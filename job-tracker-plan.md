# Job Tracker / Resume Workflow — Vercel Postgres Build Plan (Milestones + Implementation)

This document captures the end-to-end milestone plan, tech/services, data model, and the initial working UI (Tailwind + shadcn/ui) using a **side drawer** for create/edit.

---

## Tech Stack & Services

### Hosting / Runtime
- **Vercel** (hosting + env management)
- **Next.js (App Router) + TypeScript**

### Database / ORM
- **Vercel Postgres**
- **Drizzle ORM + Drizzle Kit** (schema + migrations)

### Auth + Email
- **Auth.js (NextAuth)** with **Resend** provider (magic links)
- **Resend** (magic links + reminders later)

### Payments (later milestone)
- **Stripe** (Phase 5: Lifetime purchase first)

### Optional Observability (later)
- **Sentry** (errors)
- **Plausible/PostHog** (product analytics)

---

## Milestone / Phase Model

### PHASE 0 — Repo + Baseline (½–1 day)
**Goal:** App boots, deploys, and is ready for real work.
- [ ] Next.js App Router + TypeScript
- [ ] Tailwind + shadcn/ui
- [ ] `/app` layout shell (top bar + main)
- [ ] Env validation module (Zod)
- [ ] Deploy to Vercel (baseline)
- [ ] Setup local Postgres (Docker) for development

**Deliverable:** deployed skeleton app.

---

### PHASE 1 — Auth + Database + Scaffolding (1–2 days)
**Goal:** Users can log in; DB is wired; bootstrap rows exist.

**Auth.js**
- [ ] Resend provider configured
- [ ] Login page (`/login`)
- [ ] Protected routes (`/app/**`)
- [ ] Session access in server components
- [ ] Logout
- [ ] Quick login for development

**Database**
- [ ] Create Vercel Postgres instance
- [ ] Set `DATABASE_URL`
- [ ] Add Drizzle schema + migrations
- [ ] Add db client module (`db.ts`)

**Bootstrap on first login**
- [ ] Ensure `users` row exists for session email
- [ ] Ensure `user_settings` row exists
- [ ] Ensure `user_entitlements` row exists (FREE)

**Deliverable:** login works → user exists → app can query DB by user.

---

### PHASE 2 — MVP CRUD + Table UX (2–4 days)
**Goal:** A logged-in user can track job applications end-to-end.

**Job applications**
- [ ] Create job (server action)
- [ ] Edit job (server action)
- [ ] Delete job (server action)
- [ ] Status change inline (server action)
- [ ] `lastTouchedAt` updates on any change
- [ ] Validation via Zod (shared schema)

**Resume versions**
- [ ] Create version (name only)
- [ ] Edit version name
- [ ] Attach version to job application

**Views**
- [ ] Table list (default sort: `lastTouchedAt desc`)
- [ ] Status filter
- [ ] Quick search (company/role/location)
- [ ] Row click → **side drawer** (create/edit)
- [ ] Empty states
- [ ] Pagination (offset is fine for MVP)

**Free tier enforcement (light)**
- [ ] Count jobs for user
- [ ] If FREE and >=10, block create (server-side)
- [ ] Upgrade CTA page stub

**Deliverable:** a real usable tracker.

---

### PHASE 3 — Paid Value (Follow-ups + reminders) (2–4 days)
**Goal:** The product becomes worth paying for.

- [ ] “Needs follow-up” computed view:
  - Applied: `now - lastTouchedAt >= appliedFollowupDays`
  - Interview statuses: `>= interviewFollowupDays`
- [ ] Reminder generator cron endpoint (idempotent)
- [ ] Resend emails for reminders
- [ ] “Mark contacted” action (touches job + cancels reminders)

---

### PHASE 4 — Stripe Lifetime + Gating (1–3 days)
- [ ] Stripe checkout session
- [ ] Webhook sets `user_entitlements.plan = PAID_LIFETIME`
- [ ] Remove job limit
- [ ] Enable reminders + exports

---

### PHASE 5 — Export + Ownership (1–2 days)
- [ ] Export CSV (job apps + resume label)
- [ ] Export JSON (full data)
- [ ] Paid-only
- [ ] “Download data” in settings

