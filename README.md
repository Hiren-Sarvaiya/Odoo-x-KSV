# VendorBridge — Procurement and Vendor Management ERP

> A clean, minimal, and fully digitized procurement workflow solution for modern organizations. Built with React (Vite), Node.js (Express), and PostgreSQL.

---

## 🚀 Key Features

*   **Vendor Directory**: Manage onboarding status, categories, contact information, and automated ratings.
*   **RFQ Workflow**: Procurement Officers can draft, issue, and assign RFQs to specific vendors with structured line items and deadlines.
*   **Supplier Portal**: Registered vendors can review RFQs and submit itemized digital quotations.
*   **Quotation Comparison**: Built-in side-by-side comparison tables highlighting unit price variations and cost summaries.
*   **Multi-Role Approval Engine**: Managers can review submitted quotations, add remarks, and approve or reject submissions.
*   **Automated Document Generation**: Generating signed Purchase Orders (POs) and Invoices instantly upon approval.
*   **Reports & Analytics**: Visualizing total procurement spend over time, category distributions, and vendor performance tables.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide icons, Recharts
*   **Backend**: Node.js, Express, PG Pool (Client)
*   **Database**: Neon PostgreSQL

---

## ⚙️ Quick Start

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Configure Environment
Create a `.env` file in the project root containing your database connection string:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 3. Database Initialization
Setup schemas and seed initial mock transactional data:
```bash
npm run db:setup
```

### 4. Run Locally
Run both the frontend client and the Express backend server concurrently:
```bash
npm run dev:full
```
*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:3001`

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Primary Actions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `admin123` | Full dashboard visibility and administration |
| **Officer** | `officer@demo.com` | `officer123` | Creates RFQs, compares bids, submits for approval |
| **Manager** | `manager@demo.com` | `manager123` | Reviews, comments, and decides on pending approvals |
| **Vendor 1** | `vendor@demo.com` | `vendor123` | Views assigned RFQs, submits itemized quotes |
| **Vendor 2** | `vendor2@demo.com` | `vendor123` | Competing vendor dashboard and quote submission |

---

## 📁 Project Structure

```text
├── server/
│   ├── db.js          # PostgreSQL database connection pool
│   ├── index.js       # Express server API endpoints
│   ├── schema.sql     # Database table schemas
│   └── setup-db.js    # DB initialization and data seeder script
├── src/
│   ├── components/    # Reusable UI components & layouts (Sidebar, Navbar)
│   ├── contexts/      # Shared Auth & transactional React context states
│   ├── lib/           # Utility helpers & API client mappings
│   ├── pages/         # Dashboard, RFQ, PO, Invoice, Approvals, & Reports pages
│   ├── types/         # TypeScript definitions
│   └── main.tsx       # App entry point
```
