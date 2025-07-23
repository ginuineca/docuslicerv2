import React, { Suspense, lazy, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Optimized lazy loading components with intelligent preloading and error boundaries
 */

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      <span className="text-gray-600">{message}</span>
    </div>
  </div>
)

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} />
    }

    return this.props.children
  }
}

// Default error fallback
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="text-red-600 mb-2">⚠️ Component failed to load</div>
      <div className="text-sm text-gray-600">{error.message}</div>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Reload Page
      </button>
    </div>
  </div>
)

// Enhanced lazy wrapper with preloading
function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    preload?: boolean
    fallback?: React.ComponentType
    errorFallback?: React.ComponentType<{ error: Error }>
  } = {}
) {
  const LazyComponent = lazy(importFn)
  
  // Preload component if requested
  if (options.preload) {
    importFn().catch(console.error)
  }

  const WrappedComponent: React.FC<React.ComponentProps<T>> = (props) => (
    <LazyErrorBoundary fallback={options.errorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  )

  // Add preload method to component
  ;(WrappedComponent as any).preload = importFn

  return WrappedComponent
}

// Lazy loaded main components
export const LazyDashboard = createLazyComponent(
  () => import('../dashboard/Dashboard'),
  { preload: true }
)

export const LazyWorkflowBuilder = createLazyComponent(
  () => import('../workflow/WorkflowBuilder'),
  { preload: false }
)

export const LazyTemplateBrowser = createLazyComponent(
  () => import('../workflow/TemplateBrowser'),
  { preload: false }
)

export const LazyDocumentViewer = createLazyComponent(
  () => import('../documents/DocumentViewer'),
  { preload: false }
)

export const LazyPDFEditor = createLazyComponent(
  () => import('../editor/AdvancedPDFEditor'),
  { preload: false }
)

export const LazyAnalytics = createLazyComponent(
  () => import('../analytics/AdvancedAnalytics'),
  { preload: false }
)

export const LazySecurityDashboard = createLazyComponent(
  () => import('../security/SecurityDashboard'),
  { preload: false }
)

export const LazyIntegrationManager = createLazyComponent(
  () => import('../integrations/IntegrationManager'),
  { preload: false }
)

export const LazyLegalSolution = createLazyComponent(
  () => import('../industry/LegalSolution'),
  { preload: false }
)

export const LazyHealthcareSolution = createLazyComponent(
  () => import('../industry/HealthcareSolution'),
  { preload: false }
)

export const LazyMobileWorkflowBuilder = createLazyComponent(
  () => import('../mobile/MobileWorkflowBuilder'),
  { preload: false }
)

export const LazyDocumentIntelligence = createLazyComponent(
  () => import('../ai/DocumentIntelligence'),
  { preload: false }
)

// Route-based preloading
export const preloadRouteComponents = {
  dashboard: () => LazyDashboard.preload?.(),
  workflows: () => LazyWorkflowBuilder.preload?.(),
  templates: () => LazyTemplateBrowser.preload?.(),
  documents: () => LazyDocumentViewer.preload?.(),
  editor: () => LazyPDFEditor.preload?.(),
  analytics: () => LazyAnalytics.preload?.(),
  security: () => LazySecurityDashboard.preload?.(),
  integrations: () => LazyIntegrationManager.preload?.(),
  legal: () => LazyLegalSolution.preload?.(),
  healthcare: () => LazyHealthcareSolution.preload?.(),
  mobile: () => LazyMobileWorkflowBuilder.preload?.(),
  ai: () => LazyDocumentIntelligence.preload?.()
}

// Intelligent preloader based on user behavior
export class IntelligentPreloader {
  private static instance: IntelligentPreloader
  private preloadedRoutes = new Set<string>()
  private userBehavior: { route: string; timestamp: number }[] = []

  static getInstance(): IntelligentPreloader {
    if (!IntelligentPreloader.instance) {
      IntelligentPreloader.instance = new IntelligentPreloader()
    }
    return IntelligentPreloader.instance
  }

  trackRoute(route: string) {
    this.userBehavior.push({ route, timestamp: Date.now() })
    
    // Keep only last 50 route visits
    if (this.userBehavior.length > 50) {
      this.userBehavior = this.userBehavior.slice(-50)
    }

    this.predictAndPreload()
  }

  private predictAndPreload() {
    const recentRoutes = this.userBehavior
      .filter(entry => Date.now() - entry.timestamp < 300000) // Last 5 minutes
      .map(entry => entry.route)

    // Find most visited routes
    const routeFrequency = recentRoutes.reduce((acc, route) => {
      acc[route] = (acc[route] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Preload top 3 most visited routes
    Object.entries(routeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([route]) => {
        this.preloadRoute(route)
      })
  }

  preloadRoute(route: string) {
    if (this.preloadedRoutes.has(route)) return

    const preloader = preloadRouteComponents[route as keyof typeof preloadRouteComponents]
    if (preloader) {
      preloader()
      this.preloadedRoutes.add(route)
    }
  }

  preloadOnHover(route: string) {
    // Preload component when user hovers over navigation link
    setTimeout(() => {
      this.preloadRoute(route)
    }, 100) // Small delay to avoid unnecessary preloads
  }

  preloadCriticalRoutes() {
    // Preload most important routes immediately
    this.preloadRoute('dashboard')
    this.preloadRoute('workflows')
  }
}

// Hook for using intelligent preloader
export function useIntelligentPreloader() {
  const preloader = IntelligentPreloader.getInstance()

  React.useEffect(() => {
    preloader.preloadCriticalRoutes()
  }, [preloader])

  return {
    trackRoute: preloader.trackRoute.bind(preloader),
    preloadRoute: preloader.preloadRoute.bind(preloader),
    preloadOnHover: preloader.preloadOnHover.bind(preloader)
  }
}

// Progressive loading component for large lists
export const ProgressiveList: React.FC<{
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  itemHeight: number
  initialCount?: number
  loadMoreCount?: number
  className?: string
}> = ({ 
  items, 
  renderItem, 
  itemHeight, 
  initialCount = 20, 
  loadMoreCount = 10,
  className = '' 
}) => {
  const [visibleCount, setVisibleCount] = React.useState(initialCount)
  const [isLoading, setIsLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const loadMore = React.useCallback(async () => {
    if (isLoading || visibleCount >= items.length) return

    setIsLoading(true)
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setVisibleCount(prev => Math.min(prev + loadMoreCount, items.length))
    setIsLoading(false)
  }, [isLoading, visibleCount, items.length, loadMoreCount])

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = container.querySelector('.load-more-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => observer.disconnect()
  }, [loadMore])

  const visibleItems = items.slice(0, visibleCount)

  return (
    <div ref={containerRef} className={className}>
      {visibleItems.map((item, index) => (
        <div key={index} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
      
      {visibleCount < items.length && (
        <div className="load-more-sentinel p-4 text-center">
          {isLoading ? (
            <LoadingFallback message="Loading more..." />
          ) : (
            <button
              onClick={loadMore}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Load More ({items.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Image lazy loading component
export const LazyImage: React.FC<{
  src: string
  alt: string
  placeholder?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}> = ({ src, alt, placeholder, className = '', onLoad, onError }) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '')
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoaded && !hasError) {
          const img = new Image()
          
          img.onload = () => {
            setImageSrc(src)
            setIsLoaded(true)
            onLoad?.()
          }
          
          img.onerror = () => {
            setHasError(true)
            onError?.()
          }
          
          img.src = src
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [src, isLoaded, hasError, onLoad, onError])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-50'} ${className}`}
      loading="lazy"
    />
  )
}
