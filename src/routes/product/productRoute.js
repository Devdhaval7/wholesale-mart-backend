const ProductController = require('../../controllers/productController');
const validator = require("../../helpers/validator");
const ValidationSource = require("../../helpers/validator");
const tokenValidate = require('../../middleware/tokenValidate');
const { jois } = require('./schema');
const { multerConfig } = require('../../middleware/multerConfig');

class ProductRoute extends ProductController {
    constructor(router) {
        super();
        this.route(router);
    }
    route(router) {
        router.post("/listProducts", tokenValidate, validator(jois.listProductsPayload), this.listProducts);
        router.post("/addProduct", tokenValidate,  this.addProduct);            // * validator(jois.addProductPayload), multerConfig.array('profile_image', 5),
        router.get("/getProductDetails/:id", tokenValidate, this.getProductDetails);
        router.put("/editProduct/:id", tokenValidate, validator(jois.editProductPayload), this.editProduct);
        router.delete("/deleteProduct/:id", tokenValidate, this.deleteProduct);
        router.post("/admin/updateStock", tokenValidate, this.updateStock);

        // ? Product Category....

        router.post("/admin/addProductCategory", tokenValidate, this.addProductCategory);
        router.put("/admin/updateProductCategory", tokenValidate, this.updateProductCategory);
        router.get("/admin/listProductCategory", tokenValidate, this.listProductCategory);
        router.post("/admin/deleteProductCategory", tokenValidate, this.deleteProductCategory);
        router.post("/admin/changeProductStatus", tokenValidate, this.changeProductStatus);

    }
}

module.exports = ProductRoute