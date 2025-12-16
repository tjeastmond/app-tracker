"use client";

import { useState, useTransition, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shouldShowDevLogin } from "./actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [showDevLogin, setShowDevLogin] = useState(false);

  useEffect(() => {
    shouldShowDevLogin().then(setShowDevLogin);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await signIn("resend", { email, redirect: false });
      setSubmitted(true);
    });
  };

  const handleDevLogin = () => {
    startTransition(async () => {
      await signIn("dev-bypass", { redirectTo: "/app" });
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-4 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground">
              We sent you a login link. Check your email to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Job Tracker</h1>
          <p className="text-muted-foreground">
            Sign in to track your job applications
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        {showDevLogin && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Dev Only
              </span>
            </div>
          </div>
        )}

        {showDevLogin && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleDevLogin}
            disabled={isPending}
          >
            🚀 Dev Login (Skip Email)
          </Button>
        )}
      </div>
    </div>
  );
}
