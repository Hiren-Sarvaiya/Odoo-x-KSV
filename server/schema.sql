-- ============================================================
-- Procurement & Vendor Management ERP — Database Schema
-- Run once against NeonDB (or any PostgreSQL instance)
-- ============================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('Admin','Procurement Officer','Finance Manager','Vendor','Manager','Approver')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VENDORS
CREATE TABLE IF NOT EXISTS vendors (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  gst_number  TEXT,
  email       TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Blacklisted')),
  rating      NUMERIC(3,2) NOT NULL DEFAULT 4.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RFQS
CREATE TABLE IF NOT EXISTS rfqs (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  deadline         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Draft','Open','Closed','Cancelled')),
  assigned_vendors TEXT[],
  created_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RFQ LINE ITEMS
CREATE TABLE IF NOT EXISTS rfq_line_items (
  id        TEXT PRIMARY KEY,
  rfq_id    TEXT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  product   TEXT NOT NULL,
  quantity  NUMERIC NOT NULL,
  unit      TEXT NOT NULL DEFAULT 'units'
);

-- QUOTATIONS
CREATE TABLE IF NOT EXISTS quotations (
  id           TEXT PRIMARY KEY,
  rfq_id       TEXT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id    TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  delivery_days INTEGER NOT NULL DEFAULT 7,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_by TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0
);

-- QUOTATION LINE ITEMS
CREATE TABLE IF NOT EXISTS quotation_line_items (
  id           SERIAL PRIMARY KEY,
  quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  rfq_item_id  TEXT NOT NULL,
  unit_price   NUMERIC NOT NULL DEFAULT 0
);

-- PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           TEXT PRIMARY KEY,
  po_number    TEXT UNIQUE NOT NULL,
  rfq_id       TEXT REFERENCES rfqs(id) ON DELETE SET NULL,
  quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  vendor_id    TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  subtotal     NUMERIC NOT NULL DEFAULT 0,
  gst          NUMERIC NOT NULL DEFAULT 0,
  total        NUMERIC NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft','Issued','Delivered','Cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   TEXT,
  approved_by  TEXT
);

-- PURCHASE ORDER LINE ITEMS
CREATE TABLE IF NOT EXISTS po_line_items (
  id         SERIAL PRIMARY KEY,
  po_id      TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product    TEXT NOT NULL,
  quantity   NUMERIC NOT NULL,
  unit       TEXT NOT NULL DEFAULT 'units',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total      NUMERIC NOT NULL DEFAULT 0
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  po_id          TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL,
  vendor_id      TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  subtotal       NUMERIC NOT NULL DEFAULT 0,
  gst            NUMERIC NOT NULL DEFAULT 0,
  total          NUMERIC NOT NULL DEFAULT 0,
  due_date       TEXT,
  status         TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Sent','Paid','Overdue')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id         SERIAL PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product    TEXT NOT NULL,
  quantity   NUMERIC NOT NULL,
  unit       TEXT NOT NULL DEFAULT 'units',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total      NUMERIC NOT NULL DEFAULT 0
);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id           TEXT PRIMARY KEY,
  action       TEXT NOT NULL,
  actor_name   TEXT NOT NULL,
  actor_id     TEXT NOT NULL,
  type         TEXT NOT NULL,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_id TEXT
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id        TEXT PRIMARY KEY,
  message   TEXT NOT NULL,
  read      BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type      TEXT NOT NULL
);

-- ── SEED DATA ────────────────────────────────────────────────────────────────

-- Default admin user (password: admin123)
INSERT INTO users (id, name, email, password, role) VALUES
  ('u_admin001',  'Admin User',        'admin@erp.com',    'admin123',  'Admin'),
  ('u_officer01', 'Sarah Johnson',     'officer@erp.com',  'officer123','Procurement Officer'),
  ('u_finance01', 'Michael Chen',      'finance@erp.com',  'finance123','Finance Manager'),
  ('u_vendor01',  'Vendor Portal',     'vendor@erp.com',   'vendor123', 'Vendor'),
  ('u_manager01', 'David Williams',    'manager@erp.com',  'manager123','Manager')
ON CONFLICT (id) DO NOTHING;

-- Sample vendors
INSERT INTO vendors (id, name, category, gst_number, email, phone, address, status, rating) VALUES
  ('v001', 'TechSupply Co.',       'Technology',        'GST22TECH001', 'contact@techsupply.com', '+91-9876543210', '42 Tech Park, Bangalore, KA 560001', 'Active', 4.5),
  ('v002', 'Office Essentials Ltd','Office Supplies',   'GST33OFFI002', 'sales@officeessentials.com', '+91-9876543211', '15 Commercial St, Mumbai, MH 400001', 'Active', 4.2),
  ('v003', 'FastLogistics India',  'Logistics',         'GST44FAST003', 'ops@fastlogistics.com', '+91-9876543212', '8 Industrial Area, Delhi, DL 110001', 'Active', 3.8),
  ('v004', 'Green Energy Solutions','Energy',           'GST55GREE004', 'info@greenenergy.com', '+91-9876543213', '22 Solar Lane, Hyderabad, TS 500001', 'Inactive', 4.0)
ON CONFLICT (id) DO NOTHING;
