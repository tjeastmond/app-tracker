"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobCreateSchema, type JobCreate } from "@/lib/validators";
import { useCreateJob, useUpdateJob, useDeleteJob, useMarkJobContacted } from "../hooks/use-jobs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2 } from "lucide-react";

type Resume = {
  id: string;
  name: string;
  url: string;
};

type Job = {
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
};

type JobDrawerProps = {
  open: boolean;
  onClose: () => void;
  job: Job | null;
  resumes: Resume[];
  onCreateResume: () => void;
};

const statusOptions = [
  "SAVED",
  "APPLIED",
  "RECRUITER_SCREEN",
  "TECHNICAL",
  "ONSITE",
  "OFFER",
  "REJECTED",
  "GHOSTED",
] as const;

export function JobDrawer({
  open,
  onClose,
  job,
  resumes,
  onCreateResume,
}: JobDrawerProps) {
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  const markContactedMutation = useMarkJobContacted();
  const isEdit = !!job;

  const isPending =
    createJobMutation.isPending ||
    updateJobMutation.isPending ||
    deleteJobMutation.isPending ||
    markContactedMutation.isPending;

  const form = useForm<JobCreate>({
    resolver: zodResolver(JobCreateSchema),
    defaultValues: {
      company: "",
      role: "",
      location: "",
      url: "",
      status: "SAVED",
      appliedDate: "",
      salary: "",
      notes: "",
      resumeVersionId: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (job) {
        form.reset({
          company: job.company,
          role: job.role,
          location: job.location || "",
          url: job.url || "",
          status: job.status as JobCreate["status"],
          appliedDate: job.appliedDate
            ? new Date(job.appliedDate).toISOString().split("T")[0]
            : "",
          salary: job.salary || "",
          notes: job.notes || "",
          resumeVersionId: job.resumeVersionId || undefined,
        });
      } else {
        form.reset({
          company: "",
          role: "",
          location: "",
          url: "",
          status: "SAVED",
          appliedDate: "",
          salary: "",
          notes: "",
          resumeVersionId: undefined,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job]);

  const onSubmit = (data: JobCreate) => {
    if (isEdit) {
      updateJobMutation.mutate(
        { ...data, id: job.id },
        {
          onSuccess: () => {
            onClose();
            form.reset();
          },
          onError: (error) => {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to save job";
            alert(errorMessage);
          },
        }
      );
    } else {
      createJobMutation.mutate(data, {
        onSuccess: () => {
          onClose();
          form.reset();
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to save job";
          alert(errorMessage);
        },
      });
    }
  };

  const handleDelete = () => {
    if (!job) return;
    if (!confirm("Are you sure you want to delete this job?")) return;

    deleteJobMutation.mutate(job.id, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete job";
        alert(errorMessage);
      },
    });
  };

  const handleMarkContacted = () => {
    if (!job) return;

    markContactedMutation.mutate(job.id, {
      onSuccess: () => {
        // Don't close the drawer, just show feedback via the mutation state
        // The job list will refresh automatically
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to mark as contacted";
        alert(errorMessage);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Job" : "Add New Job"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update your job application details"
              : "Track a new job application"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/jobs/123"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appliedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applied Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary</FormLabel>
                  <FormControl>
                    <Input placeholder="$120k - $150k" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resumeVersionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume Version</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? undefined : value)
                      }
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select resume" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCreateResume}
                    >
                      New
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this application..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 pt-4">
              {isEdit && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Mark this job as contacted to update the last touched date and cancel any pending reminders.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMarkContacted}
                    disabled={isPending}
                    className="w-full"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {markContactedMutation.isPending ? "Marking..." : "Mark as Contacted"}
                  </Button>
                </div>
              )}

              <div className="flex justify-between">
                <div>
                  {isEdit && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
