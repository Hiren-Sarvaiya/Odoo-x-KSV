'use client'

import React, { useState, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getInvoiceById, getPurchaseOrderById, getVendorById } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Mail, Printer } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const printRef = useRef<HTMLDivElement>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '', message: '' })

  const invoice = getInvoiceById(invoiceId)
  const po = invoice ? getPurchaseOrderById(invoice.poId) : null
  const vendor = invoice && po ? getVendorById(po.vendorId) : null

  if (!invoice || !po || !vendor) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <p className="text-gray-600">Invoice not found</p>
        </div>
      </ProtectedRoute>
    )
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printRef.current.innerHTML)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 250)
      }
    }
  }

  const handleDownloadPDF = () => {
    toast.success('Invoice downloaded as PDF (simulated)')
  }

  const handleSendEmail = () => {
    if (!emailForm.email) {
      toast.error('Please enter recipient email')
      return
    }

    toast.success(`Invoice sent to ${emailForm.email}`)
    setShowEmailForm(false)
    setEmailForm({ email: '', message: '' })
  }

  const dueDate = new Date(invoice.dueDate)
  const today = new Date()
  const isOverdue = dueDate < today && invoice.paymentStatus === 'Pending'

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
            <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Printer size={18} className="mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download size={18} className="mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={() => setShowEmailForm(!showEmailForm)}
            variant="outline"
          >
            <Mail size={18} className="mr-2" />
            Send Email
          </Button>
        </div>

        {/* Email Form */}
        {showEmailForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Invoice via Email</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Add a message (optional)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSendEmail} className="bg-blue-600 hover:bg-blue-700">
                  Send Email
                </Button>
                <Button onClick={() => setShowEmailForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Document */}
        <div
          ref={printRef}
          className="bg-white rounded-lg border border-gray-200 p-8 print:border-0 print:rounded-0"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-blue-600">INVOICE</h1>
                <p className="text-gray-600 mt-2">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="font-medium text-gray-900">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 mt-2">Due Date</p>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {dueDate.toLocaleDateString()} {isOverdue && '(OVERDUE)'}
                </p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Bill To</p>
              <p className="font-semibold text-gray-900 mt-2">{vendor.name}</p>
              <p className="text-sm text-gray-600 mt-1">{vendor.address}</p>
              <p className="text-sm text-gray-600">GST: {vendor.gstNumber}</p>
              <p className="text-sm text-gray-600">Email: {vendor.email}</p>
              <p className="text-sm text-gray-600">Phone: {vendor.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">From</p>
              <p className="font-semibold text-gray-900 mt-2">VendorBridge</p>
              <p className="text-sm text-gray-600 mt-1">Procurement Management System</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 font-semibold text-gray-900">Description</th>
                  <th className="text-right py-2 font-semibold text-gray-900">Quantity</th>
                  <th className="text-right py-2 font-semibold text-gray-900">Unit Price</th>
                  <th className="text-right py-2 font-semibold text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {po.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{item.productName}</td>
                    <td className="text-right text-gray-700">{item.quantity} {item.unit}</td>
                    <td className="text-right text-gray-700">₹{item.unitPrice.toLocaleString()}</td>
                    <td className="text-right font-medium text-gray-900">
                      ₹{(item.quantity * item.unitPrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <p className="text-gray-700">Subtotal</p>
                <p className="font-medium text-gray-900">₹{invoice.subtotal.toLocaleString()}</p>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <p className="text-gray-700">GST (18%)</p>
                <p className="font-medium text-gray-900">₹{invoice.gst.toLocaleString()}</p>
              </div>
              <div className="flex justify-between py-3 bg-gray-50 -mx-4 px-4">
                <p className="font-semibold text-gray-900">Total</p>
                <p className="font-bold text-lg text-gray-900">₹{invoice.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">Payment Status</p>
            <p className={`font-semibold mt-1 ${
              invoice.paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {invoice.paymentStatus}
            </p>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-600 text-center pt-6 border-t border-gray-200">
            <p>Thank you for your business!</p>
            <p className="mt-1">This is an electronically generated invoice.</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
