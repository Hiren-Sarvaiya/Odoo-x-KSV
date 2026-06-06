import type { User, Vendor, RFQ, Quotation, PurchaseOrder, Invoice, ActivityLog, Notification } from '../types';

const KEYS = {
  users: 'vb_users', vendors: 'vb_vendors', rfqs: 'vb_rfqs', quotations: 'vb_quotations',
  pos: 'vb_pos', invoices: 'vb_invoices', logs: 'vb_logs', notifications: 'vb_notifications',
  currentUser: 'vb_current_user', seeded: 'vb_seeded',
};

function get<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; } catch { return []; }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function upsert<T extends { id: string }>(key: string, item: T): void {
  const items = get<T>(key);
  const idx = items.findIndex((i) => (i as { id: string }).id === item.id);
  if (idx >= 0) items[idx] = item; else items.push(item);
  set(key, items);
}

function remove(key: string, id: string): void {
  set(key, get<{ id: string }>(key).filter((i) => i.id !== id));
}

export const storage = {
  getUsers: () => get<User>(KEYS.users),
  upsertUser: (u: User) => upsert(KEYS.users, u),
  getVendors: () => get<Vendor>(KEYS.vendors),
  upsertVendor: (v: Vendor) => upsert(KEYS.vendors, v),
  removeVendor: (id: string) => remove(KEYS.vendors, id),
  getRFQs: () => get<RFQ>(KEYS.rfqs),
  upsertRFQ: (r: RFQ) => upsert(KEYS.rfqs, r),
  getQuotations: () => get<Quotation>(KEYS.quotations),
  upsertQuotation: (q: Quotation) => upsert(KEYS.quotations, q),
  getPOs: () => get<PurchaseOrder>(KEYS.pos),
  upsertPO: (p: PurchaseOrder) => upsert(KEYS.pos, p),
  getInvoices: () => get<Invoice>(KEYS.invoices),
  upsertInvoice: (i: Invoice) => upsert(KEYS.invoices, i),
  getLogs: () => get<ActivityLog>(KEYS.logs),
  addLog: (log: ActivityLog) => {
    const logs = get<ActivityLog>(KEYS.logs);
    logs.unshift(log);
    set(KEYS.logs, logs.slice(0, 200));
    const notifs = get<Notification>(KEYS.notifications);
    notifs.unshift({ id: log.id + '_n', message: log.action, read: false, timestamp: log.timestamp, type: log.type });
    set(KEYS.notifications, notifs.slice(0, 50));
  },
  getNotifications: () => get<Notification>(KEYS.notifications),
  markAllRead: () => set(KEYS.notifications, get<Notification>(KEYS.notifications).map((n) => ({ ...n, read: true }))),
  getCurrentUser: (): User | null => {
    try { return JSON.parse(localStorage.getItem(KEYS.currentUser) || 'null'); } catch { return null; }
  },
  setCurrentUser: (u: User | null) => {
    if (u) localStorage.setItem(KEYS.currentUser, JSON.stringify(u));
    else localStorage.removeItem(KEYS.currentUser);
  },
  isSeeded: () => localStorage.getItem(KEYS.seeded) === 'true',
  markSeeded: () => localStorage.setItem(KEYS.seeded, 'true'),
};

