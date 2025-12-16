"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, PlayCircle, Mail, Clock, Crown, Zap } from "lucide-react";
import { useJobs } from "@/app/app/hooks/use-jobs";
import { useSession } from "next-auth/react";

type TestResult = {
  success: boolean;
  data?: {
    generated?: number;
    timestamp?: string;
    sent?: number;
    total?: number;
    errors?: string[];
    message?: string;
    [key: string]: unknown;
  };
  error?: string;
};

export default function RemindersTestPage() {
  const { data: session } = useSession();
  const { data: jobs = [] } = useJobs();
  const [generateResult, setGenerateResult] = useState<TestResult | null>(null);
  const [sendResult, setSendResult] = useState<TestResult | null>(null);
  const [touchResult, setTouchResult] = useState<TestResult | null>(null);
  const [planResult, setPlanResult] = useState<TestResult | null>(null);
  const [resetResult, setResetResult] = useState<TestResult | null>(null);
  const [runningBoth, setRunningBoth] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [touching, setTouching] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [daysAgo, setDaysAgo] = useState<string>("8");
  const [userId, setUserId] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("PAID_LIFETIME");

  // Auto-fill userId from session
  useEffect(() => {
    if (session?.user?.id && !userId) {
      setUserId(session.user.id);
    }
  }, [session, userId]);

  // Auto-select first job if none selected
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const handleGenerateReminders = async () => {
    setGenerating(true);
    setGenerateResult(null);

    try {
      const response = await fetch("/api/cron/generate-reminders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev"}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setGenerateResult({ success: true, data });
      } else {
        setGenerateResult({ success: false, error: data.error || "Failed to generate reminders" });
      }
    } catch (error) {
      setGenerateResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminders = async () => {
    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/cron/send-reminders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev"}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({ success: true, data });
      } else {
        setSendResult({ success: false, error: data.error || "Failed to send reminders" });
      }
    } catch (error) {
      setSendResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleTouchJob = async () => {
    if (!selectedJobId || !userId) {
      setTouchResult({ success: false, error: "Please select a job and enter user ID" });
      return;
    }

    setTouching(true);
    setTouchResult(null);

    try {
      const response = await fetch("/api/dev/touch-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          daysAgo: parseInt(daysAgo),
          userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTouchResult({ success: true, data });
      } else {
        setTouchResult({ success: false, error: data.error || "Failed to update job" });
      }
    } catch (error) {
      setTouchResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setTouching(false);
    }
  };

  const handleResetReminders = async () => {
    if (!userId) {
      setResetResult({ success: false, error: "Please enter user ID" });
      return;
    }

    if (!confirm("This will delete all reminders for this user. Continue?")) {
      return;
    }

    setResetting(true);
    setResetResult(null);

    try {
      const response = await fetch("/api/dev/reset-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetResult({ success: true, data });
      } else {
        setResetResult({ success: false, error: data.error || "Failed to reset reminders" });
      }
    } catch (error) {
      setResetResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!userId) {
      setPlanResult({ success: false, error: "Please enter user ID" });
      return;
    }

    setUpdatingPlan(true);
    setPlanResult(null);

    try {
      const response = await fetch("/api/dev/touch-job", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPlanResult({ success: true, data });
      } else {
        setPlanResult({ success: false, error: data.error || "Failed to update plan" });
      }
    } catch (error) {
      setPlanResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleRunBoth = async () => {
    setRunningBoth(true);
    setGenerateResult(null);
    setSendResult(null);

    try {
      // Step 1: Generate reminders
      const generateResponse = await fetch("/api/cron/generate-reminders", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev"}`,
        },
      });

      const generateData = await generateResponse.json();

      if (generateResponse.ok) {
        setGenerateResult({ success: true, data: generateData });

        // Step 2: Send reminders (wait a moment for consistency)
        await new Promise(resolve => setTimeout(resolve, 500));

        const sendResponse = await fetch("/api/cron/send-reminders", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev"}`,
          },
        });

        const sendData = await sendResponse.json();

        if (sendResponse.ok) {
          setSendResult({ success: true, data: sendData });
        } else {
          setSendResult({ success: false, error: sendData.error || "Failed to send reminders" });
        }
      } else {
        setGenerateResult({ success: false, error: generateData.error || "Failed to generate reminders" });
      }
    } catch (error) {
      setGenerateResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setRunningBoth(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reminder System Testing</h1>
        <p className="text-muted-foreground">
          Manually trigger reminder generation and email sending for testing purposes.
        </p>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Development Only</AlertTitle>
          <AlertDescription>
            This page is for testing the reminder system. In production, these operations run via Vercel Cron jobs.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-6">
        {/* Quick Run Card */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Quick Test: Run Full Cron Workflow
            </CardTitle>
            <CardDescription>
              Generate reminders + Send emails in one click (simulates the production cron jobs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleRunBoth}
              disabled={runningBoth}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {runningBoth ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running workflow...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Both: Generate + Send
                </>
              )}
            </Button>

            {(generateResult || sendResult) && (
              <div className="space-y-2">
                {generateResult && (
                  <Alert variant={generateResult.success ? "default" : "destructive"}>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Step 1: Generate</AlertTitle>
                    <AlertDescription>
                      {generateResult.success 
                        ? `Generated ${generateResult.data?.generated} reminder(s)` 
                        : generateResult.error}
                    </AlertDescription>
                  </Alert>
                )}
                {sendResult && (
                  <Alert variant={sendResult.success ? "default" : "destructive"}>
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Step 2: Send</AlertTitle>
                    <AlertDescription>
                      {sendResult.success 
                        ? `Sent ${sendResult.data?.sent} email(s)` 
                        : sendResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Tools Card */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-500" />
              Setup Tools
            </CardTitle>
            <CardDescription>
              Configure test data before running reminder tests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User ID Input */}
            <div className="space-y-2">
              <Label htmlFor="userId">User ID {userId && <span className="text-green-600">(auto-filled)</span>}</Label>
              <Input
                id="userId"
                placeholder="Enter your user ID (auto-filled from session)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {userId ? "Auto-filled from your session" : "Get your user ID from the database"}
              </p>
            </div>

            {/* Update Plan */}
            <div className="space-y-2">
              <Label>User Plan</Label>
              <div className="flex gap-2">
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">FREE</SelectItem>
                    <SelectItem value="PAID_LIFETIME">PAID_LIFETIME</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdatePlan}
                  disabled={updatingPlan || !userId}
                  variant="outline"
                >
                  {updatingPlan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update Plan"
                  )}
                </Button>
              </div>
              {planResult && (
                <Alert variant={planResult.success ? "default" : "destructive"} className="mt-2">
                  <AlertDescription>
                    {planResult.success ? planResult.data?.message : planResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Reset Reminders */}
            <div className="space-y-2">
              <Label>Reset Test Data</Label>
              <Button
                onClick={handleResetReminders}
                disabled={resetting || !userId}
                variant="destructive"
                className="w-full"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Clear All Reminders"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Delete all reminders for this user so you can test sending again
              </p>
              {resetResult && (
                <Alert variant={resetResult.success ? "default" : "destructive"} className="mt-2">
                  <AlertDescription>
                    {resetResult.success ? resetResult.data?.message : resetResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Touch Job Timestamp */}
            <div className="space-y-2">
              <Label>Backdate Job (for testing)</Label>
              <div className="flex gap-2">
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.company} - {job.role} ({job.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-24"
                  placeholder="Days"
                  value={daysAgo}
                  onChange={(e) => setDaysAgo(e.target.value)}
                />
                <Button
                  onClick={handleTouchJob}
                  disabled={touching || !selectedJobId || !userId}
                  variant="outline"
                >
                  {touching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Set Date
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set a job&apos;s lastTouchedAt to X days ago (8+ for APPLIED, 5+ for interviews)
              </p>
              {touchResult && (
                <Alert variant={touchResult.success ? "default" : "destructive"} className="mt-2">
                  <AlertDescription>
                    {touchResult.success ? touchResult.data?.message : touchResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generate Reminders Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              1. Generate Reminders
            </CardTitle>
            <CardDescription>
              Scans all jobs and creates reminder records for those needing follow-up (paid users only).
              This is idempotent - won&apos;t create duplicates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateReminders}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Generate Reminders
                </>
              )}
            </Button>

            {generateResult && (
              <Alert variant={generateResult.success ? "default" : "destructive"}>
                {generateResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {generateResult.success ? "Success!" : "Error"}
                </AlertTitle>
                <AlertDescription>
                  {generateResult.success ? (
                    <div className="mt-2 space-y-1">
                      <p>Generated {generateResult.data?.generated} new reminder(s)</p>
                      <p className="text-xs text-muted-foreground">
                        {generateResult.data?.timestamp}
                      </p>
                    </div>
                  ) : (
                    <p>{generateResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Send Reminders Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              2. Send Reminder Emails
            </CardTitle>
            <CardDescription>
              Sends emails for all pending reminders that are due. Marks them as sent after successful delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSendReminders}
              disabled={sending}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminder Emails
                </>
              )}
            </Button>

            {sendResult && (
              <Alert variant={sendResult.success ? "default" : "destructive"}>
                {sendResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {sendResult.success ? "Success!" : "Error"}
                </AlertTitle>
                <AlertDescription>
                  {sendResult.success ? (
                    <div className="mt-2 space-y-1">
                      <p>Sent {sendResult.data?.sent} email(s) out of {sendResult.data?.total} pending</p>
                      {sendResult.data?.errors && (
                        <div className="mt-2">
                          <p className="font-semibold">Errors:</p>
                          <pre className="text-xs mt-1 overflow-auto max-h-32">
                            {JSON.stringify(sendResult.data.errors, null, 2)}
                          </pre>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {sendResult.data?.timestamp}
                      </p>
                    </div>
                  ) : (
                    <p>{sendResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">Prerequisites:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Have a user with PAID_LIFETIME plan</li>
                <li>Have jobs with APPLIED or interview status</li>
                <li>Jobs haven&apos;t been touched for 7+ days (APPLIED) or 5+ days (interviews)</li>
              </ul>
            </div>
            
            <div>
              <p className="font-semibold mb-1">Testing Flow:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click &quot;Generate Reminders&quot; to create reminder records</li>
                <li>Click &quot;Send Reminder Emails&quot; to send emails for pending reminders</li>
                <li>Check your email inbox for reminder notifications</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-1">Environment Variables:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code>NEXT_PUBLIC_CRON_SECRET</code> - Optional for local testing</li>
                <li><code>RESEND_API_KEY</code> - Required for sending emails</li>
                <li><code>EMAIL_FROM</code> - Sender address</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
