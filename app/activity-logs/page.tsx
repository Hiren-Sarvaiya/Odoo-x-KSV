'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getActivityLogs } from '@/lib/storage'
import { formatDistanceToNow } from 'date-fns'
import {
  Building2,
  FileText,
  CheckCircle,
  ShoppingCart,
  History,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<any>> = {
  Building2,
  FileText,
  CheckCircle,
  ShoppingCart,
  History,
}

export default function ActivityLogsPage() {
  const [filterAction, setFilterAction] = useState('')

  const allLogs = getActivityLogs().reverse()

  const filteredLogs = filterAction
    ? allLogs.filter((log) => log.action === filterAction)
    : allLogs

  const uniqueActions = Array.from(
    new Set(allLogs.map((log) => log.action))
  ).sort()

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-2">System activity timeline</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline */}
        <div className="space-y-1">
          {filteredLogs.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Events */}
              <div className="space-y-4">
                {filteredLogs.map((log, idx) => {
                  const Icon = iconMap[log.icon || 'History'] || History

                  return (
                    <div key={log.id} className="flex gap-4 relative z-10">
                      {/* Icon Circle */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white">
                          <Icon size={20} className="text-blue-600" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-2 bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-200 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{log.action}</p>
                            <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {formatDistanceToNow(new Date(log.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                          <p>
                            <span className="font-medium">By:</span> {log.actorName}
                          </p>
                          {log.entityType && (
                            <p>
                              <span className="font-medium">{log.entityType}:</span>{' '}
                              {log.entityId?.substring(0, 8)}
                            </p>
                          )}
                          <p>
                            {new Date(log.timestamp).toLocaleDateString()} at{' '}
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              <p>No activity logs found</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
