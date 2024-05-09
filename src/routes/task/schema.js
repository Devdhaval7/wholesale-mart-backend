const Joi = require("joi");
// import { ErrorController } from "../../core/ErrorController";
// const EC = new ErrorController();

exports.jois = {

  addTaskPayload: Joi.object().keys({
    title: Joi.string().required(),
    task_description: Joi.string().required(),
    user_id: Joi.string().required(),
  }),
  listAllTaskPayload: Joi.object().keys({
    page_record: Joi.number().optional(),
    page_no: Joi.number().optional(),
    search: Joi.string().optional().allow(null, ""),
    sort_field: Joi.string().optional().allow(null, ""),
    sort_order: Joi.string().optional().allow(null, "")
  }),
  editTaskPayload: Joi.object().keys({
    title: Joi.string().required(),
    task_description: Joi.string().required(),
    user_id: Joi.string().required(),
    status: Joi.number().required(),
  }),

};
