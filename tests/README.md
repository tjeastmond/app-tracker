# Testing Guide

This project uses **Vitest** for unit tests and **Playwright** for end-to-end (E2E) tests.

## Setup

### 1. Install Playwright Browsers

```bash
pnpm exec playwright install
```

### 2. Create Test Database

Unit tests use a separate test database to avoid conflicts with development data.

```bash
# Connect to your local Postgres
docker exec -it job-tracker-postgres psql -U postgres

# Create test database
CREATE DATABASE job_tracker_test;
\q
```

### 3. Run Migrations on Test Database

```bash
# Set TEST_DATABASE_URL temporarily
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5433/job_tracker_test pnpm run db:migrate
```

### 4. Configure Test User for E2E Tests

E2E tests use the dev bypass mechanism. In your `.env.local`, ensure:

```bash
DEV_BYPASS_EMAIL=test_automation@example.com
```

This enables E2E tests to login without email verification.

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run unit tests in watch mode
pnpm test:unit:watch

# Run unit tests with UI
pnpm test:unit:ui

# Run specific test file
pnpm test tests/unit/validators/validators.spec.ts
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI (interactive mode)
pnpm test:e2e:ui

# Run E2E tests in headed mode (see browser)
pnpm test:e2e:headed

# Run specific E2E test file
pnpm test:e2e tests/e2e/auth.spec.ts

# Run only chromium browser
pnpm test:e2e --project=chromium
```

### All Tests

```bash
# Run unit tests followed by E2E tests
pnpm test:all
```

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── setup.ts            # Test database setup and fixtures
│   ├── validators/         # Zod schema tests
│   ├── actions/            # Server action tests
│   └── lib/                # Utility function tests
└── e2e/                    # End-to-end tests
    ├── helpers/            # Shared E2E utilities
    │   └── auth.ts         # Authentication helpers
    ├── auth.spec.ts        # Authentication flow tests
    ├── job-management.spec.ts      # Job CRUD tests
    ├── resume-management.spec.ts   # Resume version tests
    └── free-tier-limits.spec.ts    # Free tier enforcement tests
```

## Unit Test Guidelines

### What We Test
- **Validators**: Zod schema validation with valid/invalid inputs
- **Server Actions**: Business logic with real database interactions
- **Utilities**: Helper functions and entitlement logic

### Key Patterns
- Tests use a **separate test database** for isolation
- Database is **truncated before each test**
- **Fixture factories** create test data (users, jobs, resumes)
- **Mocking**: We mock `requireAppUserId` to simulate authenticated users
- Tests verify **actual behavior**, not stubs or mocks

### Example Unit Test

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { testDb, createTestUser } from "../setup";

vi.mock("@/lib/require-user", () => ({
  requireAppUserId: vi.fn(),
}));

const { requireAppUserId } = await import("@/lib/require-user");
const { createJob } = await import("@/app/app/actions/job-actions");

describe("createJob", () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    testUserId = user.id;
    vi.mocked(requireAppUserId).mockResolvedValue(testUserId);
  });

  it("creates a job with valid data", async () => {
    const job = await createJob({
      company: "Acme",
      role: "Engineer",
      status: "SAVED",
    });

    expect(job.company).toBe("Acme");
  });
});
```

## E2E Test Guidelines

### What We Test
- **User Workflows**: Complete user journeys through the UI
- **Authentication**: Login, logout, session persistence
- **CRUD Operations**: Creating, editing, deleting jobs and resumes
- **Free Tier Limits**: Enforcement of 10-job limit
- **Form Validation**: Error handling and validation messages

### Key Patterns
- Tests use **dev bypass login** (no email required)
- Each test starts with a **fresh authenticated session**
- Tests verify **visible UI elements** and state changes
- Focus on **user behavior**, not implementation details

### Example E2E Test

```typescript
import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Job Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("user can create a new job", async ({ page }) => {
    await page.click('button:has-text("Add Job")');
    await page.fill('[name="company"]', "Acme Corp");
    await page.fill('[name="role"]', "Engineer");
    await page.selectOption('[name="status"]', "SAVED");
    await page.click('button:has-text("Save")');

    await expect(page.locator("text=Acme Corp")).toBeVisible();
  });
});
```

## Continuous Integration

Tests are designed to run in CI environments. Playwright will automatically start the dev server before running E2E tests.

### Environment Variables for CI

```bash
# Required for tests
DATABASE_URL=postgres://user:pass@host:5432/db
TEST_DATABASE_URL=postgres://user:pass@host:5432/test_db
AUTH_SECRET=<secret>
DEV_BYPASS_EMAIL=test_automation@example.com
```

## Troubleshooting

### Unit Tests Failing

**Issue**: Database connection errors

**Solution**: Ensure test database exists and migrations are applied:
```bash
docker exec -it job-tracker-postgres psql -U postgres -c "CREATE DATABASE job_tracker_test;"
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5433/job_tracker_test pnpm run db:migrate
```

### E2E Tests Failing

**Issue**: "Dev Login" button not visible

**Solution**: Ensure `DEV_BYPASS_EMAIL` is set in `.env.local`:
```bash
DEV_BYPASS_EMAIL=test_automation@example.com
```

**Issue**: Timeout errors

**Solution**: Increase timeout or run in headed mode to debug:
```bash
pnpm test:e2e:headed
```

### Database Not Cleaning Between Tests

**Issue**: Tests failing due to existing data

**Solution**: Verify `beforeEach` hook in `tests/unit/setup.ts` is truncating tables correctly.

## Coverage

Generate test coverage report:

```bash
# Run unit tests with coverage
pnpm test:unit --coverage

# View coverage report
open coverage/index.html
```

## Best Practices

### Unit Tests
✅ Test business logic, not implementation details  
✅ Use real database interactions  
✅ Keep tests focused and concise  
✅ Use descriptive test names  
❌ Don't test framework code  
❌ Don't use snapshot testing  

### E2E Tests
✅ Test complete user workflows  
✅ Verify visible UI elements  
✅ Test as a normal user (not admin)  
✅ Test error states and validation  
❌ Don't test every edge case (use unit tests)  
❌ Don't make tests brittle with implementation details
