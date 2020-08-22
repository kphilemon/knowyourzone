const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER_HOST,
    port: process.env.SMTP_SERVER_PORT,
    secure: process.env.SMTP_SERVER_PORT === '465',
    auth: {
        user: process.env.SMTP_EMAIL_ADDRESS,
        pass: process.env.SMTP_EMAIL_PASSWORD
    }
});

// notify admin on scrapped data via email
async function notifyAdmin(data) {
    if (process.env.ADMIN_NOTIFICATION_ENABLED !== 'true') return;

    const mail = {
        from: process.env.SMTP_EMAIL_ADDRESS,
        to: process.env.ADMIN_EMAIL,
        subject: `[${(data.error) ? 'ERROR' : 'SUCCESS'}] KnowYourZone Data Scraping`,
        html: `<pre>${JSON.stringify(data, null, 4)}</pre>`
    };

    await transporter.sendMail(mail).catch(error => {
        logger.error(`Error sending email to admin: ${error.message}`);
    });
}


module.exports.transporter = transporter;
module.exports.notifyAdmin = notifyAdmin;