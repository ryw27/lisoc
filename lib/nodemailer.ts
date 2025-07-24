import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// const configOptions = {
//     host: "sm14.internetmailserver.net",
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//         user: "kun.wei@lisoc.org",
//         pass: "104@Kathleen",
//     },
//     tls: {
//         rejectUnauthorized: true
//     }
// }
const configOptions = {
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'vivien31@ethereal.email',
        pass: 'wWMTT3NqGKT4PtB5yt'
    }
};

export const transporter = nodemailer.createTransport(configOptions);