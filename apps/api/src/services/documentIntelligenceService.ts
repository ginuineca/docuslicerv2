import natural from 'natural'
import nlp from 'compromise'
import { parse as parseDate, format as formatDate } from 'date-fns'
import currency from 'currency.js'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import * as cheerio from 'cheerio'
import { parseString as parseXML } from 'xml2js'
import fs from 'fs/promises'
import path from 'path'

export interface DocumentAnalysis {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  pageCount?: number
  wordCount: number
  language: string
  confidence: number
  processingTime: number
  extractedData: {
    text: string
    entities: Entity[]
    keyTerms: KeyTerm[]
    dates: DateEntity[]
    amounts: AmountEntity[]
    contacts: ContactEntity[]
    addresses: AddressEntity[]
    tables: TableData[]
    metadata: DocumentMetadata
  }
  classification: DocumentClassification
  riskAssessment: RiskAssessment
  complianceCheck: ComplianceCheck
  insights: DocumentInsights
  createdAt: Date
}

export interface Entity {
  text: string
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'PRODUCT' | 'EVENT' | 'WORK_OF_ART' | 'LAW' | 'LANGUAGE'
  confidence: number
  startIndex: number
  endIndex: number
  context?: string
}

export interface KeyTerm {
  term: string
  frequency: number
  importance: number
  category: 'legal' | 'financial' | 'technical' | 'business' | 'other'
  context: string[]
}

export interface DateEntity {
  text: string
  parsedDate: Date
  type: 'deadline' | 'effective_date' | 'expiration' | 'created' | 'modified' | 'other'
  confidence: number
  context: string
}

export interface AmountEntity {
  text: string
  amount: number
  currency: string
  type: 'payment' | 'fee' | 'penalty' | 'deposit' | 'total' | 'tax' | 'other'
  confidence: number
  context: string
}

export interface ContactEntity {
  name?: string
  email?: string
  phone?: string
  title?: string
  organization?: string
  type: 'person' | 'business'
  confidence: number
}

export interface AddressEntity {
  fullAddress: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  type: 'billing' | 'shipping' | 'business' | 'residential' | 'other'
  confidence: number
}

export interface TableData {
  headers: string[]
  rows: string[][]
  caption?: string
  location: { page?: number; section?: string }
  confidence: number
}

export interface DocumentMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
  keywords?: string[]
  customProperties?: Record<string, any>
}

export interface DocumentClassification {
  primaryType: 'contract' | 'invoice' | 'legal_document' | 'financial_report' | 'medical_record' | 'real_estate' | 'other'
  subType?: string
  confidence: number
  indicators: string[]
  suggestedActions: string[]
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number // 0-100
  riskFactors: Array<{
    factor: string
    severity: 'low' | 'medium' | 'high'
    description: string
    recommendation: string
  }>
  complianceIssues: string[]
  securityConcerns: string[]
}

export interface ComplianceCheck {
  regulations: Array<{
    name: string
    applicable: boolean
    compliant: boolean
    issues: string[]
    recommendations: string[]
  }>
  dataPrivacy: {
    piiDetected: boolean
    phiDetected: boolean
    sensitiveData: string[]
    recommendations: string[]
  }
  retention: {
    suggestedPeriod: string
    legalRequirements: string[]
    businessRequirements: string[]
  }
}

export interface DocumentInsights {
  summary: string
  keyPoints: string[]
  actionItems: Array<{
    action: string
    priority: 'low' | 'medium' | 'high'
    dueDate?: Date
    assignee?: string
  }>
  relatedDocuments: string[]
  suggestedWorkflows: string[]
  businessImpact: {
    financial?: number
    operational?: string
    strategic?: string
  }
}

export class DocumentIntelligenceService {
  private tokenizer: any
  private stemmer: any
  private dataDir: string

