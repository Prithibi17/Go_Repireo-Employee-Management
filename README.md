# Go_Repireo People

**Learn • Build • Grow**

Official Internal Employee & Intern Management Portal with tamper-proof ID Card issuance, QR verification, Internship Lifecycle management, and Certificate generation for **Go_Repireo**.

---

## 1. Project Overview & Architecture

**Go_Repireo People** is a focused, high-performance web application purpose-built to streamline employee and intern records for Go_Repireo:

1. **Central Person Registry**: Tracks both **Employees** and **Interns** with strict separation between public identity fields and private internal HR records (emergency contacts, internal notes).
2. **Immutable Identity Sequencing**: Concurrency-safe database sequences guarantee sequential, permanent IDs (`GR-EMP-0001`, `GR-INT-0001`) that can never be reused or modified.
3. **Official Vertical ID Cards (54mm × 86mm)**: High-resolution corporate credentials with front/back sides, embedded company logo, barcode/QR verification, PNG/PDF export, and print CSS.
4. **Internship Lifecycle Flow**: `Created` → `Active` → `In Progress` → `Complete Internship` (with date reconciliation) → `Eligible for Certificate` → `Certificate Issued`.
5. **Corporate A4 Landscape Certificates**: High-fidelity completion certificates featuring company stamps, authorized signatures, immutable historical snapshots, and printable/downloadable PDFs.
6. **Cryptographic Tamper-Proof QR Verification**: Dedicated public boundary (`/verify/id/[token]` and `/verify/certificate/[token]`) resolving unpredictable SHA-256 hashed tokens (`id_v_...`, `crt_v_...`). Even revoked credentials continue resolving permanently to display `REVOKED` status.
7. **Role-Based Authorization & RLS**: Strict separation across `OWNER`, `ADMIN`, `PEOPLE_MANAGER`, and `VIEWER`.

---

## 2. Tech Stack

