'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { addRFQ, getVendors, generateId } from '@/lib/storage'
import { RFQ, RFQLineItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function CreateRFQPage() {
  const { user } = useAuth()
  const router = useRouter()
  const vendors = getVendors()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  })

  const [lineItems, setLineItems] = useState<RFQLineItem[]>([
    { id: generateId(), productName: '', quantity: 0, unit: 'pieces' },
  ])

  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: generateId(), productName: '', quantity: 0, unit: 'pieces' },
    ])
  }

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast.error('At least one line item is required')
      return
    }
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const handleUpdateLineItem = (
    id: string,
    field: keyof RFQLineItem,
    value: any
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.deadline) {
        toast.error('Please fill in all required fields')
        setLoading(false)
        return
      }

      if (lineItems.some((item) => !item.productName || item.quantity <= 0)) {
        toast.error('All line items must have product name and quantity')
        setLoading(false)
        return
      }

      if (selectedVendors.length === 0) {
        toast.error('Please select at least one vendor')
        setLoading(false)
        return
      }

      const now = new Date().toISOString()

      const newRFQ: RFQ = {
        id: generateId(),
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        status: 'Open',
        createdBy: user?.id || '',
        assignedVendors: selectedVendors,
        lineItems,
        createdAt: now,
        updatedAt: now,
      }

      addRFQ(newRFQ)
      toast.success('RFQ created successfully!')
      router.push('/rfqs')
    } catch (error) {
      console.error('Error creating RFQ:', error)
      toast.error('Failed to create RFQ')
    } finally {
      setLoading(false)
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create RFQ</h1>
            <p className="text-gray-600 mt-2">Create a new Request for Quotation</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFQ Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Office Supplies Q2 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the RFQ requirements and details..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
              <Button
                type="button"
                onClick={handleAddLineItem}
                variant="outline"
                size="sm"
              >
                <Plus size={18} className="mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="flex gap-3 items-end">
                  {/* Product Name */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, 'productName', e.target.value)
                      }
                      placeholder="Product name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, 'quantity', parseInt(e.target.value))
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, 'unit', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="pieces">Pieces</option>
                      <option value="kg">KG</option>
                      <option value="liters">Liters</option>
                      <option value="meters">Meters</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Vendors</h2>
            <div className="space-y-3">
              {vendors.filter((v) => v.status === 'Active').length > 0 ? (
                vendors
                  .filter((v) => v.status === 'Active')
                  .map((vendor) => (
                    <label key={vendor.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={() => handleVendorToggle(vendor.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-xs text-gray-600">{vendor.category}</p>
                      </div>
                    </label>
                  ))
              ) : (
                <p className="text-gray-600">No active vendors available</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create RFQ'}
            </Button>
            <Link href="/rfqs">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
