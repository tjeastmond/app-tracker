import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";

config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });
const { users } = schema;

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.error(`User with email ${email} not found`);
    process.exit(1);
  }

  if (user.isAdmin) {
    console.log(`User ${email} is already an admin`);
    process.exit(0);
  }

  await db.update(users).set({ isAdmin: true }).where(eq(users.id, user.id));

  console.log(`✅ User ${email} is now an admin`);
  process.exit(0);
}

makeAdmin().catch((error) => {
  console.error("Failed to make user admin:", error);
  process.exit(1);
});
