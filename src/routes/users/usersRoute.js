const userController = require("../../controllers/userController")
const validator = require("../../helpers/validator");
const ValidationSource = require("../../helpers/validator");
const tokenValidate = require('../../middleware/tokenValidate');
const { schema } = require('./schema');

class userRoute extends userController {
      constructor(router) {
      super();
      this.route(router);
  }
  route(router) {
      router.post("/userDashboardData",tokenValidate , validator(schema.userDashboardDataPayload), this.userDashboardData);
      router.delete("/deleteUserAccount_UD",tokenValidate, validator(schema.deleteUserAccount_UDPayload), this.deleteUserAccount_UD);
  }
}

module.exports = userRoute;