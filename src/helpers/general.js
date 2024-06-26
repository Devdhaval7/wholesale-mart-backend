const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const ejs = require("ejs");
const Path = require("path");

async function generateProductHexCode(maxLength = 8) {
    const buffer = crypto.randomBytes(Math.ceil(maxLength / 2));
    const hexCode = buffer.toString('hex').slice(0, maxLength);
    return hexCode.toUpperCase(); // Optionally convert to uppercase
}

async function generateUserHexCode(maxLength = 8) {
    const buffer = crypto.randomBytes(Math.ceil(maxLength / 2));
    const hexCode = buffer.toString('hex').slice(0, maxLength);
    return hexCode.toUpperCase(); // Optionally convert to uppercase
}

// send mail for sub admin credentials...
async function sendMail(data) {
    // ? Creating transport
    let transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // ? Verifying the Nodemailer Transport instance
    transport.verify((error, success) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Server is ready to take messages');
        }
    });

    const email_title = "Your admin account has been created.",
        EmailVerifyTemplate = Path.join(__dirname, "../templates/subAdminAccount.ejs"),
        optionsOBJ = { username: data.username, password: data.password };

    ejs.renderFile(EmailVerifyTemplate, optionsOBJ, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: optionsOBJ.username,
                subject: email_title,
                html: data,
                attachments: [
                    // { filename: 'profile.png', path: './images/profile.png' }
                ]
            };

            transport.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err)
                } else {
                    // console.log(info);
                }
            });

        }

    })


}

module.exports = {
    generateProductHexCode,
    generateUserHexCode,
    sendMail
}