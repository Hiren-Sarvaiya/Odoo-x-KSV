'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  getQuotations,
  getRFQById,
  getVendorById,
  updateQuotation,
  addPurchaseOrder,
  generateId,
  generatePONumber,
} from '@/lib/storage'
import { Quotation, PurchaseOrder } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ApprovalsPage() {
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({})
  const [rejecting, setRejecting] = useState<string | null>(null)

  // Get pending quotations
  const allQuotations = getQuotations()
  const pendingQuotations = allQuotations.filter((q) => q.status === 'Selected')

  const handleApprove = (quotation: Quotation) => {
    try {
      // Update quotation status
      updateQuotation({
        ...quotation,
        status: 'Approved',
      })

      // Generate PO
      const rfq = getRFQById(quotation.rfqId)
      if (rfq) {
        const newPO: PurchaseOrder = {
          id: generateId(),
          poNumber: generatePONumber(),
          quotationId: quotation.id,
          rfqId: quotation.rfqId,
          vendorId: quotation.vendorId,
          status: 'Issued',
          lineItems: rfq.lineItems.map((item) => {
            const quotationItem = quotation.lineItems.find(
              (li) => li.rfqLineItemId === item.id
            )
            return {
              rfqLineItemId: item.id,
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: quotationItem?.unitPrice || 0,
            }
          }),
          subtotal: quotation.totalAmount,
          gst: quotation.totalAmount * 0.18,
          gstPercentage: 18,
          total: quotation.totalAmount * 1.18,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        addPurchaseOrder(newPO)
      }

      toast.success('Quotation approved and PO generated')
      setRemarks({ ...remarks, [quotation.id]: '' })
    } catch (error) {
      console.error('Error approving quotation:', error)
      toast.error('Failed to approve quotation')
    }
  }

  const handleReject = (quotation: Quotation) => {
    if (!remarks[quotation.id]) {
      toast.error('Please provide remarks for rejection')
      return
    }

    try {
      updateQuotation({
        ...quotation,
        status: 'Rejected',
        remarks: remarks[quotation.id],
      })

      toast.success('Quotation rejected')
      setRemarks({ ...remarks, [quotation.id]: '' })
      setRejecting(null)
    } catch (error) {
      console.error('Error rejecting quotation:', error)
      toast.error('Failed to reject quotation')
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve quotations</p>
        </div>

        {/* Pending Approvals */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Approvals ({pendingQuotations.length})
          </h2>

          {pendingQuotations.length > 0 ? (
            <div className="space-y-4">
              {pendingQuotations.map((quotation) => {
                const rfq = getRFQById(quotation.rfqId)
                const vendor = getVendorById(quotation.vendorId)

                return (
                  <div
                    key={quotation.id}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left: RFQ and Vendor Info */}
                      <div>
                        <p className="text-sm text-gray-600">RFQ</p>
                        <p className="font-medium text-gray-900">{rfq?.title}</p>

                        <p className="text-sm text-gray-600 mt-4">Vendor</p>
                        <p className="font-medium text-gray-900">{vendor?.name}</p>

                        <p className="text-sm text-gray-600 mt-4">Quotation Amount</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{quotation.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          + ₹{(quotation.totalAmount * 0.18).toLocaleString()} GST
                        </p>

                        <p className="text-sm text-gray-600 mt-4">Delivery</p>
                        <p className="font-medium text-gray-900">{quotation.deliveryDays} days</p>
                      </div>

                      {/* Middle: Line Items */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Line Items</p>
                        <div className="space-y-2">
                          {rfq?.lineItems.map((item) => {
                            const quotationItem = quotation.lineItems.find(
                              (li) => li.rfqLineItemId === item.id
                            )
                            return (
                              <div
                                key={item.id}
                                className="text-sm text-gray-700 pb-2 border-b border-gray-100"
                              >
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-gray-600">
                                  {item.quantity} {item.unit} × ₹
                                  {quotationItem?.unitPrice.toLocaleString()} = ₹
                                  {(
                                    item.quantity *
                                    (quotationItem?.unitPrice || 0)
                                  ).toLocaleString()}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Right: Notes and Actions */}
                      <div>
                        {quotation.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">Notes</p>
                            <p className="text-sm text-gray-900 mt-1">{quotation.notes}</p>
                          </div>
                        )}

                        {rejecting === quotation.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={remarks[quotation.id] || ''}
                              onChange={(e) =>
                                setRemarks({
                                  ...remarks,
                                  [quotation.id]: e.target.value,
                                })
                              }
                              placeholder="Enter rejection remarks..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReject(quotation)}
                                className="bg-red-600 hover:bg-red-700 flex-1"
                              >
                                Confirm Reject
                              </Button>
                              <Button
                                onClick={() => setRejecting(null)}
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(quotation)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle size={18} className="mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => setRejecting(quotation.id)}
                              variant="outline"
                              className="flex-1 text-red-600 hover:text-red-700"
                            >
                              <XCircle size={18} className="mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              <p>No quotations pending approval</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
