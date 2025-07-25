import { useState, useEffect } from 'react'
import {
  Upload,
  FileText,
  Workflow,
  Settings,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { StatsCard, ActionCard, Card } from '../components/ui/Card'
import { Button, FloatingActionButton } from '../components/ui/Button'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [apiStatus, setApiStatus] = useState<string>('checking...')
  const [stats, setStats] = useState({
    totalDocuments: 0,
    processedToday: 0,
    activeWorkflows: 0,
    storageUsed: '0 MB'
  })

  console.log('📊 DashboardPage - Rendering for user:', user?.email)

  useEffect(() => {
    console.log('📊 DashboardPage - Checking API connection...')
    // Check API connection
    fetch('/api/status')
      .then(res => {
        console.log('📊 API Response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('📊 API Response data:', data)
        setApiStatus(data.message)
        // Mock stats for now
        setStats({
          totalDocuments: 24,
          processedToday: 8,
          activeWorkflows: 3,
          storageUsed: '156 MB'
        })
      })
      .catch(error => {
        console.error('📊 API Error:', error)
        setApiStatus('API connection failed')
      })
  }, [])

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening with your documents."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Documents"
          value={stats.totalDocuments}
          change={{ value: '+12%', type: 'increase' }}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Processed Today"
          value={stats.processedToday}
          change={{ value: '+3', type: 'increase' }}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Active Workflows"
          value={stats.activeWorkflows}
          icon={Workflow}
          color="purple"
        />
        <StatsCard
          title="Storage Used"
          value={stats.storageUsed}
          change={{ value: '2.1 GB left', type: 'neutral' }}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* System Status */}
      <Card className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">System Status</h2>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                apiStatus.includes('running') ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-gray-600">{apiStatus}</span>
            </div>
          </div>
          {apiStatus.includes('running') && (
            <CheckCircle className="h-8 w-8 text-green-500" />
          )}
          {!apiStatus.includes('running') && (
            <AlertCircle className="h-8 w-8 text-red-500" />
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/process')}
          >
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            title="Process PDFs"
            description="Upload and process PDF documents with advanced tools"
            icon={Upload}
            onClick={() => navigate('/process')}
            color="blue"
          />
          <ActionCard
            title="My Documents"
            description="View and manage your processed PDF files"
            icon={FileText}
            onClick={() => navigate('/documents')}
            color="purple"
          />
          <ActionCard
            title="Workflows"
            description="Create and manage automated document workflows"
            icon={Workflow}
            onClick={() => navigate('/workflows')}
            color="green"
          />
          <ActionCard
            title="Settings"
            description="Configure your account and preferences"
            icon={Settings}
            onClick={() => navigate('/settings')}
            color="orange"
          />
        </div>
      </div>

      {/* Recent Activity & Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>

            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600 mb-4">Upload your first PDF to get started!</p>
              <Button
                onClick={() => navigate('/process')}
                icon={Upload}
              >
                Upload Document
              </Button>
            </div>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Upload your first PDF</p>
                  <p className="text-xs text-gray-600">Start by uploading a document to process</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Create a workflow</p>
                  <p className="text-xs text-gray-500">Automate your document processing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Invite team members</p>
                  <p className="text-xs text-gray-500">Collaborate on document workflows</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upgrade to Pro</h3>
            <p className="text-sm text-gray-600 mb-4">
              Unlock advanced features like batch processing, custom workflows, and team collaboration.
            </p>
            <Button fullWidth variant="primary">
              Upgrade Now
            </Button>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={Plus}
        onClick={() => navigate('/process')}
        aria-label="Upload new document"
      />
    </AppLayout>
  )
}
