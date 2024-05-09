const { Response, Request, NextFunction } = require("express");
const jwt = require('jsonwebtoken');
const { dbReader, dbWriter } = require('../models/dbconfig');
const { SuccessResponse, AuthFailureError, BadRequestError, ApiError } = require('../core/index');
// Permit_Check
module.exports = async function tokenValidate(req, res, next) {
    try {
        if (req.headers.authorization) {
            // let access_token = req.headers.authorization;
            let access_token = req.headers.authorization.toString().split(" ")[1];
            jwt.verify(access_token.toString(), process.env.SECRET_KEY, async function (err, decoded) {
                if (err) {
                    console.log('err', err)
                    ApiError.handle(new AuthFailureError("Invalid token."), res);
                } else {
                    var user = await dbReader.users.findOne({
                        where: { access_token: access_token.toString() },
                    });
                    if (user) {
                        req.user = decoded
                        next();
                    } else {
                        ApiError.handle(new AuthFailureError("Your session is expired. Please login into system again."), res);
                    }
                }
            });
        } else {
            res.send({
                status_code: 401,
                message: "Unauthorized request: no authentication given"
            });
        }
    } catch (err) {
        ApiError.handle(new AuthFailureError(err.message), res);
    }
}
