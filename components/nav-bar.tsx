"use client";

import Link from "next/link";
import { useTransition } from "react";
import { logout } from "@/app/app/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const [isPending, startTransition] = useTransition();

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
