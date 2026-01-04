import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const configOptions = {
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: true,
    },
};

export const transporter = nodemailer.createTransport(configOptions);
