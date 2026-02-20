export type JobStatus = "new" | "in-progress" | "complete";

export interface FileData {
  id: string;
  jobId: string;
  originalName: string;
  storedPath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  metadata: { pageCount?: number; width?: number; height?: number } | null;
  createdAt: string;
}

export type JobSource = "hod" | "team-concept" | null;

export interface JobData {
  id: string;
  title: string;
  poNumber: string | null;
  source: JobSource;
  customerName: string;
  emailBody: string;
  status: JobStatus;
  notes: string;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobWithFiles extends JobData {
  files: FileData[];
}
