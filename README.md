# VendorBridge — Procurement & Vendor Management ERP

> A complete, role-based procurement ERP system for digitizing the end-to-end procurement lifecycle — from RFQ creation and vendor quotations through multi-tier approvals, purchase orders, and invoice management.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🏢 **Vendor Management** | Onboard, search, filter, and rate vendors by category and status |
| 📋 **RFQ Workflow** | Create RFQs with line items, deadlines, and assigned vendors |
| 💬 **Quotation Portal** | Vendors submit itemized quotations; officers compare side-by-side |
| ✅ **Approval Engine** | Manager review with remarks, approve/reject, with full audit trail |
| 📦 **Purchase Orders** | Auto-generated POs with GST calculation on approval |
| 🧾 **Invoice Management** | Generate, send, and track invoices with PDF download support |
| 📊 **Reports & Analytics** | Monthly spend charts, category pie charts, vendor performance tables |
| 🔔 **Activity Logs & Notifications** | Real-time bell notifications and a full audit log feed |
| 👥 **User Management** | Admin can create and manage users across all roles |

---

## 🧑‍💼 Roles & Permissions

| Role | Key Capabilities |
|------|----------------|
| **Admin** | Full access — vendors, users, all reports, all documents |
| **Procurement Officer** | Create RFQs, compare quotations, generate POs |
| **Manager** | Approve/reject quotations, view reports |
| **Vendor** | View assigned RFQs, submit and track own quotations |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (build & dev server)
- Tailwind CSS + shadcn/ui (Radix UI primitives)
- React Router v7
- React Hook Form + Zod
- Recharts (bar charts, pie charts)
- Lucide React icons
- Sonner (toasts)
- Inter font (Google Fonts)

**Backend**
- Node.js + Express
- `pg` (PostgreSQL client pool)

**Database**
- Neon PostgreSQL (serverless)

---

## ⚙️ Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd Odoo-x-KSV

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
VITE_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

> **Note:** The same `VITE_DATABASE_URL` is read by both the Vite frontend proxy and the Express server.

### 3. Initialize the Database

This creates all tables and seeds demo data:

```bash
npm run db:setup
```

### 4. Start Development Server

