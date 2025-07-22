import OpenAI from 'openai'
import { HfInference } from '@huggingface/inference'
import natural from 'natural'
import nlp from 'compromise'

export interface DocumentClassification {
  category: string
  confidence: number
  subcategories: Array<{
    name: string
    confidence: number
  }>
  tags: string[]
  language: string
}

export interface DocumentSummary {
  summary: string
  keyPoints: string[]
  entities: Array<{
    text: string
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'other'
    confidence: number
  }>
  sentiment: {
    score: number
    label: 'positive' | 'negative' | 'neutral'
  }
  wordCount: number
  readingTime: number // in minutes
}

export interface IntelligentExtraction {
  structuredData: Record<string, any>
  tables: Array<{
    headers: string[]
    rows: string[][]
    confidence: number
  }>
  forms: Array<{
    fieldName: string
    value: string
    confidence: number
    type: 'text' | 'number' | 'date' | 'email' | 'phone'
  }>
  signatures: Array<{
    location: { x: number; y: number; width: number; height: number }
    confidence: number
  }>
}

export interface ContentAnalysis {
  topics: Array<{
    name: string
    relevance: number
    keywords: string[]
  }>
  complexity: {
    score: number
    level: 'elementary' | 'middle' | 'high' | 'college' | 'graduate'
    readabilityIndex: number
  }
  structure: {
    sections: number
    paragraphs: number
    sentences: number
    averageSentenceLength: number
  }
}

