import dotenv from "dotenv";
//import nodemailer from "nodemailer";

import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";


dotenv.config();

/*const configOptions = {
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
*/

const configOptions = {
    'clientId': process.env.MS_CLIENT_ID!,
    'clientSecret': process.env.MS_CLIENT_SECRET!,
    'tenantId': process.env.MS_TENANT_ID!,
    'sender': process.env.MS_SENDER_EMAIL!
    
};




/*

export const transporter = nodemailer.createTransport(configOptions);

*/


// This is the ONLY mailbox your app will use
//const sender = "regadmin";

async function getAccessToken(): Promise<string> {
  const cca = new ConfidentialClientApplication({
    auth: {
      clientId: configOptions.clientId,
      authority: `https://login.microsoftonline.com/${configOptions.tenantId}`,
      clientSecret: configOptions.clientSecret
    }
  });

  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"]
  });

  if (!result?.accessToken) throw new Error("Failed to get token");
  return result.accessToken;
}


export async function msSendEmail(recipient: string, subject: string, content: string) {
  try {
    const token = await getAccessToken();

    const graph = Client.init({
      authProvider: (done) => done(null, token)
    });

    await graph.api(`/users/${configOptions.sender}/sendMail`).post({
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: content
        },
        toRecipients: [
          { emailAddress: { address: recipient } }
        ]
      }
    });

    console.log("Email sent!");
  } catch (error: unknown) {
    console.error("msSendEmail failed:", error);
    throw "unknown error please contact administrator";
  }
}