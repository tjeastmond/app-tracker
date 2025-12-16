# Setup Instructions

## 1. Configure Resend (For Magic Link Authentication)

### Option A: Use Resend (Recommended)
1. Go to https://resend.com and create a free account
2. Get your API key from the dashboard
3. Update `.env.local`:
   ```bash
   RESEND_API_KEY=re_your_actual_api_key_here
   EMAIL_FROM="Job Tracker <onboarding@resend.dev>"
   ```

### Option B: Use Dev Bypass (Quick Testing)
For local development without setting up Resend:

1. Update `.env.local` with your email:
   ```bash
   DEV_BYPASS_EMAIL=your.email@example.com
   ```
   
2. Start the dev server:
   ```bash
   pnpm run dev
   ```

3. Navigate to http://localhost:3000/login

4. Click the **🚀 Dev Login (Skip Email)** button

This button will:
- Only appear in development mode
- Only show if `DEV_BYPASS_EMAIL` is set to a real email (not `dev@example.com`)
- Create a user account automatically
- Log you in without sending an email

## 2. Start the Application

```bash
# Start the database (if not already running)
docker compose up -d

# Run migrations (if you haven't already)
pnpm run db:migrate

# Start the dev server
pnpm run dev
```

Visit http://localhost:3000

## Notes

- The dev bypass button **only works in development** and won't appear in production
- For production, you must configure a real Resend API key
- The free Resend tier includes 3,000 emails/month which is plenty for development and small projects
