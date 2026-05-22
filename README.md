# Sesim Labor Firm Client Portal MVP - Standardized Data Intake and Salary Calculators

## Core Product Goal

Secure multi-tenant web application for Korean labor law firms (노무사) to collect standardized HR/payroll-related intake data from client companies and export datasets to Excel.

Primary workflows:

1. New Hire Information - 입사자 정보 입력/관리
2. Termination Information - 퇴사자 정보 입력/관리
3. Salary Change Information - 급여변경 정보 입력/관리

MVP priorities:

- Security
- Strict tenant isolation
- Fast CRUD implementation
- Reliable Excel exports
- Extensible architecture

Non-goals:

- Employee self-service
- Excel import
- Messaging/chat
- Payroll calculation engine
- Billing/payments

---

# Recommended Tech Stack

## Frontend

- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Table
- Axios or native fetch

## Backend

Option A (recommended for speed + structure):

- NestJS
- TypeScript
- Prisma ORM

Option B:

- Express + Prisma

## Database

- PostgreSQL

## Auth

- Session auth preferred
- HttpOnly secure cookies
- bcrypt/argon2 password hashing

## Excel Export

- ExcelJS

## Validation

- Zod shared schemas

## Deployment

Frontend:
- Vercel

Backend:
- Railway / Render / Fly.io / ECS

DB:
- Neon / Supabase / RDS

Monitoring:
- Sentry

---

# Multi-Tenant Architecture

## Tenant Model

Every business object must contain:

- company_id
- created_by_user_id
- updated_by_user_id

STRICT RULE:

ClientCompanyAdmin MUST NEVER access records outside their own company_id.

Every query MUST be scoped.

Example:

```ts
where: {
  companyId: user.companyId
}
```

Never trust frontend filtering.

Always enforce tenant isolation server-side.

---

# User Roles

## ClientCompanyAdmin

- Belongs to exactly one company
- CRUD only for own company
- Can export own data

## FirmStaff

- Can access all companies
- Can edit client records
- Can export all data

## FirmAdmin

- Company/user management
- Optional in MVP

---

# Recommended Folder Structure

## Frontend

```bash
apps/web/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── companies/
│   ├── hire-intakes/
│   ├── terminations/
│   └── comp-changes/
├── lib/
├── hooks/
├── types/
└── utils/
```

## Backend

```bash
apps/api/
├── src/
│   ├── auth/
│   ├── users/
│   ├── companies/
│   ├── hire-intakes/
│   ├── terminations/
│   ├── compensation-changes/
│   ├── exports/
│   ├── audit-logs/
│   ├── common/
│   │   ├── guards/
│   │   ├── middleware/
│   │   ├── interceptors/
│   │   └── utils/
│   └── prisma/
```

---

# Core Database Tables

## companies

```sql
id UUID PK
name TEXT
status TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

## users

```sql
id UUID PK
email TEXT UNIQUE
password_hash TEXT
role TEXT
company_id UUID NULL
status TEXT
last_login_at TIMESTAMP NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

## departments

```sql
id UUID PK
company_id UUID NULL
name TEXT
is_active BOOLEAN
```

## hire_intakes

```sql
id UUID PK
company_id UUID
name TEXT
resident_registration_number TEXT
email TEXT
hire_date DATE
department_name TEXT
pay_amount NUMBER
pay_type TEXT
pay_tax_basis TEXT
employment_type TEXT
contract_start_date DATE NULL
contract_end_date DATE NULL
created_by_user_id UUID
updated_by_user_id UUID
deleted_at TIMESTAMP NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

## termination_records

```sql
id UUID PK
company_id UUID
name TEXT
resident_registration_number TEXT
termination_date DATE
termination_reason TEXT
created_by_user_id UUID
updated_by_user_id UUID
deleted_at TIMESTAMP NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

## compensation_change_records

