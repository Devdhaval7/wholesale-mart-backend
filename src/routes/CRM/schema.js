const Joi = require("joi");
// import { ErrorController } from "../../core/ErrorController";
// const EC = new ErrorController();

exports.jois = {

  requestActionPayload: Joi.object().keys({
    user_id: Joi.string().required(),
    action: Joi.number().required(),
  }),
  // listAllTaskPayload: Joi.object().keys({
  //   page_record: Joi.number().optional(),
  //   page_no: Joi.number().optional(),
  //   search: Joi.string().optional().allow(null, ""),
  //   sort_field: Joi.string().optional().allow(null, ""),
  //   sort_order: Joi.string().optional().allow(null, "")
  // }),
   

};
