import { sendRegistrationEmail, determineBatch } from "@/lib/config/email";

export interface SendEmailParams {
  email: string;
  teamLeader: string;
  status: "success" | "failed";
  batch?: 1 | 2;
  rejectMessage?: string;
  registrationDate?: Date | string;
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
}
