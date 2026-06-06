'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getRFQById, getQuotationsByRFQ, getVendorById, updateQuotation } from '@/lib/storage'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CompareQuotationsPage() {
  const params = useParams()
  const router = useRouter()
  const rfqId = params.id as string

  const rfq = getRFQById(rfqId)
  const quotations = getQuotationsByRFQ(rfqId)

  if (!rfq) {
    return (
      <ProtectedRoute>
        <div>RFQ not found</div>
      </ProtectedRoute>
    )
  }

  const handleSelectWinner = (quotationId: string) => {
    const quotation = quotations.find((q) => q.id === quotationId)
    if (quotation) {
      updateQuotation({
        ...quotation,
        status: 'Selected',
      })
      toast.success('Quotation selected as winner')
      setTimeout(() => router.push(`/rfqs/${rfqId}`), 1500)
    }
  }

  // Find minimum price per item
  const getMinPriceForItem = (itemId: string) => {
    return Math.min(
      ...quotations.map((q) => {
        const lineItem = q.lineItems.find((li) => li.rfqLineItemId === itemId)
        return lineItem?.unitPrice || Infinity
      })
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/rfqs/${rfqId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compare Quotations</h1>
            <p className="text-gray-600 mt-1">{rfq.title}</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase sticky left-0 bg-gray-50 z-10">
                    Product
                  </th>
                  {quotations.map((quotation) => {
                    const vendor = getVendorById(quotation.vendorId)
                    return (
                      <th key={quotation.id} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                        <div>
                          <p className="font-semibold">{vendor?.name}</p>
                          <p className="text-gray-600 text-xs mt-1">★ {vendor?.rating.toFixed(1)}</p>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rfq.lineItems.map((item) => {
                  const minPrice = getMinPriceForItem(item.id)

                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 sticky left-0 bg-white font-medium text-gray-900">
                        <p>{item.productName}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.quantity} {item.unit}
                        </p>
                      </td>
                      {quotations.map((quotation) => {
                        const lineItem = quotation.lineItems.find(
                          (li) => li.rfqLineItemId === item.id
                        )
                        const unitPrice = lineItem?.unitPrice || 0
                        const total = unitPrice * item.quantity
                        const isLowest = unitPrice === minPrice

                        return (
                          <td
                            key={quotation.id}
                            className={`px-6 py-4 text-center ${
                              isLowest ? 'bg-green-50' : ''
                            }`}
                          >
                            <div className="font-semibold text-gray-900">
                              ₹{unitPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              = ₹{total.toLocaleString()}
                            </div>
                            {isLowest && (
                              <div className="text-xs text-green-600 font-medium mt-1">
                                Best price
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {/* Total Row */}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-6 py-4 sticky left-0 bg-gray-50 text-gray-900">Total</td>
                  {quotations.map((quotation) => (
                    <td key={quotation.id} className="px-6 py-4 text-center text-gray-900">
                      ₹{quotation.totalAmount.toLocaleString()}
                    </td>
                  ))}
                </tr>
                {/* Delivery Row */}
                <tr>
                  <td className="px-6 py-4 sticky left-0 bg-white text-gray-700">
                    Delivery Days
                  </td>
                  {quotations.map((quotation) => (
                    <td key={quotation.id} className="px-6 py-4 text-center text-gray-900">
                      {quotation.deliveryDays} days
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Selection Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Winner</h2>
          <div className="grid grid-cols-1 md:grid-cols-auto gap-4">
            {quotations.map((quotation) => {
              const vendor = getVendorById(quotation.vendorId)
              const isSelected = quotation.status === 'Selected'

              return (
                <div
                  key={quotation.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{vendor?.name}</p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    ₹{quotation.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{quotation.deliveryDays} days</p>
                  <Button
                    onClick={() => handleSelectWinner(quotation.id)}
                    disabled={isSelected}
                    className={`w-full mt-4 ${
                      isSelected
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
