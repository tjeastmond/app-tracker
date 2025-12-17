# Admin Section

This document describes the admin functionality for the Job Tracker application.

## Overview

The admin section allows privileged users to manage the application's users and system settings. Admin users have access to:

- User management (create, edit, delete users)
- Grant/revoke admin privileges
- View user plan information
- Future: system statistics and settings

## Access Control

Admin access is controlled by the `isAdmin` boolean flag on the user record. Only users with `isAdmin = true` can access the admin section.

### Admin Routes

- `/admin` - Admin dashboard with links to management sections
- `/admin/users` - User management page with CRUD operations

Non-admin users attempting to access these routes will be redirected to `/app`.

## Making a User Admin

Since the first user won't have admin privileges by default, use the provided script to promote a user to admin:

```bash
pnpm run admin:make user@example.com
```

This script will:
1. Find the user by email
2. Update their `isAdmin` flag to `true`
3. Confirm the change

**Example:**

```bash
$ pnpm run admin:make john@example.com
✅ User john@example.com is now an admin
```

## User Management

The admin user management interface (`/admin/users`) provides:

### Features
- **View All Users**: Table showing email, role, plan, created date, updated date
- **Search**: Filter users by email address
- **Create User**: Add new users with optional admin privileges
- **Edit User**: Update user email and admin status
- **Delete User**: Remove users (with confirmation prompt)

### User Fields
- `email` - User's email address (unique)
- `isAdmin` - Admin privileges (boolean)
- `plan` - User's subscription plan (FREE or PAID_LIFETIME)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

## Navigation

Admin users will see an "Admin" button in the navigation bar (between Settings and dev tools).

## Security

- All admin routes are protected with the `requireAdmin()` guard
- Non-admin users are automatically redirected
- The admin link only appears for admin users
- All admin server actions verify admin status before execution

## Database Schema

The `users` table includes:

```typescript
{
  id: uuid,
  email: string,
  isAdmin: boolean (default: false),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Future Enhancements

Planned admin features:
- System statistics dashboard
- User activity monitoring
- Manual plan upgrades/downgrades
- System-wide settings management
- Audit logs
