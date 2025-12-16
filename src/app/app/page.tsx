"use client";

import { useState } from "react";
import { JobsTable } from "./ui/jobs-table";
import { JobDrawer } from "./ui/job-drawer";
import { ResumeDialog } from "./ui/resume-dialog";
import { useJobs, type Job } from "./hooks/use-jobs";
import { useResumes } from "./hooks/use-resumes";

export default function AppPage() {
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: resumes = [], isLoading: resumesLoading } = useResumes();
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loading = jobsLoading || resumesLoading;

  const handleAddJob = () => {
    setSelectedJob(null);
    setJobDrawerOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setJobDrawerOpen(true);
  };

  const handleCloseJobDrawer = () => {
    setJobDrawerOpen(false);
    setSelectedJob(null);
  };

  const handleCreateResume = () => {
    setResumeDialogOpen(true);
  };

  const handleCloseResumeDialog = () => {
    setResumeDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const freeJobCount = jobs.length;
  const isFreeTier = true; // TODO: Get from user entitlement

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job Applications</h1>
        <p className="text-muted-foreground">
          Track your job search and resume effectiveness
        </p>
      </div>

      {isFreeTier && (
        <div className="bg-muted/50 border rounded-lg p-4 mb-6">
          <p className="text-sm">
            <span className="font-semibold">Free Tier:</span> {freeJobCount}/10
            jobs used
          </p>
        </div>
      )}

      <JobsTable jobs={jobs} onAddJob={handleAddJob} onEditJob={handleEditJob} />

      <JobDrawer
        open={jobDrawerOpen}
        onClose={handleCloseJobDrawer}
        job={selectedJob}
        resumes={resumes}
        onCreateResume={handleCreateResume}
      />

      <ResumeDialog
        open={resumeDialogOpen}
        onClose={handleCloseResumeDialog}
      />
    </div>
  );
}