  // Industry-specific patterns and rules
  private contractPatterns = {
    parties: /(?:party|parties|between|among)\s+([^,\n]+?)(?:\s+and\s+([^,\n]+?))?/gi,
    effectiveDate: /(?:effective|commencement|start)\s+date[:\s]+([^,\n]+)/gi,
    termination: /(?:termination|expir|end)\s+date[:\s]+([^,\n]+)/gi,
    obligations: /(?:shall|must|will|agrees?\s+to)\s+([^.]+)/gi,
    penalties: /(?:penalty|fine|liquidated\s+damages)[:\s]+([^,\n]+)/gi
  }

  private invoicePatterns = {
    invoiceNumber: /(?:invoice|bill)\s*#?\s*:?\s*([A-Z0-9-]+)/gi,
    poNumber: /(?:po|purchase\s+order)\s*#?\s*:?\s*([A-Z0-9-]+)/gi,
    dueDate: /(?:due|payment\s+due)\s+(?:date\s*:?\s*)?([^,\n]+)/gi,
    total: /(?:total|amount\s+due)[:\s]*\$?([0-9,]+\.?\d*)/gi,
    tax: /(?:tax|vat|gst)[:\s]*\$?([0-9,]+\.?\d*)/gi
  }

  private legalPatterns = {
    caseNumber: /(?:case|matter|file)\s*#?\s*:?\s*([A-Z0-9-]+)/gi,
    court: /(?:court|tribunal|jurisdiction)[:\s]+([^,\n]+)/gi,
    statute: /(?:section|§|statute|code)\s+([0-9A-Z.-]+)/gi,
    citation: /([0-9]+)\s+([A-Z][a-z]+\.?)\s+([0-9]+)/gi
  }

