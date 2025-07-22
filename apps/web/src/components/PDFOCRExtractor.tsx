import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  Search, 
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader,
  Copy,
  Image,
  Zap
} from 'lucide-react'

interface OCRPage {
  pageNumber: number
  text: string
  confidence: number
  wordCount: number
}

interface OCRResult {
  fullText: string
  totalPages: number
  averageConfidence: number
  pages: OCRPage[]
}

interface OCRStats {
  totalWords: number
  totalCharacters: number
  processingTime: string
}

interface PDFOCRExtractorProps {
  onTextExtracted?: (result: OCRResult) => void
  className?: string
}

export function PDFOCRExtractor({ onTextExtracted, className = '' }: PDFOCRExtractorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [ocrStats, setOcrStats] = useState<OCRStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadedFile(file)
    setError(null)
    setOcrResult(null)
    setOcrStats(null)
    setSearchResults([])
    setSelectedPages([])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
    },
    maxFiles: 1
  })

  const handleExtractText = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      // In a real app, this would upload the file and call the API
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock OCR result
      const mockResult: OCRResult = {
        fullText: `This is a sample OCR extraction result from the PDF document.

The document contains multiple pages with various types of content including:
- Text paragraphs
- Tables and structured data
- Headers and footers
- Possibly some handwritten notes

Page 1 Content:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Page 2 Content:
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

The OCR process has successfully extracted text from ${selectedPages.length > 0 ? selectedPages.length : 'all'} pages with high confidence levels.`,
        totalPages: 2,
        averageConfidence: 94,
        pages: [
          {
            pageNumber: 1,
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            confidence: 96,
            wordCount: 19
          },
          {
            pageNumber: 2,
            text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            confidence: 92,
            wordCount: 18
          }
        ]
      }

      const mockStats: OCRStats = {
        totalWords: 87,
        totalCharacters: 542,
        processingTime: '3.2s'
      }
      
      setOcrResult(mockResult)
      setOcrStats(mockStats)
      
      if (onTextExtracted) {
        onTextExtracted(mockResult)
      }
    } catch (err) {
      setError('Failed to extract text from document')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim() || !ocrResult) return

    setIsSearching(true)
    try {
      // In a real app, this would call the search API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock search results
      const mockSearchResults = [
        {
          term: searchTerm,
          found: true,
          matchCount: 2,
          matches: [
            {
              pageNumber: 1,
              text: searchTerm,
              context: `...consectetur adipiscing ${searchTerm} sed do eiusmod...`
            },
            {
              pageNumber: 2,
              text: searchTerm,
              context: `...veniam quis ${searchTerm} exercitation ullamco...`
            }
          ]
        }
      ]
      
      setSearchResults(mockSearchResults)
    } catch (err) {
      setError('Failed to search text')
    } finally {
      setIsSearching(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadText = () => {
    if (!ocrResult) return
    
    const blob = new Blob([ocrResult.fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${uploadedFile?.name || 'document'}_extracted_text.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100'
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">OCR Text Extraction</h2>
        
        {/* File Upload */}
        {!uploadedFile && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop the file here' : 'Upload PDF or Image'}
            </p>
            <p className="text-gray-600">
              Drag and drop a PDF or image file, or click to browse
            </p>
          </div>
        )}

        {/* File Info */}
        {uploadedFile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {uploadedFile.type.startsWith('image/') ? (
                  <Image className="h-8 w-8 text-blue-500" />
                ) : (
                  <FileText className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{uploadedFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleExtractText}
                disabled={isProcessing}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Extract Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{ocrResult.totalPages}</div>
                <div className="text-sm text-blue-700">Pages Processed</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{ocrResult.averageConfidence}%</div>
                <div className="text-sm text-green-700">Avg Confidence</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{ocrStats?.totalWords}</div>
                <div className="text-sm text-purple-700">Total Words</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{ocrStats?.totalCharacters}</div>
                <div className="text-sm text-orange-700">Characters</div>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in extracted text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Search</span>
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-3">Search Results</h4>
                {searchResults.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <p className="text-sm text-yellow-800">
                      Found <strong>{result.matchCount}</strong> matches for "{result.term}"
                    </p>
                    {result.matches.map((match: any, matchIndex: number) => (
                      <div key={matchIndex} className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Page {match.pageNumber}</span>
                        </div>
                        <p className="text-sm text-gray-700">{match.context}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Extracted Text */}
            <div className="border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Extracted Text</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(ocrResult.fullText)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={downloadText}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {ocrResult.fullText}
                </pre>
              </div>
            </div>

            {/* Page Details */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Page Details</h3>
              {ocrResult.pages.map(page => (
                <div key={page.pageNumber} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Page {page.pageNumber}</span>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(page.confidence)}`}>
                        {page.confidence}% confidence
                      </span>
                      <span className="text-sm text-gray-500">{page.wordCount} words</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{page.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