---

### PHASE 6 — Insights (Resume effectiveness) (2–3 days)
- [ ] Counts per resume version:
  - # applied
  - # recruiter screens
  - # technical
  - # onsite
  - # offers
- [ ] “Best performing resume” highlight
- [ ] Filter view: show jobs for a resume version

---

## Setup: Dependencies

```bash
npm i drizzle-orm drizzle-kit @vercel/postgres zod
npm i next-auth @auth/core resend
npm i react-hook-form @hookform/resolvers
npm i -D dotenv tsx
```

---

## Environment Variables

### `.env.local`
```env
DATABASE_URL=postgres://...

AUTH_SECRET=your_long_random_secret
AUTH_TRUST_HOST=true

RESEND_API_KEY=...
EMAIL_FROM="Job Tracker <noreply@yourdomain.com>"
```

---

## Drizzle Config + Schema (Vercel Postgres)

### `drizzle.config.ts`
```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

### `drizzle/schema.ts`
```ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["FREE", "PAID_LIFETIME"]);
export const jobStatusEnum = pgEnum("job_status", [
  "SAVED",
  "APPLIED",
  "RECRUITER_SCREEN",
  "TECHNICAL",
  "ONSITE",
  "OFFER",
  "REJECTED",
  "GHOSTED",
]);
export const reminderTypeEnum = pgEnum("reminder_type", ["FOLLOW_UP"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
  }),
);

export const userEntitlements = pgTable(
  "user_entitlements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    plan: planEnum("plan").notNull().default("FREE"),

    stripeCustomerId: text("stripe_customer_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    activatedAt: timestamp("activated_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: uniqueIndex("user_entitlements_user_unique").on(t.userId),
    planIdx: index("user_entitlements_plan_idx").on(t.plan),
  }),
);

export const userSettings = pgTable(
  "user_settings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    appliedFollowupDays: integer("applied_followup_days").notNull().default(7),
    interviewFollowupDays: integer("interview_followup_days").notNull().default(5),
    remindersEnabled: boolean("reminders_enabled").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: uniqueIndex("user_settings_user_unique").on(t.userId),
  }),
);

export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("resume_versions_user_idx").on(t.userId),
    userNameIdx: index("resume_versions_user_name_idx").on(t.userId, t.name),
  }),
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    company: text("company").notNull(),
    role: text("role").notNull(),
    location: text("location"),
    applicationUrl: text("application_url"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),

    status: jobStatusEnum("status").notNull().default("SAVED"),

    recruiterName: text("recruiter_name"),
    recruiterEmail: text("recruiter_email"),
    notes: text("notes"),

    resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, {
      onDelete: "set null",
    }),

    lastTouchedAt: timestamp("last_touched_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("job_apps_user_idx").on(t.userId),
    statusIdx: index("job_apps_user_status_idx").on(t.userId, t.status),
    touchedIdx: index("job_apps_user_touched_idx").on(t.userId, t.lastTouchedAt),
    appliedIdx: index("job_apps_user_applied_idx").on(t.userId, t.appliedAt),
    resumeIdx: index("job_apps_user_resume_idx").on(t.userId, t.resumeVersionId),
  }),
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobApplicationId: uuid("job_application_id")
      .notNull()
      .references(() => jobApplications.id, { onDelete: "cascade" }),

    type: reminderTypeEnum("type").notNull().default("FOLLOW_UP"),
    triggerAt: timestamp("trigger_at", { withTimezone: true }).notNull(),

    sentAt: timestamp("sent_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("reminders_unique_job_type_trigger").on(
      t.jobApplicationId,
      t.type,
      t.triggerAt,
    ),
    dueIdx: index("reminders_due_idx").on(t.triggerAt, t.sentAt),
    userIdx: index("reminders_user_idx").on(t.userId),
  }),
);
```

### Generate & run migrations
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## DB Client + Env Validation

### `src/lib/env.ts`
```ts
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_TRUST_HOST: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
});

export const env = schema.parse(process.env);
```

### `src/lib/db.ts`
```ts
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import { env } from "./env";

export const db = drizzle(sql, { logger: false });

