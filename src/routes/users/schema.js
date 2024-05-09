
const Joi = require('joi');

exports.schema = {
    userDashboardDataPayload: Joi.object().keys({
        page_no:Joi.number().optional(),
        page_record: Joi.number().optional(),
        sort_field: Joi.string().optional().allow(null, ""),
        search: Joi.string().optional().allow(null, ""),
        sort_order: Joi.string().optional().allow(null, ""),
        user_type: Joi.number().optional().allow(null, ""),
    }),
    deleteUserAccount_UDPayload: Joi.object().keys({
        user_id: Joi.string().required(),
    })
}
