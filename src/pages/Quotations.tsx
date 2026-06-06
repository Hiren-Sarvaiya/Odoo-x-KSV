import { useNavigate } from 'react-router-dom';
import { ClipboardList, Eye } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { cn } from '../lib/utils';

const SC: Record<string, string> = { Submitted: 'bg-amber-100 text-amber-700', 'Under Review': 'bg-purple-100 text-purple-700', Pending: 'bg-orange-100 text-orange-700', Selected: 'bg-blue-100 text-blue-700', Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700' };

export default function Quotations() {
  const { quotations, rfqs, vendors } = useData();
  const navigate = useNavigate();
  const sorted = [...quotations].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const rfqById = (id: string) => rfqs.find((r) => r.id === id);
  const vById = (id: string) => vendors.find((v) => v.id === id);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Quotations</h1><p className="text-gray-500 text-sm mt-0.5">{sorted.length} total</p></div>
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center"><ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No quotations yet</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-6 py-3 font-semibold text-gray-600">RFQ</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Vendor</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th><th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Delivery</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted</th><th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((q) => {
                  const rfq = rfqById(q.rfqId);
                  const vendor = vById(q.vendorId);
                  return (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5"><p className="font-medium text-gray-800">{rfq?.title ?? '-'}</p></td>
                      <td className="px-4 py-3.5 text-gray-700">{vendor?.name ?? '-'}</td>
                      <td className="px-4 py-3.5"><span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', SC[q.status])}>{q.status}</span></td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800">{fmtC(q.totalAmount)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{q.deliveryDays} days</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{fmt(q.submittedAt)}</td>
                      <td className="px-6 py-3.5 text-right"><button onClick={() => rfq && navigate(`/rfqs/${rfq.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
