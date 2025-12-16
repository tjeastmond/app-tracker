"use client";

import { useState, useEffect } from "react";
import { listJobs } from "./actions/job-actions";
import { listResumes } from "./actions/resume-actions";
import { JobsTable } from "./ui/jobs-table";
import { JobDrawer } from "./ui/job-drawer";
import { ResumeDialog } from "./ui/resume-dialog";
import { useRouter } from "next/navigation";

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
  lastTouchedAt: Date;
  createdAt: Date;
  resumeName: string | null;
};

type Resume = {
  id: string;
  name: string;
  url: string;
};

export default function AppPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobDrawerOpen, setJobDrawerOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchData = async () => {
    try {
      const [jobsData, resumesData] = await Promise.all([
        listJobs(),
        listResumes(),
      ]);
      setJobs(jobsData as Job[]);
      setResumes(resumesData as Resume[]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // If auth error, redirect to login
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    fetchData();
  };

  const handleCreateResume = () => {
    setResumeDialogOpen(true);
  };

  const handleCloseResumeDialog = () => {
    setResumeDialogOpen(false);
    fetchData();
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
