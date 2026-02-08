import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "nick@jdgraphic.com";
const FROM_NAME = "JD Graphic";

export function isEmailConfigured(): boolean {
  return !!(process.env.SENDGRID_API_KEY && process.env.THREEZ_NOTIFY_EMAIL);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid not configured — email not sent");
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: ["nick@jdgraphic.com"].filter((e) => e !== options.to),
    });
    return true;
  } catch (error) {
    console.error("SendGrid error:", error);
    return false;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface FileInfo {
  originalName: string;
  sizeBytes: number | null;
  metadata?: string | null;
}

export async function sendNewJobNotification(
  job: { id: string; title: string; customerName: string; emailBody: string; fileCount: number },
  files: FileInfo[],
  portalLink: string,
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log("SendGrid not configured — email not sent");
    return false;
  }

  const notifyEmail = process.env.THREEZ_NOTIFY_EMAIL!;
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

  const fileListHtml = files.length > 0
    ? files.map((f) => {
        const meta = f.metadata ? JSON.parse(f.metadata) : null;
        const pageInfo = meta?.pageCount ? ` (${meta.pageCount} pages)` : "";
        return `<li style="padding: 4px 0;">${escapeHtml(f.originalName)} — ${formatFileSize(f.sizeBytes)}${pageInfo}</li>`;
      }).join("\n")
    : '<li style="padding: 4px 0; color: #94a3b8;">No files attached</li>';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #c41e2a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">New Job Submitted</h1>
    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Three Z Job Portal</p>
  </div>

  <div style="background-color: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="margin-top: 0; font-size: 20px;">${escapeHtml(job.title)}</h2>
    <p style="color: #64748b; margin-top: -8px;">from <strong>${escapeHtml(job.customerName)}</strong></p>

    <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Job Details</h3>
    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: Arial, sans-serif; font-size: 14px; color: #334155;">${escapeHtml(job.emailBody)}</pre>
    </div>

    <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Attached Files (${files.length})</h3>
    <ul style="background-color: white; padding: 12px 12px 12px 32px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px; list-style-type: disc;">
      ${fileListHtml}
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalLink}" style="background-color: #c41e2a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View in Portal</a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">Submitted ${timestamp}</p>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: notifyEmail,
    subject: `New Job Submitted: ${job.title} — ${job.customerName}`,
    html,
    text: `New job submitted: ${job.title} from ${job.customerName}\n\n${job.emailBody}\n\nFiles: ${files.length}\nView: ${portalLink}`,
  });
}
