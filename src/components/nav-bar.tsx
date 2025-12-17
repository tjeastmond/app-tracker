"use client";

import Link from "next/link";
import { useTransition, useEffect, useState } from "react";
import { logout } from "@/app/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { checkIsAdminAction } from "@/app/app/actions/admin-actions";

export function NavBar() {
  const [isPending, startTransition] = useTransition();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkIsAdminAction().then(setIsAdmin);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Job Tracker
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/app">
            <Button variant="ghost" size="sm">
              Jobs
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          )}
          {process.env.NODE_ENV === "development" && (
            <Link href="/dev/reminders">
              <Button variant="outline" size="sm">
                🧪 Test Reminders
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isPending}
          >
            {isPending ? "Logging out..." : "Logout"}
          </Button>
        </nav>
      </div>
    </header>
  );
}
