const nodeMailer = require("nodemailer");

const sendEmail = async (options) => {
    // Check if credentials exist, otherwise log warning and skip
    if (!process.env.SMPT_MAIL || !process.env.SMPT_PASSWORD) {
        console.warn("Email credentials missing. Skipping email send.");
        return;
    }

    const transporter = nodeMailer.createTransport({
        service: process.env.SMPT_SERVICE,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // Optional: if we want HTML emails later
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
