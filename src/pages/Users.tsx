import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { db, genId } from '../lib/api';
import type { User, Role } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const ROLES: Role[] = ['Admin', 'Procurement Officer', 'Manager', 'Vendor'];
const RC: Record<Role, string> = { Admin: 'bg-rose-100 text-rose-700', 'Procurement Officer': 'bg-blue-100 text-blue-700', Manager: 'bg-amber-100 text-amber-700', Vendor: 'bg-emerald-100 text-emerald-700' };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Procurement Officer' as Role });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadUsers = async () => {
    try {
      const u = await db.getUsers();
      setUsers(u);
    } catch {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (users.find((u) => u.email === form.email)) e.email = 'Email already in use';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await db.upsertUser({ id: genId(), ...form });
      await loadUsers();
      toast.success('User created!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'Procurement Officer' });
    } catch {
      toast.error('Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-gray-500 text-sm mt-0.5">{users.length} users</p></div>
        <Button onClick={() => { setShowModal(true); setErrors({}); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" />Add User</Button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-6 py-3 font-semibold text-gray-600">User</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th><th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">{u.name[0]}</div><span className="font-medium text-gray-800">{u.name}</span></div></td>
                  <td className="px-4 py-3.5 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3.5"><span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', RC[u.role])}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Full Name *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div>
            <div><Label>Email *</Label><Input type="email" className="mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
            <div><Label>Password *</Label><Input type="password" className="mt-1" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}</div>
            <div><Label>Role *</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Create User</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
