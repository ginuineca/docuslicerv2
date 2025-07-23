import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Zap, 
  Clock, 
  Database, 
  Wifi, 
  Monitor,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Gauge
} from 'lucide-react'
import { useWebVitals, useMemoryMonitor, PerformanceMetrics } from '../../utils/performance'
import { api } from '../../utils/optimizedApi'

interface PerformanceData {
  webVitals: {
    CLS: number
    FID: number
    FCP: number
    LCP: number
    TTFB: number
  }
  memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
  network: {
    effectiveType: string
    downlink: number
    rtt: number
  }
  cache: {
    hitRate: number
    size: number
    totalRequests: number
  }
  bundle: {
    loadTime: number
    size: number
    chunks: number
  }
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)
  const webVitals = useWebVitals()
  const memoryInfo = useMemoryMonitor()
  const performanceMetrics = PerformanceMetrics.getInstance()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Show performance monitor in development
      const toggleKey = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          setIsVisible(!isVisible)
        }
      }
      
      window.addEventListener('keydown', toggleKey)
      return () => window.removeEventListener('keydown', toggleKey)
    }
  }, [isVisible])

  useEffect(() => {
    if (isVisible) {
      collectPerformanceData()
      const interval = setInterval(collectPerformanceData, 5000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const collectPerformanceData = async () => {
    setIsCollecting(true)

    try {
      // Collect network information
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      const networkInfo = connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      } : {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
      }

      // Collect cache statistics
      const cacheStats = api.getCacheStats()

      // Collect bundle information
      const bundleInfo = {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        size: 0, // Would need to be calculated from webpack stats
        chunks: 0 // Would need to be calculated from webpack stats
      }

      const data: PerformanceData = {
        webVitals: webVitals,
        memory: memoryInfo || {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0
        },
        network: networkInfo,
        cache: {
          hitRate: cacheStats.hitRate || 0,
          size: cacheStats.size,
          totalRequests: cacheStats.totalAccess
        },
        bundle: bundleInfo
      }

      setPerformanceData(data)
    } catch (error) {
      console.error('Failed to collect performance data:', error)
    } finally {
      setIsCollecting(false)
    }
  }

  const getVitalStatus = (metric: string, value: number) => {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    }

    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  if (!isVisible) {
    return process.env.NODE_ENV === 'development' ? (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
          title="Open Performance Monitor (Ctrl+Shift+P)"
        >
          <Activity className="h-5 w-5" />
        </button>
      </div>
    ) : null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Performance Monitor</h2>
              <p className="text-sm text-gray-600">Real-time application performance metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isCollecting && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Collecting...</span>
              </div>
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!performanceData ? (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Collecting performance data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Web Vitals */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Gauge className="h-5 w-5 mr-2" />
                  Core Web Vitals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {Object.entries(performanceData.webVitals).map(([metric, value]) => {
                    const status = getVitalStatus(metric, value)
                    return (
                      <div key={metric} className="text-center">
                        <div className="mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {metric === 'CLS' ? value.toFixed(3) : formatTime(value)}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">{metric}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.replace('-', ' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Memory Usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Memory Usage
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Used Heap</span>
                        <span>{formatBytes(performanceData.memory.usedJSHeapSize)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(performanceData.memory.usedJSHeapSize / performanceData.memory.totalJSHeapSize) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Heap:</span>
                        <div className="font-medium">{formatBytes(performanceData.memory.totalJSHeapSize)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Heap Limit:</span>
                        <div className="font-medium">{formatBytes(performanceData.memory.jsHeapSizeLimit)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Wifi className="h-5 w-5 mr-2" />
                    Network
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connection Type:</span>
                      <span className="font-medium capitalize">{performanceData.network.effectiveType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downlink:</span>
                      <span className="font-medium">{performanceData.network.downlink} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RTT:</span>
                      <span className="font-medium">{performanceData.network.rtt}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Performance */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Cache Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {(performanceData.cache.hitRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {performanceData.cache.size}
                    </div>
                    <div className="text-sm text-gray-600">Cached Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {performanceData.cache.totalRequests}
                    </div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                </div>
              </div>

              {/* Performance Recommendations */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {performanceData.webVitals.LCP > 2500 && (
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800">Improve Largest Contentful Paint</div>
                        <div className="text-sm text-yellow-700">Consider optimizing images and reducing server response times</div>
                      </div>
                    </div>
                  )}
                  
                  {performanceData.memory.usedJSHeapSize / performanceData.memory.totalJSHeapSize > 0.8 && (
                    <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-800">High Memory Usage</div>
                        <div className="text-sm text-red-700">Consider implementing memory cleanup or reducing component complexity</div>
                      </div>
                    </div>
                  )}
                  
                  {performanceData.cache.hitRate < 0.7 && (
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-blue-800">Improve Cache Hit Rate</div>
                        <div className="text-sm text-blue-700">Consider increasing cache TTL or implementing better caching strategies</div>
                      </div>
                    </div>
                  )}
                  
                  {Object.values(performanceData.webVitals).every(v => v === 0) && (
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-800">Excellent Performance</div>
                        <div className="text-sm text-green-700">All performance metrics are within optimal ranges</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
