import { pgTable, text, timestamp, uuid, pgEnum, integer } from "drizzle-orm/pg-core";

// Enums
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

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// User entitlements table
export const userEntitlements = pgTable("user_entitlements", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  plan: planEnum("plan").notNull().default("FREE"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  appliedFollowupDays: integer("applied_followup_days").notNull().default(7),
  interviewFollowupDays: integer("interview_followup_days").notNull().default(5),
  remindersEnabled: integer("reminders_enabled").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// Resume versions table
export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// Job applications table
export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location"),
  url: text("url"),
  status: jobStatusEnum("status").notNull().default("SAVED"),
  appliedDate: timestamp("applied_date", { withTimezone: true, mode: "date" }),
  salary: text("salary"),
  notes: text("notes"),
  resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, {
    onDelete: "set null",
  }),
  lastTouchedAt: timestamp("last_touched_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jobApplicationId: uuid("job_application_id")
    .notNull()
    .references(() => jobApplications.id, { onDelete: "cascade" }),
  type: reminderTypeEnum("type").notNull().default("FOLLOW_UP"),
  triggerAt: timestamp("trigger_at", { withTimezone: true, mode: "date" }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