// Fail fast if env missing
void env.DATABASE_URL;
```

---

## Auth.js (Resend magic link) + Bootstrap On Login

### `src/lib/auth.ts`
```ts
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { env } from "./env";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, userSettings, userEntitlements } from "../../drizzle/schema";

async function ensureUserBootstrap(email: string) {
  // 1) users row
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user =
    existing[0] ??
    (
      await db
        .insert(users)
        .values({ email })
        .returning({ id: users.id, email: users.email })
    )[0];

  // 2) settings row
  const settings = await db
    .select({ userId: userSettings.userId })
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  if (!settings[0]) {
    await db.insert(userSettings).values({ userId: user.id });
  }

  // 3) entitlements row
  const ent = await db
    .select({ userId: userEntitlements.userId })
    .from(userEntitlements)
    .where(eq(userEntitlements.userId, user.id))
    .limit(1);

  if (!ent[0]) {
    await db.insert(userEntitlements).values({ userId: user.id, plan: "FREE" });
  }

  return user.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: env.AUTH_TRUST_HOST === "true",
  secret: env.AUTH_SECRET,
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      if (!token.email) return token;
      const appUserId = await ensureUserBootstrap(token.email);
      (token as any).appUserId = appUserId;
      return token;
    },
    async session({ session, token }) {
      (session as any).appUserId = (token as any).appUserId;
      return session;
    },
  },
});
```

### `src/app/api/auth/[...nextauth]/route.ts`
```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

---

## Zod Validators (Shared)

### `src/lib/validators.ts`
```ts
import { z } from "zod";

export const JobStatus = z.enum([
  "SAVED",
  "APPLIED",
  "RECRUITER_SCREEN",
  "TECHNICAL",
  "ONSITE",
  "OFFER",
  "REJECTED",
  "GHOSTED",
]);

export const ResumeVersionCreateSchema = z.object({
  name: z.string().min(1).max(120),
});

export const ResumeVersionUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
});

export const JobCreateSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  location: z.string().max(160).optional().nullable(),
  applicationUrl: z.string().url().optional().nullable(),
  appliedAt: z.string().datetime().optional().nullable(), // ISO string
  status: JobStatus.optional(),
  recruiterName: z.string().max(160).optional().nullable(),
  recruiterEmail: z.string().email().optional().nullable(),
  notes: z.string().max(10_000).optional().nullable(),
  resumeVersionId: z.string().uuid().optional().nullable(),
});

export const JobUpdateSchema = JobCreateSchema.extend({
  id: z.string().uuid(),
});

export const JobSetStatusSchema = z.object({
  id: z.string().uuid(),
  status: JobStatus,
});

export const JobDeleteSchema = z.object({
  id: z.string().uuid(),
});
```

---

## Auth Guard Helper

### `src/lib/require-user.ts`
```ts
import { auth } from "@/lib/auth";

export async function requireAppUserId(): Promise<string> {
  const session = await auth();
  const appUserId = (session as any)?.appUserId as string | undefined;
  if (!appUserId) throw new Error("Unauthorized");
  return appUserId;
}
```

---

## Server Actions (Phase 2 CRUD)

### `src/app/app/actions/resume-actions.ts`
```ts
"use server";

import { db } from "@/lib/db";
import { requireAppUserId } from "@/lib/require-user";
import { ResumeVersionCreateSchema, ResumeVersionUpdateSchema } from "@/lib/validators";
import { resumeVersions } from "../../../../drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function createResumeVersion(input: unknown) {
  const userId = await requireAppUserId();
  const data = ResumeVersionCreateSchema.parse(input);

  const row = (
    await db
      .insert(resumeVersions)
      .values({ userId, name: data.name })
      .returning()
  )[0];

  return row;
}

export async function updateResumeVersion(input: unknown) {
  const userId = await requireAppUserId();
  const data = ResumeVersionUpdateSchema.parse(input);

  const row = (
    await db
      .update(resumeVersions)
      .set({ name: data.name, updatedAt: new Date() })
      .where(and(eq(resumeVersions.id, data.id), eq(resumeVersions.userId, userId)))
      .returning()
  )[0];

  return row;
}

export async function deleteResumeVersion(id: string) {
  const userId = await requireAppUserId();
  await db
    .delete(resumeVersions)
    .where(and(eq(resumeVersions.id, id), eq(resumeVersions.userId, userId)));
}

export async function listResumeVersions() {
  const userId = await requireAppUserId();
  return db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.userId, userId))
    .orderBy(resumeVersions.name);
}
```

