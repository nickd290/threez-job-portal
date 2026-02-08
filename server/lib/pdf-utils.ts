import fs from "fs";
import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";

export async function extractPdfMetadata(
  filePath: string
): Promise<{ pageCount: number; width: number; height: number } | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    // Get page count using pdf-parse
    const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });
    const info = await parser.getInfo();
    const pageCount = info.total;

    // Get first page dimensions using pdf-lib
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const firstPage = pdfDoc.getPage(0);
    const { width: widthPts, height: heightPts } = firstPage.getSize();

    // Convert points to inches (72 points per inch), round to 1 decimal
    const width = Math.round((widthPts / 72) * 10) / 10;
    const height = Math.round((heightPts / 72) * 10) / 10;

    // Clean up parser resources
    await parser.destroy().catch(() => {});

    return { pageCount, width, height };
  } catch (error) {
    console.error("PDF metadata extraction failed:", error);
    return null;
  }
}
