const bcrypt = require('bcryptjs');

async function generateRandomCode(length = 12) {
    const charset = '0123456789';
    let randomCode = '';

    while (randomCode.length < length) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomCode += charset[randomIndex];
    }

    return randomCode;
}

module.exports = {
    generateRandomCode
}