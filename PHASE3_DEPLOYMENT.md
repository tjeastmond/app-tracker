# Phase 3 Deployment Checklist

## Environment Variables

Add these to your Vercel project settings:

```
CRON_SECRET=your_secure_random_string_here
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
```

Generate `CRON_SECRET` with:
```bash
openssl rand -base64 32
```

## Database Migration

The schema changes have been applied locally. For production:

1. Push the new migration to your repository
2. Ensure your Vercel Postgres instance has the latest schema
3. You can run migrations manually or they'll run on next deployment

Migration file: `drizzle/migrations/0001_eager_sunset_bain.sql`

## Vercel Cron Configuration

The `vercel.json` file configures two cron jobs:

1. **Generate Reminders** - Runs daily at 9:00 AM UTC
   - Path: `/api/cron/generate-reminders`
   - Purpose: Creates reminder records for jobs needing follow-up

2. **Send Reminders** - Runs daily at 10:00 AM UTC
   - Path: `/api/cron/send-reminders`
   - Purpose: Sends email reminders via Resend

Both endpoints require the `CRON_SECRET` in the Authorization header:
```
Authorization: Bearer {CRON_SECRET}
```

## Testing Cron Jobs Locally

You can test the cron endpoints locally:

```bash
# Generate reminders
curl -X GET http://localhost:3000/api/cron/generate-reminders \
  -H "Authorization: Bearer your_local_cron_secret"

# Send reminders
curl -X GET http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer your_local_cron_secret"
```

## Features Deployed

### Backend
- ✅ Updated schema with follow-up settings
- ✅ `markJobContacted` server action
- ✅ Reminder generator logic
- ✅ Cron endpoints for generating and sending reminders
- ✅ Email templates for reminder notifications

### Frontend
- ✅ "Needs Follow-up" filter in jobs table
- ✅ "Mark as Contacted" button in job drawer
- ✅ Visual indicators for jobs needing follow-up

## Important Notes

1. **Paid Users Only**: Reminders are only generated for users with `PAID_LIFETIME` plan
2. **Idempotent**: The reminder generator won't create duplicate reminders
3. **Automatic Cancellation**: Marking a job as contacted cancels all pending reminders
4. **Default Settings**: 
   - Applied jobs: 7 days follow-up
   - Interview stages: 5 days follow-up

## Next Steps (Phase 4)

- Stripe integration for lifetime purchases
- Remove job limits for paid users
- Enable reminder features for paying customers
