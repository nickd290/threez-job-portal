import Layout from "@/components/Layout";
import JobForm from "@/components/JobForm";
import { Card, CardContent } from "@/components/ui/card";

export default function SubmitJob() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Submit a Job</h1>
        <p className="text-muted-foreground">
          Send a new print job to Three Z Printing
        </p>
      </div>
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <JobForm />
        </CardContent>
      </Card>
    </Layout>
  );
}
