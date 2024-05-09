const ApiError = require("../core/ApiError");
const _ = require("lodash")

module.exports = (schema) => async (req, res, next) => {
    try {   
        if(!_.isEmpty(req.body)) {
            const { error } = schema.validate(req.body);
            if (!error)
                return next();
            const { details } = error;
            const message = details.map((i) => i.message.replace(/['"]+/g, '')).join(',');
            // Logger_1.default.error(message);
            next(new ApiError.BadRequestError(message));
        } else if(!_.isEmpty(req.query)) {
            const { error } =  await schema.validate(req.query);
            if (!error)
                return next();
            const  {details}  = error;
            const message = details.map((i) => i.message.replace(/['"]+/g, '')).join(',');
            // Logger_1.default.error(message);
            next(new ApiError.BadRequestError(message));
        }
    }
    catch (error) {
        next(error);
    }
};