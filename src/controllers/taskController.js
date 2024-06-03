require("dotenv").config();
const { NextFunction, Request, response } = require("express");
const { SuccessResponse, BadRequestError, ApiError } = require("../core/index");
const { dbReader, dbWriter } = require("../models/dbconfig");
const { Op } = dbReader.Sequelize;
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.SECRET_KEY;
const moment = require("moment");

class TaskController {

  // ? Create Leads / Task...
  addTask = async (req, res) => {
    try {
      let { title, task_description, user_id, type, clientArr } = req.body;
      let task_id = uuidv4()
      let unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);

      switch (type) {
        case 0:
          // ? Normal task
          await dbWriter.tasks.create({
            task_id: task_id,
            user_id: user_id,
            title: title,
            task_description: task_description,
            type: 0,
            status: 0,
            created_datetime: created_datetime,
            updated_datetime: updated_datetime
          });
          break;

        case 1:
          // ? Client through task
          clientArr = JSON.stringify(clientArr)
          await dbWriter.tasks.create({
            task_id: task_id,
            user_id: user_id,
            title: title,
            task_description: task_description,
            customer_list: clientArr,
            type: 1,
            status: 0,
            created_datetime: created_datetime,
            updated_datetime: updated_datetime
          });

          break;

        default:
          break;
      }
      return new SuccessResponse("Task assign to sub-admin successfully.", {}).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? List tasks | leads
  listAllTask = async (req, res) => {
    try {
      let user_role = req.user.user_role
      let { page_record, page_no, search, sort_field, sort_order } = req.body
      /**
       * user_role
       * 1. admin all access
       * 2. sub admin
       */
      var row_offset = 0,
        row_limit = 10;

      //Pagination
      if (page_record) {
        row_limit = parseInt(page_record);
      }

      if (page_no) {
        row_offset = page_no * page_record - page_record;
      }

      // Searching data by ingredient_name
      var SearchCondition = dbReader.Sequelize.Op.ne,
        SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }

      //Sorting by name or email
      var sortField = "created_datetime",
        sortOrder = "DESC";
      // var sortField = 'name', sortOrder = 'ASC';
      var sortJoin = [[sortField, sortOrder]];
      sortOrder = sort_order;

      if (sort_field == "title") {
        sortJoin = [dbReader.Sequelize.literal("title"), sortOrder];
      } else if (sort_field == "name") {
        sortJoin = [dbReader.Sequelize.literal('`wm_user`.`name`'), sortOrder];
      } else if (sort_field == "status") {
        sortJoin = [dbReader.Sequelize.literal("status"), sortOrder];
      }

      let getTasks
      if (user_role === 1) {
        getTasks = await dbReader.tasks.findAndCountAll({
          include: [{
            model: dbReader.users
          }],
          where: dbReader.Sequelize.and(
            dbReader.Sequelize.or(
              dbReader.Sequelize.where(dbReader.Sequelize.col('`title`'), { [SearchCondition]: SearchData }),
              dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user`.`name`'), { [SearchCondition]: SearchData }),
            ),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`type`'), 0),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`is_deleted`'), 0),
          ),
          order: [sortJoin],
          limit: row_limit,
          offset: row_offset
        })
      }
      if (user_role === 2) {
        let _user_id = req.user.user_id
        getTasks = await dbReader.tasks.findAndCountAll({
          where: dbReader.Sequelize.and(
            dbReader.Sequelize.or({
              title: {
                [SearchCondition]: SearchData
              }
            }),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`type`'), 0),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`is_deleted`'), 0),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`user_id`'), _user_id),
          ),
          order: [sortJoin],
          limit: row_limit,
          offset: row_offset
        })
      }

      if (getTasks) {
        getTasks = JSON.parse(JSON.stringify(getTasks))
      }
      return new SuccessResponse("Task lists.", getTasks).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? Sub-admin list for add leads | task...
  getSubAdmins = async (req, res) => {
    try {
      let data = await dbReader.users.findAll({
        attributes: ['user_id', 'name'],
        where: {
          is_deleted: 0,
          user_role: 2
        }
      })

      if (data) {
        data = JSON.parse(JSON.stringify(data))
      }
      return new SuccessResponse("Sub-admin list.", data).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? get task details
  getTaskDetails = async (req, res) => {
    try {
      let { id } = req.params

      let getTasks = await dbReader.tasks.findOne({
        where: {
          task_id: id,
          is_deleted: 0
        }
      })

      if (getTasks) {
        getTasks = JSON.parse(JSON.stringify(getTasks))
      }
      return new SuccessResponse("Task details.", getTasks).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? Edit Leads / Task...
  editTask = async (req, res) => {
    try {
      let { id } = req.params
      let { title, task_description, user_id, type, clientArr } = req.body;

      let unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);

      if (req.user.user_role === 1) {

        let validateTask = await dbReader.tasks.findOne({
          where: {
            task_id: id,
            is_deleted: 0
          }
        })

        if (validateTask) {
          switch (type) {
            case 0:
              await dbWriter.tasks.update({
                user_id: user_id,
                title: title,
                task_description: task_description,
                created_datetime: created_datetime,
                updated_datetime: updated_datetime
              }, {
                where: {
                  task_id: id,
                  is_deleted: 0
                }
              });
              break;
            case 1:
              clientArr = JSON.stringify(clientArr)
              await dbWriter.tasks.update({
                user_id: user_id,
                title: title,
                task_description: task_description,
                customer_list: clientArr,
                created_datetime: created_datetime,
                updated_datetime: updated_datetime
              }, {
                where: {
                  task_id: id,
                  is_deleted: 0
                }
              });
              break;

            default:
              break;
          }


        } else {
          throw new Error('Data not found.')
        }
      } else {
        throw new Error('insufficient permission.')
      }

      return new SuccessResponse("Task updated successfully.", {}).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? update task status...
  updateTaskStatus = async (req, res) => {
    try {
      let { id } = req.params
      let { status } = req.body;

      let unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);

      if (req.user.user_role === 2) {
        let validateTask = await dbReader.tasks.findOne({
          where: {
            task_id: id,
            is_deleted: 0
          }
        })

        if (validateTask) {
          await dbWriter.tasks.update({
            status: status,
            updated_datetime: updated_datetime
          }, {
            where: {
              task_id: id,
              user_id: req.user.user_id,
              is_deleted: 0
            }
          });
        } else {
          throw new Error('Data not found.')
        }
      } else {
        throw new Error('insufficient permission.')
      }

      return new SuccessResponse("Task updated successfully.", {}).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? Delete task
  deleteTask = async (req, res) => {
    try {
      let { id } = req.params

      let unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);

      if (req.user.user_role === 1) {

        let validateTask = await dbReader.tasks.findOne({
          where: {
            task_id: id,
            is_deleted: 0
          }
        })

        if (validateTask) {
          await dbWriter.tasks.update({
            is_deleted: 1,
            updated_datetime: updated_datetime
          }, {
            where: {
              task_id: id,
            }
          });
        } else {
          throw new Error('Data not found.')
        }
      } else {
        throw new Error('insufficient permission.')
      }

      return new SuccessResponse("Task deleted successfully.", {}).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? Change task status...
  changeTaskStatus = async (req, res) => {
    try {
      let { task_id, status } = req.body
      let unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);

      let validateTask = await dbReader.tasks.findOne({
        where: {
          task_id: task_id,
          is_deleted: 0
        }
      })

      if (validateTask) {
        await dbWriter.tasks.update({
          status: status,
          updated_datetime: updated_datetime
        }, {
          where: {
            task_id: task_id,
            is_deleted: 0
          }
        });
      } else {
        throw new Error('Data not found.')
      }

      return new SuccessResponse("Task status updated successfully.", {}).send(res);
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // * Client through task...

  // ? Get customer list...
  getClintLists = async (req, res) => {
    try {
      let data = await dbReader.users.findAll({
        // attributes: ['user_id', 'name', 'profile_image'],
        include: [{
          model: dbReader.userProfile
        }],
        where: {
          is_deleted: 0,
          user_role: 0,
          status: 1
        }
      })

      if (data) {
        data = JSON.parse(JSON.stringify(data))
      }
      return new SuccessResponse("Customer list.", data).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? List client through tasks | leads
  listClientTask = async (req, res) => {
    try {
      let user_role = req.user.user_role
      let { page_record, page_no, search, sort_field, sort_order } = req.body
      /**
       * user_role
       * 1. admin all access
       * 2. sub admin
       */
      var row_offset = 0,
        row_limit = 10;

      //Pagination
      if (page_record) {
        row_limit = parseInt(page_record);
      }

      if (page_no) {
        row_offset = page_no * page_record - page_record;
      }

      // Searching data by ingredient_name
      var SearchCondition = dbReader.Sequelize.Op.ne,
        SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }

      //Sorting by name or email
      var sortField = "created_datetime",
        sortOrder = "DESC";
      // var sortField = 'name', sortOrder = 'ASC';
      var sortJoin = [[sortField, sortOrder]];
      sortOrder = sort_order;

      if (sort_field == "title") {
        sortJoin = [dbReader.Sequelize.literal("title"), sortOrder];
      } else if (sort_field == "name") {
        sortJoin = [dbReader.Sequelize.literal('`wm_user`.`name`'), sortOrder];
      } else if (sort_field == "status") {
        sortJoin = [dbReader.Sequelize.literal("status"), sortOrder];
      }

      let getTasks
      if (user_role === 1) {
        getTasks = await dbReader.tasks.findAndCountAll({
          include: [{
            model: dbReader.users
          }],
          where: dbReader.Sequelize.and(
            dbReader.Sequelize.or(
              dbReader.Sequelize.where(dbReader.Sequelize.col('`title`'), { [SearchCondition]: SearchData }),
              dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user`.`name`'), { [SearchCondition]: SearchData }),
            ),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`type`'), 1),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`is_deleted`'), 0),
          ),
          order: [sortJoin],
          limit: row_limit,
          offset: row_offset
        })
      }
      if (user_role === 2) {
        let _user_id = req.user.user_id
        getTasks = await dbReader.tasks.findAndCountAll({
          where: dbReader.Sequelize.and(
            dbReader.Sequelize.or({
              title: {
                [SearchCondition]: SearchData
              }
            }),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`is_deleted`'), 0),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`type`'), 1),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_tasks`.`user_id`'), _user_id),
          ),
          order: [sortJoin],
          limit: row_limit,
          offset: row_offset
        })
      }

      if (getTasks) {
        getTasks = JSON.parse(JSON.stringify(getTasks))
      }
      return new SuccessResponse("Client Task lists.", getTasks).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

}

module.exports = TaskController;
