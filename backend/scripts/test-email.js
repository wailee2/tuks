//scripts/test-email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await t.verify();
    const info = await t.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.SMTP_USER, // send to yourself for test
      subject: 'Test email from tuks (Gmail SMTP)',
      text: 'This is a test',
    });
    console.log('Sent:', info.response || info);
  } catch (err) {
    console.error('Email error:', err);
  } finally {
    process.exit(0);
  }
})();
