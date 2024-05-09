const { ApiError, BadRequestError, SuccessResponse } = require("../core");
const { dbReader, dbWriter } = require("../models/dbconfig");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const { generateRandomCode } = require("../helpers/general");
const moment = require('moment')
const { Op } = dbReader.Sequelize;

class ShoppingController {

    // ? get Uuser cart | shopping list...
    getShoppingList = async (req, res) => {
        try {
            let user_id = req.user.user_id
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
                    user_id: user_id
                }
            })

            if (!_.isEmpty(getCartDetails)) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
            } else {
                throw new Error("Shopping cart is empty.")
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
                    user_id: user_id
                }
            })

            if (!_.isEmpty(getCartDetails)) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                // validate product and check qty...
                let productMatch = false, _shopping_list_item_id
                getCartDetails.wm_shopping_list_items.map(ele => {
                    if (ele.product_id === product_id) {
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
                    let createShoopingItems = await dbWriter.shoppingListItems.create({
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
                    include: [{
                        model: dbReader.product,
                    }]
                }],
                where: {
                    user_id: user_id
                }
            })

            if (!_.isEmpty(getCartDetails)) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                let n = 0
                while (n < getCartDetails.wm_shopping_list_items.length) {
                    if (getCartDetails.wm_shopping_list_items[n].product_id === product_id) {
                        await dbWriter.shoppingListItems.destroy(
                            {
                                where: {
                                    shopping_list_id: getCartDetails.shopping_list_id,
                                    shopping_list_item_id: getCartDetails.wm_shopping_list_items[n].shopping_list_item_id,
                                    user_id: user_id,
                                    product_id: product_id,
                                }
                            })
                    } else {
                        throw new Error("Product not found.")
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

            let getCartDetails = await dbReader.shoppingList.findOne({
                include: [{
                    model: dbReader.shoppingListItems,
                    include: [{
                        model: dbReader.product,
                    }]
                }],
                where: {
                    user_id: user_id,
                    shopping_list_id: shopping_list_id

                }
            })

            if (getCartDetails) {
                getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                let user_orders_id = uuidv4()
                let user_order_number = await generateRandomCode()
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
                // craete order items...
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
                            total_amount: parseFloat(getCartDetails.wm_shopping_list_items[n].wm_product.price * getCartDetails.wm_shopping_list_items[n].qty),
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
                            // {
                            //     model: dbReader.productCategory
                            // }, {
                            //     model: dbReader.productSubCategory
                            // },
                            {
                                model: dbReader.productPhotos
                            }],
                    }]
                }],
                where: {
                    user_id: user_id
                }
            })

            if (!_.isEmpty(getOrderData)) {
                getOrderData = JSON.parse(JSON.stringify(getOrderData))
            } else {
                throw new Error("No data found.")
            }

            return new SuccessResponse("User order data.", getOrderData).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Admin => get All orders...
    getAllOrders = async (req, res) => {
        try {
            let getOrderData = await dbReader.userOrders.findAndCountAll({
                include: [{
                    model: dbReader.userOrdersItems,
                    include: [{
                        model: dbReader.product,
                        include: [
                            // {
                            //     model: dbReader.productCategory
                            // }, {
                            //     model: dbReader.productSubCategory
                            // },
                            {
                                model: dbReader.productPhotos
                            }],
                    }]
                }],
                where: {
                    order_status: {
                        [Op.notIn] : [0]
                    }
                }
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
            let getOrderData = await dbReader.userOrders.findAndCountAll({
                include: [{
                    model: dbReader.userOrdersItems,
                    include: [{
                        model: dbReader.product,
                        include: [
                            // {
                            //     model: dbReader.productCategory
                            // }, {
                            //     model: dbReader.productSubCategory
                            // },
                            {
                                model: dbReader.productPhotos
                            }],
                    }]
                }],
                where: {
                    order_status: 0
                }
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

}

module.exports = ShoppingController