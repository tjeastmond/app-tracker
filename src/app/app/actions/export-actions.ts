"use server";

import { requireAppUserId } from "@/lib/require-user";
import { isPaidUser } from "@/lib/entitlements";
import { listJobs } from "./job-actions";

/**
 * Escape CSV field values
 */
function escapeCsvValue(value: string | null | undefined): string {
  if (value == null) return "";
  
  const str = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Format date for CSV
 */
function formatDateForCsv(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString();
}

/**
 * Export user's job applications as CSV
 */
export async function exportJobsAsCSV(): Promise<string> {
  const userId = await requireAppUserId();
  
  // Check if user is paid
  const isPaid = await isPaidUser(userId);
  if (!isPaid) {
    throw new Error("CSV export is only available for paid users. Please upgrade to access this feature.");
  }
  
  // Get all jobs
  const jobs = await listJobs();
  
  // CSV headers
  const headers = [
    "Company",
    "Role",
    "Location",
    "Status",
    "Applied Date",
    "Salary",
    "Resume",
    "Notes",
    "URL",
    "Last Touched",
    "Created",
    "ID"
  ];
  
  // Build CSV rows
  const rows = jobs.map(job => [
    escapeCsvValue(job.company),
    escapeCsvValue(job.role),
    escapeCsvValue(job.location),
    escapeCsvValue(job.status),
    formatDateForCsv(job.appliedDate),
    escapeCsvValue(job.salary),
    escapeCsvValue(job.resumeName),
    escapeCsvValue(job.notes),
    escapeCsvValue(job.url),
    formatDateForCsv(job.lastTouchedAt),
    formatDateForCsv(job.createdAt),
    escapeCsvValue(job.id)
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
  
  return csvContent;
}

/**
 * Export user's job applications as JSON
 */
export async function exportJobsAsJSON(): Promise<string> {
  const userId = await requireAppUserId();
  
  // Check if user is paid
  const isPaid = await isPaidUser(userId);
  if (!isPaid) {
    throw new Error("JSON export is only available for paid users. Please upgrade to access this feature.");
  }
  
  // Get all jobs
  const jobs = await listJobs();
  
  // Format data for JSON export
  const exportData = {
    exportDate: new Date().toISOString(),
    totalJobs: jobs.length,
    jobs: jobs.map(job => ({
      id: job.id,
      company: job.company,
      role: job.role,
      location: job.location,
      url: job.url,
      status: job.status,
      appliedDate: job.appliedDate ? new Date(job.appliedDate).toISOString() : null,
      salary: job.salary,
      notes: job.notes,
      resume: {
        id: job.resumeVersionId,
        name: job.resumeName
      },
      lastTouchedAt: new Date(job.lastTouchedAt).toISOString(),
      createdAt: new Date(job.createdAt).toISOString()
    }))
  };
  
  // Return pretty-printed JSON
  return JSON.stringify(exportData, null, 2);
}
