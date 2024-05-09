const jwt = require("jsonwebtoken");

class JWT {
    constructor() {
        this.HASH_METHOD = 'RSA256';
        this.optional_data = {
            expiresIn: 86400
        };
    }
    createJwt(dataObject) {
        return jwt.sign(dataObject, this.HASH_METHOD, this.optional_data);
    }
    decodeJwt(token) {
        jwt.verify(token, this.HASH_METHOD, { clockTimestamp: new Date().getTime() }, function (err, decoded_payload) {
            if (err) {
                return err;
            }
            else {
                return JSON.parse(JSON.stringify(decoded_payload));
            }
        });
    }
    validateToken(req, res) { }
}
module.exports = JWT;