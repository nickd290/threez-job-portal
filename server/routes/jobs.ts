import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { db, schema, UPLOADS_DIR } from "../db/index.js";
import { eq, desc, like, or, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { appendJobToSheet } from "../lib/google-sheets.js";
import { sendNewJobNotification } from "../lib/email.js";
import { extractPdfMetadata } from "../lib/pdf-utils.js";

const router = Router();
const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/jobs - list all jobs with optional filters
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(schema.jobs.status, status as string));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(schema.jobs.title, searchTerm),
          like(schema.jobs.customerName, searchTerm),
          like(schema.jobs.emailBody, searchTerm)
        )!
      );
    }

    const results = conditions.length > 0
      ? await db.select().from(schema.jobs).where(and(...conditions)).orderBy(desc(schema.jobs.createdAt))
      : await db.select().from(schema.jobs).orderBy(desc(schema.jobs.createdAt));

    res.json(results);
  } catch (error) {
    console.error("Error listing jobs:", error);
    res.status(500).json({ error: "Failed to list jobs" });
  }
});

// GET /api/jobs/:id - single job with files
router.get("/:id", async (req, res) => {
  try {
    const job = await db.select().from(schema.jobs).where(eq(schema.jobs.id, req.params.id)).get();
    if (!job) return res.status(404).json({ error: "Job not found" });

    const files = await db.select().from(schema.files).where(eq(schema.files.jobId, req.params.id));

    // Parse metadata JSON for each file
    const filesWithMeta = files.map(f => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : null,
    }));

    res.json({ ...job, files: filesWithMeta });
  } catch (error) {
    console.error("Error getting job:", error);
    res.status(500).json({ error: "Failed to get job" });
  }
});

// POST /api/jobs - create job with file uploads
router.post("/", upload.array("files", 20), async (req, res) => {
  try {
    const { title, customerName, emailBody } = req.body;
    if (!title || !customerName || !emailBody) {
      return res.status(400).json({ error: "title, customerName, and emailBody are required" });
    }

    const jobId = nanoid();
    const uploadedFiles = (req.files as Express.Multer.File[]) || [];

    // Create job
    const [job] = await db.insert(schema.jobs).values({
      id: jobId,
      title,
      customerName,
      emailBody,
      fileCount: uploadedFiles.length,
    }).returning();

    // Process files
    const jobUploadDir = path.join(UPLOADS_DIR, jobId);
    if (uploadedFiles.length > 0) {
      fs.mkdirSync(jobUploadDir, { recursive: true });
    }

    const fileRecords: (typeof schema.files.$inferSelect)[] = [];
    for (const file of uploadedFiles) {
      const destPath = path.join(jobUploadDir, file.originalname);
      fs.renameSync(file.path, destPath);

      const [fileRecord] = await db.insert(schema.files).values({
        jobId,
        originalName: file.originalname,
        storedPath: path.join(jobId, file.originalname),
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }).returning();

      fileRecords.push(fileRecord);
    }

    // PDF metadata extraction (fire-and-forget)
    const pdfExtractions = uploadedFiles.map(async (file, i) => {
      if (file.mimetype !== "application/pdf") return;
      const filePath = path.join(jobUploadDir, file.originalname);
      const metadata = await extractPdfMetadata(filePath);
      if (metadata) {
        await db.update(schema.files)
          .set({ metadata: JSON.stringify(metadata) })
          .where(eq(schema.files.id, fileRecords[i].id));
      }
    });
    Promise.all(pdfExtractions).catch((err) =>
      console.error("PDF metadata extraction error:", err)
    );

    // Log to Google Sheets (fire-and-forget)
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "http://localhost:3002";
    appendJobToSheet({
      jobId: job.id,
      title: job.title,
      customerName: job.customerName,
      status: "new",
      dateSubmitted: new Date().toISOString(),
      fileCount: uploadedFiles.length,
      portalLink: `${origin}/jobs/${job.id}`,
    }).catch((err) => console.error("Sheet sync failed:", err));

    // Send email notification to Three Z (fire-and-forget)
    sendNewJobNotification(
      job,
      fileRecords,
      `${origin}/jobs/${job.id}`
    ).catch((err) => console.error("Email notification failed:", err));

    res.status(201).json({ ...job, files: fileRecords });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// POST /api/jobs/:id/files - add files to existing job
router.post("/:id/files", upload.array("files", 20), async (req, res) => {
  try {
    const job = await db.select().from(schema.jobs).where(eq(schema.jobs.id, req.params.id)).get();
    if (!job) return res.status(404).json({ error: "Job not found" });

    const uploadedFiles = (req.files as Express.Multer.File[]) || [];
    const jobUploadDir = path.join(UPLOADS_DIR, req.params.id);
    fs.mkdirSync(jobUploadDir, { recursive: true });

    const fileRecords = [];
    for (const file of uploadedFiles) {
      const destPath = path.join(jobUploadDir, file.originalname);
      fs.renameSync(file.path, destPath);

      const [fileRecord] = await db.insert(schema.files).values({
        jobId: req.params.id,
        originalName: file.originalname,
        storedPath: path.join(req.params.id, file.originalname),
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }).returning();

      fileRecords.push(fileRecord);
    }

    // Update file count
    await db.update(schema.jobs)
      .set({ fileCount: job.fileCount + uploadedFiles.length, updatedAt: new Date() })
      .where(eq(schema.jobs.id, req.params.id));

    res.status(201).json(fileRecords);
  } catch (error) {
    console.error("Error adding files:", error);
    res.status(500).json({ error: "Failed to add files" });
  }
});

// PUT /api/jobs/:id - update status, notes
router.put("/:id", async (req, res) => {
  try {
    const job = await db.select().from(schema.jobs).where(eq(schema.jobs.id, req.params.id)).get();
    if (!job) return res.status(404).json({ error: "Job not found" });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.title !== undefined) updates.title = req.body.title;

    const [updated] = await db.update(schema.jobs)
      .set(updates)
      .where(eq(schema.jobs.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

// DELETE /api/jobs/:id - delete job and all files
router.delete("/:id", async (req, res) => {
  try {
    const job = await db.select().from(schema.jobs).where(eq(schema.jobs.id, req.params.id)).get();
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Delete file records
    await db.delete(schema.files).where(eq(schema.files.jobId, req.params.id));

    // Delete job
    await db.delete(schema.jobs).where(eq(schema.jobs.id, req.params.id));

    // Delete uploaded files from disk
    const jobUploadDir = path.join(UPLOADS_DIR, req.params.id);
    if (fs.existsSync(jobUploadDir)) {
      fs.rmSync(jobUploadDir, { recursive: true });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

export default router;
