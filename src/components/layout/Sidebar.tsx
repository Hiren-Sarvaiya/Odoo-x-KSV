import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, BarChart2, FileText, ShoppingCart, Receipt, CheckCircle, Bell, Package, ClipboardList, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import type { Role } from '../../types';

interface NavItem { label: string; path: string; icon: React.ComponentType<{ className?: string }>; roles: Role[]; }

const navItems: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard',       icon: LayoutDashboard, roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Vendors',         path: '/vendors',          icon: Store,           roles: ['Admin', 'Procurement Officer'] },
  { label: 'Users',           path: '/users',            icon: Users,           roles: ['Admin'] },
  { label: 'RFQs',            path: '/rfqs',             icon: FileText,        roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Quotations',      path: '/quotations',       icon: ClipboardList,   roles: ['Admin', 'Procurement Officer', 'Manager'] },
  { label: 'Purchase Orders', path: '/purchase-orders',  icon: ShoppingCart,    roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Invoices',        path: '/invoices',         icon: Receipt,         roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'Approvals',       path: '/approvals',        icon: CheckCircle,     roles: ['Admin', 'Manager'] },
  { label: 'Activity Logs',   path: '/activity-logs',    icon: Bell,            roles: ['Admin', 'Procurement Officer', 'Manager', 'Vendor'] },
  { label: 'My Quotations',   path: '/my-quotations',    icon: Package,         roles: ['Vendor'] },
  { label: 'Reports',         path: '/reports',          icon: BarChart2,       roles: ['Admin', 'Procurement Officer', 'Manager'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const filtered = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className={cn(
      'relative flex flex-col transition-all duration-300 min-h-screen flex-shrink-0 border-r border-slate-800/60',
      'bg-slate-900',
      collapsed ? 'w-[60px]' : 'w-56'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-slate-800/60 h-14 px-3 gap-2.5 flex-shrink-0'
      )}>
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow-sm">
          VB
        </div>
        {!collapsed && (
          <span className="font-semibold text-[15px] text-white tracking-tight whitespace-nowrap">
            VendorBridge
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-800 flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {filtered.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group',
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 pb-3 border-t border-slate-800/60 pt-3 flex-shrink-0 space-y-1">
        {!collapsed && user && (
          <div className="px-2.5 py-2 mb-1">
            <p className="text-[12px] font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
