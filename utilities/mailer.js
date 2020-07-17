const nodemailer = require('nodemailer');

module.exports = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_HOST,
    port: process.env.SMTP_SERVER_PORT,
    secure: process.env.SMTP_SERVER_PORT === '465',
    auth: {
        user: process.env.SMTP_EMAIL_ADDRESS,
        pass: process.env.SMTP_EMAIL_PASSWORD
    }
});