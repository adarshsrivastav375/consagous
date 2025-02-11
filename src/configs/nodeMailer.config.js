import env from "#configs/env";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: env.ADMIN_EMAIL,
    pass: env.PASSWORD,
  },
});

const mailOptions = (receiverEmail, subject, htmlContent) => {
  const mailOptions = {
    from: {
      name: env.APP_NAME,
      address: env.ADMIN_EMAIL,
    },
    to: receiverEmail,
    subject: subject,
    html: htmlContent,
  };
  return mailOptions;
};
export { transporter, mailOptions };
