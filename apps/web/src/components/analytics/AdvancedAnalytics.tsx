import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  DollarSign,
  Download,
  Filter,
  Calendar,
  Zap,
  Target,
  Award,
  Activity,
  PieChart,
  LineChart,
  Globe
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalDocuments: number
    totalUsers: number
    totalWorkflows: number
    processingTime: number
    costSavings: number
    efficiency: number
  }
  usage: {
    documentsProcessed: { date: string; count: number }[]
    workflowExecutions: { date: string; count: number }[]
    userActivity: { date: string; activeUsers: number }[]
  }
  performance: {
    averageProcessingTime: number
    successRate: number
    errorRate: number
    popularOperations: { operation: string; count: number; percentage: number }[]
  }
  business: {
    timesSaved: number
    costReduction: number
    productivityGain: number
    roi: number
  }
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'documents' | 'workflows' | 'users'>('documents')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: AnalyticsData = {
        overview: {
          totalDocuments: 12847,
          totalUsers: 342,
          totalWorkflows: 156,
          processingTime: 2.3,
          costSavings: 45600,
          efficiency: 94.2
        },
        usage: {
          documentsProcessed: generateTimeSeriesData(30, 50, 200),
          workflowExecutions: generateTimeSeriesData(30, 20, 80),
          userActivity: generateTimeSeriesData(30, 15, 60)
        },
        performance: {
          averageProcessingTime: 2.3,
          successRate: 97.8,
          errorRate: 2.2,
          popularOperations: [
            { operation: 'PDF Split', count: 3420, percentage: 35.2 },
            { operation: 'PDF Merge', count: 2890, percentage: 29.7 },
            { operation: 'OCR Extract', count: 1560, percentage: 16.1 },
            { operation: 'Format Convert', count: 1230, percentage: 12.7 },
            { operation: 'Digital Sign', count: 620, percentage: 6.3 }
          ]
        },
        business: {
          timesSaved: 1240,
          costReduction: 67.5,
          productivityGain: 156.8,
          roi: 340
        }
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSeriesData = (days: number, min: number, max: number) => {
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * (max - min) + min)
      })
    }
    return data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Unavailable</h3>
        <p className="text-gray-600">Unable to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your document processing</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Documents</p>
              <p className="text-2xl font-bold">{data.overview.totalDocuments.toLocaleString()}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-200" />
          </div>
          <div className="mt-4 flex items-center text-blue-100">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm">+12% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Users</p>
              <p className="text-2xl font-bold">{data.overview.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-green-200" />
          </div>
          <div className="mt-4 flex items-center text-green-100">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm">+8% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Workflows</p>
              <p className="text-2xl font-bold">{data.overview.totalWorkflows}</p>
            </div>
            <Zap className="h-8 w-8 text-purple-200" />
          </div>
          <div className="mt-4 flex items-center text-purple-100">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm">+23% from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Avg Processing</p>
              <p className="text-2xl font-bold">{data.overview.processingTime}s</p>
            </div>
            <Clock className="h-8 w-8 text-orange-200" />
          </div>
          <div className="mt-4 flex items-center text-orange-100">
            <Target className="h-4 w-4 mr-1" />
            <span className="text-sm">-15% faster</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100">Cost Savings</p>
              <p className="text-2xl font-bold">${data.overview.costSavings.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-teal-200" />
          </div>
          <div className="mt-4 flex items-center text-teal-100">
            <Award className="h-4 w-4 mr-1" />
            <span className="text-sm">ROI: {data.business.roi}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">Efficiency</p>
              <p className="text-2xl font-bold">{data.overview.efficiency}%</p>
            </div>
            <Activity className="h-8 w-8 text-indigo-200" />
          </div>
          <div className="mt-4 flex items-center text-indigo-100">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm">+5% improvement</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
            <div className="flex space-x-2">
              {['documents', 'workflows', 'users'].map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetric === metric
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Simplified chart representation */}
          <div className="h-64 flex items-end space-x-2">
            {data.usage.documentsProcessed.slice(-14).map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(item.count / 200) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(item.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Operations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Popular Operations</h3>
          <div className="space-y-4">
            {data.performance.popularOperations.map((operation, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{operation.operation}</span>
                    <span className="text-sm text-gray-600">{operation.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${operation.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-lg inline-block mb-3">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Time Saved</h4>
            <p className="text-2xl font-bold text-blue-600">{data.business.timesSaved}h</p>
            <p className="text-sm text-gray-600">This month</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-lg inline-block mb-3">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Cost Reduction</h4>
            <p className="text-2xl font-bold text-green-600">{data.business.costReduction}%</p>
            <p className="text-sm text-gray-600">Operational costs</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-lg inline-block mb-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Productivity Gain</h4>
            <p className="text-2xl font-bold text-purple-600">{data.business.productivityGain}%</p>
            <p className="text-sm text-gray-600">Team efficiency</p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-orange-100 rounded-lg inline-block mb-3">
              <Award className="h-8 w-8 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900">ROI</h4>
            <p className="text-2xl font-bold text-orange-600">{data.business.roi}%</p>
            <p className="text-sm text-gray-600">Return on investment</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Success Rate</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {data.performance.successRate}%
            </div>
            <p className="text-sm text-gray-600">Successful operations</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Processing Speed</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data.performance.averageProcessingTime}s
            </div>
            <p className="text-sm text-gray-600">Average processing time</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Error Rate</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <Activity className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {data.performance.errorRate}%
            </div>
            <p className="text-sm text-gray-600">Failed operations</p>
          </div>
        </div>
      </div>
    </div>
  )
}
