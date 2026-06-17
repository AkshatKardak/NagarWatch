import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const emailConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const dashboardUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}`;

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
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <div style="max-width:640px;margin:0 auto;border:1px solid #ECE7DE;border-radius:10px;overflow:hidden">
        <div style="background:#D95D0F;padding:20px 24px">
          <h1 style="margin:0;color:#fff;font-size:20px">NagarWatch</h1>
          <p style="margin:4px 0 0;color:#FFE0CC;font-size:13px">Civic Issue Reporting Platform</p>
        </div>
        <div style="padding:24px">
          <h2 style="margin-top:0;color:#111827;font-size:18px">${title}</h2>
          ${body}
          <div style="margin-top:28px">
            <a href="${dashboardUrl}/admin-dashboard"
               style="background:#D95D0F;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold">
              Open Admin Dashboard
            </a>
          </div>
        </div>
        <div style="background:#F9F7F4;padding:12px 24px;border-top:1px solid #ECE7DE">
          <p style="margin:0;font-size:11px;color:#9CA3AF">This is an automated message from NagarWatch. Do not reply.</p>
        </div>
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
    from: `"NagarWatch" <${process.env.EMAIL_USER}>`,
    to: authorityEmail,
    subject: `⚠️ SLA Warning - Action Required: ${complaint.title}`,
    html: cardHtml(
      "SLA Deadline Approaching",
      `
        <p>A civic complaint is approaching its service level deadline and requires immediate attention.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6B7280">Complaint ID</td><td style="padding:6px 0;font-weight:bold">${complaint.id}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Title</td><td style="padding:6px 0;font-weight:bold">${complaint.title}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Category</td><td style="padding:6px 0">${complaint.category}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Deadline</td><td style="padding:6px 0;color:#D95D0F;font-weight:bold">${complaint.deadline.toLocaleString()}</td></tr>
        </table>
        <p style="color:#DC2626;font-weight:bold">Please resolve this complaint before the deadline to avoid escalation.</p>
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
    from: `"NagarWatch" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🚨 Escalation Level ${level} - ${complaint.title}`,
    html: cardHtml(
      `Escalation Level ${level} — ${escalationMeaning} Action Required`,
      `
        <p>This complaint has breached its SLA and has been escalated to <strong>${escalationMeaning}</strong> level.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6B7280">Complaint ID</td><td style="padding:6px 0;font-weight:bold">${complaint.id}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Title</td><td style="padding:6px 0;font-weight:bold">${complaint.title}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Location</td><td style="padding:6px 0">${complaint.location}</td></tr>
        </table>
        <p style="color:#DC2626;font-weight:bold">Urgent review and action is required immediately.</p>
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
    from: `"NagarWatch" <${process.env.EMAIL_USER}>`,
    to: citizenEmail,
    subject: `✅ Your Complaint Has Been Resolved - NagarWatch`,
    html: cardHtml(
      "Complaint Resolved",
      `
        <p>Great news! The civic issue you reported has been resolved by the local authority.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6B7280">Complaint ID</td><td style="padding:6px 0;font-weight:bold">${complaint.id}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Title</td><td style="padding:6px 0;font-weight:bold">${complaint.title}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Resolved At</td><td style="padding:6px 0;color:#059669;font-weight:bold">${complaint.resolvedAt.toLocaleString()}</td></tr>
        </table>
        <p>Before and after photos are available on NagarWatch for verification.</p>
      `
    ),
  });
  console.log(`Resolution email sent for complaint ${complaint.id}`);
}

/**
 * Sends the weekly civic summary digest to the Commissioner.
 * Called automatically every Monday at 8 AM by the weekly scheduler.
 */
export async function sendWeeklySummaryEmail(
  commissionerEmail: string,
  summaryMarkdown: string,
  stats: {
    newComplaints: number;
    resolved: number;
    pending: number;
    slaBreaches: number;
    weekLabel: string;
  }
): Promise<void> {
  if (!emailConfigured) {
    console.log(`[EMAIL MOCK] Weekly summary email to ${commissionerEmail}`);
    return;
  }

  // Convert markdown bold (**text**) and headers (## text) to basic HTML
  const bodyHtml = summaryMarkdown
    .replace(/## (.+)/g, "<h3 style='color:#D95D0F;margin:20px 0 8px'>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  await transporter.sendMail({
    from: `"NagarWatch" <${process.env.EMAIL_USER}>`,
    to: commissionerEmail,
    subject: `📊 NagarWatch Weekly Civic Summary — ${stats.weekLabel}`,
    html: cardHtml(
      `Weekly Civic Summary — ${stats.weekLabel}`,
      `
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:10px;background:#F9F7F4;border-radius:6px;text-align:center">
              <div style="font-size:24px;font-weight:bold;color:#D95D0F">${stats.newComplaints}</div>
              <div style="font-size:12px;color:#6B7280">New Complaints</div>
            </td>
            <td style="width:10px"></td>
            <td style="padding:10px;background:#F0FDF4;border-radius:6px;text-align:center">
              <div style="font-size:24px;font-weight:bold;color:#059669">${stats.resolved}</div>
              <div style="font-size:12px;color:#6B7280">Resolved</div>
            </td>
            <td style="width:10px"></td>
            <td style="padding:10px;background:#FFF7ED;border-radius:6px;text-align:center">
              <div style="font-size:24px;font-weight:bold;color:#D97706">${stats.pending}</div>
              <div style="font-size:12px;color:#6B7280">Pending</div>
            </td>
            <td style="width:10px"></td>
            <td style="padding:10px;background:#FEF2F2;border-radius:6px;text-align:center">
              <div style="font-size:24px;font-weight:bold;color:#DC2626">${stats.slaBreaches}</div>
              <div style="font-size:12px;color:#6B7280">SLA Breaches</div>
            </td>
          </tr>
        </table>
        <div style="margin-top:20px;font-size:14px;line-height:1.7">${bodyHtml}</div>
      `
    ),
  });
  console.log(`Weekly summary email sent to ${commissionerEmail} for ${stats.weekLabel}`);
}
