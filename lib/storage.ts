import {
  StorageData,
  User,
  Vendor,
  RFQ,
  Quotation,
  PurchaseOrder,
  Invoice,
  ActivityLog,
  Notification,
} from './types'

const STORAGE_KEY = 'vendorbridge_data'
const USERS_KEY = 'vendorbridge_users'
const CURRENT_USER_KEY = 'vendorbridge_current_user'

// Get all data from localStorage
export function getAllData(): StorageData {
  if (typeof window === 'undefined') {
    return getDefaultData()
  }

  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('Failed to parse storage data:', e)
      return getDefaultData()
    }
  }
  return getDefaultData()
}

// Save all data to localStorage
export function saveAllData(data: StorageData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Get default/initial data
export function getDefaultData(): StorageData {
  return {
    users: [],
    vendors: [],
    rfqs: [],
    quotations: [],
    purchaseOrders: [],
    invoices: [],
    activityLogs: [],
    notifications: [],
    currentUser: null,
  }
}

// Initialize storage with demo data on first load
export function initializeStorage(): void {
  if (typeof window === 'undefined') return

  const existing = localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    const demoData = getDemoData()
    saveAllData(demoData)
  }
}

// Get demo data with initial state
function getDemoData(): StorageData {
  const now = new Date().toISOString()

  const demoUsers: User[] = [
    {
      id: 'user-1',
      email: 'admin@vendorbridge.com',
      name: 'Admin User',
      role: 'Admin',
      password: 'admin123',
      isLoggedIn: false,
      avatar: 'A',
    },
    {
      id: 'user-2',
      email: 'procurement@vendorbridge.com',
      name: 'John Procurement',
      role: 'Procurement Officer',
      password: 'procurement123',
      isLoggedIn: false,
      avatar: 'J',
    },
    {
      id: 'user-3',
      email: 'manager@vendorbridge.com',
      name: 'Sarah Manager',
      role: 'Manager',
      password: 'manager123',
      isLoggedIn: false,
      avatar: 'S',
    },
    {
      id: 'user-4',
      email: 'vendor@acmecorp.com',
      name: 'Acme Vendor',
      role: 'Vendor',
      password: 'vendor123',
      isLoggedIn: false,
      avatar: 'A',
    },
  ]

  const demoVendors: Vendor[] = [
    {
      id: 'vendor-1',
      name: 'Acme Corporation',
      category: 'Raw Materials',
      gstNumber: '27AABCT1234H1Z0',
      email: 'contact@acmecorp.com',
      phone: '+91-9999-999-999',
      address: '123 Business St, Mumbai, India',
      status: 'Active',
      rating: 4.5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vendor-2',
      name: 'Global Supplies Ltd',
      category: 'Components',
      gstNumber: '18AABCS1234H1Z0',
      email: 'sales@globalsupplies.com',
      phone: '+91-8888-888-888',
      address: '456 Trade Park, Bangalore, India',
      status: 'Active',
      rating: 4.2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vendor-3',
      name: 'FastShip Logistics',
      category: 'Logistics',
      gstNumber: '29AABCL1234H1Z0',
      email: 'shipping@fastship.com',
      phone: '+91-7777-777-777',
      address: '789 Port Area, Chennai, India',
      status: 'Active',
      rating: 4.8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vendor-4',
      name: 'TechParts International',
      category: 'Electronics',
      gstNumber: '35AABCT1234H1Z0',
      email: 'parts@techparts.com',
      phone: '+91-6666-666-666',
      address: '321 Tech Park, Hyderabad, India',
      status: 'Inactive',
      rating: 3.9,
      createdAt: now,
      updatedAt: now,
    },
  ]

  return {
    users: demoUsers,
    vendors: demoVendors,
    rfqs: [],
    quotations: [],
    purchaseOrders: [],
    invoices: [],
    activityLogs: [],
    notifications: [],
    currentUser: null,
  }
}

// User operations
export function getUserByEmail(email: string): User | undefined {
  const data = getAllData()
  return data.users.find((u) => u.email === email)
}

export function getUserById(id: string): User | undefined {
  const data = getAllData()
  return data.users.find((u) => u.id === id)
}

export function setCurrentUser(user: User | null): void {
  const data = getAllData()
  data.currentUser = user
  saveAllData(data)
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const userJson = localStorage.getItem(CURRENT_USER_KEY)
  if (userJson) {
    try {
      return JSON.parse(userJson)
    } catch (e) {
      return null
    }
  }
  return null
}

export function logout(): void {
  setCurrentUser(null)
}

// Vendor operations
export function getVendors(): Vendor[] {
  return getAllData().vendors
}

export function getVendorById(id: string): Vendor | undefined {
  return getVendors().find((v) => v.id === id)
}

export function addVendor(vendor: Vendor): void {
  const data = getAllData()
  data.vendors.push(vendor)
  saveAllData(data)
  addActivityLog({
    id: generateId(),
    action: 'Vendor Created',
    description: `Created vendor: ${vendor.name}`,
    actorId: getCurrentUser()?.id || '',
    actorName: getCurrentUser()?.name || 'Unknown',
    timestamp: new Date().toISOString(),
    entityType: 'Vendor',
    entityId: vendor.id,
    icon: 'Building2',
  })
}

export function updateVendor(vendor: Vendor): void {
  const data = getAllData()
  const index = data.vendors.findIndex((v) => v.id === vendor.id)
  if (index !== -1) {
    data.vendors[index] = vendor
    saveAllData(data)
  }
}

export function deleteVendor(id: string): void {
  const data = getAllData()
  data.vendors = data.vendors.filter((v) => v.id !== id)
  saveAllData(data)
}

