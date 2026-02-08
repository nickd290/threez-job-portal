import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import JobTable from "@/components/JobTable";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useJobs } from "@/hooks/useJobs";

export default function JobList() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useJobs({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Job Queue</h1>
            <p className="text-muted-foreground">All submitted print jobs</p>
          </div>
          <Button asChild>
            <Link href="/">
              <Plus className="h-4 w-4" />
              Submit Job
            </Link>
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title or customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Job table */}
        <JobTable jobs={data ?? []} isLoading={isLoading} />
      </div>
    </Layout>
  );
}
