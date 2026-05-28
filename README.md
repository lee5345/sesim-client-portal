# Sesim Labor Firm Client Portal MVP - Standardized Data Intake and Salary Calculators

## Core Product Goal

Secure multi-tenant web application for Korean labor law firms (노무사) to collect standardized HR/payroll-related intake data from client companies and export datasets to Excel.

Primary workflows:

1. New Hire Information - 입사자 정보 입력/관리
2. Termination Information - 퇴사자 정보 입력/관리
3. Salary Change Information - 급여변경 정보 입력/관리

# Core Stack

## App

* Next.js (App Router)
* TypeScript
* Prisma ORM
* PostgreSQL
* Auth.js

## UI

* Tailwind CSS
* shadcn/ui
* TanStack Table
* React Hook Form
* Zod

## Infra

* Vercel
* Neon Postgres
* Sentry

---

# Core Architecture

```txt
Frontend UI
  V
Server Actions / Route Handlers
  V
Business Logic / RBAC / Validation
  V
Prisma ORM
  V
PostgreSQL
```

Monolithic full-stack Next.js architecture.

No microservices.

---

# User Roles

## ClientCompanyAdmin

* CRUD only for own company
* Export own company data

## FirmStaff

* Access all companies
* Edit/export all records

## FirmAdmin (optional)

* User/company management

---

# Tenant Isolation

Every business table must contain:

```txt
company_id
```

All client queries MUST be scoped server-side:

```txt
WHERE company_id = session.company_id
```

Never trust frontend filtering.

---

# Core Modules

## 입사자 정보

Fields:

```txt
이름
주민번호
입사일
부서
급여 종류
세전/세후
급여
계약직 여부
계약기간
```

## 퇴사자 정보

Fields:

```txt
이름
주민번호
퇴사일
퇴사사유
```

## 급여변경

Fields:

```txt
이름
주민번호
변경 전 급여
변경 후 급여
급여 변경일
```

---

# Core Tables

```txt
companies
users
departments

hire_intakes
termination_records
compensation_change_records

audit_logs
```

All tables:

* UUID PKs
* timestamps
* soft delete preferred

---

# Important Enums

## 급여 종류

```txt
연봉
월급
일당
시급
```

## 세전/세후

```txt
세전
세후
```

## 계약직 여부

```txt
정규직
계약직
```

## 퇴사사유

```txt
개인사정
권고사직
계약만료
해고
직접입력
```

---

# Validation Rules

## 계약직

If:

```txt
계약직 여부 === 계약직
```

Then:

```txt
계약기간 required
```

## 급여

```txt
> 0
```

## 주민번호

Basic format validation only.

---

# Security Rules

## 주민번호

Requirements:

* encrypt at rest
* never log plaintext
* mask in UI by default

Example:

```txt
900101-1******
```

## Auth

* HttpOnly cookies
* secure sessions
* CSRF protection
* HTTPS only

---

# Excel Export

## Format

```txt
.xlsx
```

## Filename

```txt
{CompanyName}_{DatasetType}_YYYYMMDD.xlsx
```

## Rules

* server-side generation only
* centralized export mappings
* exact column ordering required

---

# Exact Export Columns

## 입사자 정보

```txt
이름
주민번호
입사일
부서
급여 종류
세전/세후
급여
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
변경 전 급여
변경 후 급여
급여 변경일
```

---

# Suggested App Structure

```txt
/app
  /(marketing)
  /(auth)
  /(client)
  /(firm)

/modules
  /auth
  /companies
  /hire-intakes
  /terminations
  /comp-changes
  /exports

/lib
  /db
  /auth
  /permissions
  /encryption
  /validation
```

---

# Development Order

## Phase 1

* Prisma schema
* Auth.js
* RBAC
* tenant isolation

## Phase 2

* Companies
* Users
* Departments

## Phase 3

* CRUD modules
* tables/forms
* validation

## Phase 4

* Excel exports

## Phase 5

* encryption
* audit logs
* security hardening

## Phase 6

* testing
* deployment
* monitoring

---

# Testing Priorities

## Critical

* tenant isolation
* RBAC
* export correctness
* 주민번호 exposure
* auth/session security

## Must Test

* cross-company access attempts
* malformed form input
* XLSX formatting
* soft delete behavior
* role escalation

---

# Environment Variables

```env
DATABASE_URL=
AUTH_SECRET=
ENCRYPTION_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SENTRY_DSN=
```

Never commit `.env`.

---

# Architectural Priorities

```txt
1. Security
2. Tenant isolation
3. Maintainability
4. Export correctness
5. Fast iteration
```

---

# MVP Constraints

Do NOT add initially:

* Excel import
* realtime features
* websockets
* microservices
* employee portals
* notifications
* workflow engines
* payroll systems
* mobile apps