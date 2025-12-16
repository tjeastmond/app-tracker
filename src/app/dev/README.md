# Development Testing Tools

## Reminder System Testing

Navigate to `/dev/reminders` to access the reminder testing interface.

### Prerequisites

1. **Get Your User ID**
   ```sql
   SELECT id FROM users WHERE email = 'your-email@example.com';
   ```
   Or check the session in browser dev tools.

2. **Ensure Environment Variables**
   ```bash
   RESEND_API_KEY=your_key
   EMAIL_FROM="Job Tracker <noreply@yourdomain.com>"
   NEXT_PUBLIC_CRON_SECRET=optional_for_local
   ```

### Testing Workflow

#### Quick Test (Recommended)
1. Navigate to `/dev/reminders`
2. **User ID is auto-filled** from your session
3. **First job is auto-selected** in the backdate dropdown
4. Click the green **"Run Both: Generate + Send"** button
5. Watch both steps complete automatically
6. Check your email!

#### Manual Testing (Advanced)

**1. Setup (Blue Card)**
- **User ID**: Auto-filled from session (editable if needed)
- **Update Plan**: Click to toggle to `PAID_LIFETIME`
- **Backdate Job**: First job auto-selected, just click "Set Date"

**2. Generate Reminders**
- Click "Generate Reminders" to create reminder records

**3. Send Emails**
- Click "Send Reminder Emails" to send pending emails

### API Endpoints

All these endpoints are available for manual testing:

```bash
# Generate reminders
curl http://localhost:3000/api/cron/generate-reminders \
  -H "Authorization: Bearer dev"

# Send reminders
curl http://localhost:3000/api/cron/send-reminders \
  -H "Authorization: Bearer dev"

# Backdate a job (dev only)
curl -X POST http://localhost:3000/api/dev/touch-job \
  -H "Content-Type: application/json" \
  -d '{"jobId":"job-uuid","daysAgo":10,"userId":"user-uuid"}'

# Update user plan (dev only)
curl -X PUT http://localhost:3000/api/dev/touch-job \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-uuid","plan":"PAID_LIFETIME"}'
```

### Troubleshooting

**No reminders generated?**
- Check that your user has `PAID_LIFETIME` plan
- Ensure jobs have status APPLIED, RECRUITER_SCREEN, TECHNICAL, or ONSITE
- Verify jobs haven't been touched for 7+ days (APPLIED) or 5+ days (interviews)

**Emails not sending?**
- Verify `RESEND_API_KEY` is valid
- Check that `EMAIL_FROM` uses a verified domain in Resend
- Look for errors in the response

**"Unauthorized" error?**
- For local testing, the CRON_SECRET check is optional
- The endpoints will accept any value if CRON_SECRET is not set

### Database Queries

Useful queries for debugging:

```sql
-- Check user plan
SELECT * FROM user_entitlements WHERE user_id = 'your-user-id';

-- Check jobs needing follow-up
SELECT id, company, role, status, last_touched_at, 
       EXTRACT(DAY FROM (NOW() - last_touched_at)) as days_ago
FROM job_applications 
WHERE user_id = 'your-user-id' 
  AND status IN ('APPLIED', 'RECRUITER_SCREEN', 'TECHNICAL', 'ONSITE')
ORDER BY last_touched_at ASC;

-- Check pending reminders
SELECT r.*, j.company, j.role 
FROM reminders r
JOIN job_applications j ON r.job_application_id = j.id
WHERE r.user_id = 'your-user-id'
  AND r.sent_at IS NULL
  AND r.cancelled_at IS NULL;

-- Check sent reminders
SELECT * FROM reminders 
WHERE user_id = 'your-user-id' 
  AND sent_at IS NOT NULL
ORDER BY sent_at DESC;
```
