import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const SHEET_TAB = "Job Submissions";

function getWriteClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export function isGoogleSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEET_ID
  );
}

export async function appendJobToSheet(data: {
  jobId: string;
  title: string;
  customerName: string;
  status: string;
  dateSubmitted: string;
  fileCount: number;
  portalLink: string;
}): Promise<boolean> {
  if (!isGoogleSheetsConfigured()) {
    console.log("Google Sheets not configured, skipping job log");
    return false;
  }

  const sheets = getWriteClient();

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_TAB}'!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.jobId,
          data.title,
          data.customerName,
          data.status,
          data.dateSubmitted,
          data.fileCount,
          data.portalLink,
        ]],
      },
    });
    console.log(`Job ${data.jobId} logged to Google Sheet`);
    return true;
  } catch (error) {
    console.error("Error appending job to Google Sheet:", error);
    return false;
  }
}
