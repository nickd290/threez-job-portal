import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpdateJob, useDeleteJob } from "@/hooks/useJobs";
import { filesApi } from "@/lib/api";
import type { JobWithFiles, JobStatus, FileData } from "@/types";

interface JobDetailProps {
  job: JobWithFiles;
}

function statusBadge(status: JobStatus) {
  switch (status) {
    case "new":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
          New
        </Badge>
      );
    case "in-progress":
      return (
        <Badge
          variant="outline"
          className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"
        >
          In Progress
        </Badge>
      );
    case "complete":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
          Complete
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-5 w-5 text-muted-foreground" />;
  if (mimeType === "application/pdf")
    return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.startsWith("image/"))
    return <Image className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

export default function JobDetail({ job }: JobDetailProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [notes, setNotes] = useState(job.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    updateJob.mutate(
      { id: job.id, data: { status: newStatus as JobStatus } },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: () => toast.error("Failed to update status"),
      }
    );
  }

  async function handleSaveNotes() {
    setIsSavingNotes(true);
    updateJob.mutate(
      { id: job.id, data: { notes } },
      {
        onSuccess: () => {
          toast.success("Notes saved");
          setIsSavingNotes(false);
        },
        onError: () => {
          toast.error("Failed to save notes");
          setIsSavingNotes(false);
        },
      }
    );
  }

  async function handleDeleteFile(file: FileData) {
    setDeletingFileId(file.id);
    try {
      await filesApi.delete(file.id);
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
      toast.success(`Deleted ${file.originalName}`);
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeletingFileId(null);
    }
  }

  function handleDeleteJob() {
    deleteJob.mutate(job.id, {
      onSuccess: () => {
        toast.success("Job deleted");
        navigate("/jobs");
      },
      onError: () => toast.error("Failed to delete job"),
    });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Job Queue
      </Link>

      {/* Header section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{job.customerName}</Badge>
          <span className="text-sm text-muted-foreground">
            Submitted {formatDate(job.createdAt)}
          </span>
        </div>
      </div>

      <Separator />

      {/* Status section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Status</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current:</span>
            {statusBadge(job.status)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Update:</span>
            <Select
              value={job.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Job Details / Email Body section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Job Details</h2>
        <Card>
          <CardContent className="p-4">
            <div className="max-h-80 overflow-auto">
              <p className="whitespace-pre-wrap font-mono text-sm">
                {job.emailBody || "No details provided."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Notes section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Textarea
          placeholder="Add internal notes about this job..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
        <Button
          onClick={handleSaveNotes}
          disabled={isSavingNotes}
          size="sm"
        >
          {isSavingNotes && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Notes
        </Button>
      </div>

      <Separator />

      {/* Files section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Attached Files ({job.files?.length ?? 0})
        </h2>
        {!job.files || job.files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files attached.</p>
        ) : (
          <div className="space-y-2">
            {job.files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {fileIcon(file.mimeType)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.originalName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.sizeBytes)}</span>
                        {file.metadata?.pageCount && (
                          <span>
                            {file.metadata.pageCount} page
                            {file.metadata.pageCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {file.metadata?.width && file.metadata?.height && (
                          <span>
                            {file.metadata.width} x {file.metadata.height} in
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a
                        href={filesApi.downloadUrl(file.id)}
                        download
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingFileId === file.id}
                      onClick={() => handleDeleteFile(file)}
                      title="Delete file"
                    >
                      {deletingFileId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Delete Job section */}
      <div className="space-y-3">
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job</DialogTitle>
              <DialogDescription>
                Are you sure? This will permanently delete this job and all
                attached files.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteJob}
                disabled={deleteJob.isPending}
              >
                {deleteJob.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
