const Joi = require("joi");
// import { ErrorController } from "../../core/ErrorController";
// const EC = new ErrorController();

exports.jois = {

  // listProductsPayload: Joi.object().keys({
  //   page_record: Joi.number().optional(),
  //   page_no: Joi.number().optional(),
  //   search: Joi.string().optional().allow(null, ""),
  //   sort_field: Joi.string().optional().allow(null, ""),
  //   sort_order: Joi.string().optional().allow(null, "")
  // }),

  addToCartPayload: Joi.object().keys({
    product_id: Joi.string().required(),
    qty: Joi.number().min(0).required(),
  }),

  removeFromCartPayload: Joi.object().keys({
    product_id: Joi.string().required()
  }),

  placeOrderPayload: Joi.object().keys({
    shopping_list_id: Joi.string().required()
  }),


};
