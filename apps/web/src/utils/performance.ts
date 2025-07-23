import { useCallback, useMemo, useRef, useEffect, useState } from 'react'

/**
 * Performance utilities for optimizing React components and user experience
 */

// Debounce hook for search inputs and API calls
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for scroll events and frequent updates
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  const startIndex = Math.max(0, visibleStart - overscan)
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan)

  const visibleItems = items.slice(startIndex, endIndex + 1)

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop
  }
}

// Memoized component wrapper
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, areEqual)
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>()
  const renderCount = useRef(0)

  useEffect(() => {
    renderStart.current = performance.now()
    renderCount.current += 1
  })

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`)
        
        if (renderTime > 16) {
          console.warn(`⚠️ ${componentName} slow render: ${renderTime.toFixed(2)}ms`)
        }
      }
    }
  })

  return {
    renderCount: renderCount.current,
    logRender: useCallback((label?: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName}${label ? ` - ${label}` : ''} rendered`)
      }
    }, [componentName])
  }
}

// Image lazy loading with placeholder
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const isInView = useIntersectionObserver(imgRef)

  useEffect(() => {
    if (isInView && src && !isLoaded && !isError) {
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      
      img.onerror = () => {
        setIsError(true)
      }
      
      img.src = src
    }
  }, [isInView, src, isLoaded, isError])

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
    isInView
  }
}

// Optimized event handlers
export function useOptimizedEventHandlers() {
  const handlersRef = useRef<Map<string, Function>>(new Map())

  const createHandler = useCallback((key: string, handler: Function) => {
    if (!handlersRef.current.has(key)) {
      handlersRef.current.set(key, handler)
    }
    return handlersRef.current.get(key)!
  }, [])

  const memoizedHandler = useCallback((handler: Function, deps: any[]) => {
    return useCallback(handler, deps)
  }, [])

  return { createHandler, memoizedHandler }
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
      console.log('Bundle analyzer available')
    }).catch(() => {
      console.log('Bundle analyzer not available')
    })
  }
}

// Memory usage monitor
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000)

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// Resource preloader
export function preloadResource(href: string, as: string = 'fetch') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  document.head.appendChild(link)
}

// Critical resource preloader
export function preloadCriticalResources() {
  // Preload critical fonts
  preloadResource('/fonts/inter-var.woff2', 'font')
  
  // Preload critical images
  preloadResource('/images/logo.svg', 'image')
  
  // Preload critical API endpoints
  preloadResource('/api/user/profile', 'fetch')
}

// Performance metrics collector
export class PerformanceMetrics {
  private static instance: PerformanceMetrics
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMetrics {
    if (!PerformanceMetrics.instance) {
      PerformanceMetrics.instance = new PerformanceMetrics()
    }
    return PerformanceMetrics.instance
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || []
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  getAllMetrics() {
    const result: Record<string, { average: number; count: number; latest: number }> = {}
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverageMetric(name),
        count: values.length,
        latest: values[values.length - 1] || 0
      }
    })
    
    return result
  }

  clearMetrics() {
    this.metrics.clear()
  }
}

// Web Vitals monitoring
export function useWebVitals() {
  const [vitals, setVitals] = useState<Record<string, number>>({})

  useEffect(() => {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => {
        setVitals(prev => ({ ...prev, CLS: metric.value }))
      })
      
      getFID((metric) => {
        setVitals(prev => ({ ...prev, FID: metric.value }))
      })
      
      getFCP((metric) => {
        setVitals(prev => ({ ...prev, FCP: metric.value }))
      })
      
      getLCP((metric) => {
        setVitals(prev => ({ ...prev, LCP: metric.value }))
      })
      
      getTTFB((metric) => {
        setVitals(prev => ({ ...prev, TTFB: metric.value }))
      })
    }).catch(() => {
      console.log('Web Vitals not available')
    })
  }, [])

  return vitals
}

// Component size optimizer
export function useComponentSize() {
  const ref = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })

    resizeObserver.observe(ref.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return { ref, size }
}

// Optimized image loading with WebP support and progressive enhancement
export function useOptimizedImage(src: string, options: {
  placeholder?: string
  sizes?: string
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'auto'
} = {}) {
  const [imageSrc, setImageSrc] = useState(options.placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const isInView = useIntersectionObserver(imgRef)

  useEffect(() => {
    if (isInView && src && !isLoaded && !isError) {
      const loadImage = async () => {
        try {
          // Check WebP support
          const supportsWebP = await checkWebPSupport()

          // Generate optimized image URLs
          const imageUrls = generateImageUrls(src, {
            ...options,
            supportsWebP
          })

          // Try loading images in order of preference
          for (const url of imageUrls) {
            try {
              await loadImagePromise(url)
              setImageSrc(url)
              setIsLoaded(true)
              return
            } catch {
              continue
            }
          }

          // If all optimized versions fail, try original
          await loadImagePromise(src)
          setImageSrc(src)
          setIsLoaded(true)
        } catch {
          setIsError(true)
        }
      }

      loadImage()
    }
  }, [isInView, src, isLoaded, isError, options])

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
    isInView
  }
}

// Check WebP support
async function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

// Generate optimized image URLs
function generateImageUrls(src: string, options: {
  quality?: number
  format?: string
  supportsWebP?: boolean
  sizes?: string
}): string[] {
  const urls: string[] = []
  const { quality = 85, supportsWebP, sizes } = options

  // If it's already an optimized URL, return as is
  if (src.includes('?') || src.includes('&')) {
    return [src]
  }

  // Generate WebP version if supported
  if (supportsWebP) {
    urls.push(`${src}?format=webp&quality=${quality}${sizes ? `&sizes=${sizes}` : ''}`)
  }

  // Generate JPEG version
  urls.push(`${src}?format=jpeg&quality=${quality}${sizes ? `&sizes=${sizes}` : ''}`)

  // Original as fallback
  urls.push(src)

  return urls
}

// Load image as promise
function loadImagePromise(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}
