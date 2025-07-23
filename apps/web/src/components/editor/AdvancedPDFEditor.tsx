import React, { useState, useRef, useEffect } from 'react'
import { 
  Edit3, 
  Type, 
  Image, 
  Square, 
  Circle, 
  ArrowRight,
  Highlighter,
  Eraser,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
  Save,
  Download,
  Undo,
  Redo,
  Layers,
  Palette,
  Settings,
  MousePointer,
  PenTool,
  Minus
} from 'lucide-react'

interface EditingTool {
  id: string
  name: string
  icon: React.ComponentType<any>
  cursor: string
  category: 'select' | 'text' | 'draw' | 'shape' | 'annotate'
}

interface Annotation {
  id: string
  type: 'text' | 'highlight' | 'rectangle' | 'circle' | 'arrow' | 'freehand'
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color: string
  strokeWidth: number
  page: number
}

export function AdvancedPDFEditor() {
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [zoom, setZoom] = useState(100)
  const [selectedColor, setSelectedColor] = useState('#ff0000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [showLayers, setShowLayers] = useState(false)
  const [history, setHistory] = useState<Annotation[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1000 })

  const tools: EditingTool[] = [
    { id: 'select', name: 'Select', icon: MousePointer, cursor: 'default', category: 'select' },
    { id: 'text', name: 'Text', icon: Type, cursor: 'text', category: 'text' },
    { id: 'pen', name: 'Pen', icon: PenTool, cursor: 'crosshair', category: 'draw' },
    { id: 'highlighter', name: 'Highlighter', icon: Highlighter, cursor: 'crosshair', category: 'annotate' },
    { id: 'rectangle', name: 'Rectangle', icon: Square, cursor: 'crosshair', category: 'shape' },
    { id: 'circle', name: 'Circle', icon: Circle, cursor: 'crosshair', category: 'shape' },
    { id: 'arrow', name: 'Arrow', icon: ArrowRight, cursor: 'crosshair', category: 'annotate' },
    { id: 'eraser', name: 'Eraser', icon: Eraser, cursor: 'crosshair', category: 'draw' }
  ]

  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#000000', '#ffffff', '#808080', '#800000', '#008000', '#000080'
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw PDF background (simulated)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#e5e7eb'
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Draw sample PDF content
    ctx.fillStyle = '#000000'
    ctx.font = '16px Arial'
    ctx.fillText('Sample PDF Document', 50, 50)
    ctx.fillText('This is a sample document for editing demonstration.', 50, 80)
    ctx.fillText('You can add annotations, text, and shapes.', 50, 110)

    // Draw all annotations
    annotations.forEach(annotation => {
      drawAnnotation(ctx, annotation)
    })

    // Draw current annotation being created
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation)
    }
  }, [annotations, currentAnnotation, zoom])

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    ctx.strokeStyle = annotation.color
    ctx.fillStyle = annotation.color
    ctx.lineWidth = annotation.strokeWidth

    switch (annotation.type) {
      case 'rectangle':
        if (annotation.width && annotation.height) {
          ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
        }
        break
      case 'circle':
        if (annotation.width && annotation.height) {
          const radius = Math.min(Math.abs(annotation.width), Math.abs(annotation.height)) / 2
          const centerX = annotation.x + annotation.width / 2
          const centerY = annotation.y + annotation.height / 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
        break
      case 'arrow':
        if (annotation.width && annotation.height) {
          const endX = annotation.x + annotation.width
          const endY = annotation.y + annotation.height
          drawArrow(ctx, annotation.x, annotation.y, endX, endY)
        }
        break
      case 'text':
        if (annotation.text) {
          ctx.font = '14px Arial'
          ctx.fillText(annotation.text, annotation.x, annotation.y)
        }
        break
      case 'highlight':
        if (annotation.width && annotation.height) {
          ctx.globalAlpha = 0.3
          ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height)
          ctx.globalAlpha = 1
        }
        break
    }
  }

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10
    const angle = Math.atan2(toY - fromY, toX - fromX)

    // Draw line
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()

    // Draw arrowhead
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
    ctx.stroke()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (selectedTool === 'select') return

    setIsDrawing(true)

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: selectedTool as any,
      x,
      y,
      width: 0,
      height: 0,
      color: selectedColor,
      strokeWidth,
      page: 1
    }

    if (selectedTool === 'text') {
      const text = prompt('Enter text:')
      if (text) {
        newAnnotation.text = text
        addAnnotation(newAnnotation)
      }
    } else {
      setCurrentAnnotation(newAnnotation)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentAnnotation({
      ...currentAnnotation,
      width: x - currentAnnotation.x,
      height: y - currentAnnotation.y
    })
  }

  const handleMouseUp = () => {
    if (currentAnnotation && isDrawing) {
      addAnnotation(currentAnnotation)
      setCurrentAnnotation(null)
    }
    setIsDrawing(false)
  }

  const addAnnotation = (annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation]
    setAnnotations(newAnnotations)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAnnotations)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAnnotations(history[historyIndex - 1] || [])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAnnotations(history[historyIndex + 1])
    }
  }

  const zoomIn = () => setZoom(Math.min(zoom + 25, 300))
  const zoomOut = () => setZoom(Math.max(zoom - 25, 25))

  const saveDocument = () => {
    // Implementation would save the annotated PDF
    alert('Document saved with annotations!')
  }

  const exportDocument = () => {
    // Implementation would export the PDF with annotations
    alert('Document exported!')
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
        {tools.map(tool => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`p-3 rounded-lg transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={tool.name}
            >
              <Icon className="h-5 w-5" />
            </button>
          )
        })}
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* History Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={zoomOut}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {zoom}%
              </span>
              <button
                onClick={zoomIn}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Color Picker */}
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-gray-600" />
              <div className="flex space-x-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded border-2 ${
                      selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="flex items-center space-x-2">
              <Minus className="h-4 w-4 text-gray-600" />
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-600 min-w-[20px]">{strokeWidth}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <Layers className="h-4 w-4" />
              <span>Layers</span>
            </button>
            <button
              onClick={saveDocument}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              onClick={exportDocument}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div 
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="block cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Layers</h3>
            <button
              onClick={() => setShowLayers(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">PDF Document</span>
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            
            {annotations.map((annotation, index) => (
              <div key={annotation.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">
                    {annotation.type} {index + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: annotation.color }}
                    />
                    <button
                      onClick={() => {
                        const newAnnotations = annotations.filter(a => a.id !== annotation.id)
                        setAnnotations(newAnnotations)
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Eraser className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