### `src/app/app/actions/job-actions.ts`
```ts
"use server";

import { db } from "@/lib/db";
import { requireAppUserId } from "@/lib/require-user";
import {
  JobCreateSchema,
  JobUpdateSchema,
  JobSetStatusSchema,
  JobDeleteSchema,
} from "@/lib/validators";
import { jobApplications, userEntitlements } from "../../../../drizzle/schema";
import { and, eq, desc, sql } from "drizzle-orm";

async function assertUnderFreeLimit(userId: string) {
  const ent = await db
    .select({ plan: userEntitlements.plan })
    .from(userEntitlements)
    .where(eq(userEntitlements.userId, userId))
    .limit(1);

  const plan = ent[0]?.plan ?? "FREE";
  if (plan !== "FREE") return;

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId));

  const count = Number(countRows[0]?.count ?? 0);
  if (count >= 10) {
    throw new Error("Free plan limit reached (10 job applications).");
  }
}

export async function createJob(input: unknown) {
  const userId = await requireAppUserId();
  await assertUnderFreeLimit(userId);

  const data = JobCreateSchema.parse(input);

  const row = (
    await db
      .insert(jobApplications)
      .values({
        userId,
        company: data.company,
        role: data.role,
        location: data.location ?? null,
        applicationUrl: data.applicationUrl ?? null,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
        status: data.status ?? "SAVED",
        recruiterName: data.recruiterName ?? null,
        recruiterEmail: data.recruiterEmail ?? null,
        notes: data.notes ?? null,
        resumeVersionId: data.resumeVersionId ?? null,
        lastTouchedAt: new Date(),
      })
      .returning()
  )[0];

  return row;
}

export async function updateJob(input: unknown) {
  const userId = await requireAppUserId();
  const data = JobUpdateSchema.parse(input);

  const row = (
    await db
      .update(jobApplications)
      .set({
        company: data.company,
        role: data.role,
        location: data.location ?? null,
        applicationUrl: data.applicationUrl ?? null,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
        status: data.status ?? "SAVED",
        recruiterName: data.recruiterName ?? null,
        recruiterEmail: data.recruiterEmail ?? null,
        notes: data.notes ?? null,
        resumeVersionId: data.resumeVersionId ?? null,
        lastTouchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(jobApplications.id, data.id), eq(jobApplications.userId, userId)))
      .returning()
  )[0];

  return row;
}

export async function setJobStatus(input: unknown) {
  const userId = await requireAppUserId();
  const data = JobSetStatusSchema.parse(input);

  const row = (
    await db
      .update(jobApplications)
      .set({
        status: data.status,
        lastTouchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(jobApplications.id, data.id), eq(jobApplications.userId, userId)))
      .returning()
  )[0];

  return row;
}

export async function deleteJob(input: unknown) {
  const userId = await requireAppUserId();
  const data = JobDeleteSchema.parse(input);

  await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.id, data.id), eq(jobApplications.userId, userId)));
}

export async function listJobs() {
  const userId = await requireAppUserId();

  return db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .orderBy(desc(jobApplications.lastTouchedAt))
    .limit(250);
}
```

---

## App Page Wiring (Server → Client)

### `src/app/app/page.tsx`
```tsx
import { listJobs } from "./actions/job-actions";
import { listResumeVersions } from "./actions/resume-actions";
import JobsTable from "./ui/jobs-table";

export default async function AppHome() {
  const [jobs, resumes] = await Promise.all([listJobs(), listResumeVersions()]);

  return (
    <main className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Track applications, statuses, and which resume version you used.
        </p>
      </div>

      <JobsTable initialJobs={jobs as any} resumeVersions={resumes as any} />
    </main>
  );
}
```

---

## UI (Tailwind + shadcn/ui): Table + Side Drawer

