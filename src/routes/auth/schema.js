const Joi = require("joi");
// import { ErrorController } from "../../core/ErrorController";
// const EC = new ErrorController();

exports.jois = {
  registrationPayload: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  loginPayload: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  adminLoginPayload: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  logoutUserPayload: Joi.object().keys({
    access_token: Joi.string().required()
  }),
  addAdminPayload: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    permission_id: Joi.array().required(),
  }),
  editAdminPayload: Joi.object().keys({
    user_id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    permission_id: Joi.array().required().allow(null, ""),
  }),
  listAdminPayload: Joi.object().keys({
    page_record: Joi.number().optional(),
    page_no: Joi.number().optional(),
    search: Joi.string().optional().allow(null, ""),
    sort_field: Joi.string().optional().allow(null, ""),
    sort_order: Joi.string().optional().allow(null, "")
  }),
  getAdminPayload: Joi.object().keys({
    user_id: Joi.string().required()
  }),
  deleteAdminPayload: Joi.object().keys({
    user_id: Joi.string().required()
  }),
  addPermissionPayload: Joi.object().keys({
    name: Joi.string().required(),
    slug: Joi.string().required()
  }),
  listPermissionPayload: Joi.object().keys({
    page_record: Joi.number().optional(),
    page_no: Joi.number().optional(),
    search: Joi.string().optional().allow(null, ""),
    sort_field: Joi.string().optional().allow(null, ""),
    sort_order: Joi.string().optional().allow(null, "")
  }),
  updateAdminProfilePayload: Joi.object().keys({
    user_id: Joi.string().optional(),
    email: Joi.string().email().required(),
    old_password: Joi.string().required(),
    new_password: Joi.string().required()
  }),
  resetPasswordPayload: Joi.object().keys({
    email: Joi.string().email().required(),
    newPassword: Joi.string().required()
  }),
  adminResetPasswordPayload: Joi.object().keys({
    temp_key: Joi.string(),
    newPassword: Joi.string().required()
  })
};
