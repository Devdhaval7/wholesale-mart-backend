const indexController = require("../controllers/indexController");

class indexRoute extends indexController {
  constructor(router) {
    super();
    this.route(router);
  }
  route(router) {
    router.get("/", this.getData);
  }
}

module.exports = indexRoute;
