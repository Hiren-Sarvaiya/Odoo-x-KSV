'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import {
  getRFQById,
  getQuotationsByRFQ,
  getQuotationById,
  updateQuotation,
  addQuotation,
  getVendorById,
  generateId,
} from '@/lib/storage'
import { Quotation, RFQ } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function RFQDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const rfqId = params.id as string

  const rfq = getRFQById(rfqId) as RFQ | undefined
  const quotations = getQuotationsByRFQ(rfqId)
  const [showQuotationForm, setShowQuotationForm] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)

  const [quotationForm, setQuotationForm] = useState<{
    [key: string]: number | undefined
  }>({})

  const [deliveryDays, setDeliveryDays] = useState(0)
  const [notes, setNotes] = useState('')

  if (!rfq) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <p className="text-gray-600">RFQ not found</p>
        </div>
      </ProtectedRoute>
    )
  }

  const isVendorAssigned = rfq.assignedVendors.includes(user?.id || '')
  const vendorQuotation = quotations.find((q) => q.vendorId === user?.id)

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (Object.values(quotationForm).some((v) => v === undefined || v <= 0)) {
      toast.error('Please fill in all prices')
      return
    }

    if (deliveryDays <= 0) {
      toast.error('Please enter valid delivery days')
      return
    }

    try {
      const lineItems = rfq.lineItems.map((item) => ({
        rfqLineItemId: item.id,
        unitPrice: quotationForm[item.id] || 0,
      }))

      const totalAmount = lineItems.reduce(
        (sum, item) => sum + item.unitPrice * rfq.lineItems.find((l) => l.id === item.rfqLineItemId)!.quantity,
        0
      )

      if (editingQuotation) {
        const updated: Quotation = {
          ...editingQuotation,
          lineItems,
          deliveryDays,
          notes,
          totalAmount,
          updatedAt: new Date().toISOString(),
        }
        updateQuotation(updated)
        toast.success('Quotation updated successfully')
      } else {
        const newQuotation: Quotation = {
          id: generateId(),
          rfqId,
          vendorId: user?.id || '',
          status: 'Submitted',
          lineItems,
          deliveryDays,
          notes,
          totalAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        addQuotation(newQuotation)
        toast.success('Quotation submitted successfully')
      }

      setShowQuotationForm(false)
      setQuotationForm({})
      setDeliveryDays(0)
      setNotes('')
      setEditingQuotation(null)
    } catch (error) {
      toast.error('Failed to submit quotation')
      console.error('Error:', error)
    }
  }

  const handleEditQuotation = () => {
    if (vendorQuotation) {
      setEditingQuotation(vendorQuotation)
      setShowQuotationForm(true)
      const form: { [key: string]: number } = {}
      vendorQuotation.lineItems.forEach((item) => {
        form[item.rfqLineItemId] = item.unitPrice
      })
      setQuotationForm(form)
      setDeliveryDays(vendorQuotation.deliveryDays)
      setNotes(vendorQuotation.notes)
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/rfqs">
            <Button variant="outline" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{rfq.title}</h1>
            <p className="text-gray-600 mt-1">RFQ ID: {rfq.id.substring(0, 12)}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-medium text-sm ${
              rfq.status === 'Open'
                ? 'bg-blue-100 text-blue-700'
                : rfq.status === 'Quoted'
                  ? 'bg-purple-100 text-purple-700'
                  : rfq.status === 'Under Review'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
            }`}
          >
            {rfq.status}
          </span>
        </div>

        {/* Description and Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium text-gray-900 mt-1">{rfq.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deadline</p>
              <p className="font-medium text-gray-900 mt-1">{new Date(rfq.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Line Items</p>
              <p className="font-medium text-gray-900 mt-1">{rfq.lineItems.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quotations Received</p>
              <p className="font-medium text-gray-900 mt-1">{quotations.length}</p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rfq.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 text-gray-700">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-700">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Quotation Form - Only for assigned vendors */}
        {isVendorAssigned && user?.role === 'Vendor' && (
          <>
            {!showQuotationForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {vendorQuotation ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">Your quotation submitted</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Status: {vendorQuotation.status}
                      </p>
                    </div>
                    <Button
                      onClick={handleEditQuotation}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Edit Quotation
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-blue-900">
                      You are assigned to this RFQ. Submit your quotation now.
                    </p>
                    <Button
                      onClick={() => {
                        setShowQuotationForm(true)
                        setQuotationForm(
                          Object.fromEntries(rfq.lineItems.map((item) => [item.id, 0]))
                        )
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus size={18} className="mr-2" />
                      Submit Quotation
                    </Button>
                  </div>
                )}
              </div>
            )}

            {showQuotationForm && (
              <form onSubmit={handleSubmitQuotation} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingQuotation ? 'Edit Your Quotation' : 'Submit Quotation'}
                </h3>

                {/* Unit Prices */}
                <div className="space-y-3">
                  {rfq.lineItems.map((item) => (
                    <div key={item.id} className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {item.productName} ({item.quantity} {item.unit})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={quotationForm[item.id] || ''}
                          onChange={(e) =>
                            setQuotationForm({
                              ...quotationForm,
                              [item.id]: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Unit price"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="font-medium text-gray-900">
                          ₹{((quotationForm[item.id] || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Days *
                  </label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(parseInt(e.target.value))}
                    placeholder="Number of days"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any comments or special notes..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Total */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹
                    {Object.entries(quotationForm)
                      .reduce((sum, [itemId, price]) => {
                        const item = rfq.lineItems.find((l) => l.id === itemId)
                        return sum + (price || 0) * (item?.quantity || 0)
                      }, 0)
                      .toLocaleString()}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingQuotation ? 'Update Quotation' : 'Submit Quotation'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowQuotationForm(false)
                      setEditingQuotation(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Quotations List */}
        {user?.role !== 'Vendor' && quotations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quotations ({quotations.length})
            </h2>
            <div className="space-y-3">
              {quotations.map((quotation) => {
                const vendor = getVendorById(quotation.vendorId)
                const total = quotation.totalAmount

                return (
                  <div key={quotation.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{vendor?.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <p>₹{total.toLocaleString()}</p>
                          <p>{quotation.deliveryDays} days delivery</p>
                          <p>{formatDistanceToNow(new Date(quotation.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          quotation.status === 'Submitted'
                            ? 'bg-blue-100 text-blue-700'
                            : quotation.status === 'Selected'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {quotation.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {user?.role === 'Procurement Officer' && (
              <Link href={`/rfqs/${rfqId}/compare`}>
                <Button className="mt-4 bg-green-600 hover:bg-green-700">
                  Compare Quotations
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
