import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Clock, 
  User, 
  FileText, 
  Download, 
  Search, 
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Share,
  Calendar,
  MapPin,
  Smartphone
} from 'lucide-react'

interface AuditEvent {
  id: string
  timestamp: Date
  userId: string
  userName: string
  userEmail: string
  userRole: string
  action: 'view' | 'edit' | 'delete' | 'download' | 'share' | 'encrypt' | 'decrypt' | 'sign' | 'upload'
  documentId: string
  documentName: string
  ipAddress: string
  userAgent: string
  location?: string
  details: Record<string, any>
  riskLevel: 'low' | 'medium' | 'high'
  complianceFlags: string[]
  sessionId: string
}

interface AuditTrailProps {
  documentId?: string
  userId?: string
  dateRange?: { start: Date; end: Date }
  onClose: () => void
}

export function AuditTrail({ documentId, userId, dateRange, onClose }: AuditTrailProps) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedRisk, setSelectedRisk] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  useEffect(() => {
    fetchAuditEvents()
  }, [documentId, userId, dateRange])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, selectedAction, selectedRisk])

  const fetchAuditEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (documentId) params.append('documentId', documentId)
      if (userId) params.append('userId', userId)
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString())
        params.append('endDate', dateRange.end.toISOString())
      }

      const response = await fetch(`/api/audit/events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Failed to fetch audit events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.action.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedAction !== 'all') {
      filtered = filtered.filter(event => event.action === selectedAction)
    }

    if (selectedRisk !== 'all') {
      filtered = filtered.filter(event => event.riskLevel === selectedRisk)
    }

    setFilteredEvents(filtered)
  }

  const getActionIcon = (action: AuditEvent['action']) => {
    switch (action) {
      case 'view': return Eye
      case 'edit': return Edit
      case 'delete': return Trash2
      case 'download': return Download
      case 'share': return Share
      case 'encrypt': return Lock
      case 'decrypt': return Unlock
      case 'sign': return Shield
      case 'upload': return FileText
      default: return FileText
    }
  }

  const getRiskColor = (risk: AuditEvent['riskLevel']) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
    }
  }

  const exportAuditLog = async () => {
    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: filteredEvents,
          format: 'pdf',
          includeDetails: true
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export audit log:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
              <p className="text-sm text-gray-600">
                {filteredEvents.length} events found
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportAuditLog}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Shield className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Filters Sidebar */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Events
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search users, documents, actions..."
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Actions</option>
                <option value="view">View</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
                <option value="download">Download</option>
                <option value="share">Share</option>
                <option value="encrypt">Encrypt</option>
                <option value="decrypt">Decrypt</option>
                <option value="sign">Sign</option>
                <option value="upload">Upload</option>
              </select>
            </div>

            {/* Risk Level Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Level
              </label>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Events:</span>
                  <span className="font-medium">{filteredEvents.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">High Risk:</span>
                  <span className="font-medium text-red-600">
                    {filteredEvents.filter(e => e.riskLevel === 'high').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unique Users:</span>
                  <span className="font-medium">
                    {new Set(filteredEvents.map(e => e.userId)).size}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {filteredEvents.map(event => {
                    const ActionIcon = getActionIcon(event.action)
                    return (
                      <div
                        key={event.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getRiskColor(event.riskLevel)}`}>
                              <ActionIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {event.userName}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {event.action}
                                </span>
                                <span className="text-sm font-medium text-blue-600">
                                  {event.documentName}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{event.timestamp.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.ipAddress}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center space-x-1">
                                    <Smartphone className="h-3 w-3" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>
                              {event.complianceFlags.length > 0 && (
                                <div className="flex items-center space-x-2 mt-2">
                                  {event.complianceFlags.map(flag => (
                                    <span
                                      key={flag}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                                    >
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(event.riskLevel)}`}>
                            {event.riskLevel.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Shield className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <p className="text-sm text-gray-900">{selectedEvent.userName} ({selectedEvent.userEmail})</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="text-sm text-gray-900">{selectedEvent.userRole}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Action</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedEvent.action}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(selectedEvent.riskLevel)}`}>
                        {selectedEvent.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                      <p className="text-sm text-gray-900">{selectedEvent.timestamp.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedEvent.sessionId}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
                    <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
