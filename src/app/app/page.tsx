"use client";

import { useState, useEffect, Suspense } from "react";
import { JobsTable } from "./ui/jobs-table";
import { JobDrawer } from "./ui/job-drawer";
import { ResumeDialog } from "./ui/resume-dialog";
import { UpgradeBanner } from "./ui/upgrade-banner";
import { useJobs, type Job } from "./hooks/use-jobs";
import { useResumes } from "./hooks/use-resumes";
import { getUserEntitlement } from "./actions/stripe-actions";
import { useSearchParams } from "next/navigation";

function AppPageContent() {
  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useJobs();
  const { data: resumes = [], isLoading: resumesLoading } = useResumes();
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const searchParams = useSearchParams();

  const loading = jobsLoading || resumesLoading;

  // Fetch user entitlement
  useEffect(() => {
    getUserEntitlement().then((entitlement) => {
      setIsPaid(entitlement.isPaid);
    });
  }, []);

  // Handle upgrade success
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      // Refetch entitlement after upgrade
      getUserEntitlement().then((entitlement) => {
        setIsPaid(entitlement.isPaid);
      });
      // Refetch jobs to refresh UI
      refetchJobs();
    }
  }, [searchParams, refetchJobs]);

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

  if (loading || isPaid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const jobCount = jobs.length;
  const showUpgradeBanner = !isPaid;
  const showSuccessMessage = searchParams.get("upgraded") === "true";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job Applications</h1>
        <p className="text-muted-foreground">
          Track your job search and resume effectiveness
        </p>
      </div>

      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            🎉 <span className="font-semibold">Welcome to Lifetime!</span> You now have unlimited jobs and all premium features.
          </p>
        </div>
      )}

      {showUpgradeBanner && (
        <UpgradeBanner jobCount={jobCount} />
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

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <AppPageContent />
    </Suspense>
  );
}
