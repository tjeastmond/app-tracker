"use client";

import { useState, useTransition } from "react";
import { exportJobsAsCSV, exportJobsAsJSON } from "@/app/app/actions/export-actions";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportSectionProps {
  isPaid: boolean;
  jobCount: number;
}

export function ExportSection({ isPaid, jobCount }: ExportSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const csv = await exportJobsAsCSV();
        const timestamp = new Date().toISOString().split("T")[0];
        downloadFile(csv, `job-applications-${timestamp}.csv`, "text/csv");
        setSuccess("CSV exported successfully!");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to export CSV");
      }
    });
  };

  const handleExportJSON = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const json = await exportJobsAsJSON();
        const timestamp = new Date().toISOString().split("T")[0];
        downloadFile(json, `job-applications-${timestamp}.json`, "application/json");
        setSuccess("JSON exported successfully!");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to export JSON");
      }
    });
  };

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-2">Export Your Data</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Download all your job application data in CSV or JSON format.
        {!isPaid && " (Paid feature)"}
      </p>

      {!isPaid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800">
            📊 Data export is only available for paid users. Upgrade to download your data.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">CSV Export</h3>
            <p className="text-sm text-muted-foreground">
              Download as spreadsheet-compatible CSV file
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={!isPaid || isPending || jobCount === 0}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">JSON Export</h3>
            <p className="text-sm text-muted-foreground">
              Download as structured JSON file
            </p>
          </div>
          <Button
            onClick={handleExportJSON}
            disabled={!isPaid || isPending || jobCount === 0}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {jobCount === 0 && (
        <p className="text-sm text-muted-foreground mt-4">
          No jobs to export. Add some job applications first.
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}
    </div>
  );
}
