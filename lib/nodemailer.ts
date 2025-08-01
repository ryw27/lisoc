import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const configOptions = {
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: true
    }
}
// const configOptions = {
//     host: 'smtp.ethereal.email',
//     port: 587,
//     auth: {
//         user: 'vivien31@ethereal.email',
//         pass: 'wWMTT3NqGKT4PtB5yt'
//     }
// };

export const transporter = nodemailer.createTransport(configOptions);