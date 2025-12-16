"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResumeVersionCreateSchema,
  type ResumeVersionCreate,
} from "@/lib/validators";
import { useCreateResume } from "../hooks/use-resumes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ResumeDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ResumeDialog({ open, onClose }: ResumeDialogProps) {
  const createResumeMutation = useCreateResume();

  const form = useForm<ResumeVersionCreate>({
    resolver: zodResolver(ResumeVersionCreateSchema),
    defaultValues: {
      name: "",
      url: "",
    },
  });

  const onSubmit = (data: ResumeVersionCreate) => {
    createResumeMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create resume";
        alert(errorMessage);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Resume Version</DialogTitle>
          <DialogDescription>
            Add a new version of your resume to track with job applications
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Frontend Focus, v2.3" {...field} />
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
                  <FormLabel>URL *</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createResumeMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createResumeMutation.isPending}>
                {createResumeMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
