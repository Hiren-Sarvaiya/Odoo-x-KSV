'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { getVendors, addVendor, updateVendor, generateId } from '@/lib/storage'
import { Vendor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Search, Plus, Edit2, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const categories = ['Raw Materials', 'Components', 'Logistics', 'Electronics', 'Services']

export default function VendorsPage() {
  const { user } = useAuth()
  const [vendors, setVendors] = useState<Vendor[]>(getVendors())
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category: 'Raw Materials',
    gstNumber: '',
    email: '',
    phone: '',
    address: '',
  })

  // Filter vendors
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.gstNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || vendor.category === categoryFilter
    const matchesStatus = !statusFilter || vendor.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.gstNumber || !formData.email) {
      toast.error('Please fill in required fields')
      return
    }

    const now = new Date().toISOString()

    if (editingId) {
      // Update existing vendor
      const updated = vendors.map((v) =>
        v.id === editingId
          ? {
              ...v,
              ...formData,
              updatedAt: now,
            }
          : v
      )
      setVendors(updated)
      updated.forEach((v) => updateVendor(v))
      toast.success('Vendor updated successfully')
      setEditingId(null)
    } else {
      // Add new vendor
      const newVendor: Vendor = {
        id: generateId(),
        ...formData,
        status: 'Active',
        rating: 3.5,
        createdAt: now,
        updatedAt: now,
      }
      const updated = [...vendors, newVendor]
      setVendors(updated)
      addVendor(newVendor)
      toast.success('Vendor added successfully')
    }

    setFormData({
      name: '',
      category: 'Raw Materials',
      gstNumber: '',
      email: '',
      phone: '',
      address: '',
    })
    setShowAddForm(false)
  }

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      category: vendor.category,
      gstNumber: vendor.gstNumber,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
    })
    setEditingId(vendor.id)
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      category: 'Raw Materials',
      gstNumber: '',
      email: '',
      phone: '',
      address: '',
    })
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600 mt-2">Manage your vendor database</p>
          </div>
          {(user?.role === 'Admin' || user?.role === 'Procurement Officer') && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Add Vendor
            </Button>
          )}
        </div>

        {/* Add/Edit Vendor Form */}
        {showAddForm && (user?.role === 'Admin' || user?.role === 'Procurement Officer') && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter vendor name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number *
                  </label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g., 27AABCT1234H1Z0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vendor@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91-9999-999-999"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter full address"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update Vendor' : 'Add Vendor'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or GST number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blacklisted">Blacklisted</option>
            </select>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredVendors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      GST Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Rating
                    </th>
                    {(user?.role === 'Admin' || user?.role === 'Procurement Officer') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/vendors/${vendor.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                          {vendor.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{vendor.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">{vendor.gstNumber}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            vendor.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : vendor.status === 'Blacklisted'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-gray-700">{vendor.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      {(user?.role === 'Admin' || user?.role === 'Procurement Officer') && (
                        <td className="px-6 py-4 text-sm font-medium">
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No vendors found. Add your first vendor to get started.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
