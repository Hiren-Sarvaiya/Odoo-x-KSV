'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  getPurchaseOrders,
  getInvoices,
  getVendors,
  getQuotations,
} from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const purchaseOrders = getPurchaseOrders()
  const invoices = getInvoices()
  const vendors = getVendors()
  const quotations = getQuotations()

  // Calculate metrics
  const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.total, 0)
  const avgPOValue = purchaseOrders.length > 0 ? totalSpend / purchaseOrders.length : 0
  const topVendor = vendors.reduce((top, v) => 
    (purchaseOrders.filter(po => po.vendorId === v.id).length > 
     purchaseOrders.filter(po => po.vendorId === top.id).length) ? v : top
  )
  const pendingInvoices = invoices.filter(i => i.paymentStatus === 'Pending').length

  // Monthly spend data
  const monthlyData = [
    { month: 'Jan', spend: 45000 },
    { month: 'Feb', spend: 52000 },
    { month: 'Mar', spend: 48000 },
    { month: 'Apr', spend: 61000 },
    { month: 'May', spend: 55000 },
    { month: 'Jun', spend: 67000 },
  ]

  // Spend by category
  const categoryData = [
    { name: 'Raw Materials', value: 120000, color: '#3B82F6' },
    { name: 'Components', value: 85000, color: '#8B5CF6' },
    { name: 'Services', value: 45000, color: '#EC4899' },
    { name: 'Logistics', value: 38000, color: '#F59E0B' },
  ]

  // Vendor performance
  const vendorPerformance = vendors
    .filter(v => v.status === 'Active')
    .map(v => {
      const vendorPOs = purchaseOrders.filter(po => po.vendorId === v.id)
      return {
        name: v.name,
        totalPOs: vendorPOs.length,
        totalAmount: vendorPOs.reduce((sum, po) => sum + po.total, 0),
        avgDeliveryDays: 5, // Mock data
        rating: v.rating,
      }
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)

  const handleExportCSV = () => {
    toast.success('Report exported as CSV')
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Procurement metrics and insights</p>
          </div>
          <Button onClick={handleExportCSV} className="bg-blue-600 hover:bg-blue-700">
            <Download size={18} className="mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Total Spend</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ₹{(totalSpend / 100000).toFixed(1)}L
            </p>
            <p className="text-xs text-gray-600 mt-2">{purchaseOrders.length} POs</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Avg PO Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ₹{(avgPOValue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-600 mt-2">Across all orders</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Top Vendor</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{topVendor.name}</p>
            <p className="text-xs text-gray-600 mt-2">★ {topVendor.rating.toFixed(1)}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Pending Invoices</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{pendingInvoices}</p>
            <p className="text-xs text-gray-600 mt-2">Awaiting payment</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spend Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Bar dataKey="spend" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Spend by Category Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Spend by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Performance Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vendor Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Vendor Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Total POs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Avg Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendorPerformance.map((vendor) => (
                  <tr key={vendor.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 text-gray-700">{vendor.totalPOs}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ₹{(vendor.totalAmount / 100000).toFixed(1)}L
                    </td>
                    <td className="px-6 py-4 text-gray-700">{vendor.avgDeliveryDays} days</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 fill-yellow-400">★</span>
                        <span className="text-gray-900 font-medium">{vendor.rating.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
