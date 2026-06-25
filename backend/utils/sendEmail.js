const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Smart Finance Tracker <noreply@smartfinance.com>',
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // 3) Actually send the email
  if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
    await transporter.sendMail(mailOptions);
  } else {
    // Fallback if credentials are not provided (e.g. for local dev/testing)
    console.log('----------------------------------------------------');
    console.log(`SIMULATING EMAIL TO: ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`MESSAGE:\n${options.message}`);
    console.log('----------------------------------------------------');
  }
};

module.exports = sendEmail;
