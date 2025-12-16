"use client";

import { useState, useEffect } from "react";
import { ExportSection } from "./ui/export-section";
import { getUserEntitlement } from "../app/actions/stripe-actions";
import { createCheckoutSession } from "../app/actions/stripe-actions";
import { useJobs } from "../app/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SettingsPage() {
  const { data: jobs = [] } = useJobs();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    getUserEntitlement().then((entitlement) => {
      setIsPaid(entitlement.isPaid);
    });
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      console.error("Failed to create checkout session:", err);
      setIsUpgrading(false);
    }
  };

  if (isPaid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/app">
            <Button variant="outline">Back to Jobs</Button>
          </Link>
        </div>
        <p className="text-muted-foreground">
          Manage your account and export your data
        </p>
      </div>

      {/* Plan Section */}
      <div className="border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold mb-1">
              {isPaid ? "Lifetime Plan" : "Free Plan"}
            </p>
            {isPaid ? (
              <p className="text-sm text-muted-foreground">
                ✨ You have access to all premium features
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Limited to 10 job applications
              </p>
            )}
          </div>
          {!isPaid && (
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isUpgrading ? "Loading..." : "Upgrade to Lifetime"}
            </Button>
          )}
        </div>
      </div>

      {/* Features Overview */}
      {!isPaid && (
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lifetime Plan Benefits</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">Unlimited job applications</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">Email follow-up reminders</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">CSV and JSON data export</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">Resume effectiveness insights</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-sm">Priority support</span>
            </li>
          </ul>
        </div>
      )}

      {/* Export Section */}
      <ExportSection isPaid={isPaid} jobCount={jobs.length} />
    </div>
  );
}
