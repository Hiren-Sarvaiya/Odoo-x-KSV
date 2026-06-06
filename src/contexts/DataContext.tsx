import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Vendor, RFQ, Quotation, PurchaseOrder, Invoice, ActivityLog } from '../types';
import { db, genId, genPONumber, genInvoiceNumber } from '../lib/api';
import { useAuth } from './AuthContext';

interface DataContextValue {
  vendors: Vendor[]; rfqs: RFQ[]; quotations: Quotation[]; pos: PurchaseOrder[];
  invoices: Invoice[]; logs: ActivityLog[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  upsertVendor: (v: Vendor) => Promise<void>;
  removeVendor: (id: string) => Promise<void>;
  upsertRFQ: (r: RFQ) => Promise<void>;
  upsertQuotation: (q: Quotation) => Promise<void>;
  approvePO: (quotationId: string, approvedBy: string) => Promise<PurchaseOrder>;
  generateInvoice: (poId: string) => Promise<Invoice>;
  upsertPO: (p: PurchaseOrder) => Promise<void>;
  upsertInvoice: (i: Invoice) => Promise<void>;
  addLog: (action: string, type: ActivityLog['type'], referenceId?: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from DB via API on mount
  const refresh = useCallback(async () => {
    try {
      const [v, r, q, p, i, l] = await Promise.all([
        db.getVendors(), db.getRFQs(), db.getQuotations(),
        db.getPOs(), db.getInvoices(), db.getLogs(),
      ]);
      setVendors(v); setRFQs(r); setQuotations(q);
      setPOs(p); setInvoices(i); setLogs(l);
    } catch (e) {
      console.error('Failed to sync context with server API:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addLog = useCallback(async (action: string, type: ActivityLog['type'], referenceId?: string) => {
    const log = { action, actorName: user?.name ?? 'System', actorId: user?.id ?? 'system', type, referenceId };
    await db.addLog(log);
    await refresh();
  }, [user, refresh]);

  const upsertVendor = useCallback(async (v: Vendor) => {
    await db.upsertVendor(v);
    await refresh();
  }, [refresh]);

  const removeVendor = useCallback(async (id: string) => {
    await db.removeVendor(id);
    await refresh();
  }, [refresh]);

  const upsertRFQ = useCallback(async (r: RFQ) => {
    await db.upsertRFQ(r);
    await refresh();
  }, [refresh]);

  const upsertQuotation = useCallback(async (q: Quotation) => {
    await db.upsertQuotation(q);
    await refresh();
  }, [refresh]);

  const upsertPO = useCallback(async (p: PurchaseOrder) => {
    await db.upsertPO(p);
    await refresh();
  }, [refresh]);

  const upsertInvoice = useCallback(async (i: Invoice) => {
    await db.upsertInvoice(i);
    await refresh();
  }, [refresh]);

  const approvePO = useCallback(async (quotationId: string, approvedBy: string): Promise<PurchaseOrder> => {
    const quot = quotations.find((q) => q.id === quotationId)!;
    const rfq = rfqs.find((r) => r.id === quot.rfqId)!;
    const lineItems = rfq.lineItems.map((li) => {
      const qi = quot.lineItems.find((q) => q.rfqItemId === li.id);
      const up = qi?.unitPrice ?? 0;
      return { product: li.product, quantity: li.quantity, unit: li.unit, unitPrice: up, total: li.quantity * up };
    });
    const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
    const gst = subtotal * 0.18;
    const poNumber = genPONumber(pos);
    const po: PurchaseOrder = { id: genId(), poNumber, rfqId: quot.rfqId, quotationId, vendorId: quot.vendorId, lineItems, subtotal, gst, total: subtotal + gst, status: 'Issued', createdAt: new Date().toISOString(), createdBy: user?.id ?? 'system', approvedBy };

    await db.upsertPO(po);
    const updatedQuot = { ...quot, status: 'Approved' as const };
    await db.upsertQuotation(updatedQuot);
    const updatedRFQ = { ...rfq, status: 'Closed' as const };
    await db.upsertRFQ(updatedRFQ);

    await refresh();
    return po;
  }, [user, quotations, rfqs, pos, refresh]);

  const generateInvoice = useCallback(async (poId: string): Promise<Invoice> => {
    const po = pos.find((p) => p.id === poId)!;
    const invoiceNumber = genInvoiceNumber(invoices);
    const inv: Invoice = { id: genId(), invoiceNumber, poId, vendorId: po.vendorId, lineItems: po.lineItems, subtotal: po.subtotal, gst: po.gst, total: po.total, dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'Draft', createdAt: new Date().toISOString() };
    await db.upsertInvoice(inv);
    await refresh();
    return inv;
  }, [pos, invoices, refresh]);

  return (
    <DataContext.Provider value={{ vendors, rfqs, quotations, pos, invoices, logs, isLoading, refresh, upsertVendor, removeVendor, upsertRFQ, upsertQuotation, approvePO, generateInvoice, upsertPO, upsertInvoice, addLog }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
