const { ApiError, BadRequestError, SuccessResponse } = require("../core");
const { dbReader, dbWriter } = require("../models/dbconfig");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const { generateProductHexCode } = require("../helpers/general");
const moment = require('moment')
const { Op } = dbReader.Sequelize;

class OrderController {

    // ? ADMIN =>  add items to order
    addItemInOrder = async (req, res) => {
        try {

            let { user_orders_id, product_id, qty } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            let validateOrder = await dbReader.userOrders.findOne({
                include: [{
                    model: dbReader.userOrdersItems,
                    where: {
                        is_deleted: 0
                    }
                }],
                where: {
                    user_orders_id: user_orders_id,
                    is_deleted: 0
                }
            })
            validateOrder = JSON.parse(JSON.stringify(validateOrder))
            if (!_.isEmpty(validateOrder)) {
                let productData = await dbReader.product.findOne({
                    where: {
                        product_id: product_id,
                        is_deleted: 0
                    }
                })
                productData = JSON.parse(JSON.stringify(productData))
                if (_.isEmpty(validateOrder)) { throw new Error("Something went wrong") }
                if (validateOrder.wm_user_order_items.length > 0) {
                    let n = 0
                    while (n < validateOrder.wm_user_order_items.length) {
                        if (validateOrder.wm_user_order_items[n].product_id === product_id) {
                            let total_amount = parseFloat(qty * productData.rrr_price)
                            await dbWriter.userOrdersItems.update({
                                qty: qty,
                                total_amount: total_amount,
                                updated_datetime: updated_datetime
                            }, {
                                where: {
                                    user_orders_id: user_orders_id,
                                    product_id: product_id,
                                    is_deleted: 0
                                }
                            })
                        }
                        n++
                    }
                }
                // ? update total
                let _validateOrder = await dbReader.userOrders.findOne({
                    include: [{
                        model: dbReader.userOrdersItems,
                        where: {
                            is_deleted: 0
                        }
                    }],
                    where: {
                        user_orders_id: user_orders_id,
                        is_deleted: 0
                    }
                })
                _validateOrder = JSON.parse(JSON.stringify(_validateOrder))
                if(_validateOrder.wm_user_order_items.length > 0){
                    let x = 0, _totlaAmount = 0
                    while (x < _validateOrder.wm_user_order_items.length) {
                        let item = _validateOrder.wm_user_order_items[x]
                        _totlaAmount = parseFloat(_totlaAmount + parseFloat(_validateOrder.wm_user_order_items[x].total_amount))
                        x++
                    }
                    await dbReader.userOrders.update({
                        total_amount: _totlaAmount,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0
                        }
                    })
                }
            } else {
                throw new Error("Something went wrong")
            }
            return new SuccessResponse("Order has been updated successfully.", {}).send(res);
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? ADMIN =>  Delete items to order
    deleteItemInOrder = async (req, res) => {
        try {

            let { user_orders_id, product_id } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            let validateOrder = await dbReader.userOrders.findOne({
                include: [{
                    model: dbReader.userOrdersItems,
                    where: {
                        is_deleted: 0
                    }
                }],
                where: {
                    user_orders_id: user_orders_id,
                    is_deleted: 0
                }
            })
            validateOrder = JSON.parse(JSON.stringify(validateOrder))
            if (!_.isEmpty(validateOrder)) {

                let productData = await dbReader.product.findOne({
                    where: {
                        product_id: product_id,
                        is_deleted: 0
                    }
                })
                productData = JSON.parse(JSON.stringify(productData))
                if (_.isEmpty(validateOrder)) { throw new Error("Something went wrong") }
                let totalAmount = 0, removeItemValue = 0
                if (validateOrder.wm_user_order_items.length > 0) {
                    let n = 0
                    while (n < validateOrder.wm_user_order_items.length) {
                        if (validateOrder.wm_user_order_items[n].product_id === product_id) {
                            removeItemValue = parseFloat(validateOrder.wm_user_order_items[n].total_amount)
                            await dbWriter.userOrdersItems.update({
                                is_deleted: 1,
                                updated_datetime: updated_datetime
                            }, {
                                where: {
                                    user_orders_id: user_orders_id,
                                    product_id: product_id,
                                    is_deleted: 0
                                }
                            })
                        }
                        totalAmount = parseFloat(parseFloat(totalAmount) + parseFloat(validateOrder.wm_user_order_items[n].total_amount))
                        n++
                    }
                    totalAmount = parseFloat(parseFloat(totalAmount) - parseFloat(removeItemValue))
                    await dbWriter.userOrders.update({
                        total_amount: totalAmount
                    }, {
                        where: {
                            user_orders_id: user_orders_id,
                            is_deleted: 0
                        }
                    })
                }
            } else {
                throw new Error("Something went wrong")
            }
            return new SuccessResponse("Product has been removed from order successfully.", {}).send(res);

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

}

module.exports = OrderController
