const nodemailer = require("nodemailer");

// EMAIL CONFIG
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Dummy SMS function (replace with Twilio/Fast2SMS)
const sendSMS = (phone, message) => {
  console.log(`SMS sent to ${phone}: ${message}`);
};

exports.notifyGuardian = async (user, day) => {
  if (!user.guardianEmail || !user.guardianPhone) return;

  await transporter.sendMail({
    to: user.guardianEmail,
    subject: "Contest Missed Alert",
    text: `Your ward missed the ${day} coding contest. Please encourage participation.`
  });

  sendSMS(
    user.guardianPhone,
    `Alert: Your ward missed the ${day} coding contest.`
  );
};