```bash
# Start frontend (port 5173) + backend (port 3001) together
npm run dev:full

# Or individually:
npm run dev          # frontend only
npm run dev:server   # backend only
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `admin123` |
| Procurement Officer | `officer@demo.com` | `officer123` |
| Manager | `manager@demo.com` | `manager123` |
| Vendor 1 | `vendor@demo.com` | `vendor123` |
| Vendor 2 | `vendor2@demo.com` | `vendor123` |

---

## 📁 Full Project Structure

```
Odoo-x-KSV/
│
├── .env                        # Environment variables (DATABASE_URL)
├── index.html                  # Vite HTML entry point
├── package.json                # Frontend deps & npm scripts
├── tailwind.config.js          # Tailwind configuration + Inter font
├── tsconfig.app.json           # TypeScript config (app)
├── tsconfig.json               # TypeScript root config
├── vite.config.ts              # Vite bundler config
│
├── server/                     # Node.js Express backend
│   ├── db.js                   # pg.Pool connection (reads from .env)
│   ├── index.js                # All REST API endpoints (CRUD + auth)
│   ├── schema.sql              # Raw SQL schema (reference)
│   ├── setup-db.js             # DB seeder — run once to initialize
│   └── package.json            # Backend-specific dependencies
│
└── src/                        # React frontend source
    │
    ├── App.tsx                 # Root component — routes & Protected wrapper
    ├── App.css                 # (minimal, styles live in index.css)
    ├── main.tsx                # React DOM entry point
    ├── index.css               # Global styles, Tailwind base, Inter font import
    ├── vite-env.d.ts           # Vite env type declarations
    │
    ├── types/
    │   └── index.ts            # TypeScript interfaces: Vendor, RFQ, Quotation,
    │                           #   PurchaseOrder, Invoice, ActivityLog, Approval, Role
    │
    ├── contexts/
    │   ├── AuthContext.tsx     # Login, signup, logout, forgot password, RequireAuth HOC
    │   └── DataContext.tsx     # All CRUD ops: upsert, remove, submitForApproval,
    │                           #   decideApproval, generateInvoice, addLog
    │
    ├── lib/
    │   ├── api.ts              # db object — typed wrappers over all backend REST calls
    │   ├── db.ts               # Neon serverless DB client (direct SQL, fallback)
    │   ├── storage.ts          # Legacy localStorage helpers (not active in prod)
    │   ├── schema.sql          # Schema reference copy
    │   └── utils.ts            # cn() class merging utility
    │
    ├── components/
    │   │
    │   ├── layout/
    │   │   ├── AppLayout.tsx   # Root layout shell: Sidebar + Navbar + <Outlet />
    │   │   ├── Sidebar.tsx     # Collapsible dark sidebar, role-filtered nav links
    │   │   └── Navbar.tsx      # Top bar: notifications bell, user avatar dropdown
    │   │
    │   └── ui/                 # 47 shadcn/ui components (Radix UI based)
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── table.tsx
    │       ├── badge.tsx
    │       ├── toast.tsx
    │       ├── chart.tsx       # Recharts wrapper
    │       └── ...             # (accordion, avatar, calendar, checkbox, etc.)
    │
    └── pages/
        ├── Login.tsx           # Sign in / sign up, role selector, demo shortcuts
        ├── Dashboard.tsx       # Stat cards, quick actions, recent POs & invoices
        │
        ├── Vendors.tsx         # Vendor list, search, add/edit/delete modal
        ├── Users.tsx           # User management (Admin only) — add/edit/delete
        │
        ├── RFQs.tsx            # RFQ list with status badges and filters
        ├── RFQCreate.tsx       # Create RFQ: title, line items, deadline, vendor assign
        ├── RFQDetail.tsx       # RFQ detail: view quotations, select winner
        │
        ├── QuotationSubmit.tsx     # Vendor view: fill unit prices per line item
        ├── QuotationComparison.tsx # Officer view: side-by-side quotation table
        ├── Quotations.tsx          # All quotations list (Officer/Manager)
        ├── MyQuotations.tsx        # Vendor's own submitted quotations
        │
        ├── Approvals.tsx       # Manager: pending/decided approvals with remarks
        │
        ├── PurchaseOrders.tsx  # PO list with status
        ├── PODetail.tsx        # PO detail: line items, generate invoice button
        │
        ├── Invoices.tsx        # Invoice list
        ├── InvoiceDetail.tsx   # Invoice detail: print, PDF download, email send
        │
        ├── ActivityLogs.tsx    # Full audit feed (all roles, filtered by role)
        └── Reports.tsx         # Charts: monthly spend, category pie, vendor table
```

---

## 🔄 Core Procurement Workflow

```
[Officer] Create RFQ → Assign Vendors
        ↓
[Vendor] View RFQ → Submit Quotation
        ↓
[Officer] Compare Quotations → Select Winner → Submit for Approval
        ↓
[Manager] Review → Approve / Reject
        ↓ (if Approved)
[System] Auto-generate Purchase Order
        ↓
[Officer] Generate Invoice from PO
        ↓
[Officer] Send Invoice → Track Payment Status
```

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend dev server on port 5173 |
| `npm run dev:server` | Start Express API server on port 3001 |
| `npm run dev:full` | Start both frontend + backend concurrently |
| `npm run db:setup` | Initialize DB schema and seed demo data |
| `npm run build` | Production build (TypeScript + Vite) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check without emit |
| `npm run preview` | Preview production build locally |

---

## 🗄️ Database Schema (Overview)

| Table | Purpose |
|-------|---------|
| `users` | Authentication and role management |
| `vendors` | Vendor directory with ratings and status |
| `rfqs` | Request for Quotations with deadlines |
| `rfq_line_items` | Products/services within each RFQ |
| `quotations` | Vendor responses to RFQs |
| `quotation_line_items` | Unit prices per line item per quotation |
| `approvals` | Manager approval records with remarks |
| `purchase_orders` | Auto-generated POs from approved quotations |
| `po_line_items` | Line items on each PO |
| `invoices` | Invoices generated from POs |
| `invoice_line_items` | Line items on each invoice |
| `activity_logs` | Full audit trail of all system actions |
| `notifications` | In-app notification messages |
