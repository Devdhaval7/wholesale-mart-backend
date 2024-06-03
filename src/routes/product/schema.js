const Joi = require("joi");
// import { ErrorController } from "../../core/ErrorController";
// const EC = new ErrorController();

exports.jois = {

  listProductsPayload: Joi.object().keys({
    page_record: Joi.number().optional(),
    page_no: Joi.number().optional(),
    search: Joi.string().optional().allow(null, ""),
    filter_by: Joi.string().optional().allow(null, ""),
    sort_field: Joi.string().optional().allow(null, ""),
    sort_order: Joi.string().optional().allow(null, "")
  }),

  addProductPayload: Joi.object().keys({
    product_category_id: Joi.string().required(),
    product_subcategory_id: Joi.string().optional().allow(null, ""),
    product_name: Joi.string().required(),
    product_description: Joi.string().required(),
    price: Joi.number().required(),
    attribute_color: Joi.string().optional().allow(null, ""),
    attribute_material: Joi.string().optional().allow(null, ""),
    attribute_shape: Joi.string().optional().allow(null, ""),
    attribute_size: Joi.string().optional().allow(null, ""),
    product_images: Joi.string().optional().allow(null, ""),
  }),

  editProductPayload: Joi.object().keys({
    product_category_id: Joi.string().required(),
    product_subcategory_id: Joi.string().optional().allow(null, ""),
    product_name: Joi.string().required(),
    product_description: Joi.string().required(),
    product_variant: Joi.string().required(),
    unit_price: Joi.number().required(),
    cost_price: Joi.number().required(),
    rrr_price: Joi.number().required(),
    stock: Joi.number().required(),
    attribute_color: Joi.string().optional().allow(null, ""),
    attribute_material: Joi.string().optional().allow(null, ""),
    attribute_shape: Joi.string().optional().allow(null, ""),
    attribute_size: Joi.string().optional().allow(null, ""),
    product_images: Joi.string().optional().allow(null, ""),
    status: Joi.number().required(),
  }),

  addProductCategoryPayload: Joi.object().keys({
    category_name: Joi.string().required(),
    image_url: Joi.string().required(),
    subcategoryArr: Joi.array().items({
      subcategory_name: Joi.string().required(),
      image_url: Joi.string().required()
    }),
  }),

  // -------------

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
    permission_id: Joi.array().required().allow(null, ""),
    user_role: Joi.number()
  }),
  editAdminPayload: Joi.object().keys({
    user_id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    permission_id: Joi.array().required().allow(null, ""),
    user_role: Joi.number()
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
  guestUserBrowsePayload: Joi.object().keys({
    device_model: Joi.string().required(),
    os_version: Joi.string().required(),
    build_version: Joi.string().required(),
    device_token: Joi.string().required(),
    platform_type: Joi.number().required(),
    unit_preference: Joi.number(),
    google_client_id: Joi.string().allow(null, ""),
    apple_client_id: Joi.string().allow(null, ""),
    allowNotification: Joi.number(),
    user_login_type: Joi.number().required()
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
