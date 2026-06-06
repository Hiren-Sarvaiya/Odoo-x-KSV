import express from 'express';
import cors from 'cors';
import { query, pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to log audit logs automatically inside DB
async function insertAuditLog(action, actorName, actorId, type, referenceId = null) {
  try {
    const logId = 'log_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const timestamp = new Date().toISOString();
    await query(
      `INSERT INTO activity_logs (id, action, actor_name, actor_id, type, timestamp, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [logId, action, actorName, actorId, type, timestamp, referenceId]
    );
    
    // Also push a notification for relevant actions
    await query(
      `INSERT INTO notifications (id, message, read, timestamp, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [logId + '_n', action, false, timestamp, type]
    );
  } catch (err) {
    console.error('Error logging audit activity:', err);
  }
}

// ─── AUTH ENDPOINTS ─────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const rows = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    await insertAuditLog(`User ${user.name} logged in`, user.name, user.id, 'auth');
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check existing
    const check = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    const id = 'u_' + Date.now();
    await query(
      'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
      [id, name, email, password, role]
    );
    
    await insertAuditLog(`New user account created: ${name} (${role})`, name, id, 'auth');
    res.status(201).json({ id, name, email, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const rows = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    const actorName = user ? user.name : 'Unknown User';
    const actorId = user ? user.id : 'unknown';
    
    await insertAuditLog(`Password reset link requested for email: ${email}`, actorName, actorId, 'auth');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  try {
    const rows = await query('SELECT id, name, email, role FROM users ORDER BY created_at');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { id, name, email, password, role } = req.body;
  try {
    await query(
      `INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name=$2, email=$3, password=$4, role=$5`,
      [id, name, email, password, role]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── VENDOR ENDPOINTS ───────────────────────────────────────────────────────

app.get('/api/vendors', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM vendors ORDER BY created_at');
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      gstNumber: r.gst_number,
      email: r.email,
      phone: r.phone,
      address: r.address,
      status: r.status,
      rating: Number(r.rating),
      createdAt: r.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vendors', async (req, res) => {
  const { id, name, category, gstNumber, email, phone, address, status, rating, createdAt } = req.body;
  try {
    await query(
      `INSERT INTO vendors (id, name, category, gst_number, email, phone, address, status, rating, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET name=$2, category=$3, gst_number=$4, email=$5, phone=$6, address=$7, status=$8, rating=$9`,
      [id, name, category, gstNumber, email, phone || '', address || '', status, rating || 4.0, createdAt || new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM vendors WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── RFQ ENDPOINTS ──────────────────────────────────────────────────────────

app.get('/api/rfqs', async (req, res) => {
  try {
    const rfqs = await query('SELECT * FROM rfqs ORDER BY created_at DESC');
    const items = await query('SELECT * FROM rfq_line_items');
    
    const formatted = rfqs.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      deadline: r.deadline,
      status: r.status,
      assignedVendors: r.assigned_vendors || [],
      createdBy: r.created_by,
      createdAt: r.created_at,
      attachments: r.attachments ? JSON.parse(r.attachments) : [],
      lineItems: items
        .filter(li => li.rfq_id === r.id)
        .map(li => ({
          id: li.id,
          product: li.product,
          quantity: Number(li.quantity),
          unit: li.unit
        }))
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rfqs', async (req, res) => {
  const { id, title, description, deadline, status, assignedVendors, createdBy, createdAt, lineItems, attachments } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO rfqs (id, title, description, deadline, status, assigned_vendors, created_by, created_at, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET title=$2, description=$3, deadline=$4, status=$5, assigned_vendors=$6, attachments=$9`,
      [id, title, description || '', deadline, status, assignedVendors, createdBy, createdAt || new Date().toISOString(), JSON.stringify(attachments || [])]
    );
    
    await client.query('DELETE FROM rfq_line_items WHERE rfq_id = $1', [id]);
    for (const li of lineItems) {
      await client.query(
        'INSERT INTO rfq_line_items (id, rfq_id, product, quantity, unit) VALUES ($1, $2, $3, $4, $5)',
        [li.id, id, li.product, li.quantity, li.unit || 'units']
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── QUOTATION ENDPOINTS ────────────────────────────────────────────────────

app.get('/api/quotations', async (req, res) => {
  try {
    const qRows = await query('SELECT * FROM quotations ORDER BY submitted_at DESC');
    const items = await query('SELECT * FROM quotation_line_items');
    
    const formatted = qRows.map(r => ({
      id: r.id,
      rfqId: r.rfq_id,
      vendorId: r.vendor_id,
      deliveryDays: Number(r.delivery_days),
      notes: r.notes,
      status: r.status,
      submittedAt: r.submitted_at,
      submittedBy: r.submitted_by,
      totalAmount: Number(r.total_amount),
      lineItems: items
        .filter(li => li.quotation_id === r.id)
        .map(li => ({
          rfqItemId: li.rfq_item_id,
          unitPrice: Number(li.unit_price)
        }))
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotations', async (req, res) => {
  const { id, rfqId, vendorId, deliveryDays, notes, status, submittedAt, submittedBy, totalAmount, lineItems } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO quotations (id, rfq_id, vendor_id, delivery_days, notes, status, submitted_at, submitted_by, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET delivery_days=$4, notes=$5, status=$6, total_amount=$9`,
      [id, rfqId, vendorId, deliveryDays, notes || '', status, submittedAt || new Date().toISOString(), submittedBy, totalAmount]
    );
    
    await client.query('DELETE FROM quotation_line_items WHERE quotation_id = $1', [id]);
    for (const li of lineItems) {
      await client.query(
        'INSERT INTO quotation_line_items (quotation_id, rfq_item_id, unit_price) VALUES ($1, $2, $3)',
        [id, li.rfqItemId, li.unitPrice]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── APPROVALS ENDPOINTS ───────────────────────────────────────────────────

app.get('/api/approvals', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM approvals ORDER BY status = \'pending\' DESC, decided_at DESC');
    res.json(rows.map(r => ({
      id: r.id,
      quotationId: r.quotation_id,
      rfqId: r.rfq_id,
      rfqTitle: r.rfq_title,
      vendorName: r.vendor_name,
      totalAmount: Number(r.total_amount),
      submittedBy: r.submitted_by,
      status: r.status,
      remarks: r.remarks,
      decidedAt: r.decided_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/approvals', async (req, res) => {
  const { id, quotationId, rfqId, rfqTitle, vendorName, totalAmount, submittedBy, status, remarks, decidedAt } = req.body;
  try {
    await query(
      `INSERT INTO approvals (id, quotation_id, rfq_id, rfq_title, vendor_name, total_amount, submitted_by, status, remarks, decided_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET status=$8, remarks=$9, decided_at=$10`,
      [id, quotationId, rfqId, rfqTitle, vendorName, totalAmount, submittedBy, status, remarks || '', decidedAt || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PURCHASE ORDER ENDPOINTS ───────────────────────────────────────────────

app.get('/api/purchase-orders', async (req, res) => {
  try {
    const poRows = await query('SELECT * FROM purchase_orders ORDER BY created_at DESC');
    const items = await query('SELECT * FROM po_line_items');
    
    const formatted = poRows.map(r => ({
      id: r.id,
      poNumber: r.po_number,
      rfqId: r.rfq_id,
      quotationId: r.quotation_id,
      vendorId: r.vendor_id,
      subtotal: Number(r.subtotal),
      gst: Number(r.gst),
      total: Number(r.total),
      status: r.status,
      createdAt: r.created_at,
      createdBy: r.created_by,
      approvedBy: r.approved_by,
      lineItems: items
        .filter(li => li.po_id === r.id)
        .map(li => ({
          product: li.product,
          quantity: Number(li.quantity),
          unit: li.unit,
          unitPrice: Number(li.unit_price),
          total: Number(li.total)
        }))
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  const { id, poNumber, rfqId, quotationId, vendorId, subtotal, gst, total, status, createdAt, createdBy, approvedBy, lineItems } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO purchase_orders (id, po_number, rfq_id, quotation_id, vendor_id, subtotal, gst, total, status, created_at, created_by, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET status=$9, approved_by=$12`,
      [id, poNumber, rfqId, quotationId, vendorId, subtotal, gst, total, status, createdAt || new Date().toISOString(), createdBy, approvedBy || null]
    );
    
    await client.query('DELETE FROM po_line_items WHERE po_id = $1', [id]);
    for (const li of lineItems) {
      await client.query(
        'INSERT INTO po_line_items (po_id, product, quantity, unit, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, li.product, li.quantity, li.unit || 'units', li.unitPrice, li.total]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── INVOICE ENDPOINTS ──────────────────────────────────────────────────────

app.get('/api/invoices', async (req, res) => {
  try {
    const invRows = await query('SELECT * FROM invoices ORDER BY created_at DESC');
    const items = await query('SELECT * FROM invoice_line_items');
    
    const formatted = invRows.map(r => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      poId: r.po_id,
      vendorId: r.vendor_id,
      subtotal: Number(r.subtotal),
      gst: Number(r.gst),
      total: Number(r.total),
      dueDate: r.due_date,
      status: r.status,
      createdAt: r.created_at,
      lineItems: items
        .filter(li => li.invoice_id === r.id)
        .map(li => ({
          product: li.product,
          quantity: Number(li.quantity),
          unit: li.unit,
          unitPrice: Number(li.unit_price),
          total: Number(li.total)
        }))
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  const { id, invoiceNumber, poId, vendorId, subtotal, gst, total, dueDate, status, createdAt, lineItems } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO invoices (id, invoice_number, po_id, vendor_id, subtotal, gst, total, due_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET status=$9`,
      [id, invoiceNumber, poId, vendorId, subtotal, gst, total, dueDate, status, createdAt || new Date().toISOString()]
    );
    
    await client.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
    for (const li of lineItems) {
      await client.query(
        'INSERT INTO invoice_line_items (invoice_id, product, quantity, unit, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, li.product, li.quantity, li.unit || 'units', li.unitPrice, li.total]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── ACTIVITY LOGS ──────────────────────────────────────────────────────────

app.get('/api/logs', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 200');
    res.json(rows.map(r => ({
      id: r.id,
      action: r.action,
      actorName: r.actor_name,
      actorId: r.actor_id,
      type: r.type,
      timestamp: r.timestamp,
      referenceId: r.reference_id
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  const { action, actorName, actorId, type, referenceId } = req.body;
  try {
    await insertAuditLog(action, actorName, actorId, type, referenceId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── NOTIFICATION ENDPOINTS ─────────────────────────────────────────────────

app.get('/api/notifications', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50');
    res.json(rows.map(r => ({
      id: r.id,
      message: r.message,
      read: r.read,
      timestamp: r.timestamp,
      type: r.type
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  try {
    await query('UPDATE notifications SET read = true');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
