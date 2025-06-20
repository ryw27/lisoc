import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const configOptions = {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "jeffrey16@ethereal.email",
        pass: "smAYWTxbcyM9ZPZrKW",
    },
}

export const transporter = nodemailer.createTransport(configOptions);