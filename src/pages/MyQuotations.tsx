import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const SC: Record<string, string> = { Submitted: 'bg-amber-100 text-amber-700', 'Under Review': 'bg-purple-100 text-purple-700', Pending: 'bg-orange-100 text-orange-700', Selected: 'bg-blue-100 text-blue-700', Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700' };

export default function MyQuotations() {
  const { quotations, rfqs, vendors } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const myVendor = vendors.find((v) => v.email === user?.email);
  const myQ = quotations.filter((q) => q.vendorId === myVendor?.id).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const rfqById = (id: string) => rfqs.find((r) => r.id === id);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (!myVendor) return <div className="text-center py-20 text-gray-400"><Package className="w-10 h-10 mx-auto mb-3 text-gray-300" /><p className="font-medium text-gray-500">Vendor profile not found</p></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My Quotations</h1><p className="text-gray-500 text-sm mt-0.5">{myQ.length} submitted</p></div>
      {myQ.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No quotations yet</p><Button onClick={() => navigate('/rfqs')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">View RFQ Invitations</Button></div>
      ) : (
        <div className="grid gap-4">
          {myQ.map((q) => {
            const rfq = rfqById(q.rfqId);
            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap"><h3 className="font-semibold text-gray-900">{rfq?.title ?? 'Unknown RFQ'}</h3><span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', SC[q.status])}>{q.status}</span></div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div><p className="text-xs text-gray-400">Total Amount</p><p className="font-semibold text-gray-800">{fmtC(q.totalAmount)}</p></div>
                      <div><p className="text-xs text-gray-400">Delivery</p><p className="font-semibold text-gray-800">{q.deliveryDays} days</p></div>
                      <div><p className="text-xs text-gray-400">Submitted</p><p className="font-semibold text-gray-800">{fmt(q.submittedAt)}</p></div>
                    </div>
                    {q.notes && <p className="text-xs text-gray-400 mt-2 italic">"{q.notes}"</p>}
                  </div>
                  {q.status === 'Submitted' && <Button onClick={() => navigate(`/rfqs/${q.rfqId}/quote`)} size="sm" variant="outline">Edit</Button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
