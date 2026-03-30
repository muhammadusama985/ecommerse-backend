import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: env.smtpUser && env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
});

const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    return;
  }

  try {
    await transporter.sendMail({
      from: env.emailFrom,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.warn("Email sending failed:", error.message);
  }
};

export { sendEmail };
