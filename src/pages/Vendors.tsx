import { useState } from 'react';
import { Plus, Search, Star, MoreVertical, Building2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { genId } from '../lib/storage';
import type { Vendor, VendorStatus, VendorCategory } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { cn } from '../lib/utils';

const CATS: VendorCategory[] = ['IT', 'Office Supplies', 'Logistics', 'Furniture', 'Services'];
const STATS: VendorStatus[] = ['Active', 'Inactive', 'Blacklisted'];
const SC: Record<VendorStatus, string> = { Active: 'bg-emerald-100 text-emerald-700', Inactive: 'bg-gray-100 text-gray-600', Blacklisted: 'bg-red-100 text-red-700' };
const empty = (): Omit<Vendor, 'id' | 'createdAt' | 'rating'> => ({ name: '', category: 'IT', gstNumber: '', email: '', phone: '', address: '', status: 'Active' });

function Stars({ r }: { r: number }) {
  return <div className="flex items-center gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} className={cn('w-3.5 h-3.5', s <= Math.round(r) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200')} />)}<span className="text-xs text-gray-500 ml-1">{r.toFixed(1)}</span></div>;
}

export default function Vendors() {
  const { vendors, upsertVendor, removeVendor, addLog } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(empty());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = vendors.filter((v) => {
    const ms = v.name.toLowerCase().includes(search.toLowerCase()) || v.gstNumber.toLowerCase().includes(search.toLowerCase());
    return ms && (filterCat === 'all' || v.category === filterCat) && (filterStatus === 'all' || v.status === filterStatus);
  });

  const openAdd = () => { setEditing(null); setForm(empty()); setErrors({}); setShowModal(true); };
  const openEdit = (v: Vendor) => { setEditing(v); setForm({ name: v.name, category: v.category, gstNumber: v.gstNumber, email: v.email, phone: v.phone, address: v.address, status: v.status }); setErrors({}); setShowModal(true); setOpenMenu(null); };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.gstNumber.trim()) e.gstNumber = 'GST number is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const v: Vendor = { id: editing?.id ?? genId(), ...form, category: form.category as VendorCategory, status: form.status as VendorStatus, rating: editing?.rating ?? 4.0, createdAt: editing?.createdAt ?? new Date().toISOString() };
    try {
      await upsertVendor(v);
      await addLog(editing ? `Vendor ${v.name} updated` : `Vendor ${v.name} added`, 'vendor', v.id);
      toast.success(editing ? 'Vendor updated!' : 'Vendor added!');
      setShowModal(false);
    } catch {
      toast.error('Failed to save vendor');
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Procurement Officer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1><p className="text-gray-500 text-sm mt-0.5">{vendors.length} vendors registered</p></div>
        {canEdit && <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" />Add Vendor</Button>}
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search by name or GST..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={filterCat} onValueChange={setFilterCat}><SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{STATS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center"><Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">No vendors found</p><p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-6 py-3 font-semibold text-gray-600">Vendor</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th><th className="text-left px-4 py-3 font-semibold text-gray-600">GST Number</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Rating</th>{canEdit && <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><span className="text-blue-700 font-bold text-sm">{v.name[0]}</span></div><div><p className="font-medium text-gray-800">{v.name}</p><p className="text-xs text-gray-400">{v.email}</p></div></div></td>
                    <td className="px-4 py-4"><span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{v.category}</span></td>
                    <td className="px-4 py-4 text-gray-600 font-mono text-xs">{v.gstNumber}</td>
                    <td className="px-4 py-4"><span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', SC[v.status])}>{v.status}</span></td>
                    <td className="px-4 py-4"><Stars r={v.rating} /></td>
                    {canEdit && <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button onClick={() => setOpenMenu(openMenu === v.id ? null : v.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                        {openMenu === v.id && (<><div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} /><div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1"><button onClick={() => openEdit(v)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Pencil className="w-3.5 h-3.5" />Edit</button><button onClick={async () => { try { await removeVendor(v.id); await addLog(`Vendor ${v.name} removed`, 'vendor', v.id); toast.success('Vendor removed'); } catch { toast.error('Failed to remove vendor'); } setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" />Remove</button></div></>)}
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Company Name *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div>
              <div><Label>Category *</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as VendorCategory })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status *</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VendorStatus })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{STATS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>GST Number *</Label><Input className="mt-1" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />{errors.gstNumber && <p className="text-xs text-red-500 mt-1">{errors.gstNumber}</p>}</div>
              <div><Label>Phone *</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />{errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}</div>
              <div className="col-span-2"><Label>Email *</Label><Input type="email" className="mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
              <div className="col-span-2"><Label>Address</Label><Input className="mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">{editing ? 'Save Changes' : 'Add Vendor'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