```sql
id UUID PK
company_id UUID
name TEXT
resident_registration_number TEXT
before_pay_type TEXT
before_pay_tax_basis TEXT
before_amount NUMERIC
after_pay_type TEXT
after_pay_tax_basis TEXT
after_amount NUMERIC
effective_date DATE
created_by_user_id UUID
updated_by_user_id UUID
deleted_at TIMESTAMP NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

## audit_logs

```sql
id UUID PK
user_id UUID
company_id UUID
entity_type TEXT
entity_id UUID
action TEXT
metadata JSONB
created_at TIMESTAMP
```

---

# Critical Security Notes

## RRN Handling

Treat RRN (주민번호) as highly sensitive PII.

Requirements:

- Encrypt at rest
- Never expose cross-tenant
- Avoid logging plaintext
- Mask in UI by default

Example masked display:

```txt
900101-1******
```

## Encryption

Recommended:

```txt
AES-256-GCM field encryption
```

Never store encryption keys in source code.

Use env vars or secret manager.

## Auth

Requirements:

- HTTPS only
- Secure cookies
- HttpOnly cookies
- CSRF protection
- Rate limiting on auth routes

## Password Hashing

Use:

```txt
argon2 preferred
bcrypt acceptable
```

Never use SHA256 directly.

---

# Recommended Enums

## Pay Type

```ts
enum PayType {
  ANNUAL = 'annual',
  MONTHLY = 'monthly',
  DAILY = 'daily',
  HOURLY = 'hourly'
}
```

## Pay Tax Basis

```ts
enum PayTaxBasis {
  PRE_TAX = 'pre_tax',
  POST_TAX = 'post_tax'
}
```

## Employment Type

```ts
enum EmploymentType {
  PERMANENT = 'permanent',
  CONTRACT = 'contract'
}
```

## Termination Reason

```ts
enum TerminationReason {
  PERSONAL = 'personal',
  RECOMMENDED_RESIGNATION = 'recommended_resignation',
  CONTRACT_END = 'contract_end',
  TERMINATION = 'termination',
  OTHER = 'other'
}
```

---

# Validation Rules

## Hire Intake

If:

```txt
employment_type === CONTRACT
```

Then:

```txt
contract_start_date required
contract_end_date required
```

## Compensation Change

Amounts must be:

```txt
> 0
```

## RRN

Only basic format validation.

Do NOT over-validate.

Example regex:

```ts
/^\d{6}-?\d{7}$/
```

---

# API Design

## Auth

```http
POST /auth/login
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET /me
```

## Companies

```http
GET /companies
POST /companies
PATCH /companies/:id
```

## Hire Intakes

```http
GET /companies/:companyId/hire-intakes
POST /companies/:companyId/hire-intakes
PATCH /companies/:companyId/hire-intakes/:id
DELETE /companies/:companyId/hire-intakes/:id
GET /companies/:companyId/hire-intakes/export.xlsx
```

## Terminations

```http
GET /companies/:companyId/terminations
POST /companies/:companyId/terminations
PATCH /companies/:companyId/terminations/:id
DELETE /companies/:companyId/terminations/:id
GET /companies/:companyId/terminations/export.xlsx
```

## Compensation Changes

```http
GET /companies/:companyId/comp-changes
POST /companies/:companyId/comp-changes
PATCH /companies/:companyId/comp-changes/:id
DELETE /companies/:companyId/comp-changes/:id
GET /companies/:companyId/comp-changes/export.xlsx
```

---

# Excel Export Rules

## File Type

```txt
.xlsx
```

## Export Scope

Per:

- Company
- Dataset

## Filename Convention

```txt
{CompanyName}_{DatasetType}_YYYYMMDD.xlsx
```

Example:

```txt
ABC병원_입사자정보_20260522.xlsx
```

## Export Method

Generate server-side.

Prefer streaming response.

## Library

```txt
ExcelJS
```

---

# Exact Export Column Order

## 입사자 정보

```txt
이름
주민번호
이메일
입사일
부서
급여
급여 종류
세전/세후
계약직 여부
계약기간
```

## 퇴사자 정보

```txt
이름
주민번호
퇴사일
퇴사사유
```

## 급여변경

```txt
이름
변경 전 급여 종류
변경 전 세전/세후
변경 전 금액
변경 후 급여 종류
변경 후 세전/세후
변경 후 금액
급여 변경일
```

Centralize mappings in ONE module.

Example:

```ts
export const hireExportColumns = [...]
```

Never hardcode columns in controllers.

---

# Frontend Pages

## Public

Optional marketing page

## Auth

- Login
- Forgot password
- Reset password

## Client Portal

- Dashboard
- 입사자 정보
- 퇴사자 정보
- 급여변경

Each requires:

- Table list
- Create form
- Edit form
- Delete action
- Export button

## Firm Portal

- Company list
- Company detail page
- Dataset tabs
- Export controls

---

# Important UI Components

## Required

- Date picker
- Dropdown/select
- Pagination table
- Inline validation errors
- Confirmation modal for delete

## Recommended

- TanStack Table
- shadcn/ui
- React Hook Form

---

# RBAC Middleware Logic

## ClientCompanyAdmin

Allowed ONLY if:

```ts
req.params.companyId === user.companyId
```

Otherwise:

```txt
403 Forbidden
```

## FirmStaff / FirmAdmin

Can access all companies.

---

# Soft Delete Rules

Preferred MVP approach:

```txt
deleted_at TIMESTAMP NULL
```

Never hard-delete sensitive records initially.

Queries should always filter:

```sql
WHERE deleted_at IS NULL
```

---

# Audit Logging

Every create/update/delete/export should create audit log entry.

## Required Fields

```txt
user_id
company_id
entity_type
entity_id
action
metadata
timestamp
```

## Actions

```txt
create
update
delete
export
```

---

# Suggested Development Order

## Phase 1

- DB schema
- Prisma setup
- Auth
- RBAC middleware

## Phase 2

- Companies CRUD
- User management
- Departments

## Phase 3

- Hire intake CRUD
- Termination CRUD
- Comp change CRUD

## Phase 4

- Excel exports

## Phase 5

- Audit logs
- Encryption
- Hardening

## Phase 6

- Tests
- Deployment
- Monitoring

---

# Testing Requirements

## Auth/RBAC

Must test:

- Client cannot access another company
- Firm can access all

## Validation

Must test:

- Contract requires dates
- Amount positive
- 주민번호 regex

## Export

Must test:

- Header order
- Header labels
- Date formatting
- XLSX generation

---

# Recommended Prisma Conventions

## Use UUIDs

```prisma
id String @id @default(uuid())
```

## Add Indexes

Example:

```prisma
@@index([companyId])
```

Add indexes for:

- companyId
- hireDate
- terminationDate
- effectiveDate

---

# Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
SESSION_SECRET=
ENCRYPTION_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SENTRY_DSN=
NODE_ENV=
```

