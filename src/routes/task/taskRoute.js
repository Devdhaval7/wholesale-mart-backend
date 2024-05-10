const TaskController = require('../../controllers/taskController');
const validator = require("../../helpers/validator");
const ValidationSource = require("../../helpers/validator");
const tokenValidate = require('../../middleware/tokenValidate');
const { jois } = require('./schema');

class TaskRoute extends TaskController {
    constructor(router) {
        super();
        this.route(router);
    }
    route(router) {
        // ? Task | Leads Routes....
        router.post("/admin/addTask", tokenValidate, validator(jois.addTaskPayload), this.addTask)
        router.get("/admin/listAllTask", tokenValidate, validator(jois.listAllTaskPayload), this.listAllTask)
        router.get("/admin/getSubAdmins", tokenValidate, this.getSubAdmins)
        router.get("/admin/getTaskDetails/:id", tokenValidate, this.getTaskDetails)
        router.put("/admin/editTask/:id", tokenValidate, validator(jois.editTaskPayload), this.editTask)
        router.delete("/admin/deleteTask/:id", tokenValidate, this.deleteTask)
    }
}

module.exports = TaskRoute