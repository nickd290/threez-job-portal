import { useLocation } from "wouter";
import { Paperclip, Inbox, Loader2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { JobData, JobStatus, JobSource } from "@/types";

interface JobTableProps {
  jobs: JobData[];
  isLoading: boolean;
}

function sourceBadge(source: JobSource) {
  switch (source) {
    case "hod":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
          HOD
        </Badge>
      );
    case "team-concept":
      return (
        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-50">
          Team Concept
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50">
          Portal
        </Badge>
      );
  }
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
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JobTable({ jobs, isLoading }: JobTableProps) {
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">No jobs found</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Files</TableHead>
          <TableHead>Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow
            key={job.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/jobs/${job.id}`)}
          >
            <TableCell className="font-medium">{job.title}</TableCell>
            <TableCell>{job.customerName}</TableCell>
            <TableCell>{sourceBadge(job.source)}</TableCell>
            <TableCell>{statusBadge(job.status)}</TableCell>
            <TableCell>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                {job.fileCount}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(job.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
