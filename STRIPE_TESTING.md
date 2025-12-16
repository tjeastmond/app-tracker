# Stripe Testing Guide

## Testing the Checkout Flow

### 1. Start the Development Server

```bash
pnpm run dev
```

### 2. Set Up Stripe CLI (if not already installed)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Login to Stripe:
```bash
stripe login
```

### 3. Forward Webhooks to Local Server

In a separate terminal, run:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like `whsec_...`. Copy this value.

### 4. Update Environment Variables

Add the webhook secret to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Restart the dev server after adding this variable.

### 5. Test the Flow

1. Log in to the application
2. You should see the upgrade banner (free tier)
3. Click "Upgrade Now" button
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any postal code
6. Complete the checkout
7. You should be redirected back to `/app?upgraded=true`
8. The webhook should process and upgrade your account
9. Verify the upgrade banner is gone and success message shows

### 6. Testing with Stripe CLI (Manual Webhook Trigger)

You can also manually trigger webhook events:

```bash
stripe trigger checkout.session.completed
```

Note: You'll need to adjust the metadata to include your actual userId for this to work.

## Verifying Database Changes

Check if the user was upgraded:

```bash
docker exec -it job-tracker-postgres psql -U postgres -d job_tracker -c "SELECT * FROM user_entitlements;"
```

Check if Stripe customer was created:

```bash
docker exec -it job-tracker-postgres psql -U postgres -d job_tracker -c "SELECT * FROM stripe_customers;"
```

## Testing Free Tier Limits

1. As a free user, try to create more than 10 jobs
2. You should see an error: "Free tier limit reached (10 jobs max). Upgrade to add unlimited jobs."
3. After upgrading, you should be able to create unlimited jobs

## Troubleshooting

### Webhook Not Received
- Make sure `stripe listen` is running
- Check that the webhook secret in `.env.local` matches the one from `stripe listen`
- Restart the dev server after changing environment variables

### Payment Not Processing
- Verify your Stripe test keys are correct in `.env.local`
- Check the Stripe dashboard for test payments
- Look at the application logs for any errors

### User Not Upgraded
- Check the webhook handler logs in the terminal
- Verify the userId is in the checkout session metadata
- Check database to see if the entitlement was updated
