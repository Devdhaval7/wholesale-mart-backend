const ProductController = require('../../controllers/productController');
const validator = require("../../helpers/validator");
const ValidationSource = require("../../helpers/validator");
const tokenValidate = require('../../middleware/tokenValidate');
const { jois } = require('./schema');

class ProductRoute extends ProductController {
    constructor(router) {
        super();
        this.route(router);
    }
    route(router) {
        router.post("/listProducts", tokenValidate, validator(jois.listProductsPayload), this.listProducts);
        router.post("/addProduct", tokenValidate, validator(jois.addProductPayload), this.addProduct);
        router.put("/editProduct/:id", tokenValidate, validator(jois.editProductPayload), this.editProduct);
        router.post("/addProductCategory", tokenValidate, this.addProductCategory);
        router.put("/updateProductCategory", tokenValidate, this.updateProductCategory);
        router.get("/listProductCategory", tokenValidate, this.listProductCategory);
        router.delete("/deleteProductCategory", tokenValidate, this.deleteProductCategory);

    }
}

module.exports = ProductRoute