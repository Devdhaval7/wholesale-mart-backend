const { ApiError, BadRequestError, SuccessResponse } = require("../core");
const { dbReader, dbWriter } = require("../models/dbconfig");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const { generateProductHexCode } = require("../helpers/general");
const moment = require('moment')
const { Op } = dbReader.Sequelize;

class ShoppingController {

    // ? get User cart | shopping list...
    getShoppingList = async (req, res) => {
        try {
            let user_id = req.user.user_id
            let getCartDetails = await dbReader.shoppingList.findOne({
                include: [{
                    model: dbReader.shoppingListItems,
                    where: {
                        is_deleted: 0
                    },
                    include: [{
                        model: dbReader.product,
                        include: [{
                            model: dbReader.productCategory
                        }, {
                            model: dbReader.productSubCategory
                        }, {
                            model: dbReader.productPhotos
                        }],
                    }]
                }],
                where: {
                    user_id: user_id,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(getCartDetails)) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
            }

            return new SuccessResponse("Shopping cart data.", getCartDetails).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? user =>  add to cart
    addToCart = async (req, res) => {
        try {

            let { product_id, qty } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            let user_id = req.user.user_id

            // check have a cart ot not 
            let getCartDetails = await dbReader.shoppingList.findOne({
                include: [{
                    model: dbReader.shoppingListItems,
                    include: [{
                        model: dbReader.product,
                        include: [{
                            model: dbReader.productCategory
                        }, {
                            model: dbReader.productSubCategory
                        }, {
                            model: dbReader.productPhotos
                        }],
                    }]
                }],
                where: {
                    user_id: user_id,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(getCartDetails)) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                // validate product and check qty...
                let productMatch = false, _shopping_list_item_id
                getCartDetails.wm_shopping_list_items.map(ele => {
                    if (ele.product_id === product_id && ele.is_deleted == 0) {
                        productMatch = true
                        _shopping_list_item_id = ele.shopping_list_item_id
                    }
                })

                if (productMatch && _shopping_list_item_id) {

                    await dbWriter.shoppingListItems.update({
                        qty: qty,
                        updated_datetime: updated_datetime,
                    }, {
                        where: {
                            shopping_list_id: getCartDetails.shopping_list_id,
                            shopping_list_item_id: _shopping_list_item_id,
                            user_id: user_id,
                            product_id: product_id,
                            is_deleted: 0
                        }
                    })

                } else {
                    let shopping_list_item_id = uuidv4()
                    await dbWriter.shoppingListItems.create({
                        shopping_list_item_id: shopping_list_item_id,
                        shopping_list_id: getCartDetails.shopping_list_id,
                        user_id: user_id,
                        product_id: product_id,
                        qty: qty,
                        created_datetime: created_datetime,
                        updated_datetime: updated_datetime,
                    })

                }

            } else {
                // create new cart for user...
                let shopping_list_id = uuidv4()
                let createShoppingCart = await dbWriter.shoppingList.create({
                    shopping_list_id: shopping_list_id,
                    user_id: user_id,
                    created_datetime: created_datetime,
                    updated_datetime: updated_datetime,
                })
                if (createShoppingCart) {
                    let shopping_list_item_id = uuidv4()
                    let createShoppingItems = await dbWriter.shoppingListItems.create({
                        shopping_list_item_id: shopping_list_item_id,
                        shopping_list_id: shopping_list_id,
                        user_id: user_id,
                        product_id: product_id,
                        qty: qty,
                        created_datetime: created_datetime,
                        updated_datetime: updated_datetime,
                    })

                } else {
                    throw new Error("Something went wrong")
                }
            }
            return new SuccessResponse("Product has been added to shopping cart successfully.", getCartDetails).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // remove product from cart...
    removeFromCart = async (req, res) => {
        try {

            let { id } = req.params
            let product_id = id
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            let user_id = req.user.user_id

            // check have a cart ot not 
            let getCartDetails = await dbReader.shoppingList.findOne({
                include: [{
                    model: dbReader.shoppingListItems,
                    where: {
                        is_deleted: 0
                    },
                    include: [{
                        model: dbReader.product,
                    }]
                }],
                where: {
                    user_id: user_id,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(getCartDetails)) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                let n = 0
                while (n < getCartDetails.wm_shopping_list_items.length) {
                    if (getCartDetails.wm_shopping_list_items[n].product_id === product_id) {
                        await dbWriter.shoppingListItems.update({
                            is_deleted: 1,
                            updated_datetime: updated_datetime
                        },
                            {
                                where: {
                                    shopping_list_id: getCartDetails.shopping_list_id,
                                    shopping_list_item_id: getCartDetails.wm_shopping_list_items[n].shopping_list_item_id,
                                    user_id: user_id,
                                    product_id: product_id,
                                }
                            })
                    }
                    n++
                }
            } else {
                throw new Error("Data not found.")
            }
            return new SuccessResponse("Product has been removed successfully.", getCartDetails).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // place order...
    placeOrder = async (req, res) => {
        try {
            let { shopping_list_id } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            let user_id = req.user.user_id
            // ? Validation for user can place order or not.
            let validateUser = await dbReader.users.findOne({
                include: [{
                    model: dbReader.userProfile,
                    where: {
                        is_deleted: 0
                    },
                }],
                where: {
                    user_id: user_id,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(validateUser)) {
                if (!validateUser.wm_user_profile.gst_number) {
                    throw new Error("Before placing orders, please update your profile as the company information is lacking.")
                }
            }

            let getCartDetails = await dbReader.shoppingList.findOne({
                include: [{
                    model: dbReader.shoppingListItems,
                    // where: {
                    //     is_deleted: 0
                    // },
                    include: [{
                        model: dbReader.product,
                    }]
                }],
                where: {
                    user_id: user_id,
                    shopping_list_id: shopping_list_id,
                    is_deleted: 0
                }
            })

            if (getCartDetails) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                let user_orders_id = uuidv4()
                let user_order_number = await generateProductHexCode()
                let user_order_date = created_datetime,
                    user_due_date = moment().add(7, 'days').unix()
                let orderObj = {
                    user_orders_id: user_orders_id,
                    user_order_number: user_order_number,
                    user_id: user_id,
                    total_amount: 0,
                    user_order_date: user_order_date,
                    user_due_date: user_due_date,
                    order_status: 0,
                    payment_status: 0,
                    created_datetime: created_datetime,
                    updated_datetime: updated_datetime,
                }

                let createOrderData = await dbReader.userOrders.create(orderObj)
                // Create order items...
                if (createOrderData) {
                    let orderItemsArr = []
                    let n = 0
                    while (n < getCartDetails.wm_shopping_list_items.length) {
                        let user_order_item_id = uuidv4()
                        let obj = {
                            user_order_item_id: user_order_item_id,
                            user_orders_id: user_orders_id,
                            user_id: user_id,
                            product_id: getCartDetails.wm_shopping_list_items[n].product_id,
                            qty: getCartDetails.wm_shopping_list_items[n].qty,
                            text_amount: 0,
                            total_amount: parseFloat(getCartDetails.wm_shopping_list_items[n].wm_product.rrr_price * getCartDetails.wm_shopping_list_items[n].qty),
                            created_datetime: created_datetime,
                            updated_datetime: updated_datetime,
                        }

                        orderItemsArr.push(obj)
                        n++
                    }
                    if (orderItemsArr.length > 0) {
                        let orderItemsData = await dbReader.userOrdersItems.bulkCreate(orderItemsArr)
                        let _total_amount = orderItemsArr.reduce((sum, product) => parseFloat(sum) + parseFloat(product.total_amount), 0);
                        await dbReader.userOrders.update({
                            total_amount: _total_amount
                        }, {
                            where: {
                                user_orders_id: user_orders_id,
                                user_id, user_id
                            }
                        })
                        // ! remove from shopping cart
                        if (getCartDetails) {
                            let n = 0
                            while (n < getCartDetails.wm_shopping_list_items.length) {
                                if (getCartDetails.wm_shopping_list_items[n].shopping_list_id === shopping_list_id) {
                                    await dbWriter.shoppingListItems.update({
                                        is_deleted: 1,
                                        updated_datetime: updated_datetime
                                    },
                                        {
                                            where: {
                                                shopping_list_id: shopping_list_id,
                                                shopping_list_item_id: getCartDetails.wm_shopping_list_items[n].shopping_list_item_id,
                                                user_id: user_id,
                                                is_deleted: 0,
                                            }
                                        })
                                }
                                n++
                            }

                            await dbWriter.shoppingList.update({
                                is_deleted: 1,
                                updated_datetime: updated_datetime
                            }, {
                                where: {
                                    shopping_list_id: shopping_list_id,
                                    user_id: user_id,
                                    is_deleted: 0
                                }
                            })
                        }

                    }
                } else {
                    throw new Error("Something went wrong.")
                }

            } else {
                throw new Error("Data Not found")
            }

            return new SuccessResponse("Order request has been sent to admin.", {}).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? get order details
    getMyOrders = async (req, res) => {
        try {
            let user_id = req.user.user_id
            let getOrderData = await dbReader.userOrders.findAll({
                include: [{
                    model: dbReader.userOrdersItems,
                    include: [{
                        model: dbReader.product,
                        include: [
                            {
                                model: dbReader.productPhotos
                            }],
                    }]
                }],
                where: {
                    user_id: user_id,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(getOrderData)) {
                getOrderData = JSON.parse(JSON.stringify(getOrderData))
            }

            return new SuccessResponse("User order data.", getOrderData).send(res);

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Admin => get All orders...
    getAllOrders = async (req, res) => {
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

            if (sort_field == "total_amount") {
                sortJoin = [dbReader.Sequelize.literal('`wm_user_orders`.`total_amount`'), sortOrder];
            } else if (sort_field == "order_status") {
                sortJoin = [dbReader.Sequelize.literal('`wm_user_orders`.`order_status`'), sortOrder];
            } else if (sort_field == "payment_status") {
                sortJoin = [dbReader.Sequelize.literal('`wm_user_orders`.`payment_status`'), sortOrder];
            }

            let getOrderData = await dbReader.userOrders.findAndCountAll({
                include: [
                    {
                        model: dbReader.users,
                        where: {
                            is_deleted: 0
                        },
                        include: [{
                            model: dbReader.userProfile,
                            where: {
                                is_deleted: 0
                            },
                        }]
                    },
                    {
                        model: dbReader.userOrdersItems,
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.product,
                            include: [{
                                model: dbReader.productPhotos
                            }],
                        }]
                    }],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        // dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user`.`name`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`user_order_number`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`total_amount`'), { [SearchCondition]: SearchData }),
                    ),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`order_status`'), { [Op.notIn]: [0] }),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`is_deleted`'), 0),
                ),
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            })

            if (!_.isEmpty(getOrderData)) {
                getOrderData = JSON.parse(JSON.stringify(getOrderData))
            } else {
                throw new Error("No data found.")
            }

            return new SuccessResponse("All Orders.", getOrderData).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Admin => get new order requests...
    getOrderRequests = async (req, res) => {
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

            if (sort_field == "total_amount") {
                sortJoin = [dbReader.Sequelize.literal('`wm_user_orders`.`total_amount`'), sortOrder];
            } else if (sort_field == "order_status") {
                sortJoin = [dbReader.Sequelize.literal('`wm_user_orders`.`order_status`'), sortOrder];
            } else if (sort_field == "payment_status") {
                sortJoin = [dbReader.Sequelize.literal('`wm_user_orders`.`payment_status`'), sortOrder];
            }

            let getOrderData = await dbReader.userOrders.findAndCountAll({
                include: [{
                    model: dbReader.userOrdersItems,
                    where: {
                        is_deleted: 0
                    },
                    include: [{
                        model: dbReader.product,
                        include: [{
                            model: dbReader.productPhotos
                        }],
                    }]
                }],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        // dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user`.`name`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`user_order_number`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`total_amount`'), { [SearchCondition]: SearchData }),
                    ),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`order_status`'), 0),
                    dbReader.Sequelize.where(dbReader.Sequelize.col('`wm_user_orders`.`is_deleted`'), 0),
                ),
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            })

            if (!_.isEmpty(getOrderData)) {
                getOrderData = JSON.parse(JSON.stringify(getOrderData))
            } else {
                throw new Error("No data found.")
            }

            return new SuccessResponse("New order requests.", getOrderData).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // * ------------------------------------------------ 
    // ? Order Actions...
    orderRequestActions = async (req, res) => {
        try {
            let { user_orders_id, action } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            /**
             * Action
             * 1. appove / processing
             * 2. reject
             * 3. dispatch
             * 3. deliverd
             */

            let validateOrder = await dbReader.userOrders.findOne({
                where: {
                    user_orders_id: user_orders_id,
                    is_deleted: 0
                }
            })
            if (_.isEmpty(validateOrder)) {
                throw new Error("Action has been aborted.")
            }

            switch (action) {
                case 1:
                    await dbWriter.userOrders.update({
                        order_status: 1,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0
                        }
                    })
                    break;
                case 2:
                    await dbWriter.userOrders.update({
                        order_status: 2,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0
                        }
                    })
                    break;
                case 3:
                    await dbWriter.userOrders.update({
                        order_status: 3,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0
                        }
                    })
                    break;
                case 4:
                    await dbWriter.userOrders.update({
                        order_status: 4,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
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

    // ? update order payment status...
    updatePaymentStatus = async (req, res) => {
        try {
            let { user_orders_id, action } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            /**
             * Action => payment_status
             * 1. due
             * 2. paid
             */

            let validateOrder = await dbReader.userOrders.findOne({
                where: {
                    user_orders_id: user_orders_id,
                    is_deleted: 0
                }
            })
            if (_.isEmpty(validateOrder)) {
                throw new Error("Action has been aborted.")
            }

            switch (action) {
                case 1:
                    await dbWriter.userOrders.update({
                        payment_status: 0,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0,
                            order_status: {
                                [Op.in]: [0, 2]
                            }
                        }
                    })
                    break;
                case 2:
                    await dbWriter.userOrders.update({
                        payment_status: 1,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0,
                            order_status: {
                                [Op.in]: [0, 2]
                            }
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

    // ? Admin => get order details...
    getOrderDetails = async (req, res) => {
        try {
            let { id } = req.params
            let user_orders_id = id
            let getOrderData = await dbReader.userOrders.findOne({
                include: [{
                    model: dbReader.users,
                    where: {
                        is_deleted: 0
                    },
                    include: [{
                        model: dbReader.userProfile,
                        where: {
                            is_deleted: 0
                        },
                    }]
                }, {
                    model: dbReader.userOrdersItems,
                    where: {
                        is_deleted: 0
                    },
                    include: [{
                        model: dbReader.product,
                        include: [{
                            model: dbReader.productPhotos
                        }],
                    }]
                }],
                where: {
                    user_orders_id: user_orders_id,
                    order_status: {
                        [Op.notIn]: [0]
                    },
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(getOrderData)) {
                getOrderData = JSON.parse(JSON.stringify(getOrderData))
            } else {
                throw new Error("No data found.")
            }

            return new SuccessResponse("Fetch order details.", getOrderData).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Admin => change order status and payment status...
    changeOrderStatus = async (req, res) => {
        try {
            let { user_orders_id, status, action } = req.body
            /**
             * * action
             * 1. order_status
             * 2. payment_status
             * 
             * * status
             *  order_status =>  1: accepted/processing, 2: rejected, 3: dispatch, 4:delivered.	
             *  order_status =>  0: due , 1: paid
             * 
             */
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            let getOrderData = await dbReader.userOrders.findOne({
                where: {
                    user_orders_id: user_orders_id,
                    is_deleted: 0
                }
            })
            if (!_.isEmpty(getOrderData)) {
                getOrderData = JSON.parse(JSON.stringify(getOrderData))
                if (action === "order_status") {
                    await dbWriter.userOrders.update({
                        order_status: status,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0
                        }
                    })
                } else if (action === "payment_status") {
                    await dbWriter.userOrders.update({
                        payment_status: status,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0
                        }
                    })
                } else {
                    throw new Error("something went wrong.")
                }
            } else {
                throw new Error("No data found.")
            }
            return new SuccessResponse("Fetch order details.", getOrderData).send(res);
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

}

module.exports = ShoppingController
