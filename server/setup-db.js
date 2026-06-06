import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('CRITICAL: DATABASE_URL or VITE_DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const statements = [
  // Drop checks to avoid conflict issues
  `ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check`,
  `ALTER TABLE IF EXISTS rfqs DROP CONSTRAINT IF EXISTS rfqs_status_check`,
  `ALTER TABLE IF EXISTS quotations DROP CONSTRAINT IF EXISTS quotations_status_check`,
  `ALTER TABLE IF EXISTS purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check`,
  `ALTER TABLE IF EXISTS invoices DROP CONSTRAINT IF EXISTS invoices_status_check`,
  `ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS attachments TEXT`,

  // Create tables in order
  `CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('Admin','Procurement Officer','Finance Manager','Vendor','Manager','Approver')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS vendors (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    gst_number  TEXT,
    email       TEXT NOT NULL,
    phone       TEXT,
    address     TEXT,
    status      TEXT NOT NULL DEFAULT 'Active',
    rating      NUMERIC(3,2) NOT NULL DEFAULT 4.0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS rfqs (
    id               TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    description      TEXT,
    deadline         TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'Open',
    assigned_vendors TEXT[],
    created_by       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attachments      TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS rfq_line_items (
    id        TEXT PRIMARY KEY,
    rfq_id    TEXT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    product   TEXT NOT NULL,
    quantity  NUMERIC NOT NULL,
    unit      TEXT NOT NULL DEFAULT 'units'
  )`,

  `CREATE TABLE IF NOT EXISTS quotations (
    id           TEXT PRIMARY KEY,
    rfq_id       TEXT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    vendor_id    TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    delivery_days INTEGER NOT NULL DEFAULT 7,
    notes        TEXT,
    status       TEXT NOT NULL DEFAULT 'Pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_by TEXT,
    total_amount NUMERIC NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS quotation_line_items (
    id           SERIAL PRIMARY KEY,
    quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    rfq_item_id  TEXT NOT NULL,
    unit_price   NUMERIC NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS approvals (
    id           TEXT PRIMARY KEY,
    quotation_id TEXT REFERENCES quotations(id) ON DELETE CASCADE,
    rfq_id       TEXT REFERENCES rfqs(id) ON DELETE CASCADE,
    rfq_title    TEXT NOT NULL,
    vendor_name  TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    submitted_by TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    remarks      TEXT,
    decided_at   TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id           TEXT PRIMARY KEY,
    po_number    TEXT UNIQUE NOT NULL,
    rfq_id       TEXT,
    quotation_id TEXT,
    vendor_id    TEXT,
    subtotal     NUMERIC NOT NULL DEFAULT 0,
    gst          NUMERIC NOT NULL DEFAULT 0,
    total        NUMERIC NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'Issued',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by   TEXT,
    approved_by  TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS po_line_items (
    id         SERIAL PRIMARY KEY,
    po_id      TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product    TEXT NOT NULL,
    quantity   NUMERIC NOT NULL,
    unit       TEXT NOT NULL DEFAULT 'units',
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total      NUMERIC NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS invoices (
    id             TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    po_id          TEXT,
    vendor_id      TEXT,
    subtotal       NUMERIC NOT NULL DEFAULT 0,
    gst            NUMERIC NOT NULL DEFAULT 0,
    total          NUMERIC NOT NULL DEFAULT 0,
    due_date       TEXT,
    status         TEXT NOT NULL DEFAULT 'Draft',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS invoice_line_items (
    id         SERIAL PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product    TEXT NOT NULL,
    quantity   NUMERIC NOT NULL,
    unit       TEXT NOT NULL DEFAULT 'units',
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total      NUMERIC NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS activity_logs (
    id           TEXT PRIMARY KEY,
    action       TEXT NOT NULL,
    actor_name   TEXT NOT NULL,
    actor_id     TEXT NOT NULL,
    type         TEXT NOT NULL,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reference_id TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id        TEXT PRIMARY KEY,
    message   TEXT NOT NULL,
    read      BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type      TEXT NOT NULL
  )`,

  // Clean old data to avoid duplicates/mismatch
  `DELETE FROM activity_logs`,
  `DELETE FROM notifications`,
  `DELETE FROM invoice_line_items`,
  `DELETE FROM invoices`,
  `DELETE FROM po_line_items`,
  `DELETE FROM purchase_orders`,
  `DELETE FROM approvals`,
  `DELETE FROM quotation_line_items`,
  `DELETE FROM quotations`,
  `DELETE FROM rfq_line_items`,
  `DELETE FROM rfqs`,
  `DELETE FROM vendors`,
  `DELETE FROM users`,

  // Seed exact users
  `INSERT INTO users (id, name, email, password, role) VALUES
    ('1', 'Admin User',   'admin@demo.com',   'admin123',   'Admin'),
    ('2', 'John Officer', 'officer@demo.com', 'officer123', 'Procurement Officer'),
    ('3', 'Sara Manager', 'manager@demo.com', 'manager123', 'Manager'),
    ('4', 'Vendor One',   'vendor@demo.com',  'vendor123',  'Vendor'),
    ('5', 'Vendor Two',   'vendor2@demo.com', 'vendor123',  'Vendor')`,

  // Seed exact vendors
  `INSERT INTO vendors (id, name, category, gst_number, email, phone, address, status, rating, created_at) VALUES
    ('v1', 'TechSupply Co',    'IT',              '29ABCDE1234F1Z5', 'vendor@demo.com',    '9876543210', '123 Tech Park, San Jose, CA',   'Active', 4.5, '2025-01-14T09:00:00Z'),
    ('v2', 'OfficeWorld',      'Office Supplies', '27XYZAB5678G2H6', 'vendor2@demo.com',   '9123456780', '456 Business Ave, Chicago, IL', 'Active', 4.0, '2025-01-15T09:00:00Z'),
    ('v3', 'FastLogistics',    'Logistics',       '24PQRST9012H3I7', 'ops@fastlog.com',     '9988776655', '789 Freight Blvd, Dallas, TX',  'Active', 3.8, '2025-01-16T09:00:00Z'),
    ('v4', 'FurniturePlus',    'Furniture',       '22LMNOP3456J4K8', 'sales@furnplus.com',  '9871234560', '321 Design St, Portland, OR',   'Inactive', 4.2, '2025-01-17T09:00:00Z'),
    ('v5', 'ServicePro',       'Services',        '20UVWXY7890K5L9', 'hello@servicepro.com', '9765432100', '654 Service Lane, Austin, TX',  'Active', 4.7, '2025-01-18T09:00:00Z')`,

  // Seed exact RFQs
  `INSERT INTO rfqs (id, title, description, deadline, status, assigned_vendors, created_by, created_at) VALUES
    ('rfq1', 'Laptop Procurement Q1', 'Need 20 laptops for dev team', '2025-02-28', 'Quoted', ARRAY['v1', 'v2'], '2', '2025-01-15T10:00:00Z'),
    ('rfq2', 'Office Chair Order',    'Ergonomic chairs for office',  '2025-03-10', 'Approved', ARRAY['v4', 'v5'], '2', '2025-01-18T11:00:00Z'),
    ('rfq3', 'Annual IT Support',     '12 month IT support contract', '2025-03-31', 'Open', ARRAY['v3', 'v5'], '2', '2025-01-20T09:00:00Z'),
    ('rfq4', 'Printer Cartridge Supply', 'Monthly cartridge supply for all printers', '2025-04-15', 'Open', ARRAY['v1', 'v2', 'v3'], '2', '2025-01-22T09:00:00Z'),
    ('rfq5', 'Security Software Licenses', 'Antivirus for 100 machines', '2025-04-30', 'Quoted', ARRAY['v1', 'v5'], '2', '2025-01-23T10:00:00Z'),
    ('rfq6', 'Canteen Furniture', 'Tables and chairs for new canteen', '2025-05-01', 'Under Review', ARRAY['v4', 'v5'], '2', '2025-01-24T11:00:00Z'),
    ('rfq7', 'Network Switches Upgrade', 'Replace old switches across 3 floors', '2025-05-15', 'Approved', ARRAY['v1', 'v3'], '2', '2025-01-25T08:00:00Z'),
    ('rfq8', 'Cleaning Services Contract', '6 month housekeeping contract', '2025-03-01', 'Closed', ARRAY['v3', 'v5'], '2', '2025-01-10T08:00:00Z')`,

  // Seed exact RFQ line items
  `INSERT INTO rfq_line_items (id, rfq_id, product, quantity, unit) VALUES
    ('i1', 'rfq1', 'Dell Laptop 16GB', 10, 'pcs'),
    ('i2', 'rfq1', 'HP Laptop 8GB', 10, 'pcs'),
    ('i3', 'rfq2', 'Ergonomic Chair', 25, 'pcs'),
    ('i4', 'rfq3', 'IT Support Contract', 1, 'contract'),
    ('i5', 'rfq4', 'Black Cartridge', 50, 'pcs'),
    ('i6', 'rfq4', 'Color Cartridge', 30, 'pcs'),
    ('i7', 'rfq5', 'Antivirus License', 100, 'pcs'),
    ('i8', 'rfq6', 'Dining Table', 10, 'pcs'),
    ('i9', 'rfq6', 'Chair', 40, 'pcs'),
    ('i10', 'rfq7', '24-Port Switch', 6, 'pcs'),
    ('i11', 'rfq8', 'Cleaning Service', 6, 'months')`,

  // Seed exact quotations
  `INSERT INTO quotations (id, rfq_id, vendor_id, delivery_days, notes, status, submitted_at, submitted_by, total_amount) VALUES
    ('q1', 'rfq1', 'v1', 7, 'Includes warranty', 'Selected', '2025-01-17T14:00:00Z', '4', 1100000),
    ('q2', 'rfq1', 'v2', 10, 'Bulk discount available', 'Submitted', '2025-01-17T16:00:00Z', '5', 1110000),
    ('q3', 'rfq2', 'v4', 14, 'Premium quality', 'Approved', '2025-01-20T10:00:00Z', '4', 212500),
    ('q4', 'rfq5', 'v1', 3, 'Includes installation support', 'Submitted', '2025-01-24T10:00:00Z', '4', 120000),
    ('q5', 'rfq5', 'v5', 5, 'Volume discount applied', 'Submitted', '2025-01-24T12:00:00Z', '4', 110000),
    ('q6', 'rfq6', 'v4', 21, 'Teak wood finish', 'Selected', '2025-01-25T09:00:00Z', '4', 208000),
    ('q7', 'rfq6', 'v5', 18, 'Metal frame design', 'Submitted', '2025-01-25T11:00:00Z', '4', 211000),
    ('q8', 'rfq7', 'v1', 7, 'Cisco brand', 'Approved', '2025-01-26T10:00:00Z', '4', 111000),
    ('q9', 'rfq8', 'v3', 0, 'Starts immediately', 'Submitted', '2025-01-11T09:00:00Z', '4', 270000)`,

  // Seed exact quotation line items
  `INSERT INTO quotation_line_items (quotation_id, rfq_item_id, unit_price) VALUES
    ('q1', 'i1', 65000),
    ('q1', 'i2', 45000),
    ('q2', 'i1', 68000),
    ('q2', 'i2', 43000),
    ('q3', 'i3', 8500),
    ('q4', 'i7', 1200),
    ('q5', 'i7', 1100),
    ('q6', 'i8', 12000),
    ('q6', 'i9', 2200),
    ('q7', 'i8', 13500),
    ('q7', 'i9', 1900),
    ('q8', 'i10', 18500),
    ('q9', 'i11', 45000)`,

  // Seed approvals
  `INSERT INTO approvals (id, quotation_id, rfq_id, rfq_title, vendor_name, total_amount, submitted_by, status, remarks, decided_at) VALUES
    ('a1', 'q3', 'rfq2', 'Office Chair Order', 'FurniturePlus', 212500, 'John Officer', 'approved', 'Good pricing', '2025-01-21T11:00:00Z'),
    ('a2', 'q6', 'rfq6', 'Canteen Furniture', 'FurniturePlus', 208000, 'John Officer', 'pending', '', NULL),
    ('a3', 'q8', 'rfq7', 'Network Switches Upgrade', 'TechSupply Co', 111000, 'John Officer', 'approved', 'Good deal', '2025-01-27T10:00:00Z')`,

  // Seed purchase orders
  `INSERT INTO purchase_orders (id, po_number, rfq_id, quotation_id, vendor_id, subtotal, gst, total, status, created_at, created_by, approved_by) VALUES
    ('po1', 'PO-20250121-001', 'rfq2', 'q3', 'v4', 212500, 38250, 250750, 'Issued', '2025-01-21T12:00:00Z', 'John Officer', 'Sara Manager'),
    ('po2', 'PO-20250127-002', 'rfq7', 'q8', 'v1', 111000, 19980, 130980, 'Acknowledged', '2025-01-27T11:00:00Z', 'John Officer', 'Sara Manager'),
    ('po3', 'PO-20250110-003', 'rfq8', 'q9', 'v3', 270000, 48600, 318600, 'Completed', '2025-01-11T10:00:00Z', 'John Officer', 'Sara Manager')`,

  // Seed purchase order line items
  `INSERT INTO po_line_items (po_id, product, quantity, unit, unit_price, total) VALUES
    ('po1', 'Ergonomic Chair', 25, 'pcs', 8500, 212500),
    ('po2', '24-Port Switch', 6, 'pcs', 18500, 111000),
    ('po3', 'Cleaning Service', 6, 'months', 45000, 270000)`,

  // Seed invoices
  `INSERT INTO invoices (id, invoice_number, po_id, vendor_id, subtotal, gst, total, due_date, status, created_at) VALUES
    ('inv1', 'INV-20250121-001', 'po1', 'v4', 212500, 38250, 250750, '2025-02-21', 'Sent', '2025-01-21T13:00:00Z'),
    ('inv2', 'INV-20250127-002', 'po2', 'v1', 111000, 19980, 130980, '2025-02-27', 'Paid', '2025-01-27T12:00:00Z'),
    ('inv3', 'INV-20250111-003', 'po3', 'v3', 270000, 48600, 318600, '2025-02-10', 'Overdue', '2025-01-11T11:00:00Z')`,

  // Seed invoice line items
  `INSERT INTO invoice_line_items (invoice_id, product, quantity, unit, unit_price, total) VALUES
    ('inv1', 'Ergonomic Chair', 25, 'pcs', 8500, 212500),
    ('inv2', '24-Port Switch', 6, 'pcs', 18500, 111000),
    ('inv3', 'Cleaning Service', 6, 'months', 45000, 270000)`,

  // Seed activity logs
  `INSERT INTO activity_logs (id, action, reference_id, actor_name, actor_id, type, timestamp) VALUES
    ('l1',  'RFQ Created',          'rfq1',  'John Officer',  '2', 'rfq',       '2025-01-15T10:00:00Z'),
    ('l2',  'Vendor Added',         'v1',    'Admin User',    '1', 'vendor',    '2025-01-14T09:00:00Z'),
    ('l3',  'Quotation Submitted',  'q1',    'Vendor One',    '4', 'quotation', '2025-01-17T14:00:00Z'),
    ('l4',  'Quotation Submitted',  'q2',    'Vendor Two',    '5', 'quotation', '2025-01-17T16:00:00Z'),
    ('l5',  'RFQ Created',          'rfq2',  'John Officer',  '2', 'rfq',       '2025-01-18T11:00:00Z'),
    ('l6',  'Quotation Approved',   'q3',    'Sara Manager',  '3', 'approval',  '2025-01-21T11:00:00Z'),
    ('l7',  'PO Generated',         'po1',   'System',        'system', 'po',   '2025-01-21T12:00:00Z'),
    ('l8',  'Invoice Generated',    'inv1',  'John Officer',  '2', 'invoice',   '2025-01-21T13:00:00Z'),
    ('l9',  'Invoice Sent',         'inv1',  'John Officer',  '2', 'invoice',   '2025-01-21T14:00:00Z'),
    ('l10', 'RFQ Created',          'rfq3',  'John Officer',  '2', 'rfq',       '2025-01-20T09:00:00Z'),
    ('l11', 'RFQ Created',          'rfq4',  'John Officer',  '2', 'rfq',       '2025-01-22T09:00:00Z'),
    ('l12', 'RFQ Created',          'rfq5',  'John Officer',  '2', 'rfq',       '2025-01-23T10:00:00Z'),
    ('l13', 'Quotation Submitted',  'q4',    'Vendor One',    '4', 'quotation', '2025-01-24T10:00:00Z'),
    ('l14', 'Quotation Submitted',  'q5',    'Vendor Two',    '5', 'quotation', '2025-01-24T12:00:00Z'),
    ('l15', 'Quotation Selected',   'q6',    'John Officer',  '2', 'quotation', '2025-01-25T13:00:00Z'),
    ('l16', 'Approval Pending',     'a2',    'System',        'system', 'approval', '2025-01-25T13:01:00Z'),
    ('l17', 'Quotation Approved',   'q8',    'Sara Manager',  '3', 'approval',  '2025-01-27T10:00:00Z'),
    ('l18', 'PO Generated',         'po2',   'System',        'system', 'po',   '2025-01-27T11:00:00Z'),
    ('l19', 'Invoice Generated',    'inv2',  'John Officer',  '2', 'invoice',   '2025-01-27T12:00:00Z'),
    ('l20', 'Invoice Paid',         'inv2',  'Sara Manager',  '3', 'invoice',   '2025-02-01T10:00:00Z')`,

  // Seed notifications matching the logs
  `INSERT INTO notifications (id, message, read, timestamp, type) VALUES
    ('l1_n', 'RFQ Laptop Procurement Q1 created', false, '2025-01-15T10:00:00Z', 'rfq'),
    ('l16_n', 'Canteen Furniture sent for manager approval', false, '2025-01-25T13:01:00Z', 'approval')`
];

async function main() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    for (const sql of statements) {
      try {
        await client.query(sql);
        const preview = sql.trim().split('\n')[0].slice(0, 60);
        console.log('  ✓', preview);
      } catch (err) {
        console.warn('  ⚠ Skipped (non-fatal):', err.message.split('\n')[0]);
      }
    }
    console.log('\n✅ Database schema ready with seed data!');
  } finally {
    client.release();
    await pool.end();
  }
}

main();
