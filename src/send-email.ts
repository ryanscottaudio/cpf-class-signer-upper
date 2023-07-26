import nodemailer, { SendMailOptions } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const nodemailerEmail = process.env.NODEMAILER_EMAIL;
const nodemailerPassword = process.env.NODEMAILER_PASSWORD;

if (!nodemailerEmail || !nodemailerPassword) {
  throw new Error("No nodemailer auth info present");
}

const emailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: nodemailerEmail,
    pass: nodemailerPassword,
  },
});

export const verifyEmailer = () =>
  new Promise((resolve, reject) => {
    emailer.verify((error, info) => (error ? reject(error) : resolve(info)));
  });

const sendEmail = (
  options: SendMailOptions
): Promise<SMTPTransport.SentMessageInfo> =>
  new Promise((resolve, reject) =>
    emailer.sendMail(options, (error, info) =>
      error ? reject(error) : resolve(info)
    )
  );

export const sendSignupEmail = (
  emailAddress: string,
  className: string,
  classTime: string,
  classDate: string,
  classLocation: string
) =>
  sendEmail({
    to: emailAddress,
    subject: `You have been signed up for class ${className} at ${classTime} on ${classDate} at Chelsea Piers Fitness ${classLocation}`,
    html: `
      <ul>
        <li>
          Class name: <strong>${className}</strong>
        </li>
        <li>
          Class time: <strong>${classTime}</strong>
        </li>
        <li>
          Class date: <strong>${classDate}</strong>
        </li>
        <li>
          Class location: <strong>${classLocation}</strong>
        </li>
        <li>
          Class location: <strong>Chelsea Piers Fitness Downtown Brooklyn</strong>
        </li>
      </ul>
    `,
  });
