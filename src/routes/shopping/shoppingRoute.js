const ShoppingController = require('../../controllers/shoppingController');
const validator = require("../../helpers/validator");
const ValidationSource = require("../../helpers/validator");
const tokenValidate = require('../../middleware/tokenValidate');
const { jois } = require('./schema');

class ShoppingRoute extends ShoppingController {
    constructor(router) {
        super();
        this.route(router);
    }
    route(router) {
        router.get("/getShoppingList", tokenValidate, this.getShoppingList);
        router.post("/addToCart", tokenValidate, validator(jois.addToCartPayload), this.addToCart);
        router.delete("/removeFromCart/:id", tokenValidate, validator(jois.removeFromCartPayload, ValidationSource.QUERY), this.removeFromCart);
        router.post("/placeOrder", tokenValidate, validator(jois.placeOrderPayload), this.placeOrder);


        router.post("/getMyOrders", tokenValidate, this.getMyOrders);

        // ? Admin orders routes...
        router.post("/admin/getAllOrders", tokenValidate, this.getAllOrders);
        router.post("/admin/getOrderRequests", tokenValidate, this.getOrderRequests);
        router.post("/admin/orderRequestActions", tokenValidate, this.orderRequestActions);
        router.post("/admin/updatePaymentStatus", tokenValidate, this.updatePaymentStatus);



    }
}

module.exports = ShoppingRoute