import type { User, Vendor, RFQ, Quotation, PurchaseOrder, Invoice, ActivityLog, Notification } from '../types';

export function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function genPONumber(pos: PurchaseOrder[]): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(pos.filter((p) => p.poNumber.includes(date)).length + 1).padStart(3, '0');
  return `PO-${date}-${seq}`;
}

export function genInvoiceNumber(invoices: Invoice[]): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(invoices.filter((i) => i.invoiceNumber.includes(date)).length + 1).padStart(3, '0');
  return `INV-${date}-${seq}`;
}

export const db = {
  // ── Users ─────────────────────────────────────────────────────────────────
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => u.email === email) ?? null;
    } catch {
      return null;
    }
  },

  async upsertUser(u: User): Promise<void> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    });
    if (!res.ok) throw new Error('Failed to upsert user');
  },

  // ── Vendors ───────────────────────────────────────────────────────────────
  async getVendors(): Promise<Vendor[]> {
    const res = await fetch('/api/vendors');
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
  },

  async upsertVendor(v: Vendor): Promise<void> {
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v)
    });
    if (!res.ok) throw new Error('Failed to upsert vendor');
  },

  async removeVendor(id: string): Promise<void> {
    const res = await fetch(`/api/vendors/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete vendor');
  },

  // ── RFQs ──────────────────────────────────────────────────────────────────
  async getRFQs(): Promise<RFQ[]> {
    const res = await fetch('/api/rfqs');
    if (!res.ok) throw new Error('Failed to fetch RFQs');
    return res.json();
  },

  async upsertRFQ(r: RFQ): Promise<void> {
    const res = await fetch('/api/rfqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });
    if (!res.ok) throw new Error('Failed to upsert RFQ');
  },

  // ── Quotations ────────────────────────────────────────────────────────────
  async getQuotations(): Promise<Quotation[]> {
    const res = await fetch('/api/quotations');
    if (!res.ok) throw new Error('Failed to fetch quotations');
    return res.json();
  },

  async upsertQuotation(q: Quotation): Promise<void> {
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    if (!res.ok) throw new Error('Failed to upsert quotation');
  },

  // ── Purchase Orders ───────────────────────────────────────────────────────
  async getPOs(): Promise<PurchaseOrder[]> {
    const res = await fetch('/api/purchase-orders');
    if (!res.ok) throw new Error('Failed to fetch POs');
    return res.json();
  },

  async upsertPO(po: PurchaseOrder): Promise<void> {
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(po)
    });
    if (!res.ok) throw new Error('Failed to upsert PO');
  },

  // ── Invoices ──────────────────────────────────────────────────────────────
  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch('/api/invoices');
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  async upsertInvoice(inv: Invoice): Promise<void> {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv)
    });
    if (!res.ok) throw new Error('Failed to upsert invoice');
  },

  // ── Activity Logs ─────────────────────────────────────────────────────────
  async getLogs(): Promise<ActivityLog[]> {
    const res = await fetch('/api/logs');
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  async addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    if (!res.ok) throw new Error('Failed to add log');
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  async getNotifications(): Promise<Notification[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markAllRead(): Promise<void> {
    const res = await fetch('/api/notifications/mark-read', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark notifications read');
  },

  // ── Session (persistent local browser storage) ────────────────────────────
  getCurrentUser(): User | null {
    try { return JSON.parse(localStorage.getItem('vb_current_user') || 'null'); } catch { return null; }
  },
  setCurrentUser(u: User | null): void {
    if (u) localStorage.setItem('vb_current_user', JSON.stringify(u));
    else localStorage.removeItem('vb_current_user');
  }
};
