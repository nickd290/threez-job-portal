import { useParams } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import JobDetail from "@/components/JobDetail";
import { useJob } from "@/hooks/useJobs";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useJob(params.id);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">Job not found</p>
          <p className="text-sm">
            The job you are looking for does not exist or has been deleted.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <JobDetail job={data} />
    </Layout>
  );
}
