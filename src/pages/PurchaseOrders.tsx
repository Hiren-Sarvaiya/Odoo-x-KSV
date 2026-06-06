import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import type { POStatus } from '../types';

const SC: Record<POStatus, string> = { Draft: 'bg-gray-100 text-gray-600', Issued: 'bg-blue-100 text-blue-700', Acknowledged: 'bg-indigo-100 text-indigo-700', Completed: 'bg-emerald-100 text-emerald-700' };

export default function PurchaseOrders() {
  const { pos, vendors, rfqs } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const myVId = vendors.find((v) => v.email === user?.email)?.id ?? '';
  const myPOs = user?.role === 'Vendor' ? pos.filter((p) => p.vendorId === myVId) : pos;
  const sorted = [...myPOs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const vById = (id: string) => vendors.find((v) => v.id === id);
  const rfqById = (id: string) => rfqs.find((r) => r.id === id);
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1><p className="text-gray-500 text-sm mt-0.5">{sorted.length} total</p></div>
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center"><ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No purchase orders yet</p><p className="text-gray-400 text-sm mt-1">POs are generated when quotations are approved</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-6 py-3 font-semibold text-gray-600">PO Number</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Vendor</th><th className="text-left px-4 py-3 font-semibold text-gray-600">RFQ</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th><th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th><th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5"><span className="font-mono text-sm font-semibold text-gray-800">{po.poNumber}</span></td>
                    <td className="px-4 py-3.5 text-gray-700">{vById(po.vendorId)?.name ?? po.vendorId}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{rfqById(po.rfqId)?.title ?? '-'}</td>
                    <td className="px-4 py-3.5"><span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', SC[po.status])}>{po.status}</span></td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-800">{fmtC(po.total)}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{fmt(po.createdAt)}</td>
                    <td className="px-6 py-3.5 text-right"><button onClick={() => navigate(`/purchase-orders/${po.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
