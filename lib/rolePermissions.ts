import { UserRole } from './types'

export type Permission =
  | 'view_dashboard'
  | 'manage_vendors'
  | 'create_rfq'
  | 'submit_quotation'
  | 'compare_quotations'
  | 'approve_quotations'
  | 'manage_users'
  | 'view_reports'
  | 'view_invoices'
  | 'generate_po'

export const rolePermissions: Record<UserRole, Permission[]> = {
  Admin: [
    'view_dashboard',
    'manage_vendors',
    'manage_users',
    'view_reports',
    'view_invoices',
  ],
  'Procurement Officer': [
    'view_dashboard',
    'manage_vendors',
    'create_rfq',
    'compare_quotations',
    'generate_po',
    'view_invoices',
  ],
  Manager: ['view_dashboard', 'approve_quotations', 'view_reports', 'view_invoices'],
  Vendor: ['view_dashboard', 'submit_quotation', 'view_invoices'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

export const roleMenuItems: Record<UserRole, { label: string; href: string; icon: string }[]> = {
  Admin: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Vendors', href: '/vendors', icon: 'Building2' },
    { label: 'Users', href: '/users', icon: 'Users' },
    { label: 'Reports', href: '/reports', icon: 'BarChart3' },
    { label: 'Activity Logs', href: '/activity-logs', icon: 'History' },
  ],
  'Procurement Officer': [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'RFQs', href: '/rfqs', icon: 'FileText' },
    { label: 'Quotations', href: '/quotations', icon: 'CheckCircle' },
    { label: 'Vendors', href: '/vendors', icon: 'Building2' },
    { label: 'POs', href: '/purchase-orders', icon: 'ShoppingCart' },
    { label: 'Invoices', href: '/invoices', icon: 'FileText' },
    { label: 'Activity Logs', href: '/activity-logs', icon: 'History' },
  ],
  Manager: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Approvals', href: '/approvals', icon: 'CheckCircle' },
    { label: 'Reports', href: '/reports', icon: 'BarChart3' },
    { label: 'Activity Logs', href: '/activity-logs', icon: 'History' },
  ],
  Vendor: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'RFQs', href: '/rfqs', icon: 'FileText' },
    { label: 'My Quotations', href: '/quotations', icon: 'CheckCircle' },
    { label: 'POs', href: '/purchase-orders', icon: 'ShoppingCart' },
    { label: 'Invoices', href: '/invoices', icon: 'FileText' },
  ],
}