### `src/app/app/ui/jobs-table.tsx`
```tsx
"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import JobDrawer from "./job-drawer";
import { setJobStatus, listJobs } from "../actions/job-actions";

type JobStatus =
  | "SAVED"
  | "APPLIED"
  | "RECRUITER_SCREEN"
  | "TECHNICAL"
  | "ONSITE"
  | "OFFER"
  | "REJECTED"
  | "GHOSTED";

type Job = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  applicationUrl: string | null;
  appliedAt: string | Date | null;
  status: JobStatus;
  recruiterName: string | null;
  recruiterEmail: string | null;
  notes: string | null;
  resumeVersionId: string | null;
  lastTouchedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ResumeVersion = {
  id: string;
  name: string;
};

const STATUS_OPTIONS: { value: JobStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "RECRUITER_SCREEN", label: "Recruiter Screen" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "ONSITE", label: "Onsite" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "GHOSTED", label: "Ghosted" },
];

function statusBadgeVariant(status: JobStatus) {
  switch (status) {
    case "OFFER":
      return "default";
    case "REJECTED":
      return "destructive";
    case "APPLIED":
    case "RECRUITER_SCREEN":
    case "TECHNICAL":
    case "ONSITE":
      return "secondary";
    case "GHOSTED":
      return "outline";
    default:
      return "outline";
  }
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString();
}

export default function JobsTable({
  initialJobs,
  resumeVersions,
}: {
  initialJobs: Job[];
  resumeVersions: ResumeVersion[];
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPending, startTransition] = useTransition();

  const resumeNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of resumeVersions) m.set(r.id, r.name);
    return m;
  }, [resumeVersions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return jobs.filter((j) => {
      const matchesStatus = statusFilter === "ALL" ? true : j.status === statusFilter;
      if (!matchesStatus) return false;

      if (!q) return true;
      return (
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        (j.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [jobs, search, statusFilter]);

  function openCreate() {
    setSelectedJob(null);
    setDrawerOpen(true);
  }

  function openEdit(job: Job) {
    setSelectedJob(job);
    setDrawerOpen(true);
  }

  function refreshJobs() {
    startTransition(async () => {
      const latest = await listJobs();
      setJobs(latest as unknown as Job[]);
    });
  }

  function onInlineStatusChange(jobId: string, status: JobStatus) {
    startTransition(async () => {
      await setJobStatus({ id: jobId, status });
      await refreshJobs();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            className="sm:w-[320px]"
            placeholder="Search company, role, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as JobStatus | "ALL")}
          >
            <SelectTrigger className="sm:w-[220px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={refreshJobs} disabled={isPending}>
            Refresh
          </Button>
        </div>

        <Button onClick={openCreate}>New job</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[180px]">Status</TableHead>
              <TableHead className="w-[120px]">Applied</TableHead>
              <TableHead className="w-[180px]">Resume</TableHead>
              <TableHead className="w-[140px]">Updated</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No jobs match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(job)}
                >
                  <TableCell className="font-medium">{job.company}</TableCell>

                  <TableCell className="text-muted-foreground">{job.role}</TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(job.status)}>
                        {job.status.replaceAll("_", " ")}
                      </Badge>

                      <Select
                        value={job.status}
                        onValueChange={(v) => onInlineStatusChange(job.id, v as JobStatus)}
                      >
                        <SelectTrigger className="h-8 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter((s) => s.value !== "ALL").map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>

                  <TableCell>{formatDate(job.appliedAt)}</TableCell>

                  <TableCell className="text-muted-foreground">
                    {job.resumeVersionId ? resumeNameById.get(job.resumeVersionId) ?? "—" : "—"}
                  </TableCell>

                  <TableCell>{formatDate(job.lastTouchedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <JobDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        job={selectedJob}
        resumeVersions={resumeVersions}
        onSaved={refreshJobs}
      />
    </div>
  );
}
```

