# Job Tracker / Resume Workflow

A Next.js application for tracking job applications with resume versioning, follow-up reminders, and insights into resume effectiveness.

## Tech Stack

### Core
- **Next.js 14+ (App Router)** with TypeScript
- **Vercel** for hosting and deployment
- **Tailwind CSS** + **shadcn/ui** for UI components

### Database
- **Vercel Postgres** (production)
- **Docker Postgres** (local development)
- **Drizzle ORM** + **Drizzle Kit** for schema and migrations

### Authentication & Email
- **Auth.js (NextAuth)** with **Resend** provider (magic links)
- **Resend** for transactional emails and reminders

### Payments (Phase 4+)
- **Stripe** for lifetime purchase payments

### Validation
- **Zod** for schema validation (shared client/server)
- **react-hook-form** + **@hookform/resolvers** for form handling

## Project Structure

```
application_tracker.dev/
├── drizzle/
│   ├── schema.ts          # Database schema definitions
│   └── migrations/        # Generated migration files
├── src/
│   ├── app/
│   │   ├── app/           # Protected application routes
│   │   │   ├── actions/   # Server actions (job-actions, resume-actions)
│   │   │   ├── ui/        # Client components (jobs-table, job-drawer)
│   │   │   └── page.tsx   # Main application page
│   │   ├── api/
│   │   │   └── auth/      # Auth.js route handlers
│   │   └── login/         # Login page
│   ├── components/
│   │   └── ui/            # shadcn/ui components
│   └── lib/
│       ├── auth.ts        # Auth.js configuration + bootstrap
│       ├── db.ts          # Database client
│       ├── env.ts         # Environment validation
│       ├── require-user.ts # Auth guard helper
│       └── validators.ts  # Zod schemas
├── drizzle.config.ts
├── .env.local             # Local environment variables
└── package.json
```

## Development Setup

### 1. Install Dependencies

```warp-runnable-command
pnpm install
```

### 2. Set Up Local Postgres (Docker)

```warp-runnable-command
docker compose up -d
```

Note: Uses port 5433 to avoid conflicts with other local Postgres instances.

### 3. Configure Environment

Create `.env.local`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5433/job_tracker

AUTH_SECRET=your_long_random_secret_here
AUTH_TRUST_HOST=true

RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="Job Tracker <noreply@yourdomain.com>"
```

Generate `AUTH_SECRET`:

```warp-runnable-command
openssl rand -base64 32
```

### 4. Run Migrations

```warp-runnable-command
pnpm run db:generate && pnpm run db:migrate
```

### 5. Start Development Server

```warp-runnable-command
pnpm run dev
```

## Database Commands

### Generate Migration

```warp-runnable-command
pnpm run db:generate
```

### Apply Migrations

```warp-runnable-command
pnpm run db:migrate
```

### Reset Database (Local Only)

```warp-runnable-command
docker exec -it job-tracker-postgres psql -U postgres -d job_tracker -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Then re-run migrations.

## Data Model

### Core Tables

- **users** - User accounts (email-based)
- **user_entitlements** - Plan info (FREE/PAID_LIFETIME)
- **user_settings** - Reminder preferences
- **resume_versions** - Named resume versions
- **job_applications** - Job tracking with status, notes, resume link
- **reminders** - Scheduled follow-up reminders

### Key Enums

- **plan**: `FREE`, `PAID_LIFETIME`
- **job_status**: `SAVED`, `APPLIED`, `RECRUITER_SCREEN`, `TECHNICAL`, `ONSITE`, `OFFER`, `REJECTED`, `GHOSTED`
- **reminder_type**: `FOLLOW_UP`

## Development Phases

### ✅ PHASE 0 — Repo + Baseline
- Next.js App Router + TypeScript
- Tailwind + shadcn/ui
- Env validation (Zod)
- Deploy to Vercel

### ✅ PHASE 1 — Auth + Database + Scaffolding
- Resend magic link authentication
- Protected routes
- Vercel Postgres setup
- User bootstrap on first login

### 🔨 PHASE 2 — MVP CRUD + Table UX (Current)
- Job application CRUD
- Resume version management
- Table with filters and search
- Side drawer for create/edit
- Free tier enforcement (10 jobs max)

### 📋 PHASE 3 — Paid Value (Follow-ups + Reminders)
- "Needs follow-up" computed view
- Reminder generator cron
- Resend email reminders
- "Mark contacted" action

### 💳 PHASE 4 — Stripe Lifetime + Gating
- Stripe checkout integration
- Webhook for plan upgrades
- Remove job limits for paid users
- Enable premium features

### 📊 PHASE 5 — Export + Ownership
- CSV export (paid-only)
- JSON export (paid-only)
- Data download in settings

### 📈 PHASE 6 — Insights (Resume Effectiveness)
- Per-resume metrics (applied, screens, offers)
- "Best performing resume" highlight
- Filter by resume version

## Key Patterns

### Server Actions

All mutations use server actions with user authentication:

```typescript
"use server";
import { requireAppUserId } from "@/lib/require-user";

export async function createJob(input: unknown) {
  const userId = await requireAppUserId();
  // ... validate and create
}
```

### Client Components

Use `"use client"` directive with `useTransition` for server action calls:

```typescript
const [isPending, startTransition] = useTransition();

function onSave(data) {
  startTransition(async () => {
    await createJob(data);
    refreshJobs();
  });
}
```

### Validation

Share Zod schemas between client and server:

```typescript
// lib/validators.ts
export const JobCreateSchema = z.object({
  company: z.string().min(1).max(160),
  // ...
});

// Server action
const data = JobCreateSchema.parse(input);

// Client form
const form = useForm({
  resolver: zodResolver(JobCreateSchema)
});
```

## Testing

### Run Tests

```warp-runnable-command
pnpm test
```

### Type Check

```warp-runnable-command
pnpm run typecheck
```

### Lint

```warp-runnable-command
pnpm run lint
```

## Deployment

### Deploy to Vercel

```warp-runnable-command
vercel --prod
```

### Environment Variables

Set in Vercel dashboard:
- `DATABASE_URL` (from Vercel Postgres)
- `AUTH_SECRET`
- `AUTH_TRUST_HOST=true`
- `RESEND_API_KEY`
- `EMAIL_FROM`

## Troubleshooting

### Database Connection Issues

Check DATABASE_URL format:
```
postgres://user:password@host:port/database
```

### Auth Not Working

Verify:
1. `AUTH_SECRET` is set and >= 16 characters
2. `AUTH_TRUST_HOST=true` is set
3. Resend API key is valid
4. `EMAIL_FROM` matches verified domain in Resend

### Migration Errors

Reset local database and re-run migrations:

```warp-runnable-command
docker restart job-tracker-postgres
pnpm run db:migrate
```

## Free Tier Limits

- Maximum 10 job applications
- No email reminders
- No data export
- Basic tracking only

## Paid Features (Lifetime)

- Unlimited job applications
- Email follow-up reminders
- CSV/JSON data export
- Resume effectiveness insights
- Priority support

## Notes

- All dates stored with timezone (`timestamp with time zone`)
- `lastTouchedAt` updates on any job modification
- Magic links expire after single use
- Server actions are user-scoped by default
- Inline status changes prevent drawer opening
