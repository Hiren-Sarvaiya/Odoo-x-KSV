'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import {
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  getPurchaseOrders,
  getInvoices,
  getRFQs,
  getQuotations,
} from '@/lib/storage'

export default function DashboardPage() {
  const { user } = useAuth()

  const purchaseOrders = getPurchaseOrders()
  const invoices = getInvoices()
  const rfqs = getRFQs()
  const quotations = getQuotations()

  // Calculate metrics based on role
  const pendingApprovals = quotations.filter((q) => q.status === 'Submitted').length
  const activeRFQs = rfqs.filter((r) => r.status === 'Open').length
  const totalPOs = purchaseOrders.length
  const totalInvoices = invoices.length

  // Get recent data
  const recentPOs = purchaseOrders.slice(-5).reverse()
  const recentInvoices = invoices.slice(-5).reverse()

  // Get role-specific metrics
  const getMetrics = () => {
    switch (user?.role) {
      case 'Admin':
        return [
          {
            label: 'Total Vendors',
            value: '12',
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
          },
          {
            label: 'Active RFQs',
            value: activeRFQs,
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
          },
          {
            label: 'Total POs',
            value: totalPOs,
            icon: ShoppingCart,
            color: 'bg-purple-100 text-purple-600',
          },
          {
            label: 'Total Invoices',
            value: totalInvoices,
            icon: FileText,
            color: 'bg-orange-100 text-orange-600',
          },
        ]
      case 'Procurement Officer':
        return [
          {
            label: 'Active RFQs',
            value: activeRFQs,
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
          },
          {
            label: 'Pending Quotations',
            value: quotations.filter((q) => q.status === 'Submitted').length,
            icon: CheckCircle,
            color: 'bg-amber-100 text-amber-600',
          },
          {
            label: 'Total POs',
            value: totalPOs,
            icon: ShoppingCart,
            color: 'bg-purple-100 text-purple-600',
          },
          {
            label: 'Invoices',
            value: totalInvoices,
            icon: FileText,
            color: 'bg-orange-100 text-orange-600',
          },
        ]
      case 'Manager':
        return [
          {
            label: 'Pending Approvals',
            value: pendingApprovals,
            icon: AlertCircle,
            color: 'bg-red-100 text-red-600',
          },
          {
            label: 'Total POs',
            value: totalPOs,
            icon: ShoppingCart,
            color: 'bg-purple-100 text-purple-600',
          },
          {
            label: 'Total Invoices',
            value: totalInvoices,
            icon: FileText,
            color: 'bg-orange-100 text-orange-600',
          },
          {
            label: 'Overdue Invoices',
            value: invoices.filter((i) => i.status === 'Overdue').length,
            icon: Clock,
            color: 'bg-red-100 text-red-600',
          },
        ]
      case 'Vendor':
        return [
          {
            label: 'Active RFQs',
            value: activeRFQs,
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
          },
          {
            label: 'My Quotations',
            value: quotations.length,
            icon: CheckCircle,
            color: 'bg-green-100 text-green-600',
          },
          {
            label: 'Purchase Orders',
            value: totalPOs,
            icon: ShoppingCart,
            color: 'bg-purple-100 text-purple-600',
          },
          {
            label: 'Invoices Due',
            value: invoices.filter((i) => i.status === 'Draft').length,
            icon: AlertCircle,
            color: 'bg-orange-100 text-orange-600',
          },
        ]
      default:
        return []
    }
  }

  const metrics = getMetrics()

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">Here&apos;s your procurement dashboard</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        {user?.role === 'Procurement Officer' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/rfqs/create">
                <Button className="bg-blue-600 hover:bg-blue-700">Create RFQ</Button>
              </Link>
              <Link href="/vendors">
                <Button variant="outline">Add Vendor</Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline">View Reports</Button>
              </Link>
            </div>
          </div>
        )}

        {user?.role === 'Manager' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/approvals">
                <Button className="bg-blue-600 hover:bg-blue-700">Review Approvals</Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline">View Reports</Button>
              </Link>
            </div>
          </div>
        )}

        {user?.role === 'Admin' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/vendors">
                <Button variant="outline">Manage Vendors</Button>
              </Link>
              <Link href="/reports">
                <Button className="bg-blue-600 hover:bg-blue-700">View Reports</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Recent POs and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent POs */}
          {(user?.role === 'Procurement Officer' || user?.role === 'Admin' || user?.role === 'Manager') && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h2>
                <Link href="/purchase-orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              {recentPOs.length > 0 ? (
                <div className="space-y-3">
                  {recentPOs.map((po) => (
                    <div key={po.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{po.poNumber}</p>
                        <p className="text-sm text-gray-600">₹{po.total.toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        po.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        po.status === 'Issued' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm text-center py-8">No purchase orders yet</p>
              )}
            </div>
          )}

          {/* Recent Invoices */}
          {(user?.role === 'Procurement Officer' || user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Vendor') && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
                <Link href="/invoices" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              {recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">₹{invoice.total.toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {invoice.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm text-center py-8">No invoices yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
