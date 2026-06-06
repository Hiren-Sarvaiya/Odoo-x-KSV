// User roles
export type UserRole = 'Admin' | 'Procurement Officer' | 'Manager' | 'Vendor'

// User
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  password?: string
  isLoggedIn: boolean
}

// Vendor
export interface Vendor {
  id: string
  name: string
  category: string
  gstNumber: string
  email: string
  phone: string
  address: string
  status: 'Active' | 'Inactive' | 'Blacklisted'
  rating: number
  createdAt: string
  updatedAt: string
}

// RFQ Line Item
export interface RFQLineItem {
  id: string
  productName: string
  quantity: number
  unit: string
}

// RFQ
export interface RFQ {
  id: string
  title: string
  description: string
  deadline: string
  status: 'Open' | 'Quoted' | 'Under Review' | 'Closed'
  createdBy: string
  assignedVendors: string[]
  lineItems: RFQLineItem[]
  createdAt: string
  updatedAt: string
}

// Quotation Line Item
export interface QuotationLineItem {
  rfqLineItemId: string
  unitPrice: number
}

// Quotation
export interface Quotation {
  id: string
  rfqId: string
  vendorId: string
  status: 'Draft' | 'Submitted' | 'Selected' | 'Approved' | 'Rejected'
  lineItems: QuotationLineItem[]
  deliveryDays: number
  notes: string
  totalAmount: number
  remarks?: string
  createdAt: string
  updatedAt: string
}

// PO Line Item
export interface POLineItem {
  rfqLineItemId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
}

// Purchase Order
export interface PurchaseOrder {
  id: string
  poNumber: string
  quotationId: string
  rfqId: string
  vendorId: string
  status: 'Draft' | 'Issued' | 'Acknowledged' | 'Completed'
  lineItems: POLineItem[]
  subtotal: number
  gst: number
  total: number
  gstPercentage: number
  createdAt: string
  updatedAt: string
}

// Invoice
export interface Invoice {
  id: string
  invoiceNumber: string
  poId: string
  vendorId: string
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
  paymentStatus: 'Pending' | 'Paid'
  dueDate: string
  subtotal: number
  gst: number
  total: number
  createdAt: string
  updatedAt: string
}

// Activity Log
export interface ActivityLog {
  id: string
  action: string
  description: string
  actorId: string
  actorName: string
  timestamp: string
  entityType: string
  entityId: string
  icon?: string
}

// Notification
export interface Notification {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  entityId?: string
  entityType?: string
}

// Storage schema
export interface StorageData {
  users: User[]
  vendors: Vendor[]
  rfqs: RFQ[]
  quotations: Quotation[]
  purchaseOrders: PurchaseOrder[]
  invoices: Invoice[]
  activityLogs: ActivityLog[]
  notifications: Notification[]
  currentUser: User | null
}