export function seedData() {
  if (storage.isSeeded()) return;
  const now = new Date();
  const ds = (d: Date) => d.toISOString();
  const ago = (n: number) => new Date(now.getTime() - n * 86400000);
  const ahead = (n: number) => new Date(now.getTime() + n * 86400000);

  const users: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'Admin' },
    { id: 'u2', name: 'Alex Chen', email: 'officer@demo.com', password: 'officer123', role: 'Procurement Officer' },
    { id: 'u3', name: 'Maria Santos', email: 'manager@demo.com', password: 'manager123', role: 'Manager' },
    { id: 'u4', name: 'TechVision Inc', email: 'vendor@demo.com', password: 'vendor123', role: 'Vendor' },
  ];
  const vendors: Vendor[] = [
    { id: 'v1', name: 'TechVision Inc', category: 'IT', gstNumber: 'GST001TV2024', email: 'vendor@demo.com', phone: '+1-555-0101', address: '123 Tech Park, San Jose, CA', status: 'Active', rating: 4.5, createdAt: ds(ago(90)) },
    { id: 'v2', name: 'OfficeMax Pro', category: 'Office Supplies', gstNumber: 'GST002OM2024', email: 'sales@officemax.pro', phone: '+1-555-0102', address: '456 Business Ave, Chicago, IL', status: 'Active', rating: 4.2, createdAt: ds(ago(80)) },
    { id: 'v3', name: 'SwiftLogix', category: 'Logistics', gstNumber: 'GST003SL2024', email: 'ops@swiftlogix.com', phone: '+1-555-0103', address: '789 Freight Blvd, Dallas, TX', status: 'Active', rating: 3.8, createdAt: ds(ago(70)) },
    { id: 'v4', name: 'FurnCraft Ltd', category: 'Furniture', gstNumber: 'GST004FC2024', email: 'info@furncraft.com', phone: '+1-555-0104', address: '321 Design St, Portland, OR', status: 'Inactive', rating: 4.0, createdAt: ds(ago(60)) },
    { id: 'v5', name: 'ProServices Group', category: 'Services', gstNumber: 'GST005PS2024', email: 'contact@proservices.com', phone: '+1-555-0105', address: '654 Service Lane, Austin, TX', status: 'Active', rating: 4.7, createdAt: ds(ago(50)) },
  ];
  const rfqs: RFQ[] = [
    { id: 'rfq1', title: 'Laptop Procurement Q4', description: 'Procure laptops for engineering team', deadline: ds(ahead(15)), lineItems: [{ id: 'li1', product: 'MacBook Pro 14"', quantity: 10, unit: 'units' }, { id: 'li2', product: 'Dell XPS 15', quantity: 5, unit: 'units' }], assignedVendors: ['v1', 'v2'], status: 'Quoted', createdBy: 'u2', createdAt: ds(ago(10)) },
    { id: 'rfq2', title: 'Office Supplies Restock', description: 'Monthly office supplies order', deadline: ds(ahead(7)), lineItems: [{ id: 'li3', product: 'A4 Paper Reams', quantity: 100, unit: 'reams' }, { id: 'li4', product: 'Ballpoint Pens', quantity: 500, unit: 'units' }], assignedVendors: ['v2', 'v5'], status: 'Open', createdBy: 'u2', createdAt: ds(ago(5)) },
    { id: 'rfq3', title: 'Server Infrastructure Upgrade', description: 'Upgrade data center servers', deadline: ds(ago(2)), lineItems: [{ id: 'li5', product: 'Dell PowerEdge R750', quantity: 4, unit: 'units' }], assignedVendors: ['v1'], status: 'Closed', createdBy: 'u2', createdAt: ds(ago(30)) },
  ];
  const quotations: Quotation[] = [
    { id: 'q1', rfqId: 'rfq1', vendorId: 'v1', lineItems: [{ rfqItemId: 'li1', unitPrice: 2400 }, { rfqItemId: 'li2', unitPrice: 1800 }], deliveryDays: 14, notes: 'Best price guaranteed. Bulk discount applied.', status: 'Selected', submittedAt: ds(ago(7)), submittedBy: 'u4', totalAmount: 33000 },
    { id: 'q2', rfqId: 'rfq1', vendorId: 'v2', lineItems: [{ rfqItemId: 'li1', unitPrice: 2600 }, { rfqItemId: 'li2', unitPrice: 1950 }], deliveryDays: 10, notes: 'Faster delivery available.', status: 'Under Review', submittedAt: ds(ago(6)), submittedBy: 'u4', totalAmount: 35750 },
  ];
  const pos: PurchaseOrder[] = [
    { id: 'po1', poNumber: 'PO-20240115-001', rfqId: 'rfq3', quotationId: 'q_hist', vendorId: 'v1', lineItems: [{ product: 'Dell PowerEdge R750', quantity: 4, unit: 'units', unitPrice: 8500, total: 34000 }], subtotal: 34000, gst: 6120, total: 40120, status: 'Acknowledged', createdAt: ds(ago(20)), createdBy: 'u2', approvedBy: 'u3' },
  ];
  const invoices: Invoice[] = [
    { id: 'inv1', invoiceNumber: 'INV-20240115-001', poId: 'po1', vendorId: 'v1', lineItems: [{ product: 'Dell PowerEdge R750', quantity: 4, unit: 'units', unitPrice: 8500, total: 34000 }], subtotal: 34000, gst: 6120, total: 40120, dueDate: ds(ahead(30)), status: 'Sent', createdAt: ds(ago(18)) },
  ];
  const logs: ActivityLog[] = [
    { id: 'log1', action: 'RFQ "Laptop Procurement Q4" created', actorName: 'Alex Chen', actorId: 'u2', type: 'rfq', timestamp: ds(ago(10)), referenceId: 'rfq1' },
    { id: 'log2', action: 'RFQ "Office Supplies Restock" created', actorName: 'Alex Chen', actorId: 'u2', type: 'rfq', timestamp: ds(ago(5)), referenceId: 'rfq2' },
    { id: 'log3', action: 'Quotation submitted by TechVision Inc for "Laptop Procurement Q4"', actorName: 'TechVision Inc', actorId: 'u4', type: 'quotation', timestamp: ds(ago(7)), referenceId: 'q1' },
    { id: 'log4', action: 'Quotation submitted by OfficeMax Pro for "Laptop Procurement Q4"', actorName: 'OfficeMax Pro', actorId: 'u4', type: 'quotation', timestamp: ds(ago(6)), referenceId: 'q2' },
    { id: 'log5', action: 'TechVision Inc selected as winner for RFQ "Laptop Procurement Q4"', actorName: 'Alex Chen', actorId: 'u2', type: 'approval', timestamp: ds(ago(5)), referenceId: 'rfq1' },
    { id: 'log6', action: 'PO PO-20240115-001 approved and generated', actorName: 'Maria Santos', actorId: 'u3', type: 'po', timestamp: ds(ago(20)), referenceId: 'po1' },
    { id: 'log7', action: 'Invoice INV-20240115-001 generated from PO PO-20240115-001', actorName: 'Alex Chen', actorId: 'u2', type: 'invoice', timestamp: ds(ago(18)), referenceId: 'inv1' },
    { id: 'log8', action: 'Vendor FurnCraft Ltd status changed to Inactive', actorName: 'Admin User', actorId: 'u1', type: 'vendor', timestamp: ds(ago(15)), referenceId: 'v4' },
    { id: 'log9', action: 'Invoice INV-20240115-001 sent to vendor', actorName: 'Alex Chen', actorId: 'u2', type: 'invoice', timestamp: ds(ago(18)), referenceId: 'inv1' },
    { id: 'log10', action: 'RFQ "Server Infrastructure Upgrade" closed', actorName: 'Alex Chen', actorId: 'u2', type: 'rfq', timestamp: ds(ago(2)), referenceId: 'rfq3' },
  ];

  localStorage.setItem(KEYS.users, JSON.stringify(users));
  localStorage.setItem(KEYS.vendors, JSON.stringify(vendors));
  localStorage.setItem(KEYS.rfqs, JSON.stringify(rfqs));
  localStorage.setItem(KEYS.quotations, JSON.stringify(quotations));
  localStorage.setItem(KEYS.pos, JSON.stringify(pos));
  localStorage.setItem(KEYS.invoices, JSON.stringify(invoices));
  localStorage.setItem(KEYS.logs, JSON.stringify(logs));
  localStorage.setItem(KEYS.notifications, JSON.stringify(logs.map((l) => ({ id: l.id + '_n', message: l.action, read: false, timestamp: l.timestamp, type: l.type }))));
  storage.markSeeded();
}

export function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function genPONumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const pos = storage.getPOs();
  const seq = String(pos.filter((p) => p.poNumber.includes(date)).length + 1).padStart(3, '0');
  return `PO-${date}-${seq}`;
}

export function genInvoiceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const invs = storage.getInvoices();
  const seq = String(invs.filter((i) => i.invoiceNumber.includes(date)).length + 1).padStart(3, '0');
  return `INV-${date}-${seq}`;
}
