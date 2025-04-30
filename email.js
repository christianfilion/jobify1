const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmailNotification(subject, message) {
  const mailOptions = {
    from: `"Jobify Notifier" <${process.env.SMTP_USER}>`,
    to: process.env.ALERT_EMAIL,
    subject,
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 Notification email sent.");
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
  }
}

module.exports = { sendEmailNotification };
