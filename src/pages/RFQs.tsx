import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const SC: Record<string, string> = { Open: 'bg-blue-100 text-blue-700', Quoted: 'bg-amber-100 text-amber-700', 'Under Review': 'bg-purple-100 text-purple-700', Approved: 'bg-emerald-100 text-emerald-700', Closed: 'bg-gray-100 text-gray-600' };

export default function RFQs() {
  const { rfqs, vendors, quotations } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const myVendorId = vendors.find((v) => v.email === user?.email)?.id ?? '';
  const myRFQs = user?.role === 'Vendor' ? rfqs.filter((r) => r.assignedVendors.includes(myVendorId)) : rfqs;
  const sorted = [...myRFQs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isOverdue = (d: string) => new Date(d) < new Date();
  const qCount = (id: string) => quotations.filter((q) => q.rfqId === id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">{user?.role === 'Vendor' ? 'RFQ Invitations' : 'Request for Quotations'}</h1><p className="text-gray-500 text-sm mt-0.5">{myRFQs.length} RFQs total</p></div>
        {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && <Button onClick={() => navigate('/rfqs/new')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" />Create RFQ</Button>}
      </div>
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center"><FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No RFQs found</p>
          {(user?.role === 'Procurement Officer' || user?.role === 'Admin') && <Button onClick={() => navigate('/rfqs/new')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" />Create your first RFQ</Button>}
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map((rfq) => {
            const overdue = isOverdue(rfq.deadline) && rfq.status !== 'Closed';
            const qc = qCount(rfq.id);
            return (
              <div key={rfq.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
                onClick={() => user?.role === 'Vendor' ? navigate(`/rfqs/${rfq.id}/quote`) : navigate(`/rfqs/${rfq.id}`)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{rfq.title}</h3>
                      <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', SC[rfq.status])}>{rfq.status}</span>
                      {overdue && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">Overdue</span>}
                    </div>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-1">{rfq.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Deadline: {fmt(rfq.deadline)}</span>
                      <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{rfq.lineItems.length} items</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{rfq.assignedVendors.length} vendors</span>
                      {qc > 0 && <span className="text-blue-600 font-medium">{qc} quotation{qc !== 1 ? 's' : ''} received</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">{new Date(rfq.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