- **Framework**: Next.js (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Document Export**: jsPDF & html2canvas
- **QR Codes**: qrcode (SVG/Canvas generation)
- **Validation**: Zod
- **Database / Backend**: PostgreSQL & Supabase (Row Level Security, pgcrypto, sequences)
- **State & Storage**: Unified DataService with in-memory resilient engine + Supabase migration SQL

---

## 3. Directory Structure

```text
go-repireo-people/
├── public/
│   ├── gorepireo-logo.png               # Official Go_Repireo logo asset
│   └── gorepireo-splash.png
├── src/
│   ├── app/
│   │   ├── (internal)/                  # Protected Internal Routes
│   │   │   ├── layout.tsx               # Sidebar & App shell
│   │   │   ├── dashboard/page.tsx       # Corporate Dashboard & metrics
│   │   │   ├── people/                  # People directory & filtering
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx         # Add Person Form (Dynamic)
│   │   │   │   └── [id]/page.tsx        # Profile, Tabs, Lifecycle
│   │   │   ├── id-cards/                # ID Card Management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── certificates/            # Certificate Management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── settings/                # Settings & Access
│   │   │       ├── page.tsx
│   │   │       └── users/page.tsx
│   │   ├── api/                         # Secure Server APIs & Actions
│   │   │   ├── auth/                    # Login / Logout
│   │   │   ├── people/                  # Creation, Archival
│   │   │   ├── id-cards/                # Issuance, Reissue, Revocation
│   │   │   ├── certificates/            # Issuance, Revocation
│   │   │   ├── internships/             # Completion
│   │   │   └── settings/                # Branding, Departments
│   │   ├── verify/                      # PUBLIC UNRESTRICTED VERIFICATION
│   │   │   ├── id/[verificationCode]/
│   │   │   └── certificate/[verificationCode]/
│   │   ├── login/page.tsx               # Corporate Login Screen
│   │   └── page.tsx                     # Redirect to Dashboard
│   ├── components/
│   │   ├── layout/Sidebar.tsx           # Corporate sidebar navigation
│   │   ├── documents/
│   │   │   ├── IDCardDocument.tsx       # Printable 54x86mm card (Front & Back)
│   │   │   └── CertificateDocument.tsx  # Printable A4 Landscape Certificate
│   │   ├── people/
│   │   │   ├── PersonForm.tsx           # Add Person dynamic form
│   │   │   ├── PersonProfileClient.tsx  # Complete profile & lifecycle modals
│   │   │   └── PeopleFilterBar.tsx      # Multi-field search & filters
│   │   └── ui/
│   │       ├── Badges.tsx               # Status & Type badges, PersonAvatar
│   │       ├── QRCodeImage.tsx          # QR Code renderer
│   │       ├── ConfirmDialog.tsx        # Danger/Action confirmation dialog
│   │       └── StatusBadge.tsx
│   ├── lib/
│   │   ├── auth.ts                      # Session & role helper
│   │   ├── supabase.ts                  # Supabase SSR & Admin clients
│   │   ├── tokens.ts                    # Cryptographic random token & hashing
│   │   └── utils.ts                     # Dates & formatting
│   ├── services/
│   │   └── dataService.ts               # Core Business Logic & Engine
│   ├── types/
│   │   └── index.ts                     # TypeScript Domain Models
│   ├── validators/
│   │   └── index.ts                     # Zod input schemas
│   └── middleware.ts                    # Edge session protection & public bypass
└── supabase/
    ├── migrations/
    │   └── 20261007000000_init_go_repireo.sql  # Full DB schema, RLS & RPCs
    └── seed.sql                         # Dev test seed data
```

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js v18+ (tested on v22)
- npm or pnpm

### 1. Clone & Install
```bash
cd C:\Users\HERMIT-PRITHIBI\.gemini\antigravity\scratch\go-repireo-people
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. First Login & Testing Credentials

The login screen provides role switching for fast role-permission validation:
- **Owner**: `owner@gorepireo.in` (Full access, manage users & roles)
- **Admin**: `admin@gorepireo.in` (Manage people, ID cards, certificates)
- **HR / People Manager**: `manager@gorepireo.in` (Manage people, internships, generate IDs)
- **Viewer**: `viewer@gorepireo.in` (Read-only access)

Any password (e.g. `password123`) is accepted in development mode.

---

## 6. Supabase & Database Migration

To run against a live Supabase or PostgreSQL instance:

1. Open the SQL Editor in your Supabase Dashboard.
2. Execute the migration file:
   `supabase/migrations/20261007000000_init_go_repireo.sql`
3. Optional: Execute `supabase/seed.sql` for sample intern and employee records.

The migration sets up:
- Concurrency-safe atomic sequences: `seq_employee_id`, `seq_intern_id`, `seq_certificate_number`.
- Row Level Security (RLS) on all tables.
- Cryptographic hash storage for tokens (`verification_tokens` table with SHA-256).
- Public RPC functions `get_public_id_verification` and `get_public_certificate_verification` which enforce a strict public boundary, ensuring private HR fields are never leaked.

---

## 7. Complete User Flow Verified

- [x] **Add Person**: Enter details → Select Intern → generates `GR-INT-0003`.
- [x] **Generate ID Card**: Computes cryptographic token `id_v_...` → renders Front & Back of vertical card → download PNG/PDF → print.
- [x] **Public ID Verification**: Visit `/verify/id/[code]` on mobile/desktop → Displays `✓ VERIFIED IDENTITY` with official photo, designation, and validity date.
- [x] **Complete Internship**: Admin opens intern profile → clicks `Complete Internship` → confirms end date & notes → status becomes `COMPLETED`.
- [x] **Issue Certificate**: Generates permanent certificate number (e.g., `GR/INT/2026/0001`) → snapshots role & department → generates certificate QR `crt_v_...` → download A4 Landscape PDF.
- [x] **Public Certificate Verification**: Scan QR → Displays `✓ VERIFIED CERTIFICATE` with tamper-proof snapshot details.
- [x] **Reissue & Revocation**: Revoking an ID or Certificate updates the database and public verification page immediately displays `REVOKED` with safe audit reasons.
