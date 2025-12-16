"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listResumes,
  createResume,
  updateResume,
  deleteResume,
} from "../actions/resume-actions";
import type { ResumeVersionCreate } from "@/lib/validators";

export type Resume = {
  id: string;
  name: string;
  url: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function useResumes() {
  return useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: async () => {
      const data = await listResumes();
      return data as Resume[];
    },
  });
}

export function useCreateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResumeVersionCreate) => createResume(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResumeVersionCreate & { id: string }) =>
      updateResume(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}
