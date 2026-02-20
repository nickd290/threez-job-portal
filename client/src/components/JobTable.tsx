import { useMemo } from "react";
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
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Get a date key like "2026-02-20" from a timestamp */
function dateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

interface CustomerGroup {
  customerName: string;
  source: JobSource;
  dateGroups: { date: string; label: string; jobs: JobData[] }[];
  jobCount: number;
}

function groupJobs(jobs: JobData[]): CustomerGroup[] {
  // Group by customer using plain object
  const customerObj: Record<string, JobData[]> = {};
  for (const job of jobs) {
    const key = job.customerName;
    if (!customerObj[key]) customerObj[key] = [];
    customerObj[key].push(job);
  }

  // Build groups sorted by most recent job per customer
  const groups: CustomerGroup[] = [];
  for (const customerName of Object.keys(customerObj)) {
    const customerJobs = customerObj[customerName];

    // Sort jobs newest first
    const sorted = [...customerJobs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Sub-group by date using plain object (preserves insertion order)
    const dateObj: Record<string, JobData[]> = {};
    for (const job of sorted) {
      const dk = dateKey(job.createdAt);
      if (!dateObj[dk]) dateObj[dk] = [];
      dateObj[dk].push(job);
    }

    const dateGroups = Object.keys(dateObj).map((dk) => ({
      date: dk,
      label: formatDate(dateObj[dk][0].createdAt),
      jobs: dateObj[dk],
    }));

    groups.push({
      customerName,
      source: sorted[0].source,
      dateGroups,
      jobCount: sorted.length,
    });
  }

  // Sort customer groups: most recent submission first
  groups.sort((a, b) => {
    const aDate = new Date(a.dateGroups[0].jobs[0].createdAt).getTime();
    const bDate = new Date(b.dateGroups[0].jobs[0].createdAt).getTime();
    return bDate - aDate;
  });

  return groups;
}

export default function JobTable({ jobs, isLoading }: JobTableProps) {
  const [, navigate] = useLocation();
  const groups = useMemo(() => groupJobs(jobs), [jobs]);

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
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.customerName} className="space-y-1">
          {/* Customer header */}
          <div className="flex items-center gap-3 px-1 pb-2">
            <h2 className="text-lg font-semibold">{group.customerName}</h2>
            {sourceBadge(group.source)}
            <span className="text-sm text-muted-foreground">
              {group.jobCount} job{group.jobCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.dateGroups.map((dg) => (
                  <>
                    {/* Date sub-header */}
                    <TableRow key={dg.date} className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={4} className="py-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {dg.label}
                        </span>
                      </TableCell>
                    </TableRow>
                    {dg.jobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{statusBadge(job.status)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Paperclip className="h-4 w-4" />
                            {job.fileCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTime(job.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
