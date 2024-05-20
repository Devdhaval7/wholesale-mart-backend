const tokenValidate = require("../../middleware/tokenValidate")
const CRMController = require('../../controllers/CRMController')
const validator = require("../../helpers/validator");
const { jois } = require('./schema');

class CRMRoute extends CRMController {
    constructor(router) {
        super()
        this.route(router)
    }
    route(router) {
        router.get('/admin/listAllPendingRequests', tokenValidate, this.listAllPendingRequests)
        router.put('/admin/requestAction', tokenValidate, validator(jois.requestActionPayload), this.requestAction)
        router.post('/admin/listAllCustomers', tokenValidate, this.listAllCustomers)
        router.put('/admin/changeUserStatus/:id', tokenValidate, this.changeUserStatus)
    }
}

module.exports = CRMRoute