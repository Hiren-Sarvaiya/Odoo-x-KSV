import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, GitCompare, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const SC: Record<string, string> = {
  // RFQ statuses
  Open: 'bg-blue-100 text-blue-700',
  Quoted: 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-purple-100 text-purple-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-gray-100 text-gray-600',
  // Quotation statuses
  Submitted: 'bg-amber-100 text-amber-700',
  Selected: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Pending: 'bg-orange-100 text-orange-700',
};

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rfqs, quotations, vendors, upsertRFQ, upsertQuotation, addLog, submitForApproval } = useData();
  const { user } = useAuth();
  const rfq = rfqs.find((r) => r.id === id);
  if (!rfq) return <div className="text-center py-20 text-gray-400">RFQ not found. <button onClick={() => navigate('/rfqs')} className="text-blue-600">Go back</button></div>;

  const myVendor = vendors.find((v) => v.email === user?.email);
  const isVendor = user?.role === 'Vendor';

  if (isVendor && (!myVendor || !rfq.assignedVendors.includes(myVendor.id))) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 max-w-md mt-2">You do not have permission to view this request for quotation. This RFQ is restricted to its assigned vendors and procurement officers.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-6 bg-blue-600 text-white hover:bg-blue-700">Return to Dashboard</Button>
      </div>
    );
  }

  const rfqQuotes = quotations.filter((q) => q.rfqId === id);
  const vById = (vid: string) => vendors.find((v) => v.id === vid);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const selectWinner = async (qid: string) => {
    try {
      await Promise.all(
        rfqQuotes.map((q) => upsertQuotation({ ...q, status: q.id === qid ? 'Selected' : 'Under Review' }))
      );
      await upsertRFQ({ ...rfq, status: 'Under Review' });
      await submitForApproval(qid);
      const w = rfqQuotes.find((q) => q.id === qid);
      addLog(`${vById(w?.vendorId ?? '')?.name ?? 'Vendor'} selected for "${rfq.title}". Sent for manager approval.`, 'approval', rfq.id);
      toast.success('Winner selected! Sent for manager approval.');
    } catch {
      toast.error('Failed to select winner');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rfqs')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1"><h1 className="text-2xl font-bold text-gray-900">{rfq.title}</h1><p className="text-gray-500 text-sm">RFQ Details · Deadline: {fmt(rfq.deadline)}</p></div>
        {rfqQuotes.length >= 2 && rfq.status === 'Quoted' && <Button onClick={() => navigate(`/rfqs/${id}/compare`)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><GitCompare className="w-4 h-4" />Compare Quotations</Button>}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', SC[rfq.status] ?? 'bg-gray-100 text-gray-600')}>{rfq.status}</span>
        <div><p className="text-sm font-semibold text-gray-700 mb-1">Description</p><p className="text-gray-600 text-sm">{rfq.description || 'No description provided'}</p></div>
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Line Items</p>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left px-4 py-2 font-semibold text-gray-600">#</th><th className="text-left px-4 py-2 font-semibold text-gray-600">Product</th><th className="text-right px-4 py-2 font-semibold text-gray-600">Qty</th><th className="text-left px-4 py-2 font-semibold text-gray-600">Unit</th></tr></thead>
              <tbody className="divide-y divide-gray-50">{rfq.lineItems.map((item, idx) => <tr key={item.id}><td className="px-4 py-2.5 text-gray-400">{idx + 1}</td><td className="px-4 py-2.5 font-medium text-gray-800">{item.product}</td><td className="px-4 py-2.5 text-right text-gray-700">{item.quantity}</td><td className="px-4 py-2.5 text-gray-500">{item.unit}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div><p className="text-sm font-semibold text-gray-700 mb-2">Assigned Vendors</p><div className="flex flex-wrap gap-2">{rfq.assignedVendors.map((vid) => <span key={vid} className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">{vById(vid)?.name ?? vid}</span>)}</div></div>
        {rfq.attachments && rfq.attachments.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-2">Attachments</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rfq.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.dataUrl}
                  download={att.name}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group cursor-pointer"
                >
                  <Paperclip className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">{att.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {att.size < 1024 ? `${att.size}B` : att.size < 1024 * 1024 ? `${(att.size / 1024).toFixed(1)}KB` : `${(att.size / (1024 * 1024)).toFixed(1)}MB`}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      {rfqQuotes.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-4">Received Quotations ({rfqQuotes.length})</h2>
          <div className="grid gap-4">
            {rfqQuotes.map((q) => {
              const vendor = vById(q.vendorId);
              return (
                <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3"><p className="font-semibold text-gray-800">{vendor?.name ?? q.vendorId}</p><span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', SC[q.status])}>{q.status}</span></div>
                      <p className="text-sm text-gray-500 mt-0.5">Delivery: {q.deliveryDays} days · Total: {fmtC(q.totalAmount)}</p>
                      {q.notes && <p className="text-xs text-gray-400 mt-1 italic">"{q.notes}"</p>}
                    </div>
                    {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && rfq.status === 'Quoted' && q.status !== 'Selected' && <Button onClick={() => selectWinner(q.id)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Select Winner</Button>}
                    {q.status === 'Selected' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">Selected Winner</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
