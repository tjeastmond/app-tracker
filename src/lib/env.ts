import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_TRUST_HOST: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_PRICE_ID_LIFETIME: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export const env = schema.parse(process.env);
