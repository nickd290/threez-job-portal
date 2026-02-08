import { Router } from "express";
import path from "path";
import fs from "fs";
import { db, schema, UPLOADS_DIR } from "../db/index.js";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/files/:id/download
router.get("/:id/download", async (req, res) => {
  try {
    const file = await db.select().from(schema.files).where(eq(schema.files.id, req.params.id)).get();
    if (!file) return res.status(404).json({ error: "File not found" });

    const filePath = path.join(UPLOADS_DIR, file.storedPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found on disk" });

    res.download(filePath, file.originalName);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

// DELETE /api/files/:id
router.delete("/:id", async (req, res) => {
  try {
    const file = await db.select().from(schema.files).where(eq(schema.files.id, req.params.id)).get();
    if (!file) return res.status(404).json({ error: "File not found" });

    // Delete from disk
    const filePath = path.join(UPLOADS_DIR, file.storedPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Delete record
    await db.delete(schema.files).where(eq(schema.files.id, req.params.id));

    // Decrement file count on job
    const job = await db.select().from(schema.jobs).where(eq(schema.jobs.id, file.jobId)).get();
    if (job) {
      await db.update(schema.jobs)
        .set({ fileCount: Math.max(0, job.fileCount - 1), updatedAt: new Date() })
        .where(eq(schema.jobs.id, file.jobId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
