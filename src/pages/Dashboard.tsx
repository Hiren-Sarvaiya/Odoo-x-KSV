import { useNavigate } from 'react-router-dom';
import { FileText, ShoppingCart, Receipt, Clock, Plus, Store, BarChart2, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const SC: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700', Quoted: 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-purple-100 text-purple-700', Closed: 'bg-gray-100 text-gray-600',
  Draft: 'bg-gray-100 text-gray-600', Issued: 'bg-blue-100 text-blue-700',
  Acknowledged: 'bg-indigo-100 text-indigo-700', Completed: 'bg-emerald-100 text-emerald-700',
  Sent: 'bg-cyan-100 text-cyan-700', Paid: 'bg-emerald-100 text-emerald-700',
  Overdue: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { rfqs, pos, invoices, vendors, approvals } = useData();
  const navigate = useNavigate();

  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const activeRFQs = rfqs.filter((r) => r.status === 'Open' || r.status === 'Quoted').length;
  const recentPOs = [...pos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const vName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id;

  const cards = [
    { title: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', roles: ['Admin', 'Procurement Officer', 'Manager'] },
    { title: 'Active RFQs', value: activeRFQs, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
    { title: 'Total POs', value: pos.length, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50', roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
    { title: 'Total Invoices', value: invoices.length, icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50', roles: ['Admin', 'Procurement Officer', 'Manager'] },
    { title: 'Active Vendors', value: vendors.filter((v) => v.status === 'Active').length, icon: Store, color: 'text-violet-600', bg: 'bg-violet-50', roles: ['Admin', 'Procurement Officer'] },
    { title: 'Pending Invoices', value: invoices.filter((i) => i.status === 'Draft' || i.status === 'Sent').length, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', roles: ['Admin', 'Procurement Officer', 'Manager'] },
  ].filter((c) => user && (c.roles as string[]).includes(user.role));

  return (
    <div className="space-y-7 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2 tabular-nums">{card.value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', card.bg)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {user?.role !== 'Vendor' && user?.role !== 'Manager' && (
          <Button onClick={() => navigate('/rfqs/new')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 text-sm font-semibold">
            <Plus className="w-4 h-4" />Create RFQ
          </Button>
        )}
        {(user?.role === 'Admin' || user?.role === 'Procurement Officer') && (
          <Button onClick={() => navigate('/vendors')} variant="outline" className="gap-2 h-9 text-sm font-semibold">
            <Store className="w-4 h-4" />Add Vendor
          </Button>
        )}
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <Button onClick={() => navigate('/reports')} variant="outline" className="gap-2 h-9 text-sm font-semibold">
            <BarChart2 className="w-4 h-4" />View Reports
          </Button>
        )}
        {user?.role === 'Manager' && (
          <Button onClick={() => navigate('/approvals')} className="bg-amber-600 hover:bg-amber-700 text-white gap-2 h-9 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />Review Approvals
          </Button>
        )}
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent POs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Recent Purchase Orders</h2>
          </div>
          {recentPOs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No purchase orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPOs.map((po) => (
                <div
                  key={po.id}
                  onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{po.poNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{vName(po.vendorId)} · {fmt(po.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{fmtC(po.total)}</p>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block', SC[po.status])}>
                      {po.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Recent Invoices</h2>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Receipt className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{vName(inv.vendorId)} · {fmt(inv.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{fmtC(inv.total)}</p>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block', SC[inv.status])}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
