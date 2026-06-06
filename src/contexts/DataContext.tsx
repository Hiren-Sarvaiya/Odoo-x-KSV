import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Vendor, RFQ, Quotation, PurchaseOrder, Invoice, ActivityLog, Approval } from '../types';
import { db, genId, genPONumber, genInvoiceNumber } from '../lib/api';
import { useAuth } from './AuthContext';

interface DataContextValue {
  vendors: Vendor[]; rfqs: RFQ[]; quotations: Quotation[]; pos: PurchaseOrder[];
  invoices: Invoice[]; logs: ActivityLog[]; approvals: Approval[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  upsertVendor: (v: Vendor) => Promise<void>;
  removeVendor: (id: string) => Promise<void>;
  upsertRFQ: (r: RFQ) => Promise<void>;
  upsertQuotation: (q: Quotation) => Promise<void>;
  submitForApproval: (quotationId: string) => Promise<void>;
  decideApproval: (approvalId: string, decision: 'approved' | 'rejected', remarks: string) => Promise<PurchaseOrder | null>;
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
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [v, r, q, p, i, l, a] = await Promise.all([
        db.getVendors(), db.getRFQs(), db.getQuotations(),
        db.getPOs(), db.getInvoices(), db.getLogs(), db.getApprovals(),
      ]);
      setVendors(v); setRFQs(r); setQuotations(q);
      setPOs(p); setInvoices(i); setLogs(l); setApprovals(a);
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

  /**
   * Called by Procurement Officer after selecting a winner quotation.
   * Creates an Approval record in the DB with status='pending'.
   */
  const submitForApproval = useCallback(async (quotationId: string) => {
    const quot = quotations.find((q) => q.id === quotationId);
    if (!quot) throw new Error('Quotation not found');
    const rfq = rfqs.find((r) => r.id === quot.rfqId);
    const vendor = vendors.find((v) => v.id === quot.vendorId);

    const approval: Approval = {
      id: 'apr_' + genId(),
      quotationId: quot.id,
      rfqId: quot.rfqId,
      rfqTitle: rfq?.title ?? 'Unknown RFQ',
      vendorName: vendor?.name ?? 'Unknown Vendor',
      totalAmount: quot.totalAmount,
      submittedBy: user?.name ?? 'Officer',
      status: 'pending',
      remarks: '',
      decidedAt: null,
    };

    await db.upsertApproval(approval);
    await refresh();
  }, [quotations, rfqs, vendors, user, refresh]);

  /**
   * Called by Manager from Approvals page.
   * On 'approved': creates PO, sets quotation→Approved, RFQ→Closed.
   * On 'rejected':  sets quotation→Rejected, RFQ back to Quoted.
   */
  const decideApproval = useCallback(async (approvalId: string, decision: 'approved' | 'rejected', remarks: string): Promise<PurchaseOrder | null> => {
    const approval = approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval not found');

    const updatedApproval: Approval = {
      ...approval,
      status: decision,
      remarks,
      decidedAt: new Date().toISOString(),
    };
    await db.upsertApproval(updatedApproval);

    const quot = quotations.find((q) => q.id === approval.quotationId);
    const rfq = rfqs.find((r) => r.id === approval.rfqId);

    if (decision === 'approved' && quot && rfq) {
      // Build PO from quotation
      const lineItems = rfq.lineItems.map((li) => {
        const qi = quot.lineItems.find((q) => q.rfqItemId === li.id);
        const up = qi?.unitPrice ?? 0;
        return { product: li.product, quantity: li.quantity, unit: li.unit, unitPrice: up, total: li.quantity * up };
      });
      const subtotal = lineItems.reduce((s, l) => s + l.total, 0);
      const gst = subtotal * 0.18;
      const poNumber = genPONumber(pos);
      const po: PurchaseOrder = {
        id: genId(), poNumber,
        rfqId: rfq.id, quotationId: quot.id, vendorId: quot.vendorId,
        lineItems, subtotal, gst, total: subtotal + gst,
        status: 'Issued',
        createdAt: new Date().toISOString(),
        createdBy: user?.id ?? 'system',
        approvedBy: user?.name ?? 'Manager',
      };

      await db.upsertPO(po);
      await db.upsertQuotation({ ...quot, status: 'Approved' });
      await db.upsertRFQ({ ...rfq, status: 'Closed' });
      await refresh();
      return po;
    } else if (decision === 'rejected' && quot && rfq) {
      // Mark the rejected quotation as Rejected
      await db.upsertQuotation({ ...quot, status: 'Rejected' });
      // Restore all other Under Review quotations for this RFQ back to Submitted
      const otherQuotations = quotations.filter(
        (q) => q.rfqId === rfq.id && q.id !== quot.id && q.status === 'Under Review'
      );
      await Promise.all(otherQuotations.map((q) => db.upsertQuotation({ ...q, status: 'Submitted' })));
      // Put RFQ back to Quoted so officer can re-compare
      await db.upsertRFQ({ ...rfq, status: 'Quoted' });
    }

    await refresh();
    return null;
  }, [approvals, quotations, rfqs, pos, user, refresh]);

  const generateInvoice = useCallback(async (poId: string): Promise<Invoice> => {
    const po = pos.find((p) => p.id === poId)!;
    const invoiceNumber = genInvoiceNumber(invoices);
    const inv: Invoice = {
      id: genId(), invoiceNumber, poId,
      vendorId: po.vendorId, lineItems: po.lineItems,
      subtotal: po.subtotal, gst: po.gst, total: po.total,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'Draft', createdAt: new Date().toISOString()
    };
    await db.upsertInvoice(inv);
    await refresh();
    return inv;
  }, [pos, invoices, refresh]);

  return (
    <DataContext.Provider value={{
      vendors, rfqs, quotations, pos, invoices, logs, approvals, isLoading, refresh,
      upsertVendor, removeVendor, upsertRFQ, upsertQuotation,
      submitForApproval, decideApproval, generateInvoice, upsertPO, upsertInvoice, addLog
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
