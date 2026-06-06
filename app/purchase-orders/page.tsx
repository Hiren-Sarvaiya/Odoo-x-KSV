'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getPurchaseOrders, getVendorById, addInvoice, generateId, generateInvoiceNumber } from '@/lib/storage'
import { Invoice } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Eye, FileText } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const purchaseOrders = getPurchaseOrders()

  const filteredPOs = purchaseOrders.filter((po) =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleGenerateInvoice = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId)
    if (!po) return

    try {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const newInvoice: Invoice = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber(),
        poId,
        vendorId: po.vendorId,
        status: 'Sent',
        paymentStatus: 'Pending',
        dueDate: dueDate.toISOString(),
        subtotal: po.subtotal,
        gst: po.gst,
        total: po.total,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addInvoice(newInvoice)
      toast.success('Invoice generated successfully')
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Failed to generate invoice')
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-2">View and manage purchase orders</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by PO number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* POs List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredPOs.length > 0 ? (
            filteredPOs.map((po) => {
              const vendor = getVendorById(po.vendorId)

              return (
                <div key={po.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {/* PO Info */}
                    <div>
                      <p className="text-sm text-gray-600">PO Number</p>
                      <p className="font-bold text-gray-900 text-lg mt-1">{po.poNumber}</p>
                      <p className="text-sm text-gray-600 mt-3">Vendor</p>
                      <p className="font-medium text-gray-900">{vendor?.name}</p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        ₹{po.subtotal.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-3">GST (18%)</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        ₹{po.gst.toLocaleString()}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-3">
                        Total: ₹{po.total.toLocaleString()}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                          po.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : po.status === 'Issued'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {po.status}
                      </span>

                      <p className="text-sm text-gray-600 mt-3">{po.lineItems.length} items</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Link href={`/purchase-orders/${po.id}`}>
                        <Button variant="outline" className="w-full">
                          <Eye size={18} className="mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleGenerateInvoice(po.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <FileText size={18} className="mr-2" />
                        Generate Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              <p>No purchase orders found</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
