import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  customerName: text("customer_name").notNull(),
  emailBody: text("email_body").notNull(),
  poNumber: text("po_number"),
  source: text("source"),
  status: text("status").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  fileCount: integer("file_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  jobId: text("job_id").notNull().references(() => jobs.id),
  originalName: text("original_name").notNull(),
  storedPath: text("stored_path").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
