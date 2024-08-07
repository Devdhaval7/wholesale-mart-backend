const { ApiError, BadRequestError, SuccessResponse } = require("../core");
const { dbReader, dbWriter } = require("../models/dbconfig");
const { Op } = dbReader.Sequelize;
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.SECRET_KEY;
const moment = require("moment");
const { generateUserHexCode, sendMail } = require("../helpers/general");
class CRMController {

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
            } else if (sort_field == "email") {
                sortJoin = [dbReader.Sequelize.literal("email"), sortOrder];
            } else if (sort_field == "status") {
                sortJoin = [dbReader.Sequelize.literal("status"), sortOrder];
            }

            let _data = await dbReader.users.findAndCountAll({
                include: [{
                    model: dbReader.userProfile
                }],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`name`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`email`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_profile`.`city`'), { [SearchCondition]: SearchData }),
                    ),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`status`'), {
                        [Op.in]: [1, 2]
                    }),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`user_role`'), 0),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`is_crm_client`'), 0),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`is_deleted`'), 0),
                ),
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            });
            _data = JSON.parse(JSON.stringify(_data))
            _data.rows.map(ele => {
                if (ele.profile_image) {
                    const base64Image = Buffer.from(ele.profile_image, 'binary').toString('base64');
                    const dataURI = base64Image ? `data:image/jpeg;base64,${base64Image}` : "";
                    ele.profile_image = dataURI
                } else {
                    ele.profile_image = ""
                }
            })
            return new SuccessResponse("Fetch all users.", _data).send(res);

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

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
            } else if (sort_field == "email") {
                sortJoin = [dbReader.Sequelize.literal("email"), sortOrder];
            }

            let _data = await dbReader.users.findAndCountAll({
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`name`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`email`'), { [SearchCondition]: SearchData }),
                    ),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`status`'), 0),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`user_role`'), 0),
                ),
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            });
            _data = JSON.parse(JSON.stringify(_data))
            _data.rows.map(ele => {
                if (ele.profile_image) {
                    const base64Image = Buffer.from(ele.profile_image, 'binary').toString('base64');
                    const dataURI = base64Image ? `data:image/jpeg;base64,${base64Image}` : "";
                    ele.profile_image = dataURI
                } else {
                    ele.profile_image = ""
                }
            })
            return new SuccessResponse("All pending new account requests.", _data).send(res);

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

    // ? Change user status...
    changeUserStatus = async (req, res) => {
        try {
            let { user_id, status } = req.body;
            /**
             * status
             * 1. active
             * 2. block
             * 3. delete user permanently
             */

            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            if ([1, 2].includes(req.user.user_role)) {
                let validateUser = await dbReader.users.findOne({
                    where: {
                        user_id: user_id,
                        is_deleted: 0
                    }
                })

                if (validateUser) {
                    validateUser = JSON.parse(JSON.stringify(validateUser))

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
                            });
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
                            });
                            break;
                        case 3:
                            await dbWriter.users.update({
                                status: 1,
                                is_deleted: 1,
                                updated_datetime: updated_datetime
                            }, {
                                where: {
                                    user_id: user_id,
                                    is_deleted: 0
                                }
                            });
                            break;

                        default:
                            throw new Error("Something went wrong.")
                            break;
                    }


                } else {
                    throw new Error('Data not found.')
                }
            } else {
                throw new Error('insufficient permission.')
            }

            return new SuccessResponse("User status updated successfully.", {}).send(
                res
            );
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Add new customer...
    addNewCustomer = async (req, res) => {
        try {
            let { name, email, password, company_name, address_main_line, city, state, postcode, country,
                phone_number, landline_number, gst_number, is_crm_client } = req.body;

            let user_id = uuidv4();
            let user_role = 0,
                status = 1, user_password = password, _mailPassword = password;
            let userDetails = await dbReader.users.findOne({
                where: {
                    email: email,
                    is_deleted: 0
                }
            });
            let userData;
            if (!_.isEmpty(userDetails)) {
                ApiError.handle(new BadRequestError("User already exists."), res);
            } else {
                const salt = bcrypt.genSaltSync(saltRounds);
                const hash = bcrypt.hashSync(password, salt);
                password = hash;
                var unixTimestamp = Math.floor(new Date().getTime() / 1000);
                let created_datetime = JSON.stringify(unixTimestamp),
                    updated_datetime = JSON.stringify(unixTimestamp);

                // let access_token = jwt.sign(data, jwt_secret);
                let user_code = await generateUserHexCode()
                is_crm_client == 0 ? 0 : 1
                let userDB = await dbWriter.users.create({
                    user_id,
                    user_code,
                    name,
                    email,
                    password,
                    user_password,
                    user_role,
                    is_crm_client,
                    status,
                    created_datetime,
                });
                userDB = JSON.parse(JSON.stringify(userDB));
                if (userDB) {
                    let user_profile_id = uuidv4();

                    let _userProfile = await dbWriter.userProfile.create({
                        user_profile_id,
                        user_id,
                        company_name,
                        address_main_line, city,
                        state, postcode, country,
                        phone_number, landline_number, gst_number,
                        created_datetime,
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

                // * send mail
                let _mailOBJ = {
                    username: email,
                    password: _mailPassword,
                }
                await sendMail(_mailOBJ)

                return new SuccessResponse("Customer added successfully", userData).send(res);
            }
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? update customer...
    updateCustomer = async (req, res) => {
        try {
            let { user_id, name, email, password, company_name, address_main_line, city, state, postcode, country,
                phone_number, landline_number, gst_number, is_crm_client } = req.body;
            let user_role = 0,
                status = 1, user_password = password, _mailPassword = password;
            let userDetails = await dbReader.users.findOne({
                where: {
                    email: email,
                    is_deleted: 0
                }
            });
            let userData;

            if (!_.isEmpty(userDetails) && userDetails.user_id != user_id) {
                ApiError.handle(new BadRequestError("User already exists."), res);
            } else {
                const salt = bcrypt.genSaltSync(saltRounds);
                const hash = bcrypt.hashSync(password, salt);
                password = hash;
                var unixTimestamp = Math.floor(new Date().getTime() / 1000);
                let created_datetime = JSON.stringify(unixTimestamp),
                    updated_datetime = JSON.stringify(unixTimestamp);

                is_crm_client == 0 ? 0 : 1

                let userDB = await dbWriter.users.update({
                    name,
                    email,
                    password,
                    user_password,
                    updated_datetime
                }, {
                    where: {
                        user_id: user_id,
                        is_deleted: 0
                    }
                })
                if (userDB) {
                    await dbWriter.userProfile.update({
                        company_name,
                        address_main_line, city,
                        state, postcode, country,
                        phone_number, landline_number, gst_number,
                        updated_datetime
                    }, {
                        where: {
                            user_id: user_id,
                            is_deleted: 0
                        }
                    })
                }

                // * send mail
                let _mailOBJ = {
                    username: email,
                    password: _mailPassword,
                }
                await sendMail(_mailOBJ)

                return new SuccessResponse("Customer updated successfully", userData).send(res);
            }
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? List all client customers
    listAllClientCustomers = async (req, res) => {
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
            } else if (sort_field == "status") {
                sortJoin = [dbReader.Sequelize.literal("status"), sortOrder];
            }

            let _data = await dbReader.users.findAndCountAll({
                include: [{
                    model: dbReader.userProfile
                }],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`name`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`email`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_profile`.`city`'), { [SearchCondition]: SearchData }),
                    ),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`status`'), {
                        [Op.in]: [1, 2]
                    }),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`user_role`'), 0),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`is_crm_client`'), 1),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_users`.`is_deleted`'), 0),
                ),
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            });
            _data = JSON.parse(JSON.stringify(_data))
            _data.rows.map(ele => {
                if (ele.profile_image) {
                    const base64Image = Buffer.from(ele.profile_image, 'binary').toString('base64');
                    const dataURI = base64Image ? `data:image/jpeg;base64,${base64Image}` : "";
                    ele.profile_image = dataURI
                } else {
                    ele.profile_image = ""
                }
            })
            return new SuccessResponse("Fetch all users.", _data).send(res);

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };


    // ? Delete products...
    deleteCustomer = async (req, res) => {
        try {
            let { id } = req.params
            let user_id = id
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            // validate user
            let _validateUser = await dbReader.users.findOne({
                where: {
                    user_id: user_id,
                    user_role: 0,
                    is_deleted: 0
                }
            })

            if (_.isEmpty(_validateUser)) {
                throw new Error("Data not found.")
            } else {
                await dbWriter.users.update({
                    is_deleted: 1
                }, {
                    where: {
                        user_id: user_id,
                        user_role: 0,
                        is_deleted: 0
                    }
                })
            }

            return new SuccessResponse("Customer has been deleted successfully.", {}).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

}

module.exports = CRMController