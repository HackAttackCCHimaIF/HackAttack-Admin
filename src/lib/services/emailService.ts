import {
  sendRegistrationEmail,
  determineBatch,
  sendWorkshopEmail,
} from "@/lib/config/email";
import { createTransport } from "nodemailer";

export interface SendEmailParams {
  email: string;
  teamLeader: string;
  status: "success" | "failed";
  batch?: 1 | 2;
  rejectMessage?: string;
  registrationDate?: Date | string;
}

export interface SendWorkshopEmailParams {
  email: string;
  participantName: string;
  workshopName: string;
  institution: string;
  status: "approved" | "rejected";
  rejectMessage?: string;
}

export interface SendMagicLinkEmailParams {
  email: string;
  token: string;
  adminName?: string;
}

export class EmailService {
  static async sendRegistrationEmail(params: SendEmailParams) {
    const {
      email,
      teamLeader,
      status,
      batch,
      rejectMessage,
      registrationDate,
    } = params;

    let finalBatch = batch;

    if (status === "success" && !batch && registrationDate) {
      finalBatch = await determineBatch(new Date(registrationDate));
    }

    if (status === "success" && !finalBatch) {
      throw new Error("Batch is required for success emails");
    }

    if (status === "failed" && !rejectMessage) {
      throw new Error("Reject message is required for failed emails");
    }

    return await sendRegistrationEmail({
      email,
      teamLeader,
      status,
      batch: finalBatch,
      rejectMessage,
    });
  }

  static async sendBatch1SuccessEmail(email: string, teamLeader: string) {
    return await this.sendRegistrationEmail({
      email,
      teamLeader,
      status: "success",
      batch: 1,
    });
  }

  static async sendBatch2SuccessEmail(email: string, teamLeader: string) {
    return await this.sendRegistrationEmail({
      email,
      teamLeader,
      status: "success",
      batch: 2,
    });
  }

  static async sendFailedRegistrationEmail(
    email: string,
    teamLeader: string,
    rejectMessage: string
  ) {
    return await this.sendRegistrationEmail({
      email,
      teamLeader,
      status: "failed",
      rejectMessage,
    });
  }

  static async sendEmailWithAutoBatch(
    email: string,
    teamLeader: string,
    registrationDate: Date | string,
    status: "success" | "failed",
    rejectMessage?: string
  ) {
    return await this.sendRegistrationEmail({
      email,
      teamLeader,
      status,
      registrationDate,
      rejectMessage,
    });
  }

  static async sendWorkshopApprovalEmail(params: SendWorkshopEmailParams) {
    const {
      email,
      participantName,
      workshopName,
      institution,
      status,
      rejectMessage,
    } = params;

    if (status === "rejected" && !rejectMessage) {
      throw new Error(
        "Reject message is required for rejected workshop emails"
      );
    }

    return await sendWorkshopEmail({
      email,
      participantName,
      workshopName,
      institution,
      status,
      rejectMessage,
    });
  }

  static async sendWorkshopSuccessEmail(
    email: string,
    participantName: string,
    workshopName: string,
    institution: string
  ) {
    return await this.sendWorkshopApprovalEmail({
      email,
      participantName,
      workshopName,
      institution,
      status: "approved",
    });
  }

  static async sendWorkshopRejectionEmail(
    email: string,
    participantName: string,
    workshopName: string,
    institution: string,
    rejectMessage: string
  ) {
    return await this.sendWorkshopApprovalEmail({
      email,
      participantName,
      workshopName,
      institution,
      status: "rejected",
      rejectMessage,
    });
  }

  static async sendMagicLinkEmail(params: SendMagicLinkEmailParams) {
    const { email, token } = params;

    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${token}`;

    const emailHtml = `
      <h2>HackAttack 2025 Admin Confirmation</h2>
      
      <p>Click the following link to continue to your admin account:</p>
      <p><a href="${magicLinkUrl}">Sign In</a></p>
      
      <p>For security concern, don't share this link with anyone! This link will expire in 15 minutes and can only be used once.</p>
      <p>Ignore this email if it's not you.</p>
    `;

    const transporter = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Admin Login - HackAttack 2025",
      html: emailHtml,
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      console.log(`Magic link email sent to ${email}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Failed to send magic link email:", error);
      throw new Error("Failed to send magic link email");
    }
  }
}
