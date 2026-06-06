'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { getRFQs, getQuotationsByRFQ, getVendorById } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Search, Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function RFQsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const allRFQs = getRFQs()

  // Filter RFQs based on user role
  const userRFQs = user?.role === 'Vendor' 
    ? allRFQs.filter(rfq => rfq.assignedVendors.includes(user.id))
    : allRFQs

  // Apply search and status filters
  const filteredRFQs = userRFQs.filter((rfq) => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || rfq.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RFQs</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'Vendor'
                ? 'RFQs available for your quotation'
                : 'Request for Quotation management'}
            </p>
          </div>
          {user?.role === 'Procurement Officer' && (
            <Link href="/rfqs/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={18} className="mr-2" />
                Create RFQ
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by RFQ title or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Quoted">Quoted</option>
              <option value="Under Review">Under Review</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* RFQs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredRFQs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      RFQ ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Quotations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRFQs.map((rfq) => {
                    const quotationCount = getQuotationsByRFQ(rfq.id).length
                    const deadlinePassed = new Date(rfq.deadline) < new Date()

                    return (
                      <tr key={rfq.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-gray-700">
                          {rfq.id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{rfq.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{rfq.lineItems.length} items</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div>
                            <p>{new Date(rfq.deadline).toLocaleDateString()}</p>
                            {deadlinePassed && (
                              <p className="text-red-600 text-xs font-medium">Passed</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <p className="font-medium">{quotationCount}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <Link href={`/rfqs/${rfq.id}`} className="text-blue-600 hover:text-blue-700">
                            <Eye size={18} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>
                {user?.role === 'Vendor'
                  ? 'No RFQs available for you at this time.'
                  : 'No RFQs found. Create your first RFQ to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