Never commit `.env`.

---

# Recommended Initial MVP Constraints

To move fast:

- Keep department_name as string
- Use enums for fixed dropdowns
- No realtime features
- No websocket infra
- No file uploads
- No microservices
- Monolith architecture preferred initially

---

# Production Readiness Checklist

## Before Production

- HTTPS enabled
- DB backups enabled
- Error monitoring enabled
- Rate limiting enabled
- Encryption verified
- Tenant isolation tested
- Export functionality tested
- Env vars secured
- Cookies secure + HttpOnly
- CSRF enabled

---

# Biggest Risk Areas

## 1. Tenant Isolation Bugs

MOST IMPORTANT.

Always verify:

```txt
company_id scoping
```

on every query.

## 2. 주민번호 Exposure

Avoid:

- Logs
- Analytics
- Console output
- Client-side persistence

## 3. Export Bugs

Excel column order MUST match spec exactly.

## 4. Hardcoded Config

Centralize:

- Export mappings
- Dropdown values
- Labels

---

# Recommended Future Features

## Phase 2 Ideas

- Employee master entity
- Excel upload/import
- Payroll calculator
- MFA
- Approval workflows
- Notifications
- Activity feeds
- Fine-grained permissions
- Dynamic export templates
- Analytics dashboard
- Korean labor compliance engine

---

# Personal Dev Notes

## Architectural Priorities

1. Security
2. Tenant isolation
3. Maintainability
4. Fast iteration
5. Clean exports

## MVP Philosophy

DO NOT over-engineer.

Keep:

- clear services
- strong RBAC
- centralized config
- simple CRUD
- reliable exports

This is essentially:

```txt
multi-tenant secure CRUD + Excel export platform
```

not a full payroll system.

---

# Quick MVP Summary

Core stack:

```txt
Next.js
NestJS
PostgreSQL
Prisma
ExcelJS
Tailwind
```

Core concerns:

```txt
RBAC
tenant isolation
PII security
Excel export correctness
```

Core deliverable:

```txt
secure company-scoped HR intake portal for Korean labor firms
```