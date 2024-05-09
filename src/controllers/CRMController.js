const { ApiError, BadRequestError, SuccessResponse } = require("../core");
const { dbReader, dbWriter } = require("../models/dbconfig");
const { Op } = dbReader.Sequelize;
const _ = require("lodash");
class CRMController {

    // ? Pending new account requests list...
    listAllPendingRequests = async (req, res) => {
        try {
            var { page_record, page_no, search, sort_field, sort_order } = req.body;
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

            if (sort_field == "name") {
                sortJoin = [dbReader.Sequelize.literal("name"), sortOrder];
            }
            let _data = await dbReader.users.findAll({
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or({
                        name: {
                            [SearchCondition]: SearchData
                        }
                    }),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`status`'), 0),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`user_role`'), 0),
                ),
                order: sortJoin,
                limit: row_limit,
                offset: row_offset
            });
            return new SuccessResponse("All pending new account requests.", _data).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Accept and reject new account requests...
    requestAction = async (req, res) => {
        try {
            let { user_id, action } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            /**
             * Action
             * 1. appove
             * 2. reject
             */

            let validateUser = await dbReader.users.findOne({
                where: {
                    user_id: user_id,
                    is_deleted: 0
                }
            })
            if (_.isEmpty(validateUser)) {
                throw new Error("Action has been aborted.")
            }

            let msg = ""
            switch (action) {
                case 1:
                    await dbWriter.users.update({
                        status: 1,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_id: user_id,
                            is_deleted: 0
                        }
                    })
                    break;
                case 2:
                    await dbWriter.users.update({
                        status: 2,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_id: user_id,
                            is_deleted: 0
                        }
                    })
                    break;

                default:
                    throw new Error("Something went wrong.")
                    break;
            }

            return new SuccessResponse("Action has been taken.", {}).send(
                res
            );
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? List all customers
    listAllCustomers = async (req, res) => {
        try {
            var { page_record, page_no, search, sort_field, sort_order } = req.body;
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

            if (sort_field == "name") {
                sortJoin = [dbReader.Sequelize.literal("name"), sortOrder];
            }
            let _data = await dbReader.users.findAll({
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or({
                        name: {
                            [SearchCondition]: SearchData
                        }
                    }),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`status`'),{
                        [Op.in]: [1, 2]
                    }),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`user_role`'), 0),
                ),
                order: sortJoin,
                limit: row_limit,
                offset: row_offset
            });
            return new SuccessResponse("Fetch all users.", _data).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

}

module.exports = CRMController