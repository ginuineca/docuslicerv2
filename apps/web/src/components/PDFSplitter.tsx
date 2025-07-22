import { useState, useEffect } from 'react'
import { Scissors, Download, Eye, Plus, Minus } from 'lucide-react'

interface SplitRange {
  id: string
  start: number
  end: number
  name: string
}

interface PDFSplitterProps {
  file: File
  totalPages: number
  onSplit: (ranges: SplitRange[]) => void
  onPreview: (file: File) => void
}

export function PDFSplitter({ file, totalPages, onSplit, onPreview }: PDFSplitterProps) {
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([
    { id: '1', start: 1, end: totalPages, name: `${file.name.replace('.pdf', '')}_part1` }
  ])
  const [splitMode, setSplitMode] = useState<'ranges' | 'pages' | 'intervals'>('ranges')
  const [intervalSize, setIntervalSize] = useState<number>(1)

  useEffect(() => {
    // Reset ranges when file changes
    setSplitRanges([
      { id: '1', start: 1, end: totalPages, name: `${file.name.replace('.pdf', '')}_part1` }
    ])
  }, [file, totalPages])

  const addRange = () => {
    const lastRange = splitRanges[splitRanges.length - 1]
    const newStart = lastRange ? lastRange.end + 1 : 1
    const newEnd = Math.min(newStart + 9, totalPages)
    
    if (newStart <= totalPages) {
      const newRange: SplitRange = {
        id: Date.now().toString(),
        start: newStart,
        end: newEnd,
        name: `${file.name.replace('.pdf', '')}_part${splitRanges.length + 1}`
      }
      setSplitRanges([...splitRanges, newRange])
    }
  }

  const removeRange = (id: string) => {
    if (splitRanges.length > 1) {
      setSplitRanges(splitRanges.filter(range => range.id !== id))
    }
  }

  const updateRange = (id: string, field: keyof SplitRange, value: string | number) => {
    setSplitRanges(splitRanges.map(range => 
      range.id === id ? { ...range, [field]: value } : range
    ))
  }

  const generateIntervalRanges = () => {
    const ranges: SplitRange[] = []
    let currentPage = 1
    let partNumber = 1

    while (currentPage <= totalPages) {
      const endPage = Math.min(currentPage + intervalSize - 1, totalPages)
      ranges.push({
        id: partNumber.toString(),
        start: currentPage,
        end: endPage,
        name: `${file.name.replace('.pdf', '')}_part${partNumber}`
      })
      currentPage = endPage + 1
      partNumber++
    }

    setSplitRanges(ranges)
  }

  const generatePageRanges = () => {
    const ranges: SplitRange[] = []
    for (let i = 1; i <= totalPages; i++) {
      ranges.push({
        id: i.toString(),
        start: i,
        end: i,
        name: `${file.name.replace('.pdf', '')}_page${i}`
      })
    }
    setSplitRanges(ranges)
  }

  const handleModeChange = (mode: 'ranges' | 'pages' | 'intervals') => {
    setSplitMode(mode)
    
    switch (mode) {
      case 'pages':
        generatePageRanges()
        break
      case 'intervals':
        generateIntervalRanges()
        break
      case 'ranges':
        setSplitRanges([
          { id: '1', start: 1, end: totalPages, name: `${file.name.replace('.pdf', '')}_part1` }
        ])
        break
    }
  }

  const isValidRange = (range: SplitRange) => {
    return range.start >= 1 && 
           range.end <= totalPages && 
           range.start <= range.end &&
           range.name.trim() !== ''
  }

  const hasOverlappingRanges = () => {
    const sortedRanges = [...splitRanges].sort((a, b) => a.start - b.start)
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].end >= sortedRanges[i + 1].start) {
        return true
      }
    }
    return false
  }

  const canSplit = splitRanges.every(isValidRange) && !hasOverlappingRanges()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Scissors className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Split PDF</h3>
      </div>

      {/* Split Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Split Method
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleModeChange('ranges')}
            className={`p-3 text-sm rounded-lg border ${
              splitMode === 'ranges'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Custom Ranges
          </button>
          <button
            onClick={() => handleModeChange('pages')}
            className={`p-3 text-sm rounded-lg border ${
              splitMode === 'pages'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Individual Pages
          </button>
          <button
            onClick={() => handleModeChange('intervals')}
            className={`p-3 text-sm rounded-lg border ${
              splitMode === 'intervals'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Fixed Intervals
          </button>
        </div>
      </div>

      {/* Interval Size Input */}
      {splitMode === 'intervals' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pages per file
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={intervalSize}
              onChange={(e) => setIntervalSize(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generateIntervalRanges}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Split Ranges */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Split Configuration ({splitRanges.length} files)
          </label>
          {splitMode === 'ranges' && (
            <button
              onClick={addRange}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Range</span>
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {splitRanges.map((range, index) => (
            <div
              key={range.id}
              className={`p-3 border rounded-lg ${
                isValidRange(range) ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={range.name}
                    onChange={(e) => updateRange(range.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="File name"
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-1">
                  <span className="text-sm text-gray-500">Pages:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={range.start}
                    onChange={(e) => updateRange(range.id, 'start', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={splitMode !== 'ranges'}
                  />
                </div>
                <div className="col-span-3 flex items-center space-x-1">
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={range.end}
                    onChange={(e) => updateRange(range.id, 'end', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={splitMode !== 'ranges'}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  {splitMode === 'ranges' && splitRanges.length > 1 && (
                    <button
                      onClick={() => removeRange(range.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onPreview(file)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <Eye className="h-4 w-4" />
          <span>Preview Original</span>
        </button>

        <div className="flex items-center space-x-3">
          {!canSplit && (
            <p className="text-sm text-red-600">
              {hasOverlappingRanges() ? 'Overlapping ranges detected' : 'Invalid range configuration'}
            </p>
          )}
          <button
            onClick={() => onSplit(splitRanges)}
            disabled={!canSplit}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scissors className="h-4 w-4" />
            <span>Split PDF</span>
          </button>
        </div>
      </div>
    </div>
  )
}
