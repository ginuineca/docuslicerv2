import { Client as ElasticsearchClient } from '@elastic/elasticsearch'
import lunr from 'lunr'
import Fuse from 'fuse.js'
import natural from 'natural'
import { removeStopwords } from 'stopword'
import fs from 'fs/promises'
import path from 'path'

export interface SearchDocument {
  id: string
  title: string
  content: string
  metadata: {
    fileType: string
    fileSize: number
    createdAt: Date
    modifiedAt: Date
    author?: string
    tags: string[]
    language?: string
    pageCount?: number
    wordCount?: number
    category?: string
    source?: string
  }
  extractedData?: {
    entities?: Array<{ text: string; type: string; confidence: number }>
    keywords?: Array<{ text: string; score: number }>
    summary?: string
    sentiment?: { score: number; label: 'positive' | 'negative' | 'neutral' }
  }
  permissions?: {
    userId: string
    access: 'public' | 'private' | 'shared'
    sharedWith?: string[]
  }
}

export interface SearchQuery {
  query: string
  filters?: {
    fileType?: string[]
    dateRange?: { from: Date; to: Date }
    author?: string[]
    tags?: string[]
    language?: string[]
    category?: string[]
    minFileSize?: number
    maxFileSize?: number
    minPageCount?: number
    maxPageCount?: number
  }
  sort?: {
    field: 'relevance' | 'date' | 'title' | 'fileSize' | 'pageCount'
    order: 'asc' | 'desc'
  }
  pagination?: {
    page: number
    limit: number
  }
  highlight?: boolean
  facets?: string[]
}

export interface SearchResult {
  documents: Array<{
    document: SearchDocument
    score: number
    highlights?: Record<string, string[]>
  }>
  total: number
  facets?: Record<string, Array<{ value: string; count: number }>>
  suggestions?: string[]
  queryTime: number
  page: number
  totalPages: number
}

export interface IndexStats {
  totalDocuments: number
  totalSize: number
  averageDocumentSize: number
  languageDistribution: Record<string, number>
  fileTypeDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
  lastIndexed: Date
  indexHealth: 'green' | 'yellow' | 'red'
}

export class SearchService {
  private elasticsearchClient?: ElasticsearchClient
  private lunrIndex?: lunr.Index
  private fuseIndex?: Fuse<SearchDocument>
  private documents: Map<string, SearchDocument> = new Map()
  private useElasticsearch: boolean = false
  private indexName: string = 'docuslicer-documents'
  private dataDir: string