export class AIService {
  private openai: OpenAI | null = null
  private hf: HfInference | null = null
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize AI services
   */
  private async initialize(): Promise<void> {
    try {
      // Initialize OpenAI if API key is provided
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        })
        console.log('✅ OpenAI service initialized')
      } else {
        console.warn('⚠️ OpenAI API key not found. AI features will use fallback methods.')
      }

      // Initialize Hugging Face if API key is provided
      if (process.env.HUGGINGFACE_API_KEY) {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY)
        console.log('✅ Hugging Face service initialized')
      } else {
        console.warn('⚠️ Hugging Face API key not found. Using local NLP processing.')
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize AI services:', error)
      this.isInitialized = false
    }
  }

  /**
   * Classify document content
   */
  async classifyDocument(text: string): Promise<DocumentClassification> {
    try {
      if (this.openai) {
        return await this.classifyWithOpenAI(text)
      } else if (this.hf) {
        return await this.classifyWithHuggingFace(text)
      } else {
        return await this.classifyWithLocalNLP(text)
      }
    } catch (error) {
      console.error('Document classification error:', error)
      return await this.classifyWithLocalNLP(text)
    }
  }

  /**
   * Generate document summary
   */
  async summarizeDocument(text: string): Promise<DocumentSummary> {
    try {
      if (this.openai) {
        return await this.summarizeWithOpenAI(text)
      } else if (this.hf) {
        return await this.summarizeWithHuggingFace(text)
      } else {
        return await this.summarizeWithLocalNLP(text)
      }
    } catch (error) {
      console.error('Document summarization error:', error)
      return await this.summarizeWithLocalNLP(text)
    }
  }

  /**
   * Extract structured data intelligently
   */
  async extractIntelligentData(text: string): Promise<IntelligentExtraction> {
    try {
      if (this.openai) {
        return await this.extractWithOpenAI(text)
      } else {
        return await this.extractWithLocalNLP(text)
      }
    } catch (error) {
      console.error('Intelligent extraction error:', error)
      return await this.extractWithLocalNLP(text)
    }
  }

  /**
   * Analyze content structure and complexity
   */
  async analyzeContent(text: string): Promise<ContentAnalysis> {
    try {
      const doc = nlp(text)
      const sentences = doc.sentences().json()
      const words = doc.terms().json()

      // Safe extraction of text content
      const sentenceTexts = sentences.map((s: any) => s.text || s.normal || s)
      const wordTexts = words.map((w: any) => w.text || w.normal || w)

      // Calculate readability using Flesch Reading Ease
      const avgSentenceLength = wordTexts.length / sentenceTexts.length || 1
      const avgSyllables = this.calculateAverageSyllables(wordTexts)
      const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllables)

      // Determine reading level
      let level: ContentAnalysis['complexity']['level'] = 'elementary'
      if (fleschScore < 30) level = 'graduate'
      else if (fleschScore < 50) level = 'college'
      else if (fleschScore < 60) level = 'high'
      else if (fleschScore < 70) level = 'middle'

      // Extract topics using TF-IDF
      const topics = await this.extractTopics(text)

      // Count paragraphs using text analysis and compromise if available
      let paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length

      try {
        // Try to use compromise paragraphs method if available
        if (typeof doc.paragraphs === 'function') {
          const paragraphs = doc.paragraphs().json()
          if (paragraphs && paragraphs.length > 0) {
            paragraphCount = paragraphs.length
          }
        }
      } catch (error) {
        // Use text-based counting as fallback
        console.warn('Compromise paragraphs extraction failed, using text analysis fallback')
      }

      return {
        topics,
        complexity: {
          score: Math.round(fleschScore),
          level,
          readabilityIndex: fleschScore
        },
        structure: {
          sections: (text.match(/\n\s*\n/g) || []).length + 1,
          paragraphs: paragraphCount,
          sentences: sentenceTexts.length,
          averageSentenceLength: Math.round(avgSentenceLength)
        }
      }
    } catch (error) {
      console.error('Content analysis error:', error)
      throw error
    }
  }

  /**
   * Classify document using OpenAI
   */
  private async classifyWithOpenAI(text: string): Promise<DocumentClassification> {
    if (!this.openai) throw new Error('OpenAI not initialized')

    const prompt = `Classify the following document text and provide:
1. Main category (invoice, contract, report, letter, form, manual, legal, medical, financial, other)
2. Subcategories (up to 3)
3. Relevant tags (up to 5)
4. Language

Text: ${text.substring(0, 2000)}...

Respond in JSON format:
{
  "category": "main_category",
  "confidence": 0.95,
  "subcategories": [{"name": "subcategory", "confidence": 0.8}],
  "tags": ["tag1", "tag2"],
  "language": "en"
}`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result
  }

  /**
   * Classify document using Hugging Face
   */
  private async classifyWithHuggingFace(text: string): Promise<DocumentClassification> {
    if (!this.hf) throw new Error('Hugging Face not initialized')

    const result = await this.hf.textClassification({
      model: 'microsoft/DialoGPT-medium',
      inputs: text.substring(0, 512)
    })

    // Convert HF result to our format
    return {
      category: Array.isArray(result) ? result[0]?.label || 'other' : 'other',
      confidence: Array.isArray(result) ? result[0]?.score || 0.5 : 0.5,
      subcategories: [],
      tags: [],
      language: 'en'
    }
  }

  /**
   * Classify document using local NLP
   */
  private async classifyWithLocalNLP(text: string): Promise<DocumentClassification> {
    const doc = nlp(text)
    const words = doc.terms().out('array')
    
    // Simple keyword-based classification
    const categories = {
      invoice: ['invoice', 'bill', 'payment', 'amount', 'due', 'total', 'tax'],
      contract: ['agreement', 'contract', 'terms', 'conditions', 'party', 'signature'],
      report: ['report', 'analysis', 'summary', 'findings', 'conclusion', 'data'],
      letter: ['dear', 'sincerely', 'regards', 'yours', 'letter'],
      form: ['form', 'application', 'field', 'checkbox', 'submit'],
      legal: ['legal', 'law', 'court', 'judge', 'attorney', 'lawsuit'],
      medical: ['patient', 'doctor', 'medical', 'diagnosis', 'treatment', 'health'],
      financial: ['financial', 'bank', 'account', 'balance', 'transaction', 'credit']
    }

    let bestCategory = 'other'
    let bestScore = 0

    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (words.filter(word => 
          word.toLowerCase().includes(keyword.toLowerCase())
        ).length)
      }, 0) / keywords.length

      if (score > bestScore) {
        bestScore = score
        bestCategory = category
      }
    }

    // Extract entities as tags
    const people = doc.people().out('array')
    const places = doc.places().out('array')
    const organizations = doc.organizations().out('array')
    
    const tags = [...people, ...places, ...organizations].slice(0, 5)

    return {
      category: bestCategory,
      confidence: Math.min(bestScore * 0.3 + 0.5, 0.95),
      subcategories: [],
      tags,
      language: 'en'
    }
  }

  /**
   * Summarize document using OpenAI
   */
  private async summarizeWithOpenAI(text: string): Promise<DocumentSummary> {
    if (!this.openai) throw new Error('OpenAI not initialized')

    const prompt = `Summarize the following document and provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Named entities (people, organizations, locations, dates, amounts)
4. Overall sentiment

Text: ${text.substring(0, 3000)}...

Respond in JSON format:
{
  "summary": "Brief summary...",
  "keyPoints": ["Point 1", "Point 2"],
  "entities": [{"text": "Entity", "type": "person", "confidence": 0.9}],
  "sentiment": {"score": 0.1, "label": "neutral"}
}`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      ...result,
      wordCount: text.split(/\s+/).length,
      readingTime: Math.ceil(text.split(/\s+/).length / 200) // 200 words per minute
    }
  }

  /**
   * Summarize document using Hugging Face
   */
  private async summarizeWithHuggingFace(text: string): Promise<DocumentSummary> {
    if (!this.hf) throw new Error('Hugging Face not initialized')

    const summary = await this.hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text.substring(0, 1024)
    })

    return {
      summary: typeof summary === 'string' ? summary : summary.summary_text || 'Summary not available',
      keyPoints: [],
      entities: [],
      sentiment: { score: 0, label: 'neutral' },
      wordCount: text.split(/\s+/).length,
      readingTime: Math.ceil(text.split(/\s+/).length / 200)
    }
  }

  /**
   * Summarize document using local NLP
   */
  private async summarizeWithLocalNLP(text: string): Promise<DocumentSummary> {
    const doc = nlp(text)
    const sentences = doc.sentences().json()
    const words = text.split(/\s+/)

    // Simple extractive summarization - take first and last sentences
    const sentenceTexts = sentences.map((s: any) => s.text || s)
    const summary = sentenceTexts.length > 2
      ? `${sentenceTexts[0]} ${sentenceTexts[sentenceTexts.length - 1]}`
      : sentenceTexts.join(' ')

    // Extract entities using safer methods
    const people = doc.people().json().map((p: any) => p.text || p.normal || p)
    const places = doc.places().json().map((p: any) => p.text || p.normal || p)
    const organizations = doc.organizations().json().map((o: any) => o.text || o.normal || o)

    // Extract dates using regex as primary method
    const dateRegex = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b|\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi
    const dates = text.match(dateRegex) || []

    // Try to extract additional dates using compromise if available
    let compromiseDates: string[] = []
    try {
      // Check if dates method exists
      if (typeof doc.dates === 'function') {
        const dateEntities = doc.dates().json()
        compromiseDates = dateEntities.map((d: any) => d.text || d.normal || String(d))
      }
    } catch (error) {
      // Fallback to regex-only extraction
      console.warn('Compromise dates extraction failed, using regex fallback')
    }

    // Combine all dates
    const allDates = [...new Set([...dates, ...compromiseDates])]

    const entities = [
      ...people.map(p => ({ text: String(p), type: 'person' as const, confidence: 0.7 })),
      ...places.map(p => ({ text: String(p), type: 'location' as const, confidence: 0.7 })),
      ...organizations.map(o => ({ text: String(o), type: 'organization' as const, confidence: 0.7 })),
      ...allDates.map(d => ({ text: String(d), type: 'date' as const, confidence: 0.7 }))
    ]

    // Simple sentiment analysis using word lists
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'benefit']
    const negativeWords = ['bad', 'poor', 'negative', 'problem', 'issue', 'error']

    const positiveCount = positiveWords.reduce((sum, word) =>
      sum + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0)
    const negativeCount = negativeWords.reduce((sum, word) =>
      sum + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0)

    const sentimentScore = (positiveCount - negativeCount) / words.length
    const sentimentLabel = sentimentScore > 0.01 ? 'positive' :
                          sentimentScore < -0.01 ? 'negative' : 'neutral'

    return {
      summary,
      keyPoints: sentenceTexts.slice(0, 3),
      entities,
      sentiment: {
        score: sentimentScore,
        label: sentimentLabel
      },
      wordCount: words.length,
      readingTime: Math.ceil(words.length / 200)
    }
  }

  /**
   * Extract structured data using OpenAI
   */
  private async extractWithOpenAI(text: string): Promise<IntelligentExtraction> {
    if (!this.openai) throw new Error('OpenAI not initialized')

    const prompt = `Extract structured data from this document:
${text.substring(0, 2000)}...

Identify and extract:
1. Key-value pairs (names, dates, amounts, etc.)
2. Tables (if any)
3. Form fields
4. Any structured information

Respond in JSON format with extracted data.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000
    })

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}')
      return {
        structuredData: result.structuredData || {},
        tables: result.tables || [],
        forms: result.forms || [],
        signatures: []
      }
    } catch {
      return await this.extractWithLocalNLP(text)
    }
  }

  /**
   * Extract structured data using local NLP
   */
  private async extractWithLocalNLP(text: string): Promise<IntelligentExtraction> {
    const doc = nlp(text)

    // Extract common patterns using regex
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []
    const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []

    // Extract dates using regex as primary method
    const dateRegex = /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b|\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi
    const dates = text.match(dateRegex) || []

    // Extract money amounts using regex
    const moneyRegex = /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|usd)\b/gi
    const money = text.match(moneyRegex) || []

    // Try to use compromise for additional extraction with fallback
    let compromiseDates: string[] = []
    let compromiseMoney: string[] = []

    try {
      // Try dates extraction if method exists
      if (typeof doc.dates === 'function') {
        const dateEntities = doc.dates().json()
        compromiseDates = dateEntities.map((d: any) => d.text || d.normal || String(d))
      }
    } catch (error) {
      console.warn('Compromise dates extraction failed, using regex fallback')
    }

    try {
      // Try money extraction if method exists
      if (typeof doc.money === 'function') {
        const moneyEntities = doc.money().json()
        compromiseMoney = moneyEntities.map((m: any) => m.text || m.normal || String(m))
      }
    } catch (error) {
      // Fallback to regex-only extraction
      console.warn('Compromise money extraction failed, using regex fallback')
    }

    // Combine all extracted data
    const allDates = [...new Set([...dates, ...compromiseDates])]
    const allMoney = [...new Set([...money, ...compromiseMoney])]

    const structuredData: Record<string, any> = {}
    if (emails.length > 0) structuredData.emails = emails
    if (phones.length > 0) structuredData.phones = phones
    if (allDates.length > 0) structuredData.dates = allDates
    if (allMoney.length > 0) structuredData.amounts = allMoney

    const forms = [
      ...emails.map(email => ({ fieldName: 'email', value: email, confidence: 0.9, type: 'email' as const })),
      ...phones.map(phone => ({ fieldName: 'phone', value: phone, confidence: 0.8, type: 'phone' as const })),
      ...allDates.map(date => ({ fieldName: 'date', value: date, confidence: 0.7, type: 'date' as const })),
      ...allMoney.map(amount => ({ fieldName: 'amount', value: amount, confidence: 0.8, type: 'text' as const }))
    ]

    return {
      structuredData,
      tables: [],
      forms,
      signatures: []
    }
  }

  /**
   * Extract topics using TF-IDF
   */
  private async extractTopics(text: string): Promise<ContentAnalysis['topics']> {
    const doc = nlp(text)
    const terms = doc.terms().out('array')
    
    // Simple frequency-based topic extraction
    const wordFreq: Record<string, number> = {}
    terms.forEach(term => {
      const word = term.toLowerCase()
      if (word.length > 3 && !this.isStopWord(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    })

    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    return sortedWords.map(([word, freq]) => ({
      name: word,
      relevance: freq / terms.length,
      keywords: [word]
    }))
  }

  /**
   * Calculate average syllables per word
   */
  private calculateAverageSyllables(words: string[]): number {
    const syllableCount = words.reduce((sum, word) => {
      return sum + this.countSyllables(word)
    }, 0)
    return syllableCount / words.length
  }

  /**
   * Count syllables in a word
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    word = word.replace(/^y/, '')
    const matches = word.match(/[aeiouy]{1,2}/g)
    return matches ? matches.length : 1
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']
    return stopWords.includes(word.toLowerCase())
  }

  /**
   * Check if AI services are available
   */
  isAvailable(): boolean {
    return this.isInitialized && (this.openai !== null || this.hf !== null)
  }

  /**
   * Get available AI capabilities
   */
  getCapabilities(): {
    openai: boolean
    huggingface: boolean
    localNLP: boolean
  } {
    return {
      openai: this.openai !== null,
      huggingface: this.hf !== null,
      localNLP: true
    }
  }
}