// RFQ operations
export function getRFQs(): RFQ[] {
  return getAllData().rfqs
}

export function getRFQById(id: string): RFQ | undefined {
  return getRFQs().find((r) => r.id === id)
}

export function addRFQ(rfq: RFQ): void {
  const data = getAllData()
  data.rfqs.push(rfq)
  saveAllData(data)
  addActivityLog({
    id: generateId(),
    action: 'RFQ Created',
    description: `Created RFQ: ${rfq.title}`,
    actorId: getCurrentUser()?.id || '',
    actorName: getCurrentUser()?.name || 'Unknown',
    timestamp: new Date().toISOString(),
    entityType: 'RFQ',
    entityId: rfq.id,
    icon: 'FileText',
  })
}

export function updateRFQ(rfq: RFQ): void {
  const data = getAllData()
  const index = data.rfqs.findIndex((r) => r.id === rfq.id)
  if (index !== -1) {
    data.rfqs[index] = rfq
    saveAllData(data)
  }
}

// Quotation operations
export function getQuotations(): Quotation[] {
  return getAllData().quotations
}

export function getQuotationById(id: string): Quotation | undefined {
  return getQuotations().find((q) => q.id === id)
}

export function getQuotationsByRFQ(rfqId: string): Quotation[] {
  return getQuotations().filter((q) => q.rfqId === rfqId)
}

export function getQuotationsByVendor(vendorId: string): Quotation[] {
  return getQuotations().filter((q) => q.vendorId === vendorId)
}

export function addQuotation(quotation: Quotation): void {
  const data = getAllData()
  data.quotations.push(quotation)
  saveAllData(data)
  addActivityLog({
    id: generateId(),
    action: 'Quotation Submitted',
    description: `Quotation submitted for RFQ`,
    actorId: getCurrentUser()?.id || '',
    actorName: getCurrentUser()?.name || 'Unknown',
    timestamp: new Date().toISOString(),
    entityType: 'Quotation',
    entityId: quotation.id,
    icon: 'FileText',
  })
}

export function updateQuotation(quotation: Quotation): void {
  const data = getAllData()
  const index = data.quotations.findIndex((q) => q.id === quotation.id)
  if (index !== -1) {
    data.quotations[index] = quotation
    saveAllData(data)
  }
}

// Purchase Order operations
export function getPurchaseOrders(): PurchaseOrder[] {
  return getAllData().purchaseOrders
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return getPurchaseOrders().find((p) => p.id === id)
}

export function addPurchaseOrder(po: PurchaseOrder): void {
  const data = getAllData()
  data.purchaseOrders.push(po)
  saveAllData(data)
  addActivityLog({
    id: generateId(),
    action: 'Purchase Order Generated',
    description: `Generated PO: ${po.poNumber}`,
    actorId: getCurrentUser()?.id || '',
    actorName: getCurrentUser()?.name || 'Unknown',
    timestamp: new Date().toISOString(),
    entityType: 'PurchaseOrder',
    entityId: po.id,
    icon: 'ShoppingCart',
  })
}

export function updatePurchaseOrder(po: PurchaseOrder): void {
  const data = getAllData()
  const index = data.purchaseOrders.findIndex((p) => p.id === po.id)
  if (index !== -1) {
    data.purchaseOrders[index] = po
    saveAllData(data)
  }
}

// Invoice operations
export function getInvoices(): Invoice[] {
  return getAllData().invoices
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find((i) => i.id === id)
}

export function getInvoicesByVendor(vendorId: string): Invoice[] {
  return getInvoices().filter((i) => i.vendorId === vendorId)
}

export function addInvoice(invoice: Invoice): void {
  const data = getAllData()
  data.invoices.push(invoice)
  saveAllData(data)
  addActivityLog({
    id: generateId(),
    action: 'Invoice Generated',
    description: `Generated Invoice: ${invoice.invoiceNumber}`,
    actorId: getCurrentUser()?.id || '',
    actorName: getCurrentUser()?.name || 'Unknown',
    timestamp: new Date().toISOString(),
    entityType: 'Invoice',
    entityId: invoice.id,
    icon: 'FileText',
  })
}

export function updateInvoice(invoice: Invoice): void {
  const data = getAllData()
  const index = data.invoices.findIndex((i) => i.id === invoice.id)
  if (index !== -1) {
    data.invoices[index] = invoice
    saveAllData(data)
  }
}

// Activity Log operations
export function getActivityLogs(): ActivityLog[] {
  return getAllData().activityLogs
}

export function addActivityLog(log: ActivityLog): void {
  const data = getAllData()
  data.activityLogs.push(log)
  saveAllData(data)
}

// Notification operations
export function getNotifications(): Notification[] {
  return getAllData().notifications
}

export function addNotification(notification: Notification): void {
  const data = getAllData()
  data.notifications.push(notification)
  saveAllData(data)
}

export function markNotificationAsRead(id: string): void {
  const data = getAllData()
  const notification = data.notifications.find((n) => n.id === id)
  if (notification) {
    notification.read = true
    saveAllData(data)
  }
}

export function markAllNotificationsAsRead(): void {
  const data = getAllData()
  data.notifications.forEach((n) => {
    n.read = true
  })
  saveAllData(data)
}

// Utility functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generatePONumber(): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0].replace(/-/g, '')
  const count = getPurchaseOrders().length + 1
  return `PO-${date}-${String(count).padStart(3, '0')}`
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0].replace(/-/g, '')
  const count = getInvoices().length + 1
  return `INV-${date}-${String(count).padStart(3, '0')}`
}
