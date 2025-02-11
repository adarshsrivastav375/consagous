import env from "#configs/env";
import { transporter, mailOptions } from "#configs/nodeMailer";
import crypto from "crypto";


function extractS3KeyFromUrl(url) {
  const s3Domain = "s3.ap-south-1.amazonaws.com";
  const bucketName = env.AWS_BUCKET_NAME;

  const regex = new RegExp(`https://${bucketName}\\.${s3Domain}/(.+)`);
  const match = url.match(regex);

  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  throw new Error("Invalid S3 URL or mismatch with bucket domain");
}

/*------------------------------------------to send mail-------------------------------------------*/

const sendMail = (receiverEmail, subject, htmlContent) => {
  const options = mailOptions(receiverEmail, subject, htmlContent);
  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log("Error while sending email:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });
};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function generatePassword() {
  return crypto.randomBytes(5).toString("hex");
}
export { extractS3KeyFromUrl, sendMail, generateOTP, generatePassword };
