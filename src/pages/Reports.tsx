import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const COLORS = ['#1D4ED8', '#0891B2', '#0D9488', '#D97706', '#7C3AED', '#DB2777'];

export default function Reports() {
  const { pos, invoices, vendors } = useData();
  const fmtC = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const totalSpend = pos.reduce((s, p) => s + p.total, 0);
  const avgPO = pos.length ? totalSpend / pos.length : 0;
  const pendingInv = invoices.filter((i) => i.status === 'Draft' || i.status === 'Sent').length;
  const vendorSpend: Record<string, number> = {};
  pos.forEach((p) => { vendorSpend[p.vendorId] = (vendorSpend[p.vendorId] ?? 0) + p.total; });
  const topV = vendors.find((v) => v.id === Object.entries(vendorSpend).sort((a, b) => b[1] - a[1])[0]?.[0]);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const spend = pos.filter((p) => { const pd = new Date(p.createdAt); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear(); }).reduce((s, p) => s + p.total, 0);
    return { month, spend };
  });

  const catSpend: Record<string, number> = {};
  pos.forEach((p) => { const cat = vendors.find((v) => v.id === p.vendorId)?.category ?? 'Other'; catSpend[cat] = (catSpend[cat] ?? 0) + p.total; });
  const pieData = Object.entries(catSpend).map(([name, value]) => ({ name, value }));

  const vendorPerf = vendors.map((v) => {
    const vPOs = pos.filter((p) => p.vendorId === v.id);
    return { id: v.id, name: v.name, category: v.category, totalPOs: vPOs.length, totalSpend: vPOs.reduce((s, p) => s + p.total, 0), rating: v.rating };
  }).filter((v) => v.totalPOs > 0).sort((a, b) => b.totalSpend - a.totalSpend);

  const handleCSV = () => {
    const h = ['Vendor', 'Category', 'Total POs', 'Total Spend', 'Rating'];
    const rows = vendorPerf.map((v) => [v.name, v.category, v.totalPOs, v.totalSpend.toFixed(2), v.rating]);
    const csv = [h, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'vendor_report.csv'; a.click();
  };

  const statCards = [
    { title: 'Total Spend', value: fmtC(totalSpend), icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
    { title: 'Avg PO Value', value: fmtC(avgPO), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Top Vendor', value: topV?.name ?? 'N/A', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
    { title: 'Pending Invoices', value: String(pendingInv), icon: Clock, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-gray-500 text-sm mt-0.5">Procurement performance overview</p></div><Button onClick={handleCSV} variant="outline">Export CSV</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between"><div className="min-w-0"><p className="text-sm text-gray-500 font-medium">{card.title}</p><p className="text-xl font-bold text-gray-900 mt-1 truncate">{card.value}</p></div><div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', card.color)}><card.icon className="w-6 h-6" /></div></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-gray-800">Monthly Procurement Spend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmtC(v), 'Spend']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="spend" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold text-gray-800">Spend by Category</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data yet</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => fmtC(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }} /><Legend /></PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base font-semibold text-gray-800">Vendor Performance</CardTitle></CardHeader>
        <CardContent className="p-0">
          {vendorPerf.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">No vendor purchase data yet</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-6 py-3 font-semibold text-gray-600">Vendor</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th><th className="text-right px-4 py-3 font-semibold text-gray-600">Total POs</th><th className="text-right px-4 py-3 font-semibold text-gray-600">Total Spend</th><th className="text-right px-6 py-3 font-semibold text-gray-600">Rating</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{vendorPerf.map((v) => <tr key={v.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-3.5 font-medium text-gray-800">{v.name}</td><td className="px-4 py-3.5"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{v.category}</span></td><td className="px-4 py-3.5 text-right text-gray-700">{v.totalPOs}</td><td className="px-4 py-3.5 text-right font-semibold text-gray-800">{fmtC(v.totalSpend)}</td><td className="px-6 py-3.5 text-right"><span className="text-amber-500">{'★'.repeat(Math.round(v.rating))}</span><span className="text-gray-300">{'★'.repeat(5 - Math.round(v.rating))}</span><span className="text-xs text-gray-500 ml-1">{v.rating}</span></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
