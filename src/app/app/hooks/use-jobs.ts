"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listJobs,
  createJob,
  updateJob,
  deleteJob,
} from "../actions/job-actions";
import type { JobCreate } from "@/lib/validators";
import { useRouter } from "next/navigation";

export type Job = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  status: string;
  appliedDate: Date | null;
  salary: string | null;
  notes: string | null;
  resumeVersionId: string | null;
  lastTouchedAt: Date;
  createdAt: Date;
  resumeName: string | null;
};

export function useJobs() {
  const router = useRouter();

  return useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      try {
        const data = await listJobs();
        return data as Job[];
      } catch (error) {
        // If auth error, redirect to login
        router.push("/login");
        throw error;
      }
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreate) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreate & { id: string }) => updateJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
