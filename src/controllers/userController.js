const { NextFunction, Request, response } = require('express');
const { SuccessResponse, BadRequestError, ApiError } = require('../core/index');
const { dbReader, dbWriter } = require('../models/dbconfig');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

class userController {

    // Users Dashboard Data
    userDashboardData = async (req, res) => {
        try {
            var { page_record, page_no, search, sort_field, search, sort_order } = req.body;
            let data = {}

            //Pagination
            if (sort_field != "user_subscription") {
                var row_offset = 0, row_limit = 1;
                if (page_record)
                    row_limit = parseInt(page_record);
                if (page_no)
                    row_offset = (page_no * page_record) - page_record;
            }

            //search
            var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            //Sorting
            var sortField = 'created_datetime',
                sortOrder = 'DESC';
            var sortJoin = [
                [sortField, sortOrder]
            ];
            sortOrder = sort_order;
            let sortbyUserSubscription = 0
            if (sort_field == "email") {
                sortJoin = [dbReader.Sequelize.literal('email'), sortOrder];
                sortbyUserSubscription = 0
            }
            if (sort_field == "newsletter_permission") {
                sortJoin = [dbReader.Sequelize.literal('is_newsletters_subscribe'), sortOrder];
                sortbyUserSubscription = 0
            }
            if (sort_field == "user_subscription") {
                sortbyUserSubscription = 1
            }

            let whereCondition = dbReader.Sequelize.and(
                dbReader.Sequelize.or(
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`email`'), { [SearchCondition]: SearchData }),
                ),
                dbReader.Sequelize.where(dbReader.Sequelize.col('`vb_users`.`is_guest`'), 0),
                dbReader.Sequelize.where(dbReader.Sequelize.col('`vb_users`.`is_deleted`'), 0)
            )

            let usersData = await dbReader.users.findAndCountAll({
                attributes: ['user_id', 'email', 'is_newsletters_subscribe', 'created_datetime'],
                include: [
                    {
                        separate: true,
                        model: dbReader.userSubscription,
                        where: {
                            status: 1,
                            is_deleted: 0
                        }
                    }
                ],
                where: whereCondition,
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            });

            let totalUsres = await dbReader.users.count({ where: { is_guest: 0, is_deleted: 0 } })
            let totalSubscribedusers = await dbReader.users.count({
                include: [{
                    model: dbReader.userSubscription,
                    where: {
                        status: 1,
                        is_deleted: 0
                    }
                }],
                where: { is_guest: 0, is_deleted: 0 }
            })

            let temp = [], obj = {
                count: 0,
                rows: []
            }
            if (usersData.rows.length) {
                usersData.rows = JSON.parse(JSON.stringify(usersData.rows));
                /**
                 * user_subscription        :- 1. Subscribed and 0. Not Subscribed
                 * newsletter_permission    :- 1. Subscribed and 0. Not Subscribed to Newsletter
                 */
                usersData.rows.forEach(e => {
                    temp.push({
                        user_id: e.user_id,
                        email: e.email,
                        user_subscription: e.vb_user_subscriptions.length > 0 ? 1 : 0,
                        newsletter_permission: e.is_newsletters_subscribe === 1 ? 1 : 0
                    })
                });
                if (sortbyUserSubscription === 1 && sortOrder == "ASC") {
                    temp = temp.slice().sort((a, b) => a.user_subscription - b.user_subscription);
                    if (page_no === 1) {
                        temp = temp.slice(page_no - 1, page_record)
                    } else {
                        temp = temp.slice((page_no - 1) * page_record, page_no * page_record)
                    }
                    obj.count = usersData.count ? usersData.count : 0
                    obj.rows = temp ? temp : []
                }
                if (sortbyUserSubscription === 1 && sortOrder == "DESC") {
                    temp = temp.slice().sort((a, b) => b.user_subscription - a.user_subscription);
                    if (page_no === 1) {
                        temp = temp.slice(page_no - 1, page_record)
                    } else {
                        temp = temp.slice((page_no - 1) * page_record, page_no * page_record)
                    }
                    obj.count = usersData.count ? usersData.count : 0
                    obj.rows = temp ? temp : []
                } else {
                    obj.count = usersData.count ? usersData.count : 0
                    obj.rows = temp ? temp : []
                }
            }

            data = {
                total_accounts: totalUsres ? totalUsres : 0,
                total_subscribers: totalSubscribedusers ? totalSubscribedusers : 0,
                userDetails: obj
            }
            res.send({
                status_code: 200,
                message: "Users List",
                data: data
            });
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ! Delete User Account From UserDashboard...
    deleteUserAccount_UD = async (req, res) => {
        try {
            let { user_id } = req.query;
            let getUserDetails = await dbReader.users.findOne({
                where: { user_id }
            })

            async function deleteUsersData() {
                let userAccount = await dbWriter.users.destroy({
                    where: {
                        email: getUserDetails.email
                    }
                })
                if (userAccount === 1) {
                    //like
                    await dbWriter.like.destroy({
                        where: {
                            user_id: user_id
                        }
                    })
                    //favourite
                    await dbWriter.favorites.destroy({
                        where: {
                            user_id: user_id
                        }
                    })
                    //shopping list
                    await dbWriter.shoppingList.destroy({
                        where: {
                            user_id: user_id
                        }
                    })
                    //shopping list item
                    await dbWriter.shoppingListItem.destroy({
                        where: {
                            user_id: user_id
                        }
                    })
                    // User Notification
                    await dbWriter.userNotificationPreference.destroy({
                        where: {
                            user_id: user_id
                        }
                    })
                    //subscription
                    await dbWriter.userSubscription.destroy({
                        where: {
                            user_id: user_id
                        }
                    })
                    // klaviyo
                    await dbWriter.klaviyoUsers.update({
                        is_deleted: 1
                    }, {
                        where: {
                            user_id: user_id
                        }
                    })
                    // //subscription -> pending LOGS
                    // await dbWriter.userSubscription.destroy({
                    //     where: {
                    //         user_id: user_id
                    //     }
                    // })
                }
            }

            if (getUserDetails != null) {
                await deleteUsersData()
            } else {
                throw new Error("User not found")
            }
            res.send({
                status_code: 200,
                message: "User account deleted successfully",
            });
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

}

module.exports = userController;