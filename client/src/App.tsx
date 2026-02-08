import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";

const SubmitJob = lazy(() => import("./pages/SubmitJob"));
const JobList = lazy(() => import("./pages/JobList"));
const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={SubmitJob} />
        <Route path="/jobs" component={JobList} />
        <Route path="/jobs/:id" component={JobDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="bottom-right" />
      <Router />
    </QueryClientProvider>
  );
}
