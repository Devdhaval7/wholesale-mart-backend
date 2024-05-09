// const { ErrorController } =require "../core/ErrorController";
const { SuccessResponse } =require('./ApiResponse');
const { BadRequestError, ApiError, AuthFailureError } = require('./ApiError');
const { JWT } = require("./JWT");
// import UAParser = require("ua-parser-js");

module.exports = { SuccessResponse, BadRequestError, ApiError, JWT, AuthFailureError}
