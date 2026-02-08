import Layout from "@/components/Layout";
import { FileQuestion } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/" className="text-primary hover:underline">Go to Submit Job</Link>
      </div>
    </Layout>
  );
}
