"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useUpdateJob, type Job } from "../hooks/use-jobs";
import type { JobCreate } from "@/lib/validators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

type JobsTableProps = {
  jobs: Job[];
  onAddJob: () => void;
  onEditJob: (job: Job) => void;
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

const statusColors: Record<string, string> = {
  SAVED: "bg-gray-500",
  APPLIED: "bg-blue-500",
  RECRUITER_SCREEN: "bg-purple-500",
  TECHNICAL: "bg-yellow-500",
  ONSITE: "bg-orange-500",
  OFFER: "bg-green-500",
  REJECTED: "bg-red-500",
  GHOSTED: "bg-gray-700",
};

export function JobsTable({ jobs, onAddJob, onEditJob }: JobsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const updateJobMutation = useUpdateJob();

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (jobId: string, newStatus: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    updateJobMutation.mutate(
      {
        id: job.id,
        company: job.company,
        role: job.role,
        location: job.location || undefined,
        url: job.url || undefined,
        status: newStatus as JobCreate["status"],
        appliedDate: job.appliedDate?.toISOString(),
        salary: job.salary || undefined,
        notes: job.notes || undefined,
        resumeVersionId: job.resumeVersionId || undefined,
      },
      {
        onError: (error) => {
          console.error("Failed to update status:", error);
        },
      }
    );
  };

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">No jobs tracked yet</p>
        <Button onClick={onAddJob} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Job
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onAddJob} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Job
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Last Touched</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow
                key={job.id}
                className="hover:bg-muted/50"
                onClick={() => onEditJob(job)}
              >
                <TableCell className="font-medium cursor-pointer">{job.company}</TableCell>
                <TableCell className="cursor-pointer">{job.role}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={job.status}
                    onValueChange={(value) => handleStatusChange(job.id, value)}
                    disabled={updateJobMutation.isPending}
                  >
                    <SelectTrigger className="w-[160px]">
                      <Badge className={statusColors[job.status]}>
                        {job.status.replace(/_/g, " ")}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="cursor-pointer">
                  {job.appliedDate
                    ? format(new Date(job.appliedDate), "MMM d, yyyy")
                    : "-"}
                </TableCell>
                <TableCell className="cursor-pointer">{job.resumeName || "-"}</TableCell>
                <TableCell className="text-muted-foreground cursor-pointer">
                  {format(new Date(job.lastTouchedAt), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredJobs.length === 0 && jobs.length > 0 && (
        <p className="text-center text-muted-foreground py-4">
          No jobs match your search or filter criteria
        </p>
      )}
    </div>
  );
}
