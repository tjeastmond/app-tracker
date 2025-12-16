import Link from "next/link";

export function NavBar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Job Tracker
        </Link>
        <nav className="flex items-center gap-4">
          {/* Navigation items will go here */}
        </nav>
      </div>
    </header>
  );
}
