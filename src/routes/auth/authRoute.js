const AuthController = require('../../controllers/authController');
const validator = require("../../helpers/validator");
const ValidationSource = require("../../helpers/validator");
const tokenValidate = require('../../middleware/tokenValidate');
const { jois } = require('./schema');

class AuthRoute extends AuthController {
    constructor(router) {
        super();
        this.route(router);
    }
    route(router) {

        // ? Admin routes
        router.post("/admin/register", this.adminRegister);
        router.post("/admin/login", validator(jois.adminLoginPayload), this.adminLogin);
        router.post("/admin/fetchAdminProfile", tokenValidate, this.fetchAdminProfile)
        router.put("/admin/updateAdminProfile", tokenValidate, this.updateAdminProfile); // postImage

        // ? user routes
        router.post("/signUp", validator(jois.registrationPayload), this.signUp);
        router.post("/signIn", validator(jois.loginPayload), this.signIn);

        router.post("/logoutUser", this.logoutUser); // validator(jois.logoutUserPayload)
        router.post("/fetchUserProfile", tokenValidate, this.fetchUserProfile);
        router.put("/updateUserProfile", tokenValidate, this.updateUserProfile);

        // ? Sub-admins
        router.post("/admin/addPemission", tokenValidate, validator(jois.addPermissionPayload), this.addPemission);
        router.post("/admin/listAdmin", tokenValidate, validator(jois.listAdminPayload), this.listAdmin);
        router.post("/admin/addAdmin", tokenValidate, validator(jois.addAdminPayload), this.addAdmin);
        router.put("/admin/editAdmin", tokenValidate, validator(jois.editAdminPayload), this.editAdmin);
        router.post("/admin/deleteAdmin", tokenValidate, validator(jois.deleteAdminPayload), this.deleteAdmin); // ValidationSource.QUERY

        router.get("/admin/listPermission", tokenValidate, this.listPermission)
        router.post("/admin/listPendingAccountRequests", tokenValidate, this.listPendingAccountRequests)
        router.post("/admin/deletePermission/:id", tokenValidate, this.deletePermission)
        // router.get("/getAdmin", tokenValidate, validator(jois.getAdminPayload, ValidationSource.QUERY), this.getAdmin); 
        // router.post("/updateAdminProfile", tokenValidate, validator(jois.updateAdminProfilePayload), this.updateAdminProfile);

        // router.put("/resetPassword", validator(jois.resetPasswordPayload), this.resetPassword);
        // router.put("/adminResetPassword/:temp_key?", validator(jois.adminResetPasswordPayload, ValidationSource.PARAM), this.adminResetPassword);
    }
}

module.exports = AuthRoute