import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, BarChart2, FileText, ShoppingCart, Receipt, CheckCircle, Bell, Package, ClipboardList, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import type { Role } from '../../types';

interface NavItem { label: string; path: string; icon: React.ComponentType<{ className?: string }>; roles: Role[]; }

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Vendors', path: '/vendors', icon: Store, roles: ['Admin', 'Procurement Officer'] },
  { label: 'Users', path: '/users', icon: Users, roles: ['Admin'] },
  { label: 'RFQs', path: '/rfqs', icon: FileText, roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Quotations', path: '/quotations', icon: ClipboardList, roles: ['Admin', 'Procurement Officer', 'Manager'] },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Invoices', path: '/invoices', icon: Receipt, roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Approvals', path: '/approvals', icon: CheckCircle, roles: ['Admin', 'Manager'] },
  { label: 'Activity Logs', path: '/activity-logs', icon: Bell, roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'My Quotations', path: '/my-quotations', icon: Package, roles: ['Vendor'] },
  { label: 'Reports', path: '/reports', icon: BarChart2, roles: ['Admin', 'Procurement Officer', 'Manager'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const filtered = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className={cn('relative flex flex-col bg-[#0f172a] text-white transition-all duration-300 min-h-screen flex-shrink-0', collapsed ? 'w-16' : 'w-60')}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">VB</div>
            <span className="font-semibold text-base tracking-tight">VendorBridge</span>
          </div>
        )}
        {collapsed && <div className="w-8 h-8 mx-auto rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">VB</div>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-white/40 hover:text-white transition-colors ml-auto flex-shrink-0">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {filtered.map((item) => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150', isActive ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10')}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4 border-t border-white/10 pt-4 flex-shrink-0">
        <button onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
