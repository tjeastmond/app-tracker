"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "../actions/stripe-actions";
import { Button } from "@/components/ui/button";

interface UpgradeBannerProps {
  jobCount: number;
}

export function UpgradeBanner({ jobCount }: UpgradeBannerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = () => {
    setError(null);
    startTransition(async () => {
      try {
        const { url } = await createCheckoutSession();
        window.location.href = url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start checkout");
      }
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            You&apos;re on the Free Plan
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            <span className="font-semibold">{jobCount}/10 jobs used</span>
            {jobCount >= 8 && (
              <span className="text-orange-600 ml-2">
                ⚠️ You&apos;re approaching your limit!
              </span>
            )}
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">Upgrade to Lifetime Plan for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Unlimited job applications</li>
              <li>Email follow-up reminders</li>
              <li>CSV/JSON data export</li>
              <li>Resume effectiveness insights</li>
              <li>Priority support</li>
            </ul>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-3">
              {error}
            </p>
          )}
        </div>
        <Button
          onClick={handleUpgrade}
          disabled={isPending}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isPending ? "Loading..." : "Upgrade Now"}
        </Button>
      </div>
    </div>
  );
}
