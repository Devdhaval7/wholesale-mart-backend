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
        router.post('/admin/listAllPendingRequests', tokenValidate, this.listAllPendingRequests)
        router.put('/admin/requestAction', tokenValidate, validator(jois.requestActionPayload), this.requestAction)
        router.post('/admin/listAllCustomers', tokenValidate, this.listAllCustomers)
        router.post('/admin/changeUserStatus', tokenValidate, this.changeUserStatus)
        router.post('/admin/addNewCustomer', tokenValidate, this.addNewCustomer)
        router.post('/admin/updateCustomer', tokenValidate, this.updateCustomer)
        router.post('/admin/listAllClientCustomers', tokenValidate, this.listAllClientCustomers)
        router.delete('/admin/deleteCustomer/:id', tokenValidate, this.deleteCustomer)
    }
}

module.exports = CRMRoute