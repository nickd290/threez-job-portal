import { Link, useLocation } from "wouter";
import { FileText, List, Plus } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Three Z Job Portal</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === "/" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Plus className="h-4 w-4 inline mr-1" />
              Submit Job
            </Link>
            <Link
              href="/jobs"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.startsWith("/jobs") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4 inline mr-1" />
              Job Queue
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
