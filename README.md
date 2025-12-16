# Job Tracker

A Next.js application for tracking job applications with resume versioning, follow-up reminders, and insights into resume effectiveness.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local Postgres:**
   ```bash
   docker compose up -d
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000)

## Documentation

See [WARP.md](./WARP.md) for complete documentation including:
- Tech stack details
- Database setup
- Development workflow
- Deployment instructions

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Postgres + Drizzle ORM
- **Auth:** Auth.js (NextAuth) with Resend magic links
- **Hosting:** Vercel

## Project Status

Currently in **Phase 0** - baseline infrastructure setup complete.

See [job-tracker-plan.md](./job-tracker-plan.md) for the full implementation roadmap.
