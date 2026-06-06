export type Role = 'Admin' | 'Procurement Officer' | 'Manager' | 'Vendor';
export type VendorStatus = 'Active' | 'Inactive' | 'Blacklisted';
export type VendorCategory = 'IT' | 'Office Supplies' | 'Logistics' | 'Furniture' | 'Services';
export type RFQStatus = 'Open' | 'Quoted' | 'Under Review' | 'Approved' | 'Closed';
export type QuotationStatus = 'Submitted' | 'Under Review' | 'Selected' | 'Approved' | 'Rejected' | 'Pending';
export type POStatus = 'Draft' | 'Issued' | 'Acknowledged' | 'Completed';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  gstNumber: string;
  email: string;
  phone: string;
  address: string;
  status: VendorStatus;
  rating: number;
  createdAt: string;
}

export interface RFQLineItem {
  id: string;
  product: string;
  quantity: number;
  unit: string;
}

export interface RFQ {
  id: string;
  title: string;
  description: string;
  deadline: string;
  lineItems: RFQLineItem[];
  assignedVendors: string[];
  status: RFQStatus;
  createdBy: string;
  createdAt: string;
  attachments?: Array<{ name: string; size: number; type: string; dataUrl: string }>;
}

export interface QuotationLineItem {
  rfqItemId: string;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  lineItems: QuotationLineItem[];
  deliveryDays: number;
  notes: string;
  status: QuotationStatus;
  submittedAt: string;
  submittedBy: string;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  rfqId: string;
  quotationId: string;
  vendorId: string;
  lineItems: Array<{ product: string; quantity: number; unit: string; unitPrice: number; total: number }>;
  subtotal: number;
  gst: number;
  total: number;
  status: POStatus;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  vendorId: string;
  lineItems: Array<{ product: string; quantity: number; unit: string; unitPrice: number; total: number }>;
  subtotal: number;
  gst: number;
  total: number;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  actorName: string;
  actorId: string;
  type: 'rfq' | 'quotation' | 'po' | 'invoice' | 'vendor' | 'approval' | 'auth';
  timestamp: string;
  referenceId?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: ActivityLog['type'];
}

export interface Approval {
  id: string;
  quotationId: string;
  rfqId: string;
  rfqTitle: string;
  vendorName: string;
  totalAmount: number;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks: string;
  decidedAt: string | null;
}