### `src/app/app/ui/job-drawer.tsx`
```tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createJob, updateJob, deleteJob } from "../actions/job-actions";

type JobStatus =
  | "SAVED"
  | "APPLIED"
  | "RECRUITER_SCREEN"
  | "TECHNICAL"
  | "ONSITE"
  | "OFFER"
  | "REJECTED"
  | "GHOSTED";

type Job = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  applicationUrl: string | null;
  appliedAt: string | Date | null;
  status: JobStatus;
  recruiterName: string | null;
  recruiterEmail: string | null;
  notes: string | null;
  resumeVersionId: string | null;
};

type ResumeVersion = { id: string; name: string };

const STATUS: { value: JobStatus; label: string }[] = [
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "RECRUITER_SCREEN", label: "Recruiter Screen" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "ONSITE", label: "Onsite" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
  { value: "GHOSTED", label: "Ghosted" },
];

function toDateInputValue(d: string | Date | null | undefined) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

const FormSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  location: z.string().max(160).optional().nullable(),
  applicationUrl: z.string().url().optional().nullable(),
  appliedAt: z.string().optional().nullable(), // YYYY-MM-DD
  status: z.enum([
    "SAVED",
    "APPLIED",
    "RECRUITER_SCREEN",
    "TECHNICAL",
    "ONSITE",
    "OFFER",
    "REJECTED",
    "GHOSTED",
  ]),
  recruiterName: z.string().max(160).optional().nullable(),
  recruiterEmail: z.string().email().optional().nullable(),
  resumeVersionId: z.string().uuid().optional().nullable(),
  notes: z.string().max(10_000).optional().nullable(),
});

type FormValues = z.infer<typeof FormSchema>;

export default function JobDrawer({
  open,
  onOpenChange,
  job,
  resumeVersions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job: Job | null;
  resumeVersions: ResumeVersion[];
  onSaved: () => void;
}) {
  const isEdit = !!job;
  const [isPending, startTransition] = useTransition();

  const defaults: FormValues = useMemo(
    () => ({
      company: job?.company ?? "",
      role: job?.role ?? "",
      location: job?.location ?? null,
      applicationUrl: job?.applicationUrl ?? null,
      appliedAt: toDateInputValue(job?.appliedAt),
      status: job?.status ?? "SAVED",
      recruiterName: job?.recruiterName ?? null,
      recruiterEmail: job?.recruiterEmail ?? null,
      resumeVersionId: job?.resumeVersionId ?? null,
      notes: job?.notes ?? null,
    }),
    [job],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  function submit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        appliedAt: values.appliedAt ? new Date(values.appliedAt).toISOString() : null,
      };

      if (isEdit && job) {
        await updateJob({ id: job.id, ...payload });
      } else {
        await createJob(payload);
      }

      onSaved();
      onOpenChange(false);
    });
  }

  function onDelete() {
    if (!job) return;
    startTransition(async () => {
      await deleteJob({ id: job.id });
      onSaved();
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit job" : "New job"}</SheetTitle>
          <SheetDescription>
            Keep it simple. Track the role, status, and which resume you used.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" {...form.register("company")} />
              {form.formState.errors.company?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.company.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" {...form.register("role")} />
              {form.formState.errors.role?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Remote / NYC / Hybrid…"
                {...form.register("location")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appliedAt">Applied date</Label>
              <Input id="appliedAt" type="date" {...form.register("appliedAt")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationUrl">Application URL</Label>
            <Input id="applicationUrl" placeholder="https://…" {...form.register("applicationUrl")} />
            {form.formState.errors.applicationUrl?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.applicationUrl.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as JobStatus, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resume version</Label>
              <Select
                value={form.watch("resumeVersionId") ?? "NONE"}
                onValueChange={(v) =>
                  form.setValue("resumeVersionId", v === "NONE" ? null : v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— None —</SelectItem>
                  {resumeVersions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recruiterName">Recruiter name</Label>
              <Input id="recruiterName" {...form.register("recruiterName")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiterEmail">Recruiter email</Label>
              <Input id="recruiterEmail" type="email" {...form.register("recruiterEmail")} />
              {form.formState.errors.recruiterEmail?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.recruiterEmail.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={6} {...form.register("notes")} />
          </div>

          <SheetFooter className="gap-2">
            {isEdit ? (
              <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
                Delete
              </Button>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isEdit ? "Save changes" : "Create job"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Notes / Guardrails

- Inline status dropdown stops row click propagation.
- Drawer uses HTML date input (`YYYY-MM-DD`) and converts to ISO before calling server actions.
- All server actions are user-scoped by `requireAppUserId()`.

---

## Scripts

Recommended `package.json` scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```
