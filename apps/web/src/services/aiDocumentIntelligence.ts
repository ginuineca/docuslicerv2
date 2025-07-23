interface DocumentClassification {
  type: 'invoice' | 'contract' | 'resume' | 'legal' | 'financial' | 'medical' | 'academic' | 'marketing' | 'other'
  confidence: number
  subtype?: string
  language: string
  pageCount: number
  hasImages: boolean
  hasTables: boolean
  hasForms: boolean
  isScanned: boolean
}

interface ExtractedData {
  entities: {
    type: 'person' | 'organization' | 'date' | 'amount' | 'email' | 'phone' | 'address'
    value: string
    confidence: number
    position: { page: number; x: number; y: number; width: number; height: number }
  }[]
  keyValuePairs: {
    key: string
    value: string
    confidence: number
  }[]
  tables: {
    headers: string[]
    rows: string[][]
    confidence: number
  }[]
  summary: string
  keyInsights: string[]
}

interface WorkflowSuggestion {
  id: string
  name: string
  description: string
  confidence: number
  estimatedTime: string
  steps: {
    operation: string
    description: string
    parameters: Record<string, any>
  }[]
  businessValue: string
}

export class AIDocumentIntelligence {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * Classify document type and characteristics
   */
  async classifyDocument(text: string, metadata?: any): Promise<DocumentClassification> {
    try {
      const prompt = `
        Analyze this document text and classify it. Return a JSON object with the following structure:
        {
          "type": "invoice|contract|resume|legal|financial|medical|academic|marketing|other",
          "confidence": 0.0-1.0,
          "subtype": "specific subtype if applicable",
          "language": "detected language code",
          "pageCount": estimated_pages,
          "hasImages": boolean,
          "hasTables": boolean,
          "hasForms": boolean,
          "isScanned": boolean
        }

        Document text (first 2000 characters):
        ${text.substring(0, 2000)}
      `

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert document classifier. Analyze documents and return structured JSON responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        type: result.type || 'other',
        confidence: result.confidence || 0.5,
        subtype: result.subtype,
        language: result.language || 'en',
        pageCount: result.pageCount || 1,
        hasImages: result.hasImages || false,
        hasTables: result.hasTables || false,
        hasForms: result.hasForms || false,
        isScanned: result.isScanned || false
      }
    } catch (error) {
      console.error('Document classification error:', error)
      return {
        type: 'other',
        confidence: 0.1,
        language: 'en',
        pageCount: 1,
        hasImages: false,
        hasTables: false,
        hasForms: false,
        isScanned: false
      }
    }
  }

  /**
   * Extract structured data from document
   */
  async extractData(text: string, documentType: string): Promise<ExtractedData> {
    try {
      const prompt = `
        Extract structured data from this ${documentType} document. Return a JSON object with:
        {
          "entities": [{"type": "person|organization|date|amount|email|phone|address", "value": "extracted_value", "confidence": 0.0-1.0}],
          "keyValuePairs": [{"key": "field_name", "value": "field_value", "confidence": 0.0-1.0}],
          "tables": [{"headers": ["col1", "col2"], "rows": [["val1", "val2"]], "confidence": 0.0-1.0}],
          "summary": "brief summary of document content",
          "keyInsights": ["insight1", "insight2", "insight3"]
        }

        Document text:
        ${text.substring(0, 4000)}
      `

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert data extraction specialist. Extract structured information from documents and return valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1500
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        entities: result.entities || [],
        keyValuePairs: result.keyValuePairs || [],
        tables: result.tables || [],
        summary: result.summary || 'No summary available',
        keyInsights: result.keyInsights || []
      }
    } catch (error) {
      console.error('Data extraction error:', error)
      return {
        entities: [],
        keyValuePairs: [],
        tables: [],
        summary: 'Error extracting data from document',
        keyInsights: []
      }
    }
  }

  /**
   * Generate workflow suggestions based on document analysis
   */
  async suggestWorkflows(classification: DocumentClassification, extractedData: ExtractedData): Promise<WorkflowSuggestion[]> {
    try {
      const prompt = `
        Based on this document analysis, suggest 3-5 optimal workflows. Return a JSON array of workflow suggestions:
        [
          {
            "id": "unique_id",
            "name": "workflow_name",
            "description": "what this workflow does",
            "confidence": 0.0-1.0,
            "estimatedTime": "X minutes",
            "steps": [{"operation": "split|merge|extract|convert", "description": "step description", "parameters": {}}],
            "businessValue": "why this workflow is valuable"
          }
        ]

        Document Classification:
        Type: ${classification.type}
        Subtype: ${classification.subtype || 'N/A'}
        Has Tables: ${classification.hasTables}
        Has Forms: ${classification.hasForms}
        Is Scanned: ${classification.isScanned}

        Key Insights: ${extractedData.keyInsights.join(', ')}
        Entity Count: ${extractedData.entities.length}
        Table Count: ${extractedData.tables.length}
      `

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a workflow automation expert. Suggest optimal document processing workflows based on document analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const suggestions = JSON.parse(data.choices[0].message.content)

      return suggestions.map((suggestion: any) => ({
        id: suggestion.id || `workflow-${Date.now()}`,
        name: suggestion.name || 'Suggested Workflow',
        description: suggestion.description || 'AI-suggested workflow',
        confidence: suggestion.confidence || 0.7,
        estimatedTime: suggestion.estimatedTime || '5 minutes',
        steps: suggestion.steps || [],
        businessValue: suggestion.businessValue || 'Improves document processing efficiency'
      }))
    } catch (error) {
      console.error('Workflow suggestion error:', error)
      return []
    }
  }

  /**
   * Analyze document for compliance and risk factors
   */
  async analyzeCompliance(text: string, regulations: string[] = ['GDPR', 'HIPAA', 'SOX']): Promise<{
    complianceScore: number
    risks: { type: string; severity: 'low' | 'medium' | 'high'; description: string }[]
    recommendations: string[]
  }> {
    try {
      const prompt = `
        Analyze this document for compliance with ${regulations.join(', ')} regulations. Return JSON:
        {
          "complianceScore": 0-100,
          "risks": [{"type": "risk_type", "severity": "low|medium|high", "description": "risk description"}],
          "recommendations": ["recommendation1", "recommendation2"]
        }

        Document text (first 3000 characters):
        ${text.substring(0, 3000)}
      `

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a compliance expert. Analyze documents for regulatory compliance and identify risks.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 800
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        complianceScore: result.complianceScore || 75,
        risks: result.risks || [],
        recommendations: result.recommendations || []
      }
    } catch (error) {
      console.error('Compliance analysis error:', error)
      return {
        complianceScore: 50,
        risks: [],
        recommendations: ['Unable to analyze compliance - manual review recommended']
      }
    }
  }

  /**
   * Generate document insights and analytics
   */
  async generateInsights(text: string, metadata?: any): Promise<{
    readabilityScore: number
    sentiment: 'positive' | 'neutral' | 'negative'
    topics: string[]
    complexity: 'low' | 'medium' | 'high'
    actionItems: string[]
    keyMetrics: { name: string; value: string | number }[]
  }> {
    try {
      const prompt = `
        Analyze this document and provide insights. Return JSON:
        {
          "readabilityScore": 0-100,
          "sentiment": "positive|neutral|negative",
          "topics": ["topic1", "topic2"],
          "complexity": "low|medium|high",
          "actionItems": ["action1", "action2"],
          "keyMetrics": [{"name": "metric_name", "value": "metric_value"}]
        }

        Document text:
        ${text.substring(0, 3000)}
      `

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a document analysis expert. Provide comprehensive insights about document content and structure.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 800
        })
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        readabilityScore: result.readabilityScore || 70,
        sentiment: result.sentiment || 'neutral',
        topics: result.topics || [],
        complexity: result.complexity || 'medium',
        actionItems: result.actionItems || [],
        keyMetrics: result.keyMetrics || []
      }
    } catch (error) {
      console.error('Insights generation error:', error)
      return {
        readabilityScore: 50,
        sentiment: 'neutral',
        topics: [],
        complexity: 'medium',
        actionItems: [],
        keyMetrics: []
      }
    }
  }
}
