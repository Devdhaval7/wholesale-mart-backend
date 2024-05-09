const swaggerUi =require("swagger-ui-express");
const swaggerDocument = require("../../core/Swagger.json");

class SwaggerRoute {
    constructor(router) {
        this.route(router);
    }
    route(router) {
        router.get("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        router.get('/*', swaggerUi.serve);
    }
}
module.exports.SwaggerRoute = SwaggerRoute
