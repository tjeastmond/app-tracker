import { beforeEach, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@drizzle/schema";
import { sql, eq } from "drizzle-orm";

// Use separate test database
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5433/job_tracker_test";

const pool = new Pool({
  connectionString: TEST_DATABASE_URL,
  max: 1, // Single connection to avoid deadlocks
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const testDb = drizzle(pool, { schema });

// Clean up database before each test
beforeEach(async () => {
  try {
    // Disable foreign key checks temporarily and truncate all tables
    await testDb.execute(sql`
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
        END LOOP;
      END $$;
    `);
  } catch (error) {
    console.error('Failed to clean database:', error);
    throw error;
  }
});

// Close connection after all tests
afterAll(async () => {
  await pool.end();
});

// Fixture factories
export async function createTestUser(email?: string) {
  const user = await testDb.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(schema.users)
      .values({
        email: email || 'test-' + Date.now() + '@example.com',
      })
      .returning();

    if (!newUser) {
      throw new Error("Failed to create test user");
    }

    // Bootstrap entitlements and settings
    await tx.insert(schema.userEntitlements).values({
      userId: newUser.id,
      plan: "FREE",
    });
    return newUser;
  });

  return user;
}

export async function createPaidTestUser(email?: string) {
  const user = await createTestUser(email);

  await testDb
    .update(schema.userEntitlements)
    .set({ plan: "PAID_LIFETIME" })
.where(eq(schema.userEntitlements.userId, user.id));

  return user;
}

export async function createTestResumeVersion(
  userId: string,
  data?: { name?: string; url?: string }
) {
  const [resume] = await testDb
    .insert(schema.resumeVersions)
    .values({
      userId,
      name: data?.name || "Default Resume",
      url: data?.url || "https://example.com/resume.pdf",
    })
    .returning();

  return resume;
}

export async function createTestJob(
  userId: string,
  data?: {
    company?: string;
    role?: string;
    status?: (typeof schema.jobStatusEnum.enumValues)[number];
    resumeVersionId?: string;
  }
) {
  const [job] = await testDb
    .insert(schema.jobApplications)
    .values({
      userId,
      company: data?.company || "Test Company",
      role: data?.role || "Software Engineer",
      status: data?.status || "SAVED",
      resumeVersionId: data?.resumeVersionId,
    })
    .returning();

  return job;
}

