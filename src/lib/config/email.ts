"use server";

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const emailBatch1Template = fs.readFileSync(
  path.join(process.cwd(), "public", "email-template", "emailBatch1.html"),
  "utf8"
);

const emailBatch2Template = fs.readFileSync(
  path.join(process.cwd(), "public", "email-template", "emailBatch2.html"),
  "utf8"
);

const emailFailedRegistTemplate = fs.readFileSync(
  path.join(
    process.cwd(),
    "public",
    "email-template",
    "emailFailedRegist.html"
  ),
  "utf8"
);

const emailWorkshopSuccessTemplate = fs.readFileSync(
  path.join(
    process.cwd(),
    "public",
    "email-template",
    "emailWorkshopSuccess.html"
  ),
  "utf8"
);

const emailWorkshopRejectedTemplate = fs.readFileSync(
  path.join(
    process.cwd(),
    "public",
    "email-template",
    "emailWorkshopRejected.html"
  ),
  "utf8"
);

interface EmailServiceParams {
  email: string;
  teamLeader: string;
  status: "success" | "failed";
  batch?: 1 | 2;
  rejectMessage?: string;
}

interface WorkshopEmailParams {
  email: string;
  participantName: string;
  workshopName: string;
  institution: string;
  status: "approved" | "rejected";
  rejectMessage?: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    host: "​smtp.gmail.com​",
    port: 587,
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendRegistrationEmail({
  email,
  teamLeader,
  status,
  batch,
  rejectMessage,
}: EmailServiceParams) {
  let template: string;
  let subject: string;
  let attachments: { filename: string; path: string; cid: string }[] = [];

  const baseAttachments = [
    {
      filename: "header.png",
      path: path.join(
        process.cwd(),
        "public",
        "email-template",
        "email-asset",
        "header.png"
      ),
      cid: "header",
    },
  ];

  if (status === "success") {
    if (batch === 1) {
      template = emailBatch1Template;
      subject =
        "🎉 CONGRATS! Anda Resmi Terdaftar di HACKATTACK 2025 - Batch 1";
      attachments = [
        ...baseAttachments,
        {
          filename: "bannersuccess.png",
          path: path.join(
            process.cwd(),
            "public",
            "email-template",
            "email-asset",
            "bannersuccess.png"
          ),
          cid: "bannersuccess",
        },
      ];
    } else if (batch === 2) {
      template = emailBatch2Template;
      subject =
        "🎉 CONGRATS! Anda Resmi Terdaftar di HACKATTACK 2025 - Batch 2";
      attachments = [
        ...baseAttachments,
        {
          filename: "bannersuccess.png",
          path: path.join(
            process.cwd(),
            "public",
            "email-template",
            "email-asset",
            "bannersuccess.png"
          ),
          cid: "bannersuccess",
        },
      ];
    } else {
      throw new Error("Batch is required for success emails");
    }
  } else if (status === "failed") {
    template = emailFailedRegistTemplate;
    subject = "⚠️ PENTING: Pendaftaran HACKATTACK 2025 Anda Perlu Diperbaiki";
    attachments = [
      ...baseAttachments,
      {
        filename: "bannergagal.png",
        path: path.join(
          process.cwd(),
          "public",
          "email-template",
          "email-asset",
          "bannergagal.png"
        ),
        cid: "bannergagal",
      },
    ];
  } else {
    throw new Error("Invalid status. Must be 'success' or 'failed'");
  }

  let htmlContent = template
    .replace(/\{\{teamLeader\}\}/g, teamLeader)
    .replace(/\{\{email\}\}/g, email);

  if (status === "failed" && rejectMessage) {
    htmlContent = htmlContent.replace(/\{\{rejectMessage\}\}/g, rejectMessage);
  }

  const message = {
    from: `HackAttack.CCIHimaIF <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: subject,
    html: htmlContent,
    attachments: attachments,
  };

  const transporter = createTransporter();

  try {
    await transporter.sendMail(message);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

// export async function sendRejectRegistrationEmail(email: string) {
//   const notifyMeTemplate = rejectSubmissionTemplate;

//   const message = {
//     from: `HackAttack.CCIHimaIF <${process.env.EMAIL_FROM}>`,
//     to: email,
//     subject: "🚀 Rejection: HackAttack2025 Submission",
//     html: notifyMeTemplate.replace("{{email}}", email),
//     attachments: [
//       {
//         filename: "header.png",
//         path: path.join(
//           process.cwd(),
//           "public",
//           "email-template",
//           "email-asset",
//           "header.png"
//         ),
//         cid: "header",
//       },
//       {
//         filename: "banner.png",
//         path: path.join(
//           process.cwd(),
//           "public",
//           "email-template",
//           "email-asset",
//           "banner.png"
//         ),
//         cid: "banner",
//       },
//     ],
//   };

//   const transporter = createTransporter();

//   try {
//     await transporter.sendMail(message);
//     return { success: true };
//   } catch (error) {
//     console.error("Error sending email:", error);
//     return { success: false, error };
//   }
// }

export async function determineBatch(registrationDate: Date): Promise<1 | 2> {
  const regDate = new Date(registrationDate);
  const batch1Start = new Date("2025-10-27");
  const batch1End = new Date("2025-11-8");
  const batch2Start = new Date("2025-11-9");
  const batch2End = new Date("2025-11-15");

  if (regDate >= batch1Start && regDate <= batch1End) {
    return 1;
  } else if (regDate >= batch2Start && regDate <= batch2End) {
    return 2;
  } else {
    return 2;
  }
}

export async function sendWorkshopEmail({
  email,
  participantName,
  workshopName,
  institution,
  status,
  rejectMessage,
}: WorkshopEmailParams) {
  let template: string;
  let subject: string;
  let attachments: { filename: string; path: string; cid: string }[] = [];

  const baseAttachments = [
    {
      filename: "header.png",
      path: path.join(
        process.cwd(),
        "public",
        "email-template",
        "email-asset",
        "header.png"
      ),
      cid: "header",
    },
  ];

  let workshopTitle = "";
  let workshopDate = "";
  let Benefit1 = "";
  let Benefit2 = "";
  let Benefit3 = "";

  if (workshopName == "workshop1") {
    workshopName =
      "Workshop 1 🤩☺️ Hackattack 2025 – Decode the Problem: Framing Ideas into Digital Impact for Nusantara.";
    workshopTitle =
      "🔍 Saatnya Ikut Workshop 1 Hackattack 2025 Decode the Problem ";
    workshopDate = "Minggu, 9 November 2025";
    Benefit1 =
      "Belajar teknik framing masalah yang relevan dengan kondisi nyata di Nusantara ";
    Benefit2 =
      "Mendapatkan panduan dari mentor dalam menyusun solusi digital yang tepat sasaran";
    Benefit3 =
      "Mengembangkan kemampuan berpikir kritis dan analitis untuk inovasi sosial";
  }

  if (workshopName == "workshop2") {
    workshopName =
      "Workshop 2 🤩☺️ Hackattack 2025 – Code the Solution: Prototyping Smart Innovations for Real-World Impact.";
    workshopTitle =
      "Undangan Resmi Workshop 2 Hackattack 2025 Code the Solution";
    workshopDate = "Minggu, 23 November 2025";
    Benefit1 = "Mengubah ide menjadi prototipe digital yang konkret";
    Benefit2 = "Menggunakan pendekatan desain dan coding yang efisien";
    Benefit3 =
      "Mempelajari cara membuat solusi digital yang bisa langsung diuji di dunia nyata";
  }

  if (status === "approved") {
    template = emailWorkshopSuccessTemplate;
    subject = `🎉 Workshop Registration Approved - ${workshopName}`;
    attachments = [
      ...baseAttachments,
      {
        filename: "bannersuccess.png",
        path: path.join(
          process.cwd(),
          "public",
          "email-template",
          "email-asset",
          "bannersuccess.png"
        ),
        cid: "bannersuccess",
      },
    ];
  } else if (status === "rejected") {
    template = emailWorkshopRejectedTemplate;
    subject = `⚠️ Workshop Registration Update - ${workshopName}`;
    attachments = [
      ...baseAttachments,
      {
        filename: "bannergagal.png",
        path: path.join(
          process.cwd(),
          "public",
          "email-template",
          "email-asset",
          "bannergagal.png"
        ),
        cid: "bannergagal",
      },
    ];
  } else {
    throw new Error("Invalid status. Must be 'approved' or 'rejected'");
  }

  let htmlContent = template
    .replace(/\{\{participantName\}\}/g, participantName)
    .replace(/\{\{participantEmail\}\}/g, email)
    .replace(/\{\{workshopTitle\}\}/g, workshopTitle)
    .replace(/\{\{workshopDate\}\}/g, workshopDate)
    .replace(/\{\{workshopName\}\}/g, workshopName)
    .replace(/\{\{institution\}\}/g, institution)
    .replace(/\{\{Benefit1\}\}/g, Benefit1)
    .replace(/\{\{Benefit2\}\}/g, Benefit2)
    .replace(/\{\{Benefit3\}\}/g, Benefit3);

  if (status === "rejected" && rejectMessage) {
    htmlContent = htmlContent.replace(/\{\{rejectMessage\}\}/g, rejectMessage);
  }

  const message = {
    from: `HackAttack.CCIHimaIF <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: subject,
    html: htmlContent,
    attachments: attachments,
  };

  const transporter = createTransporter();

  try {
    await transporter.sendMail(message);
    return { success: true };
  } catch (error) {
    console.error("Error sending workshop email:", error);
    return { success: false, error };
  }
}
