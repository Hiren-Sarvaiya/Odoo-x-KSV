import { useNavigate } from 'react-router-dom';
import { FileText, ShoppingCart, Receipt, Clock, Plus, Store, BarChart2, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const SC: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-700', Quoted: 'bg-amber-100 text-amber-700', 'Under Review': 'bg-purple-100 text-purple-700',
  Closed: 'bg-gray-100 text-gray-600', Draft: 'bg-gray-100 text-gray-600', Issued: 'bg-blue-100 text-blue-700',
  Acknowledged: 'bg-indigo-100 text-indigo-700', Completed: 'bg-emerald-100 text-emerald-700',
  Sent: 'bg-cyan-100 text-cyan-700', Paid: 'bg-emerald-100 text-emerald-700', Overdue: 'bg-red-100 text-red-700',
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
    { title: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'text-amber-600 bg-amber-50', roles: ['Admin', 'Procurement Officer', 'Manager'] },
    { title: 'Active RFQs', value: activeRFQs, icon: FileText, color: 'text-blue-600 bg-blue-50', roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
    { title: 'Total POs', value: pos.length, icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50', roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
    { title: 'Total Invoices', value: invoices.length, icon: Receipt, color: 'text-emerald-600 bg-emerald-50', roles: ['Admin', 'Procurement Officer', 'Manager'] },
    { title: 'Active Vendors', value: vendors.filter((v) => v.status === 'Active').length, icon: Store, color: 'text-violet-600 bg-violet-50', roles: ['Admin', 'Procurement Officer'] },
    { title: 'Pending Invoices', value: invoices.filter((i) => i.status === 'Draft' || i.status === 'Sent').length, icon: TrendingUp, color: 'text-orange-600 bg-orange-50', roles: ['Admin', 'Procurement Officer', 'Manager'] },
  ].filter((c) => user && (c.roles as string[]).includes(user.role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <Card key={card.title} className="border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden relative group rounded-2xl">
            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", card.color.split(' ')[0].replace('text-', 'bg-'))} />
            <CardContent className="p-5 pl-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{card.title}</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', card.color)}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {user?.role !== 'Vendor' && user?.role !== 'Manager' && <Button onClick={() => navigate('/rfqs/new')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-sm hover:shadow transition-all"><Plus className="w-4 h-4" />Create RFQ</Button>}
        {(user?.role === 'Admin' || user?.role === 'Procurement Officer') && <Button onClick={() => navigate('/vendors')} variant="outline" className="gap-2 font-semibold hover:bg-slate-50 transition-colors"><Store className="w-4 h-4" />Add Vendor</Button>}
        {(user?.role === 'Admin' || user?.role === 'Manager') && <Button onClick={() => navigate('/reports')} variant="outline" className="gap-2 font-semibold hover:bg-slate-50 transition-colors"><BarChart2 className="w-4 h-4" />View Reports</Button>}
        {user?.role === 'Manager' && <Button onClick={() => navigate('/approvals')} className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold shadow-sm hover:shadow transition-all"><CheckCircle className="w-4 h-4" />Review Approvals</Button>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-150 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-50"><CardTitle className="text-base font-bold text-gray-800">Recent Purchase Orders</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentPOs.length === 0 ? <div className="px-6 py-12 text-center"><ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No purchase orders yet</p></div> :
              <div className="divide-y divide-gray-50">{recentPOs.map((po) => (
                <div key={po.id} className="px-6 py-4 hover:bg-blue-50/20 transition-all flex items-center justify-between cursor-pointer group" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                  <div><p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{po.poNumber}</p><p className="text-xs text-gray-500 mt-0.5">{vName(po.vendorId)} · {fmt(po.createdAt)}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-gray-800">{fmtC(po.total)}</p><span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider', SC[po.status])}>{po.status}</span></div>
                </div>
              ))}</div>}
          </CardContent>
        </Card>
        <Card className="border border-gray-150 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-50"><CardTitle className="text-base font-bold text-gray-800">Recent Invoices</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? <div className="px-6 py-12 text-center"><Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No invoices yet</p></div> :
              <div className="divide-y divide-gray-50">{recentInvoices.map((inv) => (
                <div key={inv.id} className="px-6 py-4 hover:bg-blue-50/20 transition-all flex items-center justify-between cursor-pointer group" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <div><p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{inv.invoiceNumber}</p><p className="text-xs text-gray-500 mt-0.5">{vName(inv.vendorId)} · {fmt(inv.createdAt)}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-gray-800">{fmtC(inv.total)}</p><span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider', SC[inv.status])}>{inv.status}</span></div>
                </div>
              ))}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
