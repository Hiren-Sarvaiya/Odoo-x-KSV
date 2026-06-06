-- VendorBridge NeonDB Schema
-- Run this SQL in the Neon SQL Editor to initialize the database

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Procurement Officer', 'Manager', 'Vendor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  gst_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Blacklisted')),
  rating NUMERIC(3,1) NOT NULL DEFAULT 4.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfqs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Quoted', 'Under Review', 'Closed')),
  assigned_vendors TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_line_items (
  id TEXT PRIMARY KEY,
  rfq_id TEXT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'units'
);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  rfq_id TEXT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  delivery_days INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Selected', 'Approved', 'Rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by TEXT NOT NULL DEFAULT '',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quotation_line_items (
  id SERIAL PRIMARY KEY,
  quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  rfq_item_id TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  rfq_id TEXT NOT NULL,
  quotation_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft', 'Issued', 'Acknowledged', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT '',
  approved_by TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS po_line_items (
  id SERIAL PRIMARY KEY,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'units',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'units',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  reference_id TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL
);

-- Seed demo users (passwords are plaintext for hackathon demo)
INSERT INTO users (id, name, email, password, role) VALUES
  ('u1', 'Admin User', 'admin@demo.com', 'admin123', 'Admin'),
  ('u2', 'Alex Chen', 'officer@demo.com', 'officer123', 'Procurement Officer'),
  ('u3', 'Maria Santos', 'manager@demo.com', 'manager123', 'Manager'),
  ('u4', 'TechVision Inc', 'vendor@demo.com', 'vendor123', 'Vendor')
ON CONFLICT (id) DO NOTHING;

-- Seed demo vendors
INSERT INTO vendors (id, name, category, gst_number, email, phone, address, status, rating) VALUES
  ('v1', 'TechVision Inc', 'IT', 'GST001TV2024', 'vendor@demo.com', '+1-555-0101', '123 Tech Park, San Jose, CA', 'Active', 4.5),
  ('v2', 'OfficeMax Pro', 'Office Supplies', 'GST002OM2024', 'sales@officemax.pro', '+1-555-0102', '456 Business Ave, Chicago, IL', 'Active', 4.2),
  ('v3', 'SwiftLogix', 'Logistics', 'GST003SL2024', 'ops@swiftlogix.com', '+1-555-0103', '789 Freight Blvd, Dallas, TX', 'Active', 3.8),
  ('v4', 'FurnCraft Ltd', 'Furniture', 'GST004FC2024', 'info@furncraft.com', '+1-555-0104', '321 Design St, Portland, OR', 'Inactive', 4.0),
  ('v5', 'ProServices Group', 'Services', 'GST005PS2024', 'contact@proservices.com', '+1-555-0105', '654 Service Lane, Austin, TX', 'Active', 4.7)
ON CONFLICT (id) DO NOTHING;