  constructor() {
    this.tokenizer = new natural.WordTokenizer()
    this.stemmer = natural.PorterStemmer
    this.dataDir = path.join(process.cwd(), 'data', 'intelligence')
    this.ensureDataDir()
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create intelligence data directory:', error)
    }
  }

  /**
   * Analyze a document and extract intelligence
   */
  async analyzeDocument(filePath: string, fileName: string): Promise<DocumentAnalysis> {
    const startTime = Date.now()
    const fileStats = await fs.stat(filePath)
    const fileType = path.extname(fileName).toLowerCase()

    // Extract text based on file type
    let extractedText = ''
    let pageCount = 1
    let metadata: DocumentMetadata = {}

    try {
      switch (fileType) {
        case '.pdf':
          const pdfData = await fs.readFile(filePath)
          const pdfResult = await pdf(pdfData)
          extractedText = pdfResult.text
          pageCount = pdfResult.numpages
          metadata = this.extractPDFMetadata(pdfResult)
          break
        case '.docx':
          const docxData = await fs.readFile(filePath)
          const docxResult = await mammoth.extractRawText({ buffer: docxData })
          extractedText = docxResult.value
          break
        case '.txt':
          extractedText = await fs.readFile(filePath, 'utf-8')
          break
        case '.html':
          const htmlContent = await fs.readFile(filePath, 'utf-8')
          const $ = cheerio.load(htmlContent)
          extractedText = $.text()
          break
        default:
          throw new Error(`Unsupported file type: ${fileType}`)
      }
    } catch (error) {
      throw new Error(`Failed to extract text from ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Perform comprehensive analysis
    const language = this.detectLanguage(extractedText)
    const entities = this.extractEntities(extractedText)
    const keyTerms = this.extractKeyTerms(extractedText)
    const dates = this.extractDates(extractedText)
    const amounts = this.extractAmounts(extractedText)
    const contacts = this.extractContacts(extractedText)
    const addresses = this.extractAddresses(extractedText)
    const tables = this.extractTables(extractedText)
    const classification = this.classifyDocument(extractedText, fileName)
    const riskAssessment = this.assessRisk(extractedText, classification)
    const complianceCheck = this.checkCompliance(extractedText, classification)
    const insights = this.generateInsights(extractedText, classification, entities, keyTerms)

    const processingTime = Date.now() - startTime
    const wordCount = this.tokenizer.tokenize(extractedText)?.length || 0

    const analysis: DocumentAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName,
      fileType,
      fileSize: fileStats.size,
      pageCount,
      wordCount,
      language: language.language,
      confidence: language.confidence,
      processingTime,
      extractedData: {
        text: extractedText,
        entities,
        keyTerms,
        dates,
        amounts,
        contacts,
        addresses,
        tables,
        metadata
      },
      classification,
      riskAssessment,
      complianceCheck,
      insights,
      createdAt: new Date()
    }

    // Save analysis for future reference
    await this.saveAnalysis(analysis)

    return analysis
  }

  /**
   * Extract PDF metadata
   */
  private extractPDFMetadata(pdfResult: any): DocumentMetadata {
    const info = pdfResult.info || {}
    return {
      title: info.Title,
      author: info.Author,
      subject: info.Subject,
      creator: info.Creator,
      producer: info.Producer,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
      keywords: info.Keywords ? info.Keywords.split(',').map((k: string) => k.trim()) : []
    }
  }

  /**
   * Detect document language
   */
  private detectLanguage(text: string): { language: string; confidence: number } {
    // Simplified language detection - in production, use a proper language detection library
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const spanishWords = ['el', 'la', 'y', 'o', 'pero', 'en', 'de', 'con', 'por', 'para', 'que', 'es']
    const frenchWords = ['le', 'la', 'et', 'ou', 'mais', 'dans', 'de', 'avec', 'par', 'pour', 'que', 'est']

    const words = text.toLowerCase().split(/\s+/).slice(0, 100) // First 100 words
    
    const englishScore = englishWords.reduce((score, word) => score + (words.includes(word) ? 1 : 0), 0)
    const spanishScore = spanishWords.reduce((score, word) => score + (words.includes(word) ? 1 : 0), 0)
    const frenchScore = frenchWords.reduce((score, word) => score + (words.includes(word) ? 1 : 0), 0)

    const maxScore = Math.max(englishScore, spanishScore, frenchScore)
    
    if (maxScore === 0) {
      return { language: 'unknown', confidence: 0 }
    }

    let language = 'english'
    if (spanishScore === maxScore) language = 'spanish'
    else if (frenchScore === maxScore) language = 'french'

    return {
      language,
      confidence: Math.min(maxScore / 10, 1) // Normalize to 0-1
    }
  }

  /**
   * Extract named entities
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = []
    const doc = nlp(text)

    // Extract people
    const people = doc.people().out('array')
    people.forEach((person: string) => {
      const matches = [...text.matchAll(new RegExp(person.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))]
      matches.forEach(match => {
        entities.push({
          text: match[0],
          type: 'PERSON',
          confidence: 0.8,
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
          context: this.getContext(text, match.index || 0, 50)
        })
      })
    })

    // Extract organizations
    const orgs = doc.organizations().out('array')
    orgs.forEach((org: string) => {
      const matches = [...text.matchAll(new RegExp(org.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))]
      matches.forEach(match => {
        entities.push({
          text: match[0],
          type: 'ORGANIZATION',
          confidence: 0.7,
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
          context: this.getContext(text, match.index || 0, 50)
        })
      })
    })

    // Extract places
    const places = doc.places().out('array')
    places.forEach((place: string) => {
      const matches = [...text.matchAll(new RegExp(place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))]
      matches.forEach(match => {
        entities.push({
          text: match[0],
          type: 'LOCATION',
          confidence: 0.7,
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
          context: this.getContext(text, match.index || 0, 50)
        })
      })
    })

    return entities
  }

  /**
   * Extract key terms with importance scoring
   */
  private extractKeyTerms(text: string): KeyTerm[] {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || []
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'])
    
    // Filter tokens and count frequency
    const filteredTokens = tokens.filter(token => 
      token.length > 2 && 
      !stopWords.has(token) && 
      /^[a-zA-Z]+$/.test(token)
    )

    const frequency: Record<string, number> = {}
    filteredTokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1
    })

    // Calculate TF-IDF-like importance
    const totalTokens = filteredTokens.length
    const keyTerms: KeyTerm[] = []

    Object.entries(frequency).forEach(([term, freq]) => {
      if (freq >= 2) { // Only include terms that appear at least twice
        const tf = freq / totalTokens
        const importance = tf * Math.log(totalTokens / freq) // Simplified TF-IDF
        
        // Categorize terms
        let category: KeyTerm['category'] = 'other'
        if (this.isLegalTerm(term)) category = 'legal'
        else if (this.isFinancialTerm(term)) category = 'financial'
        else if (this.isTechnicalTerm(term)) category = 'technical'
        else if (this.isBusinessTerm(term)) category = 'business'

        // Get contexts where this term appears
        const contexts = this.getTermContexts(text, term, 3)

        keyTerms.push({
          term,
          frequency: freq,
          importance,
          category,
          context: contexts
        })
      }
    })

    return keyTerms
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 20) // Top 20 key terms
  }

  /**
   * Extract dates with context
   */
  private extractDates(text: string): DateEntity[] {
    const datePatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g, // MM/DD/YYYY
      /\b(\d{1,2}-\d{1,2}-\d{4})\b/g,   // MM-DD-YYYY
      /\b(\d{4}-\d{1,2}-\d{1,2})\b/g,   // YYYY-MM-DD
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi,
      /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi
    ]

    const dates: DateEntity[] = []

    datePatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)]
      matches.forEach(match => {
        try {
          const dateText = match[1]
          let parsedDate: Date

          // Try different parsing strategies
          if (dateText.includes('/')) {
            parsedDate = new Date(dateText)
          } else if (dateText.includes('-')) {
            parsedDate = new Date(dateText)
          } else {
            parsedDate = new Date(dateText)
          }

          if (!isNaN(parsedDate.getTime())) {
            const context = this.getContext(text, match.index || 0, 30)
            const type = this.classifyDate(context)

            dates.push({
              text: dateText,
              parsedDate,
              type,
              confidence: 0.8,
              context
            })
          }
        } catch (error) {
          // Skip invalid dates
        }
      })
    })

    return dates
  }

  /**
   * Extract monetary amounts
   */
  private extractAmounts(text: string): AmountEntity[] {
    const amountPatterns = [
      /\$([0-9,]+\.?\d*)/g,
      /([0-9,]+\.?\d*)\s*(?:dollars?|USD|usd)/gi,
      /(?:amount|total|sum|fee|cost|price|payment)[:\s]*\$?([0-9,]+\.?\d*)/gi
    ]

    const amounts: AmountEntity[] = []

    amountPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)]
      matches.forEach(match => {
        try {
          const amountText = match[0]
          const numericValue = match[1].replace(/,/g, '')
          const amount = parseFloat(numericValue)

          if (!isNaN(amount) && amount > 0) {
            const context = this.getContext(text, match.index || 0, 30)
            const type = this.classifyAmount(context)

            amounts.push({
              text: amountText,
              amount,
              currency: 'USD', // Default to USD, could be enhanced
              type,
              confidence: 0.8,
              context
            })
          }
        } catch (error) {
          // Skip invalid amounts
        }
      })
    })

    return amounts
  }

  /**
   * Extract contact information
   */
  private extractContacts(text: string): ContactEntity[] {
    const contacts: ContactEntity[] = []

    // Email pattern
    const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g
    const emailMatches = [...text.matchAll(emailPattern)]
    
    emailMatches.forEach(match => {
      contacts.push({
        email: match[1],
        type: 'person',
        confidence: 0.9
      })
    })

    // Phone pattern
    const phonePattern = /\b(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})\b/g
    const phoneMatches = [...text.matchAll(phonePattern)]
    
    phoneMatches.forEach(match => {
      contacts.push({
        phone: match[1],
        type: 'person',
        confidence: 0.8
      })
    })

    return contacts
  }

  /**
   * Extract addresses
   */
  private extractAddresses(text: string): AddressEntity[] {
    const addresses: AddressEntity[] = []

    // Simple address pattern (can be enhanced)
    const addressPattern = /\b(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}(?:-\d{4})?)\b/gi
    const matches = [...text.matchAll(addressPattern)]

    matches.forEach(match => {
      addresses.push({
        fullAddress: match[1],
        type: 'other',
        confidence: 0.7
      })
    })

    return addresses
  }

  /**
   * Extract table data (simplified)
   */
  private extractTables(text: string): TableData[] {
    // This is a simplified implementation
    // In production, you'd use more sophisticated table detection
    const tables: TableData[] = []

    // Look for tab-separated or pipe-separated data
    const lines = text.split('\n')
    let currentTable: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.includes('\t') || line.includes('|')) {
        currentTable.push(line)
      } else if (currentTable.length > 1) {
        // Process accumulated table
        const headers = currentTable[0].split(/\t|\|/).map(h => h.trim())
        const rows = currentTable.slice(1).map(row => 
          row.split(/\t|\|/).map(cell => cell.trim())
        )

        if (headers.length > 1 && rows.length > 0) {
          tables.push({
            headers,
            rows,
            location: { section: `Line ${i - currentTable.length + 1}` },
            confidence: 0.6
          })
        }
        
        currentTable = []
      }
    }

    return tables
  }

  /**
   * Classify document type
   */
  private classifyDocument(text: string, fileName: string): DocumentClassification {
    const lowerText = text.toLowerCase()
    const lowerFileName = fileName.toLowerCase()

    // Contract indicators
    const contractIndicators = ['agreement', 'contract', 'terms', 'conditions', 'party', 'parties', 'whereas', 'hereby', 'covenant']
    const contractScore = contractIndicators.reduce((score, indicator) => 
      score + (lowerText.includes(indicator) ? 1 : 0), 0
    )

    // Invoice indicators
    const invoiceIndicators = ['invoice', 'bill', 'amount due', 'payment terms', 'total', 'tax', 'subtotal']
    const invoiceScore = invoiceIndicators.reduce((score, indicator) => 
      score + (lowerText.includes(indicator) ? 1 : 0), 0
    )

    // Legal document indicators
    const legalIndicators = ['court', 'case', 'plaintiff', 'defendant', 'statute', 'law', 'legal', 'attorney']
    const legalScore = legalIndicators.reduce((score, indicator) => 
      score + (lowerText.includes(indicator) ? 1 : 0), 0
    )

    // Financial report indicators
    const financialIndicators = ['balance sheet', 'income statement', 'cash flow', 'revenue', 'expenses', 'profit', 'loss']
    const financialScore = financialIndicators.reduce((score, indicator) => 
      score + (lowerText.includes(indicator) ? 1 : 0), 0
    )

    // Determine primary type
    const scores = {
      contract: contractScore,
      invoice: invoiceScore,
      legal_document: legalScore,
      financial_report: financialScore
    }

    const maxScore = Math.max(...Object.values(scores))
    const primaryType = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] as DocumentClassification['primaryType'] || 'other'

    return {
      primaryType,
      confidence: Math.min(maxScore / 5, 1), // Normalize to 0-1
      indicators: Object.entries(scores)
        .filter(([, score]) => score > 0)
        .map(([type]) => type),
      suggestedActions: this.getSuggestedActions(primaryType)
    }
  }

  /**
   * Assess document risk
   */
  private assessRisk(text: string, classification: DocumentClassification): RiskAssessment {
    const riskFactors: RiskAssessment['riskFactors'] = []
    let riskScore = 0

    // Check for high-risk terms
    const highRiskTerms = ['penalty', 'liquidated damages', 'termination', 'breach', 'default', 'liability', 'indemnification']
    const foundHighRiskTerms = highRiskTerms.filter(term => text.toLowerCase().includes(term))
    
    if (foundHighRiskTerms.length > 0) {
      riskFactors.push({
        factor: 'High-risk legal terms detected',
        severity: 'high',
        description: `Found terms: ${foundHighRiskTerms.join(', ')}`,
        recommendation: 'Review these terms carefully with legal counsel'
      })
      riskScore += foundHighRiskTerms.length * 15
    }

    // Check for missing standard clauses (for contracts)
    if (classification.primaryType === 'contract') {
      const standardClauses = ['governing law', 'dispute resolution', 'force majeure', 'confidentiality']
      const missingClauses = standardClauses.filter(clause => !text.toLowerCase().includes(clause))
      
      if (missingClauses.length > 0) {
        riskFactors.push({
          factor: 'Missing standard contract clauses',
          severity: 'medium',
          description: `Missing: ${missingClauses.join(', ')}`,
          recommendation: 'Consider adding standard protective clauses'
        })
        riskScore += missingClauses.length * 10
      }
    }

    // Determine overall risk level
    let overallRisk: RiskAssessment['overallRisk'] = 'low'
    if (riskScore >= 70) overallRisk = 'critical'
    else if (riskScore >= 50) overallRisk = 'high'
    else if (riskScore >= 25) overallRisk = 'medium'

    return {
      overallRisk,
      riskScore: Math.min(riskScore, 100),
      riskFactors,
      complianceIssues: [], // Would be populated by compliance checking
      securityConcerns: [] // Would be populated by security analysis
    }
  }

  /**
   * Check compliance requirements
   */
  private checkCompliance(text: string, classification: DocumentClassification): ComplianceCheck {
    const regulations = []
    const sensitiveData: string[] = []
    let piiDetected = false
    let phiDetected = false

    // Check for PII
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g
    const creditCardPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g
    
    if (ssnPattern.test(text)) {
      piiDetected = true
      sensitiveData.push('Social Security Numbers')
    }
    
    if (creditCardPattern.test(text)) {
      piiDetected = true
      sensitiveData.push('Credit Card Numbers')
    }

    // Check for PHI (simplified)
    const medicalTerms = ['patient', 'diagnosis', 'treatment', 'medical record', 'health information']
    if (medicalTerms.some(term => text.toLowerCase().includes(term))) {
      phiDetected = true
      sensitiveData.push('Health Information')
    }

    return {
      regulations,
      dataPrivacy: {
        piiDetected,
        phiDetected,
        sensitiveData,
        recommendations: piiDetected || phiDetected ? 
          ['Implement data encryption', 'Restrict access controls', 'Consider data anonymization'] : 
          []
      },
      retention: {
        suggestedPeriod: this.getSuggestedRetentionPeriod(classification.primaryType),
        legalRequirements: [],
        businessRequirements: []
      }
    }
  }

  /**
   * Generate document insights
   */
  private generateInsights(
    text: string, 
    classification: DocumentClassification, 
    entities: Entity[], 
    keyTerms: KeyTerm[]
  ): DocumentInsights {
    // Generate summary (simplified)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const summary = sentences.slice(0, 3).join('. ').trim() + '.'

    // Extract key points
    const keyPoints = keyTerms
      .slice(0, 5)
      .map(term => `Key term: ${term.term} (mentioned ${term.frequency} times)`)

    // Generate action items based on document type
    const actionItems = this.generateActionItems(classification.primaryType, entities)

    return {
      summary,
      keyPoints,
      actionItems,
      relatedDocuments: [], // Would be populated by document relationship analysis
      suggestedWorkflows: this.getSuggestedWorkflows(classification.primaryType),
      businessImpact: {
        operational: `Document processing completed in ${Date.now()}ms`,
        strategic: `${classification.primaryType} analysis provides insights for business decision-making`
      }
    }
  }

  // Helper methods
  private getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - length)
    const end = Math.min(text.length, index + length)
    return text.substring(start, end).trim()
  }

  private getTermContexts(text: string, term: string, maxContexts: number): string[] {
    const contexts: string[] = []
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const matches = [...text.matchAll(regex)]
    
    matches.slice(0, maxContexts).forEach(match => {
      contexts.push(this.getContext(text, match.index || 0, 30))
    })
    
    return contexts
  }

  private isLegalTerm(term: string): boolean {
    const legalTerms = ['contract', 'agreement', 'clause', 'party', 'liability', 'breach', 'damages', 'indemnify', 'covenant', 'warranty']
    return legalTerms.includes(term.toLowerCase())
  }

  private isFinancialTerm(term: string): boolean {
    const financialTerms = ['payment', 'invoice', 'amount', 'fee', 'cost', 'price', 'total', 'tax', 'revenue', 'expense']
    return financialTerms.includes(term.toLowerCase())
  }

  private isTechnicalTerm(term: string): boolean {
    const technicalTerms = ['system', 'software', 'hardware', 'network', 'database', 'server', 'application', 'interface']
    return technicalTerms.includes(term.toLowerCase())
  }

  private isBusinessTerm(term: string): boolean {
    const businessTerms = ['company', 'business', 'organization', 'management', 'strategy', 'process', 'workflow', 'operation']
    return businessTerms.includes(term.toLowerCase())
  }

  private classifyDate(context: string): DateEntity['type'] {
    const lowerContext = context.toLowerCase()
    if (lowerContext.includes('due') || lowerContext.includes('deadline')) return 'deadline'
    if (lowerContext.includes('effective') || lowerContext.includes('start')) return 'effective_date'
    if (lowerContext.includes('expir') || lowerContext.includes('end')) return 'expiration'
    if (lowerContext.includes('created') || lowerContext.includes('made')) return 'created'
    if (lowerContext.includes('modified') || lowerContext.includes('updated')) return 'modified'
    return 'other'
  }

  private classifyAmount(context: string): AmountEntity['type'] {
    const lowerContext = context.toLowerCase()
    if (lowerContext.includes('payment') || lowerContext.includes('pay')) return 'payment'
    if (lowerContext.includes('fee')) return 'fee'
    if (lowerContext.includes('penalty') || lowerContext.includes('fine')) return 'penalty'
    if (lowerContext.includes('deposit')) return 'deposit'
    if (lowerContext.includes('total') || lowerContext.includes('sum')) return 'total'
    if (lowerContext.includes('tax')) return 'tax'
    return 'other'
  }

  private getSuggestedActions(documentType: DocumentClassification['primaryType']): string[] {
    const actions: Record<string, string[]> = {
      contract: ['Review terms and conditions', 'Verify party information', 'Check compliance requirements', 'Set up renewal reminders'],
      invoice: ['Verify amounts and calculations', 'Check payment terms', 'Process for payment', 'Update accounting records'],
      legal_document: ['Review with legal counsel', 'Check jurisdiction requirements', 'Verify citations and references', 'File appropriately'],
      financial_report: ['Analyze financial metrics', 'Compare with previous periods', 'Identify trends and anomalies', 'Prepare executive summary'],
      medical_record: ['Ensure HIPAA compliance', 'Verify patient information', 'Check treatment protocols', 'Update medical history'],
      real_estate: ['Verify property details', 'Check legal descriptions', 'Review disclosure requirements', 'Coordinate with parties'],
      other: ['Classify document type', 'Extract key information', 'Determine next steps', 'File appropriately']
    }
    
    return actions[documentType] || actions.other
  }

  private generateActionItems(documentType: DocumentClassification['primaryType'], entities: Entity[]): DocumentInsights['actionItems'] {
    const actionItems: DocumentInsights['actionItems'] = []
    
    switch (documentType) {
      case 'contract':
        actionItems.push(
          { action: 'Review contract terms', priority: 'high' },
          { action: 'Verify party signatures', priority: 'medium' },
          { action: 'Set up renewal calendar', priority: 'low' }
        )
        break
      case 'invoice':
        actionItems.push(
          { action: 'Verify invoice amounts', priority: 'high' },
          { action: 'Process payment', priority: 'high' },
          { action: 'Update accounting system', priority: 'medium' }
        )
        break
      default:
        actionItems.push(
          { action: 'Review document content', priority: 'medium' },
          { action: 'File document appropriately', priority: 'low' }
        )
    }
    
    return actionItems
  }

  private getSuggestedWorkflows(documentType: DocumentClassification['primaryType']): string[] {
    const workflows: Record<string, string[]> = {
      contract: ['Contract Review Workflow', 'Legal Approval Process', 'Signature Collection', 'Contract Management'],
      invoice: ['Invoice Processing', 'Payment Approval', 'Accounting Integration', 'Vendor Management'],
      legal_document: ['Legal Review Process', 'Compliance Check', 'Document Filing', 'Case Management'],
      financial_report: ['Financial Analysis', 'Executive Review', 'Board Reporting', 'Regulatory Filing'],
      other: ['Document Classification', 'Content Review', 'Approval Process', 'Archive Management']
    }
    
    return workflows[documentType] || workflows.other
  }

  private getSuggestedRetentionPeriod(documentType: DocumentClassification['primaryType']): string {
    const retentionPeriods: Record<string, string> = {
      contract: '7 years after expiration',
      invoice: '7 years for tax purposes',
      legal_document: 'Permanent or as required by law',
      financial_report: '7 years for regulatory compliance',
      medical_record: '10 years or as required by state law',
      real_estate: 'Permanent for property records',
      other: '3 years unless otherwise specified'
    }
    
    return retentionPeriods[documentType] || retentionPeriods.other
  }

  /**
   * Save analysis to disk
   */
  private async saveAnalysis(analysis: DocumentAnalysis): Promise<void> {
    try {
      const analysisFile = path.join(this.dataDir, `${analysis.id}.json`)
      await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2))
    } catch (error) {
      console.error('Failed to save analysis:', error)
    }
  }

  /**
   * Get saved analysis by ID
   */
  async getAnalysis(analysisId: string): Promise<DocumentAnalysis | null> {
    try {
      const analysisFile = path.join(this.dataDir, `${analysisId}.json`)
      const data = await fs.readFile(analysisFile, 'utf-8')
      const analysis = JSON.parse(data)
      
      // Convert date strings back to Date objects
      analysis.createdAt = new Date(analysis.createdAt)
      analysis.extractedData.dates.forEach((date: any) => {
        date.parsedDate = new Date(date.parsedDate)
      })
      
      return analysis
    } catch (error) {
      return null
    }
  }

  /**
   * Get analysis summary statistics
   */
  async getAnalyticsStats(): Promise<{
    totalAnalyses: number
    documentTypes: Record<string, number>
    averageProcessingTime: number
    riskDistribution: Record<string, number>
  }> {
    try {
      const files = await fs.readdir(this.dataDir)
      const analysisFiles = files.filter(file => file.endsWith('.json'))
      
      const documentTypes: Record<string, number> = {}
      const riskDistribution: Record<string, number> = {}
      let totalProcessingTime = 0
      
      for (const file of analysisFiles) {
        try {
          const data = await fs.readFile(path.join(this.dataDir, file), 'utf-8')
          const analysis = JSON.parse(data)
          
          documentTypes[analysis.classification.primaryType] = (documentTypes[analysis.classification.primaryType] || 0) + 1
          riskDistribution[analysis.riskAssessment.overallRisk] = (riskDistribution[analysis.riskAssessment.overallRisk] || 0) + 1
          totalProcessingTime += analysis.processingTime
        } catch (error) {
          // Skip invalid files
        }
      }
      
      return {
        totalAnalyses: analysisFiles.length,
        documentTypes,
        averageProcessingTime: analysisFiles.length > 0 ? totalProcessingTime / analysisFiles.length : 0,
        riskDistribution
      }
    } catch (error) {
      return {
        totalAnalyses: 0,
        documentTypes: {},
        averageProcessingTime: 0,
        riskDistribution: {}
      }
    }
  }
}
