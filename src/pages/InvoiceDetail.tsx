import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Printer, Mail, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';
import type { InvoiceStatus } from '../types';

const SC: Record<InvoiceStatus, string> = { Draft: 'bg-gray-100 text-gray-600', Sent: 'bg-cyan-100 text-cyan-700', Paid: 'bg-emerald-100 text-emerald-700', Overdue: 'bg-red-100 text-red-700' };

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, vendors, pos, upsertInvoice, addLog } = useData();
  const { user } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const inv = invoices.find((i) => i.id === id);
  if (!inv) return <div className="text-center py-20 text-gray-400">Invoice not found. <button onClick={() => navigate('/invoices')} className="text-blue-600">Back</button></div>;

  const myVendor = vendors.find((v) => v.email === user?.email);
  const isVendor = user?.role === 'Vendor';

  if (isVendor && inv.vendorId !== myVendor?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 max-w-md mt-2">You do not have permission to view this invoice. Invoices are restricted to their assigned vendors and internal procurement staff.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-6 bg-blue-600 text-white hover:bg-blue-700">Return to Dashboard</Button>
      </div>
    );
  }

  const vendor = vendors.find((v) => v.id === inv.vendorId);
  const po = pos.find((p) => p.id === inv.poId);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const emailBody = `Dear ${vendor?.name},\n\nPlease find attached Invoice ${inv.invoiceNumber} for PO ${po?.poNumber}.\n\nAmount Due: ${fmtC(inv.total)}\nDue Date: ${fmt(inv.dueDate)}\n\nPlease process payment by the due date.\n\nBest regards,\nProcurement Team`;

  const handlePrint = async () => {
    try {
      await addLog(`Invoice ${inv.invoiceNumber} sent to printer`, 'invoice', inv.id);
    } catch (e) { console.error(e); }
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await addLog(`Invoice ${inv.invoiceNumber} downloaded as PDF`, 'invoice', inv.id);
    } catch (e) { console.error(e); }
    // Use browser print-to-PDF in a new window for clean download
    const printContent = document.getElementById('invoice-print')?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) { window.print(); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>${inv.invoiceNumber}</title><style>body{font-family:sans-serif;margin:40px;color:#111;}table{width:100%;border-collapse:collapse;}th,td{padding:8px 12px;text-align:left;}th{background:#f9fafb;font-weight:600;}tr{border-bottom:1px solid #f0f0f0;}.text-right{text-align:right;}.font-bold{font-weight:700;}</style></head><body>${printContent}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <>
      <style>{`@media print { body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3 print:hidden">
          <button onClick={() => navigate('/invoices')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div className="flex-1"><h1 className="text-2xl font-bold text-gray-900">{inv.invoiceNumber}</h1><p className="text-gray-500 text-sm">Invoice · {fmt(inv.createdAt)}</p></div>
          <div className="flex items-center gap-2">
            {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && (
              <Select value={inv.status} onValueChange={async (v) => { try { await upsertInvoice({ ...inv, status: v as InvoiceStatus }); await addLog(`Invoice ${inv.invoiceNumber} → ${v}`, 'invoice', inv.id); toast.success('Status updated'); } catch { toast.error('Failed to update status'); } }}>
                <SelectTrigger className="w-32 h-9 text-xs print:hidden"><SelectValue /></SelectTrigger>
                <SelectContent>{(['Draft','Sent','Paid','Overdue'] as InvoiceStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Button onClick={() => setShowEmail(true)} variant="outline" className="gap-2 print:hidden"><Mail className="w-4 h-4" />Send via Email</Button>
            <Button onClick={handlePrint} variant="outline" className="gap-2 print:hidden border-gray-300"><Printer className="w-4 h-4" />Print Invoice</Button>
            <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 print:hidden"><Download className="w-4 h-4" />Download PDF</Button>
          </div>
        </div>
        <div id="invoice-print" className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-2 mb-2"><div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-sm">VB</div><div><h2 className="font-bold text-gray-900 text-lg">VendorBridge</h2><p className="text-xs text-gray-400">Procurement & Vendor ERP</p></div></div>
            <div className="text-right"><h1 className="text-3xl font-black text-gray-900">INVOICE</h1><p className="font-mono font-semibold text-blue-600 mt-1">{inv.invoiceNumber}</p><span className={cn('text-xs font-bold px-2.5 py-1 rounded-full mt-2 inline-block', SC[inv.status])}>{inv.status}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
            <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</p><p className="font-bold text-gray-900">{vendor?.name}</p><p className="text-sm text-gray-600">{vendor?.email}</p><p className="text-sm text-gray-600">{vendor?.phone}</p><p className="text-sm text-gray-600">{vendor?.address}</p><p className="text-xs text-gray-400 mt-1">GST: {vendor?.gstNumber}</p></div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Invoice Date</span><span className="font-medium text-gray-800">{fmt(inv.createdAt)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Due Date</span><span className="font-semibold text-gray-900">{fmt(inv.dueDate)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">PO Reference</span><span className="font-medium text-gray-800 font-mono">{po?.poNumber ?? '-'}</span></div>
            </div>
          </div>
          <table className="w-full text-sm mb-6">
            <thead><tr className="bg-gray-50 rounded-lg"><th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-l-lg">Description</th><th className="text-right px-4 py-3 font-semibold text-gray-600">Qty</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Unit</th><th className="text-right px-4 py-3 font-semibold text-gray-600">Unit Price</th><th className="text-right px-4 py-3 font-semibold text-gray-600 rounded-r-lg">Amount</th></tr></thead>
            <tbody>{inv.lineItems.map((item, idx) => <tr key={idx} className="border-b border-gray-50"><td className="px-4 py-3 font-medium text-gray-800">{item.product}</td><td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td><td className="px-4 py-3 text-gray-500">{item.unit}</td><td className="px-4 py-3 text-right text-gray-600">{fmtC(item.unitPrice)}</td><td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtC(item.total)}</td></tr>)}</tbody>
          </table>
          <div className="flex justify-end"><div className="w-64 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-800">{fmtC(inv.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">GST (18%)</span><span className="text-gray-700">{fmtC(inv.gst)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2"><span className="text-gray-900">Total Due</span><span className="text-blue-700 text-lg">{fmtC(inv.total)}</span></div>
          </div></div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center"><p className="text-xs text-gray-400">Thank you for your business. Please remit payment by {fmt(inv.dueDate)}.</p></div>
        </div>
      </div>
      <Dialog open={showEmail} onOpenChange={setShowEmail}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Send Invoice via Email</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>To</Label><Input className="mt-1" defaultValue={vendor?.email} readOnly /></div>
            <div><Label>Subject</Label><Input className="mt-1" defaultValue={`Invoice ${inv.invoiceNumber} - ${po?.poNumber}`} readOnly /></div>
            <div><Label>Message</Label><Textarea className="mt-1 font-mono text-xs" rows={8} defaultValue={emailBody} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowEmail(false)}>Cancel</Button>
              <Button onClick={async () => { try { await upsertInvoice({ ...inv, status: 'Sent' }); await addLog(`Invoice ${inv.invoiceNumber} sent to ${vendor?.name}`, 'invoice', inv.id); toast.success('Invoice sent!'); } catch { toast.error('Failed to update invoice status'); } setShowEmail(false); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Mail className="w-4 h-4" />Send Invoice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
