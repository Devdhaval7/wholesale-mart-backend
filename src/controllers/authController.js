const { SuccessResponse, BadRequestError, ApiError } = require("../core/index");
const { dbReader, dbWriter } = require("../models/dbconfig");
const { Op } = dbReader.Sequelize;
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.SECRET_KEY;
const moment = require("moment");
const { sendMail, generateUserHexCode } = require("../helpers/general");

class AuthController {

  // ? admin functions
  adminRegister = async (req, res) => {
    try {
      let { name, email, password } = req.body;
      let user_id = uuidv4();
      let user_role = 1, user_password = password;

      let userDetails = await dbReader.users.findOne({
        where: {
          email: email,
          is_deleted: 0
        }
      });

      if (!_.isEmpty(userDetails)) {
        ApiError.handle(new BadRequestError("Admin already exists."), res);
      } else {
        let data = {
          user_id: user_id,
          email: email
        };
        let userData,
          status = 1;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        password = hash;
        var unixTimestamp = Math.floor(new Date().getTime() / 1000);
        let created_datetime = JSON.stringify(unixTimestamp),
          updated_datetime = JSON.stringify(unixTimestamp);

        let access_token = jwt.sign(data, jwt_secret);
        let user_code = await generateUserHexCode()
        let userDB = await dbWriter.users.create({
          user_id,
          user_code,
          name,
          email,
          password,
          user_password,
          user_role,
          access_token,
          status,
          created_datetime,
          updated_datetime
        });
        userDB = JSON.parse(JSON.stringify(userDB));
        if (userDB) {
          let user_profile_id = uuidv4();
          let _userProfile = await dbWriter.userProfile.create({
            user_profile_id,
            user_id,
            name,
            created_datetime,
            updated_datetime
          });
          if (_userProfile) {
            userData = await dbReader.users.findOne({
              where: {
                email: email,
                is_deleted: 0
              }
            });
          }
        }

        new SuccessResponse("Admin register successfully", userData).send(res);
      }
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? Login Admin
  adminLogin = async (req, res) => {
    try {
      let { email, password } = req.body;
      let userData = await dbReader.users.findOne({
        where: {
          email: email,
          user_role: {
            [dbReader.Sequelize.Op.in]: [1, 2]
          },
          is_deleted: 0
        }
      });
      if (!_.isEmpty(userData)) {
        userData = JSON.parse(JSON.stringify(userData));

        // user status validation
        if (userData.status === 0 || userData.status === 2) {
          ApiError.handle(
            new BadRequestError(
              "Your account has been blocked or might be not active."
            ),
            res
          );
        }

        const match = bcrypt.compareSync(password, userData.password); // true
        if (match == true) {
          let data = {
            user_id: userData.user_id,
            user_role: userData.user_role,
            email: email
          };
          let access_token = jwt.sign(data, jwt_secret);
          await dbReader.users.update(
            {
              access_token: access_token
            },
            {
              where: {
                email: email
              }
            }
          );
          let updateUserData = await dbReader.users.findOne({
            include: [
              {
                model: dbReader.userProfile
              }
            ],
            where: {
              email: email
            }
          });
          updateUserData = JSON.parse(JSON.stringify(updateUserData));
          delete updateUserData.password;
          // delete updateUserData.access_token;
          delete updateUserData.is_deleted;

          new SuccessResponse("Admin login successfully", updateUserData).send(
            res
          );
        } else {
          ApiError.handle(
            new BadRequestError("Invalid username or password."),
            res
          );
        }
      } else {
        ApiError.handle(new BadRequestError("Invalid email address."), res);
      }
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  //Create new user into database
  signUp = async (req, res) => {
    try {
      let { name, email, password } = req.body;

      let user_id = uuidv4();
      let user_role = 0,
        status = 0, user_password = password;
      let userDetails = await dbReader.users.findOne({
        where: {
          email: email,
          is_deleted: 0
        }
      });

      if (!_.isEmpty(userDetails)) {
        ApiError.handle(new BadRequestError("User already exists."), res);
      } else {
        let data = {
          user_id: user_id,
          user_role: user_role,
          email: email
        };
        let userData;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        password = hash;
        var unixTimestamp = Math.floor(new Date().getTime() / 1000);
        let created_datetime = JSON.stringify(unixTimestamp),
          updated_datetime = JSON.stringify(unixTimestamp);

        let access_token = jwt.sign(data, jwt_secret);
        let user_code = await generateUserHexCode()
        let userDB = await dbWriter.users.create({
          user_id,
          user_code,
          name,
          email,
          password,
          user_password,
          user_role,
          access_token,
          status,
          created_datetime,
          updated_datetime
        });
        userDB = JSON.parse(JSON.stringify(userDB));
        if (userDB) {
          let user_profile_id = uuidv4();
          let _userProfile = await dbWriter.userProfile.create({
            user_profile_id,
            user_id,
            name,
            created_datetime,
            updated_datetime
          });
          if (_userProfile) {
            userData = await dbReader.users.findOne({
              where: {
                email: email,
                is_deleted: 0
              }
            });
          }
        }

        return new SuccessResponse("User register successfully", userData).send(res);
      }
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  //Login user
  signIn = async (req, res) => {
    try {
      let { email, password } = req.body;
      let userData = await dbReader.users.findOne({
        where: {
          email: email,
          // user_role: 0,
          is_deleted: 0,
        }
      });
      if (!_.isEmpty(userData)) {
        userData = JSON.parse(JSON.stringify(userData));

        // user status validation
        if (userData.status === 0 || userData.status === 2) {
          throw new Error('Your account has been blocked or might be not active.')
        }

        const match = bcrypt.compareSync(password, userData.password); // true
        if (match == true) {
          let data = {
            user_id: userData.user_id,
            user_role: userData.user_role,
            email: email
          };
          let access_token = jwt.sign(data, jwt_secret);
          await dbReader.users.update(
            {
              access_token: access_token
            },
            {
              where: {
                email: email
              }
            }
          );
          let updateUserData = await dbReader.users.findOne({
            include: [
              {
                model: dbReader.userProfile
              }
            ],
            where: {
              email: email
            }
          });
          updateUserData = JSON.parse(JSON.stringify(updateUserData));
          delete updateUserData.password;
          // delete updateUserData.access_token;
          delete updateUserData.is_deleted;

          return new SuccessResponse("User login successfully", updateUserData).send(
            res
          );
        } else {
          ApiError.handle(
            new BadRequestError("Invalid username or password."),
            res
          );
        }
      } else {
        ApiError.handle(new BadRequestError("User not found."), res);
      }
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // logout user
  logoutUser = async (req, res) => {
    try {
      let { access_token } = req.body;
      if (!access_token) {
        //@ts-ignore
        access_token = req.access_token;
      }
      if (access_token) {
        let loggedUser = await dbReader.users.findOne({
          attributes: ["user_id"],
          where: {
            access_token: access_token
          }
        });
        loggedUser = JSON.parse(JSON.stringify(loggedUser));
        if (loggedUser) {
          let access_token = "";
          await dbWriter.users.update(
            {
              device_token: "",
              access_token: access_token
            },
            {
              where: {
                user_id: loggedUser.user_id
              }
            }
          );
          return new SuccessResponse("Logout successfully", {}).send(
            res
          );
        }
      }
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? user profile
  fetchUserProfile = async (req, res) => {
    try {
      let access_token = req.headers.authorization.toString().split(" ")[1];
      let userProfile = await dbReader.users.findOne({
        include: [{
          model: dbReader.userProfile,
        }],
        where: {
          access_token: access_token.toString(),
          user_role: 0,
          status: 1
        }
      });

      if (userProfile) {
        userProfile = JSON.parse(JSON.stringify(userProfile));
        const base64Image = Buffer.from(userProfile.profile_image, 'binary').toString('base64');

        // Construct data URI
        const dataURI = `data:image/jpeg;base64,${base64Image}`;
        userProfile.profile_image = dataURI
      } else {
        throw new Error("User not found");
      }
      res.send({
        status_code: 200,
        message: "User Profile Detail",
        data: userProfile
      });
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? update user profile
  updateUserProfile = async (req, res) => {
    try {
      let access_token = req.headers.authorization.toString().split(" ")[1];
      let { name, profile_image, company_name, address_main_line, city, state, postcode, country, phone_number, landline_number, gst_number } = req.body
      var unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);

      let userProfile = await dbReader.users.findOne({
        include: [{
          model: dbReader.userProfile,
        }],
        where: {
          access_token: access_token.toString(),
          user_role: 0,
          status: 1
        }
      });

      if (userProfile) {
        userProfile = JSON.parse(JSON.stringify(userProfile));
        await dbWriter.users.update(
          {
            name,
            profile_image,
            updated_datetime
          },
          {
            where: {
              user_id: userProfile.user_id,
              is_deleted: 0
            }
          }
        );
        await dbWriter.userProfile.update(
          {
            company_name, address_main_line, city, state,
            postcode, country, phone_number, landline_number,
            gst_number,
            is_deleted: 0,
            updated_datetime
          },
          {
            where: {
              user_id: userProfile.user_id
            }
          }
        );
      } else {
        throw new Error("User not found");
      }
      return new SuccessResponse("User Profile updated successfully.", userProfile).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // Fetch Admin profile
  fetchAdminProfile = async (req, res) => {
    try {
      let access_token = req.headers.authorization.toString().split(" ")[1];
      let userProfile = await dbReader.users.findOne({
        where: {
          access_token: access_token.toString(),
          user_role: {
            [Op.in]: [1, 2]
          }
        }
      });

      if (userProfile) {
        userProfile = JSON.parse(JSON.stringify(userProfile));
        const base64Image = Buffer.from(userProfile.profile_image, 'binary').toString('base64');

        // Construct data URI
        const dataURI = `data:image/jpeg;base64,${base64Image}`;
        userProfile.profile_image = dataURI
        let adminPermission = await dbReader.adminPermissions.findOne({
          where: {
            user_id: userProfile.user_id
          }
        });
        adminPermission = JSON.parse(JSON.stringify(adminPermission));
        let permission_id = JSON.parse(adminPermission.permission_id);
        let permission = await dbReader.permissions.findAll({
          attributes: ["slug"],
          where: {
            permission_id: {
              [Op.in]: permission_id
            }
          }//dbReader.Sequelize.
        });
        permission = JSON.parse(JSON.stringify(permission));
        let permissionSlug = [];
        permission.forEach((element) => {
          permissionSlug.push(element.slug);
        });

        userProfile.permission = !_.isEmpty(permission) ? permissionSlug : [];
      } else {
        throw new Error("User not found");
      }
      res.send({
        status_code: 200,
        message: "User Profile Detail",
        data: userProfile
      });
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // Add new admin
  addAdmin = async (req, res) => {
    try {
      let { name, email, password, role } = req.body; // permission_id
      // permission_id = JSON.stringify(permission_id);
      let user_id = uuidv4();
      let user_role = 2;
      let _mailPassword = password, user_password = password;
      let userData = await dbReader.users.findOne({
        where: {
          email: email,
          is_deleted: 0
        }
      });
      if (!_.isEmpty(userData)) {
        ApiError.handle(
          new BadRequestError(
            "This user already exists. Please create an account with a different email."
          ),
          res
        );
      } else {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        password = hash;
        var unixTimestamp = Math.floor(new Date().getTime() / 1000);
        let created_datetime = JSON.stringify(unixTimestamp),
          updated_datetime = JSON.stringify(unixTimestamp);
        let user_code = await generateUserHexCode()
        let userData = await dbWriter.users.create({
          user_id,
          user_code,
          name,
          email,
          password,
          user_password,
          role,
          user_role,
          created_datetime,
          updated_datetime
        });
        if (userData) {
          userData = JSON.parse(JSON.stringify(userData));
          delete userData.password;
          delete userData.is_deleted;
          let admin_permission_id = uuidv4();
          let user_profile_id = uuidv4();
          let arr = []
          let permission_id = JSON.stringify(arr)
          let adminProfileData = await dbWriter.userProfile.create({
            user_profile_id: user_profile_id,
            user_id: user_id,
            created_datetime: created_datetime,
            updated_datetime: updated_datetime
          });
          let PermissionsData = await dbWriter.adminPermissions.create({
            admin_permission_id,
            user_id,
            permission_id,
            created_datetime,
            updated_datetime
          });
          userData.permission = PermissionsData;
          userData.userProfile = adminProfileData;

          // send mail
          let _mailOBJ = {
            username: email,
            password: _mailPassword,
          }
          await sendMail(_mailOBJ)

          return new SuccessResponse("Admin has been added successfully.", userData).send(
            res
          );
        }
      }
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? Update sub-admin permission...
  updateAdminPermissions = async (req, res) => {
    try {
      let { user_id, permission_id } = req.body;
      permission_id = JSON.stringify(permission_id);
      var unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);
      let userData = await dbReader.users.findOne({
        where: {
          user_id: user_id,
          is_deleted: 0
        }
      });
      if (_.isEmpty(userData)) {
        ApiError.handle(new BadRequestError("User Not found."), res);
      } else {
        if (userData) {
          userData = JSON.parse(JSON.stringify(userData));
          await dbWriter.adminPermissions.update({
            permission_id,
            updated_datetime
          }, {
            where: {
              user_id: user_id,
            }
          });
          return new SuccessResponse("Admin permission has been updated successfully.", {}).send(
            res
          );
        }
      }
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  //Edit detail of admin
  editAdmin = async (req, res) => {
    try {
      let { user_id, name, email, role } = req.body;
      var unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let updated_datetime = JSON.stringify(unixTimestamp);
      let userData = await dbWriter.users.update(
        {
          name,
          role,
          email,
          updated_datetime
        },
        {
          where: {
            user_id: user_id
          }
        }
      );
      return new SuccessResponse("Admin has been updated successfully.", {}).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // List all admin detail -> sub admin
  listAdmin = async (req, res) => {
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
      } else if (sort_field == "email") {
        sortJoin = [dbReader.Sequelize.literal("email"), sortOrder];
      } else if (sort_field == "permissions") {
        sortJoin = [dbReader.Sequelize.literal("permission_id"), sortOrder];
      }
      let admin = await dbReader.adminPermissions.findAndCountAll({
        include: [
          {
            model: dbReader.users,
            // attributes: ["name", "email"],
            where: dbReader.Sequelize.and(
              dbReader.Sequelize.or(
                dbReader.Sequelize.where(dbReader.Sequelize.col('`name`'), { [SearchCondition]: SearchData }),
                dbReader.Sequelize.where(dbReader.Sequelize.col('`email`'), { [SearchCondition]: SearchData }),
              ),
              dbReader.Sequelize.where(dbReader.Sequelize.col('`is_deleted`'), 0),
              dbReader.Sequelize.where(dbReader.Sequelize.col('`user_role`'), 2),
            )
          }
        ],
        order: [sortJoin],
        limit: row_limit,
        offset: row_offset
      });
      admin = JSON.parse(JSON.stringify(admin));
      let permissionD,
        permissionArray = [];
      admin.rows.forEach((element) => {
        if (element.permission_id && element.permission_id.length) {
          permissionArray.push({
            permission_id: JSON.parse(element.permission_id),
            user_id: element.user_id
          });
        }
        permissionD = JSON.parse(element.permission_id);
        element.name = element.wm_user.name;
        element.email = element.wm_user.email;
        element.password = element.wm_user.password;
        element.role = element.wm_user.role;
        element.permission_id = JSON.parse(element.permission_id);
        delete element.vb_user;
      });
      let perArr = [];
      permissionArray.map((val) => {
        val.permission_id.map((data) => {
          perArr.push(data);
        });
      });
      let permissionData = await dbReader.permissions.findAll({
        where: {
          permission_id: {
            [dbReader.Sequelize.Op.in]: perArr
          }
        }
      });
      permissionData = JSON.parse(JSON.stringify(permissionData));
      admin.rows.permission = [];
      admin.rows.forEach((element) => {
        element.permission = [];
        permissionData.map((val) => {
          element.permission_id.forEach((data) => {
            if (data === val.permission_id) {
              element.permission.push(val.name);
            }
          });
        });
      });

      return new SuccessResponse("List of Admins.", admin).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // Get Admin by id from database
  getAdmin = async (req, res) => {
    try {
      let { user_id } = req.query;
      let users = await dbReader.users.findOne({
        include: {
          model: dbReader.adminPermissions,
          as: "admin_permissions",
          where: {
            user_id: user_id
          },
          attributes: ["permission_id"]
        }
      });
      res.send({
        status_code: 200,
        message: "Get Admin successfully.",
        data: users
      });
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // Delete admin from database
  deleteAdmin = async (req, res) => {
    try {
      let { user_id } = req.body;
      var unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);

      let validateAdmin = await dbReader.users.findOne({
        where: {
          user_id: user_id,
          is_deleted: 0
        }
      })

      if (validateAdmin) {

        let removeAdmin = await dbReader.users.update({
          is_deleted: 1,
          updated_datetime: updated_datetime
        }, {
          where: {
            user_id: user_id
          }
        });

        if (removeAdmin) {

          await dbReader.userProfile.update({
            is_deleted: 1,
            updated_datetime: updated_datetime
          }, {
            where: {
              user_id: user_id
            }
          });

          return new SuccessResponse("Admin has been deleted successfully.", {}).send(
            res
          );

        } else {
          throw new Error("Something went wrong.")

        }


      } else {
        throw new Error("Admin don't found.")
      }



    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ? change admin status...
  changeAdminStatus = async (req, res) => {
    try {
      let { user_id, status } = req.body
      let unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);
      /**
       * status
       * 1. Active
       * 2. De-active
       */
      let _validateUser = await dbReader.users.findOne({
        where: {
          user_id: user_id,
          is_deleted: 0
        }
      })

      if (!_validateUser) {
        throw new Error("User does not exist.")
      }

      switch (status) {
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
      return new SuccessResponse("User status updated successfully.", {}).send(res);
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // Add permission
  addPemission = async (req, res) => {
    try {
      let { name, slug } = req.body;
      let permission_id = uuidv4();
      var unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let created_datetime = JSON.stringify(unixTimestamp),
        updated_datetime = JSON.stringify(unixTimestamp);
      let validatePermission = await dbWriter.permissions.findOne({
        where: {
          name: name
        }
      })
      if (validatePermission) {
        throw new Error("Permission already exists.")
      }
      let permissionData = await dbWriter.permissions.create({
        permission_id,
        name,
        slug,
        created_datetime,
        updated_datetime
      });

      return new SuccessResponse("Add new permission successfully", permissionData).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // List all Permisssion
  listPermission = async (req, res) => {
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
      let permissions = await dbReader.permissions.findAll({
        where: dbReader.Sequelize.and(
          dbReader.Sequelize.or({
            name: {
              [SearchCondition]: SearchData
            }
          }),
        ),
        order: ["name"],
        limit: row_limit,
        offset: row_offset
      });

      return new SuccessResponse("List of permissions.", permissions).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  //Update admin profile
  updateAdminProfile = async (req, res) => {
    try {
      let { name } = req.body;
      // Check if file was uploaded
      let user_id = req.user.user_id
      let userData = await dbReader.users.findOne({
        where: {
          user_id: user_id,
          is_deleted: 0,
          user_role: {
            [Op.in]: [1, 2]
          },
        }
      });
      if (!_.isEmpty(userData)) {
        userData = JSON.parse(JSON.stringify(userData));

        await dbReader.users.update(
          {
            name: name,
          },
          {
            where: {
              user_id: user_id,
              is_deleted: 0,
              user_role: {
                [Op.in]: [1, 2]
              },
            }
          }
        );
        let adminData = await dbReader.users.findOne({
          where: {
            user_id: user_id,
            is_deleted: 0,
            user_role: {
              [Op.in]: [1, 2]
            },
          }
        });

        return new SuccessResponse("Admin Profile update successfully.", adminData).send(
          res
        );
      } else {
        ApiError.handle(new BadRequestError("Data not found."), res);
      }

    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // List all Permisssion
  listPendingAccountRequests = async (req, res) => {
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

  // ? Delete permission...
  deletePermission = async (req, res) => {
    try {
      let { id } = req.params
      let permission_id = id

      let validatePermission = await dbReader.permissions.findOne({
        where: {
          permission_id: permission_id
        }
      })

      if (validatePermission) {
        validatePermission = JSON.parse(JSON.stringify(validatePermission))

        let checkAdmin = await dbReader.adminPermissions.findAll()
        checkAdmin = JSON.parse(JSON.stringify(checkAdmin))
        if (checkAdmin.length > 0) {
          let n = 0
          while (n < checkAdmin.length) {
            let temp = JSON.parse(checkAdmin[n].permission_id)
            let _temp = temp.filter(ele => permission_id !== ele)
            _temp = JSON.stringify(_temp)
            await dbReader.adminPermissions.update({
              permission_id: _temp
            }, {
              where: {
                admin_permission_id: checkAdmin[n].admin_permission_id
              }
            })
            n++
          }
        }

        // delete permission
        await dbReader.permissions.destroy({
          where: {
            permission_id: permission_id
          }
        })

      } else {
        throw new Error("Data not found.")
      }

      return new SuccessResponse("Permission deleted.", {}).send(
        res
      );
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // update Avatar...
  updateAvatar = async (req, res) => {
    try {
      const userId = req.body.user_id;
      const profileImage = req.file.buffer;
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded!' });
      }
      // Update user profile image using Sequelize
      const user = await dbWriter.users.findOne({
        where: {
          user_id: userId
        }
      });
      console.log(user)
      if (!user) {
        return res.status(404).json({ error: 'User not found!' });
      }

      // Update profile image in the database 
      await dbWriter.users.update({
        profile_image: profileImage
      }, {
        where: {
          user_id: userId
        }
      })

      return new SuccessResponse("Avatar updated successfully.", {}).send(res);
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // ------------------------------

  // Reset Password...
  resetPassword = async (req, res) => {
    try {
      let { email, newPassword } = req.body;

      let data;
      var unixTimestamp = Math.floor(new Date().getTime() / 1000);
      let updated_datetime = JSON.stringify(unixTimestamp);
      if (email) {
        let getUserDetails = await dbReader.users.findOne({
          where: {
            email
          }
        });
        if (getUserDetails) {
          getUserDetails = JSON.parse(JSON.stringify(getUserDetails));

          if (getUserDetails.user_login_type === 1) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hash = bcrypt.hashSync(newPassword, salt);
            newPassword = hash;

            await dbWriter.users.update(
              {
                password: newPassword,
                updated_datetime: updated_datetime
              },
              {
                where: {
                  user_id: getUserDetails.user_id
                }
              }
            );

            data = await dbReader.users.findOne({
              where: {
                user_id: getUserDetails.user_id
              }
            });
            data = JSON.parse(JSON.stringify(data));
          } else {
            throw new Error(
              "This user is linked to a social account so you can't reset password"
            );
          }
        }
      }

      res.send({
        status_code: 200,
        message: "Password reset successfully"
      });
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  // Admin Reset Password...
  adminResetPassword = async (req, res) => {
    try {
      let { temp_key } = req.query;
      let { newPassword } = req.body;

      if (temp_key) {
        let decryptedData = jwt.verify(temp_key, process.env.SECRET_KEY);

        if (decryptedData) {
          const salt = bcrypt.genSaltSync(saltRounds);
          const hash = bcrypt.hashSync(newPassword, salt);
          // password = hash;
          let ENCPassword = hash;

          await dbWriter.users.update(
            {
              password: ENCPassword
            },
            {
              where: {
                user_id: decryptedData.user_id
              }
            }
          );
        }
      } else {
        throw new Error("Token Not Found");
      }

      res.send({
        status_code: 200,
        message: "Password reset successfully"
      });
    } catch (e) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

}

module.exports = AuthController;
