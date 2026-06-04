import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const emailConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const dashboardUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/authority`;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
} as SMTPTransport.Options);

if (emailConfigured) {
  console.log("Email notifications configured");
} else {
  console.warn("Email not configured - notifications will be skipped");
}

function cardHtml(title: string, body: string): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <div style="max-width:640px;margin:0 auto;border:1px solid #d1d5db;border-radius:8px;padding:24px">
        <h2 style="margin-top:0;color:#111827">${title}</h2>
        ${body}
        <p style="margin-top:24px">
          <a href="${dashboardUrl}" style="background:#0f766e;color:#fff;padding:10px 14px;text-decoration:none;border-radius:6px">
            Open NagarWatch dashboard
          </a>
        </p>
      </div>
    </div>
  `;
}

export async function sendSLAWarning(
  authorityEmail: string,
  complaint: { id: string; title: string; category: string; deadline: Date }
): Promise<void> {
  if (!emailConfigured) {
    console.log(`[EMAIL MOCK] SLA warning for ${complaint.id}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: authorityEmail,
    subject: `SLA Warning - Action Required: ${complaint.title}`,
    html: cardHtml(
      "SLA Warning",
      `
        <p>A civic issue is approaching its service deadline.</p>
        <p><strong>Complaint ID:</strong> ${complaint.id}</p>
        <p><strong>Title:</strong> ${complaint.title}</p>
        <p><strong>Category:</strong> ${complaint.category}</p>
        <p><strong>Deadline:</strong> ${complaint.deadline.toLocaleString()}</p>
      `
    ),
  });

  console.log(`SLA warning email sent for complaint ${complaint.id}`);
}

export async function sendEscalationEmail(
  toEmail: string,
  complaint: { id: string; title: string; location: string },
  level: number
): Promise<void> {
  if (!emailConfigured) {
    console.log(`[EMAIL MOCK] Escalation level ${level} for ${complaint.id}`);
    return;
  }

  const escalationMeaning = level === 1 ? "Zonal Head" : "Commissioner";

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `Escalation Level ${level} - ${complaint.title}`,
    html: cardHtml(
      `Escalation Level ${level}`,
      `
        <p>This complaint has breached its SLA and now requires ${escalationMeaning} attention.</p>
        <p><strong>Complaint ID:</strong> ${complaint.id}</p>
        <p><strong>Title:</strong> ${complaint.title}</p>
        <p><strong>Location:</strong> ${complaint.location}</p>
        <p>Please review and act on this complaint urgently.</p>
      `
    ),
  });

  console.log(`Escalation email sent for complaint ${complaint.id} at level ${level}`);
}

export async function sendResolutionEmail(
  citizenEmail: string,
  complaint: { id: string; title: string; resolvedAt: Date }
): Promise<void> {
  if (!emailConfigured) {
    console.log(`[EMAIL MOCK] Resolution email for ${complaint.id}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: citizenEmail,
    subject: "Your Complaint Has Been Resolved - NagarWatch",
    html: cardHtml(
      "Complaint Resolved",
      `
        <p>Thank you for reporting this civic issue. The authority has marked it resolved.</p>
        <p><strong>Complaint ID:</strong> ${complaint.id}</p>
        <p><strong>Title:</strong> ${complaint.title}</p>
        <p><strong>Resolved At:</strong> ${complaint.resolvedAt.toLocaleString()}</p>
        <p>Before and after photos are available on NagarWatch.</p>
      `
    ),
  });

  console.log(`Resolution email sent for complaint ${complaint.id}`);
}
