import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { env } from "./env";
import { users, userEntitlements, userSettings } from "@drizzle/schema";
import { eq } from "drizzle-orm";

const providers: Provider[] = [
  Resend({
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
  }),
];

// Dev-only credentials provider for bypassing email
if (process.env.NODE_ENV === "development" && process.env.DEV_BYPASS_EMAIL) {
  providers.push(
    Credentials({
      id: "dev-bypass",
      name: "Dev Bypass",
      credentials: {},
      async authorize() {
        const devEmail = process.env.DEV_BYPASS_EMAIL;
        if (!devEmail) return null;

        // Find or create user
        let user = await db.query.users.findFirst({
          where: eq(users.email, devEmail),
        });

        if (!user) {
          const [newUser] = await db
            .insert(users)
            .values({ email: devEmail })
            .returning();
          user = newUser;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Bootstrap user on first sign-in
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      if (existingUser) {
        // Check if entitlements and settings exist
        const entitlement = await db.query.userEntitlements.findFirst({
          where: eq(userEntitlements.userId, existingUser.id),
        });

        if (!entitlement) {
          await db.insert(userEntitlements).values({
            userId: existingUser.id,
            plan: "FREE",
          });
        }

        const settings = await db.query.userSettings.findFirst({
          where: eq(userSettings.userId, existingUser.id),
        });

        if (!settings) {
          await db.insert(userSettings).values({
            userId: existingUser.id,
            reminderDays: 7,
          });
        }
      }

      return true;
    },
    async session({ session, token, user }) {
      // Ensure user ID is available in session
      if (token?.sub) {
        session.user.id = token.sub;
      } else if (user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
