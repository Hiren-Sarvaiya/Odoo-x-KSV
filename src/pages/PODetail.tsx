import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';
import type { POStatus } from '../types';

const SC: Record<POStatus, string> = { Draft: 'bg-gray-100 text-gray-600', Issued: 'bg-blue-100 text-blue-700', Acknowledged: 'bg-indigo-100 text-indigo-700', Completed: 'bg-emerald-100 text-emerald-700' };
const STATUSES: POStatus[] = ['Draft', 'Issued', 'Acknowledged', 'Completed'];

export default function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pos, vendors, rfqs, invoices, generateInvoice, upsertPO, addLog } = useData();
  const { user } = useAuth();
  const po = pos.find((p) => p.id === id);
  if (!po) return <div className="text-center py-20 text-gray-400">PO not found. <button onClick={() => navigate('/purchase-orders')} className="text-blue-600">Back</button></div>;

  const myVendor = vendors.find((v) => v.email === user?.email);
  const isVendor = user?.role === 'Vendor';

  if (isVendor && po.vendorId !== myVendor?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 max-w-md mt-2">You do not have permission to view this purchase order. Purchase orders are restricted to the issuing organization and the assigned vendor.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-6 bg-blue-600 text-white hover:bg-blue-700">Return to Dashboard</Button>
      </div>
    );
  }

  const vendor = vendors.find((v) => v.id === po.vendorId);
  const rfq = rfqs.find((r) => r.id === po.rfqId);
  const existingInv = invoices.find((i) => i.poId === po.id);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleGenInvoice = async () => {
    try {
      const inv = await generateInvoice(po.id);
      await addLog(`Invoice ${inv.invoiceNumber} generated from PO ${po.poNumber}`, 'invoice', inv.id);
      toast.success(`Invoice ${inv.invoiceNumber} generated!`);
      navigate(`/invoices/${inv.id}`);
    } catch {
      toast.error('Failed to generate invoice');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/purchase-orders')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1"><h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1><p className="text-gray-500 text-sm">Purchase Order · {fmt(po.createdAt)}</p></div>
        {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && !existingInv && <Button onClick={handleGenInvoice} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><FileText className="w-4 h-4" />Generate Invoice</Button>}
        {existingInv && <Button onClick={() => navigate(`/invoices/${existingInv.id}`)} variant="outline" className="gap-2"><FileText className="w-4 h-4" />View Invoice</Button>}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Status</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', SC[po.status])}>{po.status}</span>
              {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && (
                <Select value={po.status} onValueChange={(v) => { upsertPO({ ...po, status: v as POStatus }); addLog(`PO ${po.poNumber} status → ${v}`, 'po', po.id); toast.success('Status updated'); }}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="text-right"><p className="text-xs text-gray-400 font-medium uppercase tracking-wide">PO Number</p><p className="font-mono font-bold text-gray-800 text-lg">{po.poNumber}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vendor Details</p><p className="font-semibold text-gray-800">{vendor?.name}</p><p className="text-sm text-gray-500">{vendor?.email}</p><p className="text-sm text-gray-500">{vendor?.phone}</p><p className="text-sm text-gray-500">{vendor?.address}</p><p className="text-xs text-gray-400 mt-1">GST: {vendor?.gstNumber}</p></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Related RFQ</p><p className="font-semibold text-gray-800">{rfq?.title ?? '-'}</p><p className="text-sm text-gray-500">{rfq?.description}</p>{rfq && <button onClick={() => navigate(`/rfqs/${rfq.id}`)} className="text-xs text-blue-600 hover:underline mt-1">View RFQ</button>}</div>
        </div>
        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Line Items</p>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="text-left px-4 py-2.5 font-semibold text-gray-600">Product</th><th className="text-right px-4 py-2.5 font-semibold text-gray-600">Qty</th><th className="text-left px-4 py-2.5 font-semibold text-gray-600">Unit</th><th className="text-right px-4 py-2.5 font-semibold text-gray-600">Unit Price</th><th className="text-right px-4 py-2.5 font-semibold text-gray-600">Total</th></tr></thead>
              <tbody className="divide-y divide-gray-50">{po.lineItems.map((item, idx) => <tr key={idx}><td className="px-4 py-3 font-medium text-gray-800">{item.product}</td><td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td><td className="px-4 py-3 text-gray-500">{item.unit}</td><td className="px-4 py-3 text-right text-gray-600">{fmtC(item.unitPrice)}</td><td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtC(item.total)}</td></tr>)}</tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr><td colSpan={4} className="px-4 py-2.5 text-right font-medium text-gray-600">Subtotal</td><td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmtC(po.subtotal)}</td></tr>
                <tr><td colSpan={4} className="px-4 py-2 text-right text-gray-500 text-xs">GST (18%)</td><td className="px-4 py-2 text-right text-gray-600">{fmtC(po.gst)}</td></tr>
                <tr className="border-t border-gray-200"><td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">Total</td><td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{fmtC(po.total)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
