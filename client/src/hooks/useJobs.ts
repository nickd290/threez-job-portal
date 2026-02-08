import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api";
import type { JobData } from "@/types";

export function useJobs(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => jobsApi.list(filters),
    refetchInterval: 15000,
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => jobsApi.get(id!),
    enabled: !!id,
    refetchInterval: 15000,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => jobsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobData> }) =>
      jobsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", variables.id] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
