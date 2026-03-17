# Workspace

## Overview

Cloud HR & Attendance Management System — pnpm monorepo using TypeScript. Full-stack HR system with role-based access control.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite (artifacts/cloud-hr), Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Cookie-based session auth (SHA-256 password hash)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, path /api)
│   └── cloud-hr/           # React + Vite frontend (port 24251, path /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seed script
```

## Features

### Roles
- **Admin**: Full access (Dashboard, Departments, Employees, Attendance, Leaves, Reports, Settings)
- **Manager**: Dashboard, Attendance, Leaves, Reports, Profile
- **Employee**: Dashboard, Attendance, Leaves, Profile

### Modules
1. **Dashboard** — Stats summary, recent attendance
2. **Department Management** (Admin) — CRUD departments
3. **Employee Management** (Admin) — CRUD employees with fingerprint ID assignment
4. **Attendance** — Simulated fingerprint check-in/checkout, auto late/early detection
5. **Leave Management** — Submit requests, approve/reject workflow
6. **Reports** — Monthly attendance statistics per employee
7. **System Settings** (Admin) — Work hours, late thresholds, leave entitlements

## Database Schema

- `users` — Authentication accounts (username, passwordHash, role)
- `employees` — Employee profiles linked to users
- `departments` — Departments with optional manager
- `attendance` — Daily check-in/checkout records with status classification
- `leaves` — Leave requests with approval workflow
- `settings` — Key-value system configuration

## Default Login Accounts

| Role     | Username | Password   | Fingerprint |
|----------|----------|------------|-------------|
| Admin    | admin    | admin123   | FP001       |
| Manager  | manager1 | manager123 | FP002       |
| Manager  | manager2 | manager123 | FP003       |
| Employee | emp001   | emp123     | FP004       |
| Employee | emp002   | emp123     | FP005       |
| Employee | emp003   | emp123     | FP006       |
| Employee | emp004   | emp123     | FP007       |
| Employee | emp005   | emp123     | FP008       |

## Running Codegen

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Seeding Data

```bash
pnpm --filter @workspace/scripts run seed
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Run typecheck from root:
```bash
pnpm run typecheck
```