  constructor(elasticsearchUrl?: string) {
    this.dataDir = path.join(process.cwd(), 'data', 'search')
    this.ensureDataDir()

    if (elasticsearchUrl) {
      try {
        this.elasticsearchClient = new ElasticsearchClient({
          node: elasticsearchUrl
        })
        this.useElasticsearch = true
        this.initializeElasticsearchIndex()
        console.log('✅ Elasticsearch connected for search indexing')
      } catch (error) {
        console.warn('⚠️ Elasticsearch connection failed, using local search indices')
        this.useElasticsearch = false
      }
    }

    this.loadDocuments()
    this.buildLocalIndices()
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create search data directory:', error)
    }
  }

  /**
   * Initialize Elasticsearch index
   */
  private async initializeElasticsearchIndex(): Promise<void> {
    if (!this.elasticsearchClient) return

    try {
      const indexExists = await this.elasticsearchClient.indices.exists({
        index: this.indexName
      })

      if (!indexExists) {
        await this.elasticsearchClient.indices.create({
          index: this.indexName,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  custom_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'stemmer']
                  }
                }
              }
            },
            mappings: {
              properties: {
                title: {
                  type: 'text',
                  analyzer: 'custom_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                content: {
                  type: 'text',
                  analyzer: 'custom_analyzer'
                },
                'metadata.fileType': { type: 'keyword' },
                'metadata.fileSize': { type: 'long' },
                'metadata.createdAt': { type: 'date' },
                'metadata.modifiedAt': { type: 'date' },
                'metadata.author': { type: 'keyword' },
                'metadata.tags': { type: 'keyword' },
                'metadata.language': { type: 'keyword' },
                'metadata.pageCount': { type: 'integer' },
                'metadata.wordCount': { type: 'integer' },
                'metadata.category': { type: 'keyword' },
                'extractedData.entities': {
                  type: 'nested',
                  properties: {
                    text: { type: 'keyword' },
                    type: { type: 'keyword' },
                    confidence: { type: 'float' }
                  }
                },
                'extractedData.keywords': {
                  type: 'nested',
                  properties: {
                    text: { type: 'keyword' },
                    score: { type: 'float' }
                  }
                },
                'extractedData.summary': { type: 'text' },
                'extractedData.sentiment.score': { type: 'float' },
                'extractedData.sentiment.label': { type: 'keyword' }
              }
            }
          }
        })
        console.log('✅ Elasticsearch index created')
      }
    } catch (error) {
      console.error('Failed to initialize Elasticsearch index:', error)
      this.useElasticsearch = false
    }
  }

  /**
   * Index a document
   */
  async indexDocument(document: SearchDocument): Promise<void> {
    // Store in memory
    this.documents.set(document.id, document)

    if (this.useElasticsearch && this.elasticsearchClient) {
      try {
        await this.elasticsearchClient.index({
          index: this.indexName,
          id: document.id,
          body: document
        })
      } catch (error) {
        console.error('Failed to index document in Elasticsearch:', error)
      }
    }

    // Rebuild local indices
    this.buildLocalIndices()
    
    // Save to disk
    await this.saveDocuments()
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(documents: SearchDocument[]): Promise<void> {
    // Store in memory
    documents.forEach(doc => {
      this.documents.set(doc.id, doc)
    })

    if (this.useElasticsearch && this.elasticsearchClient) {
      try {
        const body = documents.flatMap(doc => [
          { index: { _index: this.indexName, _id: doc.id } },
          doc
        ])

        await this.elasticsearchClient.bulk({ body })
      } catch (error) {
        console.error('Failed to bulk index documents in Elasticsearch:', error)
      }
    }

    // Rebuild local indices
    this.buildLocalIndices()
    
    // Save to disk
    await this.saveDocuments()
  }

  /**
   * Search documents
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now()

    let result: SearchResult

    if (this.useElasticsearch && this.elasticsearchClient) {
      result = await this.searchElasticsearch(query)
    } else {
      result = await this.searchLocal(query)
    }

    result.queryTime = Date.now() - startTime
    return result
  }

  /**
   * Search using Elasticsearch
   */
  private async searchElasticsearch(query: SearchQuery): Promise<SearchResult> {
    if (!this.elasticsearchClient) throw new Error('Elasticsearch not available')

    const searchBody: any = {
      query: {
        bool: {
          must: [],
          filter: []
        }
      }
    }

    // Main query
    if (query.query) {
      searchBody.query.bool.must.push({
        multi_match: {
          query: query.query,
          fields: ['title^2', 'content', 'extractedData.summary'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      })
    } else {
      searchBody.query.bool.must.push({ match_all: {} })
    }

    // Filters
    if (query.filters) {
      const filters = query.filters

      if (filters.fileType?.length) {
        searchBody.query.bool.filter.push({
          terms: { 'metadata.fileType': filters.fileType }
        })
      }

      if (filters.dateRange) {
        searchBody.query.bool.filter.push({
          range: {
            'metadata.createdAt': {
              gte: filters.dateRange.from.toISOString(),
              lte: filters.dateRange.to.toISOString()
            }
          }
        })
      }

      if (filters.author?.length) {
        searchBody.query.bool.filter.push({
          terms: { 'metadata.author': filters.author }
        })
      }

      if (filters.tags?.length) {
        searchBody.query.bool.filter.push({
          terms: { 'metadata.tags': filters.tags }
        })
      }

      if (filters.language?.length) {
        searchBody.query.bool.filter.push({
          terms: { 'metadata.language': filters.language }
        })
      }

      if (filters.category?.length) {
        searchBody.query.bool.filter.push({
          terms: { 'metadata.category': filters.category }
        })
      }

      if (filters.minFileSize || filters.maxFileSize) {
        const range: any = {}
        if (filters.minFileSize) range.gte = filters.minFileSize
        if (filters.maxFileSize) range.lte = filters.maxFileSize
        searchBody.query.bool.filter.push({
          range: { 'metadata.fileSize': range }
        })
      }

      if (filters.minPageCount || filters.maxPageCount) {
        const range: any = {}
        if (filters.minPageCount) range.gte = filters.minPageCount
        if (filters.maxPageCount) range.lte = filters.maxPageCount
        searchBody.query.bool.filter.push({
          range: { 'metadata.pageCount': range }
        })
      }
    }

    // Sorting
    if (query.sort) {
      const sortField = query.sort.field === 'relevance' ? '_score' : 
                       query.sort.field === 'date' ? 'metadata.createdAt' :
                       query.sort.field === 'title' ? 'title.keyword' :
                       query.sort.field === 'fileSize' ? 'metadata.fileSize' :
                       'metadata.pageCount'

      searchBody.sort = [{ [sortField]: { order: query.sort.order } }]
    }

    // Pagination
    const page = query.pagination?.page || 1
    const limit = query.pagination?.limit || 20
    searchBody.from = (page - 1) * limit
    searchBody.size = limit

    // Highlighting
    if (query.highlight) {
      searchBody.highlight = {
        fields: {
          title: {},
          content: {},
          'extractedData.summary': {}
        }
      }
    }

    // Facets (aggregations)
    if (query.facets?.length) {
      searchBody.aggs = {}
      query.facets.forEach(facet => {
        const field = facet === 'fileType' ? 'metadata.fileType' :
                     facet === 'author' ? 'metadata.author' :
                     facet === 'language' ? 'metadata.language' :
                     facet === 'category' ? 'metadata.category' :
                     `metadata.${facet}`

        searchBody.aggs[facet] = {
          terms: { field, size: 10 }
        }
      })
    }

    const response = await this.elasticsearchClient.search({
      index: this.indexName,
      body: searchBody
    })

    // Process results
    const documents = response.body.hits.hits.map((hit: any) => ({
      document: hit._source,
      score: hit._score,
      highlights: hit.highlight
    }))

    const facets: Record<string, Array<{ value: string; count: number }>> = {}
    if (response.body.aggregations) {
      Object.entries(response.body.aggregations).forEach(([key, agg]: [string, any]) => {
        facets[key] = agg.buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count
        }))
      })
    }

    return {
      documents,
      total: response.body.hits.total.value,
      facets,
      suggestions: [], // Would implement with suggest API
      queryTime: 0, // Will be set by caller
      page,
      totalPages: Math.ceil(response.body.hits.total.value / limit)
    }
  }

  /**
   * Search using local indices
   */
  private async searchLocal(query: SearchQuery): Promise<SearchResult> {
    let results: Array<{ document: SearchDocument; score: number }> = []

    if (query.query) {
      // Use Lunr for full-text search
      if (this.lunrIndex) {
        const lunrResults = this.lunrIndex.search(query.query)
        results = lunrResults.map(result => ({
          document: this.documents.get(result.ref)!,
          score: result.score
        })).filter(r => r.document)
      }

      // Fallback to Fuse.js for fuzzy search
      if (results.length === 0 && this.fuseIndex) {
        const fuseResults = this.fuseIndex.search(query.query)
        results = fuseResults.map(result => ({
          document: result.item,
          score: 1 - result.score! // Fuse.js uses distance, we want similarity
        }))
      }
    } else {
      // Return all documents
      results = Array.from(this.documents.values()).map(doc => ({
        document: doc,
        score: 1
      }))
    }

    // Apply filters
    if (query.filters) {
      results = results.filter(result => this.applyFilters(result.document, query.filters!))
    }

    // Apply sorting
    if (query.sort) {
      results.sort((a, b) => {
        let comparison = 0
        
        switch (query.sort!.field) {
          case 'relevance':
            comparison = b.score - a.score
            break
          case 'date':
            const dateA = a.document.metadata.createdAt instanceof Date
              ? a.document.metadata.createdAt
              : new Date(a.document.metadata.createdAt)
            const dateB = b.document.metadata.createdAt instanceof Date
              ? b.document.metadata.createdAt
              : new Date(b.document.metadata.createdAt)

            const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime()
            const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime()

            comparison = timeB - timeA
            break
          case 'title':
            comparison = a.document.title.localeCompare(b.document.title)
            break
          case 'fileSize':
            comparison = a.document.metadata.fileSize - b.document.metadata.fileSize
            break
          case 'pageCount':
            comparison = (a.document.metadata.pageCount || 0) - (b.document.metadata.pageCount || 0)
            break
        }

        return query.sort!.order === 'desc' ? -comparison : comparison
      })
    }

    // Calculate facets
    const facets: Record<string, Array<{ value: string; count: number }>> = {}
    if (query.facets?.length) {
      query.facets.forEach(facet => {
        const values: Record<string, number> = {}
        results.forEach(result => {
          let value: string
          switch (facet) {
            case 'fileType':
              value = result.document.metadata.fileType
              break
            case 'author':
              value = result.document.metadata.author || 'Unknown'
              break
            case 'language':
              value = result.document.metadata.language || 'Unknown'
              break
            case 'category':
              value = result.document.metadata.category || 'Uncategorized'
              break
            default:
              value = 'Unknown'
          }
          values[value] = (values[value] || 0) + 1
        })

        facets[facet] = Object.entries(values)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      })
    }

    // Apply pagination
    const page = query.pagination?.page || 1
    const limit = query.pagination?.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedResults = results.slice(startIndex, endIndex)

    // Generate suggestions (simple implementation)
    const suggestions = this.generateSuggestions(query.query || '')

    return {
      documents: paginatedResults,
      total: results.length,
      facets,
      suggestions,
      queryTime: 0, // Will be set by caller
      page,
      totalPages: Math.ceil(results.length / limit)
    }
  }

  /**
   * Apply filters to a document
   */
  private applyFilters(document: SearchDocument, filters: NonNullable<SearchQuery['filters']>): boolean {
    if (filters.fileType?.length && !filters.fileType.includes(document.metadata.fileType)) {
      return false
    }

    if (filters.dateRange) {
      const docDate = document.metadata.createdAt
      if (docDate < filters.dateRange.from || docDate > filters.dateRange.to) {
        return false
      }
    }

    if (filters.author?.length && !filters.author.includes(document.metadata.author || '')) {
      return false
    }

    if (filters.tags?.length && !filters.tags.some(tag => document.metadata.tags.includes(tag))) {
      return false
    }

    if (filters.language?.length && !filters.language.includes(document.metadata.language || '')) {
      return false
    }

    if (filters.category?.length && !filters.category.includes(document.metadata.category || '')) {
      return false
    }

    if (filters.minFileSize && document.metadata.fileSize < filters.minFileSize) {
      return false
    }

    if (filters.maxFileSize && document.metadata.fileSize > filters.maxFileSize) {
      return false
    }

    if (filters.minPageCount && (document.metadata.pageCount || 0) < filters.minPageCount) {
      return false
    }

    if (filters.maxPageCount && (document.metadata.pageCount || 0) > filters.maxPageCount) {
      return false
    }

    return true
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string): string[] {
    if (!query) return []

    const suggestions: string[] = []
    const queryWords = query.toLowerCase().split(/\s+/)

    // Simple suggestion based on document titles and content
    this.documents.forEach(doc => {
      const titleWords = doc.title.toLowerCase().split(/\s+/)
      const contentWords = doc.content.toLowerCase().split(/\s+/).slice(0, 100) // First 100 words

      const allWords = titleWords.concat(contentWords)
      allWords.forEach(word => {
        if (word.length > 3 && queryWords.some(qw => word.startsWith(qw))) {
          if (!suggestions.includes(word) && suggestions.length < 5) {
            suggestions.push(word)
          }
        }
      })
    })

    return suggestions
  }

  /**
   * Build local search indices
   */
  private buildLocalIndices(): void {
    const documents = Array.from(this.documents.values())

    // Build Lunr index
    this.lunrIndex = lunr(function() {
      this.ref('id')
      this.field('title', { boost: 10 })
      this.field('content')
      this.field('tags')
      this.field('author')
      this.field('summary')

      documents.forEach(doc => {
        this.add({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          tags: doc.metadata.tags.join(' '),
          author: doc.metadata.author || '',
          summary: doc.extractedData?.summary || ''
        })
      })
    })

    // Build Fuse.js index
    const fuseOptions = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.3 },
        { name: 'metadata.tags', weight: 0.2 },
        { name: 'extractedData.summary', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true
    }

    this.fuseIndex = new Fuse(documents, fuseOptions)
  }

  /**
   * Delete a document from the index
   */
  async deleteDocument(documentId: string): Promise<void> {
    this.documents.delete(documentId)

    if (this.useElasticsearch && this.elasticsearchClient) {
      try {
        await this.elasticsearchClient.delete({
          index: this.indexName,
          id: documentId
        })
      } catch (error) {
        console.error('Failed to delete document from Elasticsearch:', error)
      }
    }

    // Rebuild local indices
    this.buildLocalIndices()
    
    // Save to disk
    await this.saveDocuments()
  }

  /**
   * Get document by ID
   */
  getDocument(documentId: string): SearchDocument | undefined {
    return this.documents.get(documentId)
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<IndexStats> {
    const documents = Array.from(this.documents.values())
    const totalSize = documents.reduce((sum, doc) => sum + doc.metadata.fileSize, 0)

    const languageDistribution: Record<string, number> = {}
    const fileTypeDistribution: Record<string, number> = {}
    const categoryDistribution: Record<string, number> = {}

    documents.forEach(doc => {
      const lang = doc.metadata.language || 'unknown'
      const type = doc.metadata.fileType
      const category = doc.metadata.category || 'uncategorized'

      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1
      fileTypeDistribution[type] = (fileTypeDistribution[type] || 0) + 1
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1
    })

    let indexHealth: 'green' | 'yellow' | 'red' = 'green'
    if (this.useElasticsearch && this.elasticsearchClient) {
      try {
        const health = await this.elasticsearchClient.cluster.health({
          index: this.indexName
        })
        indexHealth = health.body.status
      } catch (error) {
        indexHealth = 'red'
      }
    }

    return {
      totalDocuments: documents.length,
      totalSize,
      averageDocumentSize: documents.length > 0 ? totalSize / documents.length : 0,
      languageDistribution,
      fileTypeDistribution,
      categoryDistribution,
      lastIndexed: new Date(),
      indexHealth
    }
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text: string, maxKeywords: number = 10): Array<{ text: string; score: number }> {
    // Tokenize and clean text
    const tokens = natural.WordTokenizer.tokenize(text.toLowerCase()) || []
    const cleanTokens = removeStopwords(tokens).filter(token => 
      token.length > 2 && /^[a-zA-Z]+$/.test(token)
    )

    // Calculate TF-IDF scores (simplified)
    const termFreq: Record<string, number> = {}
    cleanTokens.forEach(token => {
      termFreq[token] = (termFreq[token] || 0) + 1
    })

    // Convert to keyword objects and sort by frequency
    const keywords = Object.entries(termFreq)
      .map(([text, freq]) => ({
        text,
        score: freq / cleanTokens.length
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxKeywords)

    return keywords
  }

  /**
   * Extract entities from text (simplified implementation)
   */
  extractEntities(text: string): Array<{ text: string; type: string; confidence: number }> {
    const entities: Array<{ text: string; type: string; confidence: number }> = []

    // Simple regex-based entity extraction
    const patterns = [
      { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'PERSON' },
      { pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, type: 'DATE' },
      { pattern: /\$\d+(?:,\d{3})*(?:\.\d{2})?\b/g, type: 'MONEY' },
      { pattern: /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd)\b/g, type: 'ORGANIZATION' },
      { pattern: /\b\w+@\w+\.\w+\b/g, type: 'EMAIL' },
      { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, type: 'PHONE' }
    ]

    patterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern) || []
      matches.forEach(match => {
        entities.push({
          text: match,
          type,
          confidence: 0.8 // Simplified confidence score
        })
      })
    })

    return entities
  }

  /**
   * Load documents from disk
   */
  private async loadDocuments(): Promise<void> {
    try {
      const documentsFile = path.join(this.dataDir, 'documents.json')
      const data = await fs.readFile(documentsFile, 'utf-8')
      const parsedDocuments = JSON.parse(data)
      
      parsedDocuments.forEach((doc: any) => {
        // Convert date strings back to Date objects
        doc.metadata.createdAt = new Date(doc.metadata.createdAt)
        doc.metadata.modifiedAt = new Date(doc.metadata.modifiedAt)
        this.documents.set(doc.id, doc)
      })
      
      console.log(`Loaded ${this.documents.size} documents from disk`)
    } catch (error) {
      console.log('No existing documents found, starting with empty index')
    }
  }

  /**
   * Save documents to disk
   */
  private async saveDocuments(): Promise<void> {
    try {
      const documentsFile = path.join(this.dataDir, 'documents.json')
      const documents = Array.from(this.documents.values())
      await fs.writeFile(documentsFile, JSON.stringify(documents, null, 2))
    } catch (error) {
      console.error('Failed to save documents to disk:', error)
    }
  }

  /**
   * Reindex all documents
   */
  async reindexAll(): Promise<void> {
    console.log('Starting reindex of all documents...')
    
    if (this.useElasticsearch && this.elasticsearchClient) {
      try {
        // Delete and recreate index
        await this.elasticsearchClient.indices.delete({ index: this.indexName })
        await this.initializeElasticsearchIndex()
        
        // Reindex all documents
        const documents = Array.from(this.documents.values())
        if (documents.length > 0) {
          await this.indexDocuments(documents)
        }
      } catch (error) {
        console.error('Failed to reindex in Elasticsearch:', error)
      }
    }

    // Rebuild local indices
    this.buildLocalIndices()
    
    console.log('Reindex completed')
  }
}
