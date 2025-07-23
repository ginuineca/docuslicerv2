import React, { useState, useEffect, useRef } from 'react'
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  BarChart3,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Settings
} from 'lucide-react'

interface WorkflowMetrics {
  executionId: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  startTime: number
  currentTime: number
  estimatedCompletion: number
  nodes: NodeMetrics[]
  performance: PerformanceMetrics
  resources: ResourceMetrics
}

interface NodeMetrics {
  id: string
  label: string
  status: 'idle' | 'running' | 'completed' | 'error' | 'skipped'
  progress: number
  executionTime: number
  memoryUsage: number
  cpuUsage: number
  startTime?: number
  endTime?: number
  retryCount: number
  cacheHit: boolean
}

interface PerformanceMetrics {
  totalExecutionTime: number
  averageNodeTime: number
  parallelEfficiency: number
  cacheHitRate: number
  throughput: number
  errorRate: number
}

interface ResourceMetrics {
  memoryUsage: number
  cpuUsage: number
  diskIO: number
  networkIO: number
  activeWorkers: number
  queuedNodes: number
}

export function WorkflowPerformanceMonitor({ 
  executionId, 
  onPause, 
  onResume, 
  onCancel 
}: {
  executionId: string
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
}) {
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedView, setSelectedView] = useState<'overview' | 'nodes' | 'performance' | 'resources'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout>()
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (autoRefresh) {
      fetchMetrics()
      intervalRef.current = setInterval(fetchMetrics, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [executionId, autoRefresh])

  useEffect(() => {
    if (metrics && chartRef.current) {
      drawPerformanceChart()
    }
  }, [metrics, selectedView])

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/workflows/executions/${executionId}/metrics`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch workflow metrics:', error)
    }
  }

  const drawPerformanceChart = () => {
    const canvas = chartRef.current
    if (!canvas || !metrics) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    // Draw performance timeline
    if (selectedView === 'performance') {
      drawTimelineChart(ctx, width, height)
    } else if (selectedView === 'resources') {
      drawResourceChart(ctx, width, height)
    }
  }

  const drawTimelineChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!metrics) return

    const padding = 40
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    // Draw axes
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Draw node execution timeline
    const totalTime = metrics.currentTime - metrics.startTime
    const nodeHeight = Math.max(20, chartHeight / metrics.nodes.length)

    metrics.nodes.forEach((node, index) => {
      const y = padding + index * nodeHeight
      const nodeStartTime = node.startTime || metrics.startTime
      const nodeEndTime = node.endTime || metrics.currentTime
      
      const startX = padding + ((nodeStartTime - metrics.startTime) / totalTime) * chartWidth
      const endX = padding + ((nodeEndTime - metrics.startTime) / totalTime) * chartWidth
      const nodeWidth = Math.max(2, endX - startX)

      // Color based on status
      let color = '#9ca3af' // idle
      if (node.status === 'running') color = '#3b82f6' // blue
      else if (node.status === 'completed') color = '#10b981' // green
      else if (node.status === 'error') color = '#ef4444' // red

      ctx.fillStyle = color
      ctx.fillRect(startX, y, nodeWidth, nodeHeight - 2)

      // Draw node label
      ctx.fillStyle = '#374151'
      ctx.font = '12px Arial'
      ctx.fillText(node.label.substring(0, 15), startX + 5, y + 15)
    })

    // Draw progress indicator
    const progressX = padding + (metrics.progress / 100) * chartWidth
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(progressX, padding)
    ctx.lineTo(progressX, height - padding)
    ctx.stroke()
  }

  const drawResourceChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!metrics) return

    const padding = 40
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    // Draw resource usage bars
    const resources = [
      { label: 'Memory', value: metrics.resources.memoryUsage, color: '#3b82f6' },
      { label: 'CPU', value: metrics.resources.cpuUsage, color: '#10b981' },
      { label: 'Disk I/O', value: metrics.resources.diskIO, color: '#f59e0b' },
      { label: 'Network', value: metrics.resources.networkIO, color: '#8b5cf6' }
    ]

    const barHeight = chartHeight / resources.length - 10
    
    resources.forEach((resource, index) => {
      const y = padding + index * (barHeight + 10)
      const barWidth = (resource.value / 100) * chartWidth

      // Background bar
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(padding, y, chartWidth, barHeight)

      // Value bar
      ctx.fillStyle = resource.color
      ctx.fillRect(padding, y, barWidth, barHeight)

      // Label
      ctx.fillStyle = '#374151'
      ctx.font = '14px Arial'
      ctx.fillText(`${resource.label}: ${resource.value.toFixed(1)}%`, padding + 10, y + barHeight / 2 + 5)
    })
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading workflow metrics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Activity className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Workflow Performance</h3>
            <p className="text-sm text-gray-600">Execution ID: {executionId.substring(0, 8)}...</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metrics.status)}`}>
            {metrics.status}
          </span>
          
          <div className="flex items-center space-x-1">
            {metrics.status === 'running' && onPause && (
              <button
                onClick={onPause}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Pause execution"
              >
                <Pause className="h-4 w-4" />
              </button>
            )}
            
            {metrics.status === 'paused' && onResume && (
              <button
                onClick={onResume}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Resume execution"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-1 ${autoRefresh ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-700`}
              title="Toggle auto-refresh"
            >
              <Activity className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Toggle detailed view"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{metrics.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${metrics.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span>Elapsed: {formatTime(metrics.currentTime - metrics.startTime)}</span>
          <span>ETA: {formatTime(metrics.estimatedCompletion - metrics.currentTime)}</span>
        </div>
      </div>

      {/* Detailed View */}
      {isExpanded && (
        <div className="p-4">
          {/* View Tabs */}
          <div className="flex space-x-4 mb-4 border-b border-gray-200">
            {['overview', 'nodes', 'performance', 'resources'].map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view as any)}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  selectedView === view
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview */}
          {selectedView === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-blue-900">
                  {formatTime(metrics.performance.totalExecutionTime)}
                </div>
                <div className="text-xs text-blue-700">Total Time</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-green-900">
                  {metrics.performance.parallelEfficiency.toFixed(1)}%
                </div>
                <div className="text-xs text-green-700">Parallel Efficiency</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <HardDrive className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-purple-900">
                  {metrics.performance.cacheHitRate.toFixed(1)}%
                </div>
                <div className="text-xs text-purple-700">Cache Hit Rate</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-orange-900">
                  {metrics.performance.throughput.toFixed(1)}
                </div>
                <div className="text-xs text-orange-700">Docs/Min</div>
              </div>
            </div>
          )}

          {/* Nodes */}
          {selectedView === 'nodes' && (
            <div className="space-y-2">
              {metrics.nodes.map(node => (
                <div key={node.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      node.status === 'completed' ? 'bg-green-500' :
                      node.status === 'running' ? 'bg-blue-500' :
                      node.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{node.label}</div>
                      <div className="text-sm text-gray-600">
                        {node.executionTime > 0 && `${formatTime(node.executionTime)} • `}
                        {formatBytes(node.memoryUsage)}
                        {node.cacheHit && ' • Cached'}
                        {node.retryCount > 0 && ` • ${node.retryCount} retries`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{node.progress.toFixed(0)}%</div>
                    <div className="text-xs text-gray-600">{node.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Performance Chart */}
          {(selectedView === 'performance' || selectedView === 'resources') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <canvas
                ref={chartRef}
                width={600}
                height={300}
                className="w-full h-64"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
