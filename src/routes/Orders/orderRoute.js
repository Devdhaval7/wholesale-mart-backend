const OrderController = require('../../controllers/orderController');
const validator = require("../../helpers/validator");
const ValidationSource = require("../../helpers/validator");
const tokenValidate = require('../../middleware/tokenValidate');
const { jois } = require('./schema');

class OrderRoute extends OrderController {
    constructor(router) {
        super();
        this.route(router);
    }
    route(router) {

        router.post("/admin/addItemInOrder", tokenValidate, validator(jois.addItemInOrderPayload), this.addItemInOrder);
        router.post("/admin/deleteItemInOrder", tokenValidate, validator(jois.deleteItemInOrderPayload), this.deleteItemInOrder);

    }
}

module.exports = OrderRoute
