import fs from 'fs/promises'
import path from 'path'
import { DocumentIntelligenceService, DocumentAnalysis } from './documentIntelligenceService'

export interface IndustrySolution {
  id: string
  name: string
  industry: 'legal' | 'healthcare' | 'real_estate' | 'financial_services' | 'manufacturing' | 'education'
  description: string
  features: string[]
  templates: IndustryTemplate[]
  workflows: IndustryWorkflow[]
  complianceRequirements: ComplianceRequirement[]
  automationRules: AutomationRule[]
  integrations: IndustryIntegration[]
  pricing: {
    tier: 'basic' | 'professional' | 'enterprise'
    monthlyPrice: number
    annualPrice: number
    features: string[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface IndustryTemplate {
  id: string
  name: string
  type: 'contract' | 'form' | 'report' | 'checklist' | 'workflow' | 'compliance'
  industry: string
  description: string
  fields: TemplateField[]
  validationRules: ValidationRule[]
  automationTriggers: string[]
  complianceChecks: string[]
  tags: string[]
  usage: {
    downloads: number
    rating: number
    reviews: number
  }
  createdAt: Date
}

export interface TemplateField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'file' | 'signature'
  label: string
  description?: string
  required: boolean
  validation?: {
    pattern?: string
    min?: number
    max?: number
    options?: string[]
  }
  defaultValue?: any
  placeholder?: string
  helpText?: string
}

export interface ValidationRule {
  field: string
  rule: 'required' | 'pattern' | 'range' | 'custom'
  value?: any
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface IndustryWorkflow {
  id: string
  name: string
  industry: string
  type: 'document_processing' | 'approval' | 'compliance' | 'automation' | 'integration'
  description: string
  steps: WorkflowStep[]
  triggers: WorkflowTrigger[]
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  sla: {
    expectedDuration: number // in minutes
    escalationRules: EscalationRule[]
  }
  metrics: {
    completionRate: number
    averageDuration: number
    errorRate: number
  }
  createdAt: Date
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'manual' | 'automated' | 'approval' | 'notification' | 'integration'
  description: string
  assignee?: string
  estimatedDuration: number
  dependencies: string[]
  actions: string[]
  conditions: string[]
}

export interface WorkflowTrigger {
  type: 'document_upload' | 'status_change' | 'time_based' | 'external_event' | 'user_action'
  conditions: Record<string, any>
  actions: string[]
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface WorkflowAction {
  type: 'send_notification' | 'update_status' | 'create_task' | 'generate_document' | 'call_api' | 'send_email'
  parameters: Record<string, any>
  conditions?: WorkflowCondition[]
}

export interface EscalationRule {
  condition: string
  action: string
  delay: number // in minutes
  assignee: string
}

export interface ComplianceRequirement {
  id: string
  name: string
  regulation: string // HIPAA, SOX, GDPR, etc.
  industry: string
  description: string
  requirements: string[]
  checkpoints: ComplianceCheckpoint[]
  penalties: string[]
  lastUpdated: Date
}

export interface ComplianceCheckpoint {
  id: string
  name: string
  description: string
  type: 'document_check' | 'process_check' | 'access_check' | 'audit_check'
  automated: boolean
  frequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  criteria: string[]
  actions: string[]
}

export interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: string
    conditions: Record<string, any>
  }
  actions: Array<{
    type: string
    parameters: Record<string, any>
  }>
  enabled: boolean
  priority: number
  createdAt: Date
}

export interface IndustryIntegration {
  id: string
  name: string
  provider: string
  type: 'crm' | 'erp' | 'practice_management' | 'accounting' | 'document_management' | 'communication'
  industry: string
  description: string
  features: string[]
  configuration: Record<string, any>
  status: 'active' | 'inactive' | 'pending' | 'error'
  lastSync?: Date
}

export interface IndustryAnalytics {
  industry: string
  totalSolutions: number
  activeUsers: number
  documentVolume: number
  complianceScore: number
  automationRate: number
  timesSaved: number // in hours
  costSavings: number // in dollars
  errorReduction: number // percentage
  customerSatisfaction: number // 1-5 scale
  trends: {
    period: string
    metrics: Record<string, number>
  }[]
}

export class IndustrySolutionsService {
  private intelligenceService: DocumentIntelligenceService
  private dataDir: string
  private solutionsDir: string
  private templatesDir: string
  private workflowsDir: string

  constructor() {
    this.intelligenceService = new DocumentIntelligenceService()
    this.dataDir = path.join(process.cwd(), 'data', 'industry-solutions')
    this.solutionsDir = path.join(this.dataDir, 'solutions')
    this.templatesDir = path.join(this.dataDir, 'templates')
    this.workflowsDir = path.join(this.dataDir, 'workflows')
    this.initializeAsync()
  }

  private async initializeAsync(): Promise<void> {
    await this.initializeDirectories()
    await this.initializeDefaultSolutions()
  }

  private async initializeDirectories(): Promise<void> {
    const directories = [
      { path: this.dataDir, name: 'data' },
      { path: this.solutionsDir, name: 'solutions' },
      { path: this.templatesDir, name: 'templates' },
      { path: this.workflowsDir, name: 'workflows' }
    ]

    for (const dir of directories) {
      try {
        await fs.mkdir(dir.path, { recursive: true })
        console.log(`✅ Created ${dir.name} directory: ${dir.path}`)
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Directory already exists, this is fine
          continue
        }
        console.warn(`⚠️ Could not create ${dir.name} directory: ${error.message}`)
      }
    }
  }

  private async initializeDefaultSolutions(): Promise<void> {
    try {
      const existingSolutions = await this.listSolutions()
      if (existingSolutions.length === 0) {
        await this.createDefaultSolutions()
      }
    } catch (error) {
      console.error('Failed to initialize default solutions:', error)
    }
  }

  /**
   * Create default industry solutions
   */
  private async createDefaultSolutions(): Promise<void> {
    const defaultSolutions: Omit<IndustrySolution, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Legal Practice Management Suite',
        industry: 'legal',
        description: 'Comprehensive legal document management, case tracking, and compliance solution',
        features: [
          'Case document organization',
          'Contract analysis and review',
          'E-discovery preparation',
          'Court filing integration',
          'Billable time tracking',
          'Client communication management',
          'Legal research integration',
          'Compliance monitoring'
        ],
        templates: [],
        workflows: [],
        complianceRequirements: [],
        automationRules: [],
        integrations: [],
        pricing: {
          tier: 'professional',
          monthlyPrice: 199,
          annualPrice: 1990,
          features: ['Unlimited cases', 'Advanced analytics', 'API access', 'Priority support']
        }
      },
      {
        name: 'Healthcare Document Compliance',
        industry: 'healthcare',
        description: 'HIPAA-compliant document management for healthcare providers',
        features: [
          'HIPAA compliance monitoring',
          'Patient record management',
          'Insurance claim processing',
          'Medical device documentation',
          'Audit trail management',
          'PHI protection',
          'Regulatory reporting',
          'Quality assurance tracking'
        ],
        templates: [],
        workflows: [],
        complianceRequirements: [],
        automationRules: [],
        integrations: [],
        pricing: {
          tier: 'enterprise',
          monthlyPrice: 299,
          annualPrice: 2990,
          features: ['HIPAA compliance', 'Unlimited users', 'Advanced security', 'Dedicated support']
        }
      },
      {
        name: 'Real Estate Transaction Processing',
        industry: 'real_estate',
        description: 'Streamlined real estate transaction and document management',
        features: [
          'Property disclosure automation',
          'Contract package assembly',
          'Closing document management',
          'Multi-party coordination',
          'Transaction timeline tracking',
          'Commission calculations',
          'Regulatory compliance',
          'Client portal access'
        ],
        templates: [],
        workflows: [],
        complianceRequirements: [],
        automationRules: [],
        integrations: [],
        pricing: {
          tier: 'professional',
          monthlyPrice: 149,
          annualPrice: 1490,
          features: ['Unlimited transactions', 'Client portals', 'Mobile access', 'Standard support']
        }
      },
      {
        name: 'Financial Services Documentation',
        industry: 'financial_services',
        description: 'Regulatory-compliant financial document processing and risk management',
        features: [
          'Risk assessment automation',
          'Regulatory reporting',
          'Client onboarding (KYC)',
          'Audit documentation',
          'Compliance monitoring',
          'Investment documentation',
          'Loan processing',
          'Anti-money laundering (AML)'
        ],
        templates: [],
        workflows: [],
        complianceRequirements: [],
        automationRules: [],
        integrations: [],
        pricing: {
          tier: 'enterprise',
          monthlyPrice: 399,
          annualPrice: 3990,
          features: ['Full compliance suite', 'Advanced analytics', 'Custom integrations', 'White-label options']
        }
      }
    ]

    for (const solution of defaultSolutions) {
      await this.createSolution(solution)
    }
  }

  /**
   * Create a new industry solution
   */
  async createSolution(solutionData: Omit<IndustrySolution, 'id' | 'createdAt' | 'updatedAt'>): Promise<IndustrySolution> {
    const solution: IndustrySolution = {
      ...solutionData,
      id: `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const solutionFile = path.join(this.solutionsDir, `${solution.id}.json`)
    await fs.writeFile(solutionFile, JSON.stringify(solution, null, 2))

    return solution
  }

  /**
   * Get solution by ID
   */
  async getSolution(solutionId: string): Promise<IndustrySolution | null> {
    try {
      const solutionFile = path.join(this.solutionsDir, `${solutionId}.json`)
      const data = await fs.readFile(solutionFile, 'utf-8')
      const solution = JSON.parse(data)
      
      // Convert date strings back to Date objects
      solution.createdAt = new Date(solution.createdAt)
      solution.updatedAt = new Date(solution.updatedAt)
      
      return solution
    } catch (error) {
      return null
    }
  }

  /**
   * List all solutions
   */
  async listSolutions(industry?: string): Promise<IndustrySolution[]> {
    try {
      const files = await fs.readdir(this.solutionsDir)
      const solutionFiles = files.filter(file => file.endsWith('.json'))
      
      const solutions: IndustrySolution[] = []
      
      for (const file of solutionFiles) {
        try {
          const data = await fs.readFile(path.join(this.solutionsDir, file), 'utf-8')
          const solution = JSON.parse(data)
          
          // Convert date strings back to Date objects
          solution.createdAt = new Date(solution.createdAt)
          solution.updatedAt = new Date(solution.updatedAt)
          
          if (!industry || solution.industry === industry) {
            solutions.push(solution)
          }
        } catch (error) {
          // Skip invalid files
        }
      }
      
      return solutions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      return []
    }
  }

  /**
   * Process document with industry-specific analysis
   */
  async processDocumentForIndustry(
    filePath: string,
    fileName: string,
    industry: string,
    solutionId?: string
  ): Promise<{
    analysis: DocumentAnalysis
    industryInsights: any
    recommendations: string[]
    complianceStatus: any
    automationOpportunities: string[]
  }> {
    // Perform standard document analysis
    const analysis = await this.intelligenceService.analyzeDocument(filePath, fileName)
    
    // Get industry-specific solution
    const solutions = await this.listSolutions(industry as any)
    const solution = solutionId ? await this.getSolution(solutionId) : solutions[0]
    
    if (!solution) {
      throw new Error(`No solution found for industry: ${industry}`)
    }

    // Generate industry-specific insights
    const industryInsights = await this.generateIndustryInsights(analysis, solution)
    const recommendations = await this.generateIndustryRecommendations(analysis, solution)
    const complianceStatus = await this.checkIndustryCompliance(analysis, solution)
    const automationOpportunities = await this.identifyAutomationOpportunities(analysis, solution)

    return {
      analysis,
      industryInsights,
      recommendations,
      complianceStatus,
      automationOpportunities
    }
  }

  /**
   * Generate industry-specific insights
   */
  private async generateIndustryInsights(analysis: DocumentAnalysis, solution: IndustrySolution): Promise<any> {
    const insights: any = {
      industry: solution.industry,
      documentRelevance: this.calculateDocumentRelevance(analysis, solution),
      keyFindings: [],
      riskFactors: [],
      opportunities: []
    }

    switch (solution.industry) {
      case 'legal':
        insights.keyFindings = [
          `Document classified as ${analysis.classification.primaryType}`,
          `${analysis.extractedData.entities.length} entities identified`,
          `${analysis.extractedData.dates.length} important dates found`,
          `Risk level: ${analysis.riskAssessment.overallRisk}`
        ]
        insights.riskFactors = analysis.riskAssessment.riskFactors.map(rf => rf.factor)
        insights.opportunities = [
          'Automate contract review process',
          'Set up deadline reminders',
          'Integrate with case management system'
        ]
        break

      case 'healthcare':
        const hasPHI = analysis.complianceCheck.dataPrivacy.phiDetected
        insights.keyFindings = [
          `PHI detected: ${hasPHI ? 'Yes' : 'No'}`,
          `Compliance score: ${100 - analysis.riskAssessment.riskScore}%`,
          `Document type: ${analysis.classification.primaryType}`
        ]
        insights.riskFactors = hasPHI ? ['PHI present - requires special handling'] : []
        insights.opportunities = [
          'Implement automated PHI redaction',
          'Set up HIPAA compliance monitoring',
          'Integrate with EHR system'
        ]
        break

      case 'real_estate':
        insights.keyFindings = [
          `Property-related document: ${analysis.classification.primaryType}`,
          `${analysis.extractedData.addresses.length} addresses identified`,
          `${analysis.extractedData.amounts.length} financial terms found`
        ]
        insights.opportunities = [
          'Automate property disclosure generation',
          'Set up transaction milestone tracking',
          'Integrate with MLS system'
        ]
        break

      case 'financial_services':
        insights.keyFindings = [
          `Financial document type: ${analysis.classification.primaryType}`,
          `Risk assessment: ${analysis.riskAssessment.overallRisk}`,
          `Regulatory compliance: ${analysis.complianceCheck.regulations.length} regulations checked`
        ]
        insights.riskFactors = analysis.riskAssessment.riskFactors.map(rf => rf.factor)
        insights.opportunities = [
          'Automate risk assessment process',
          'Set up regulatory reporting',
          'Implement KYC automation'
        ]
        break
    }

    return insights
  }

  /**
   * Generate industry-specific recommendations
   */
  private async generateIndustryRecommendations(analysis: DocumentAnalysis, solution: IndustrySolution): Promise<string[]> {
    const recommendations: string[] = []

    // Base recommendations from document analysis
    recommendations.push(...analysis.insights.actionItems.map(ai => ai.action))

    // Industry-specific recommendations
    switch (solution.industry) {
      case 'legal':
        if (analysis.classification.primaryType === 'contract') {
          recommendations.push('Schedule contract review meeting')
          recommendations.push('Set up renewal reminders')
          recommendations.push('Update contract database')
        }
        break

      case 'healthcare':
        if (analysis.complianceCheck.dataPrivacy.phiDetected) {
          recommendations.push('Apply PHI protection measures')
          recommendations.push('Update access controls')
          recommendations.push('Schedule HIPAA compliance review')
        }
        break

      case 'real_estate':
        if (analysis.extractedData.addresses.length > 0) {
          recommendations.push('Verify property details')
          recommendations.push('Update transaction timeline')
          recommendations.push('Notify all parties of document receipt')
        }
        break

      case 'financial_services':
        if (analysis.riskAssessment.overallRisk === 'high') {
          recommendations.push('Escalate to risk management team')
          recommendations.push('Perform additional due diligence')
          recommendations.push('Update risk assessment documentation')
        }
        break
    }

    return recommendations
  }

  /**
   * Check industry-specific compliance
   */
  private async checkIndustryCompliance(analysis: DocumentAnalysis, solution: IndustrySolution): Promise<any> {
    const complianceStatus = {
      overall: 'compliant' as 'compliant' | 'non_compliant' | 'needs_review',
      score: 100 - analysis.riskAssessment.riskScore,
      issues: [] as string[],
      recommendations: [] as string[]
    }

    // Industry-specific compliance checks
    switch (solution.industry) {
      case 'healthcare':
        if (analysis.complianceCheck.dataPrivacy.phiDetected) {
          complianceStatus.issues.push('PHI detected - requires HIPAA compliance measures')
          complianceStatus.recommendations.push('Implement PHI protection protocols')
          complianceStatus.overall = 'needs_review'
        }
        break

      case 'financial_services':
        if (analysis.riskAssessment.overallRisk === 'high') {
          complianceStatus.issues.push('High risk document requires additional review')
          complianceStatus.recommendations.push('Perform enhanced due diligence')
          complianceStatus.overall = 'needs_review'
        }
        break

      case 'legal':
        if (analysis.riskAssessment.riskFactors.length > 0) {
          complianceStatus.issues.push('Legal risk factors identified')
          complianceStatus.recommendations.push('Review with legal counsel')
          complianceStatus.overall = 'needs_review'
        }
        break
    }

    return complianceStatus
  }

  /**
   * Identify automation opportunities
   */
  private async identifyAutomationOpportunities(analysis: DocumentAnalysis, solution: IndustrySolution): Promise<string[]> {
    const opportunities: string[] = []

    // Base automation opportunities
    if (analysis.extractedData.dates.length > 0) {
      opportunities.push('Automate deadline tracking and reminders')
    }

    if (analysis.extractedData.amounts.length > 0) {
      opportunities.push('Automate financial data extraction and validation')
    }

    if (analysis.extractedData.entities.length > 0) {
      opportunities.push('Automate contact and organization data synchronization')
    }

    // Industry-specific opportunities
    switch (solution.industry) {
      case 'legal':
        opportunities.push('Automate contract clause analysis')
        opportunities.push('Set up automated compliance checking')
        opportunities.push('Implement automated billing time capture')
        break

      case 'healthcare':
        opportunities.push('Automate PHI detection and redaction')
        opportunities.push('Set up automated HIPAA compliance monitoring')
        opportunities.push('Implement automated patient record updates')
        break

      case 'real_estate':
        opportunities.push('Automate property disclosure generation')
        opportunities.push('Set up automated transaction status updates')
        opportunities.push('Implement automated commission calculations')
        break

      case 'financial_services':
        opportunities.push('Automate risk assessment scoring')
        opportunities.push('Set up automated regulatory reporting')
        opportunities.push('Implement automated KYC processing')
        break
    }

    return opportunities
  }

  /**
   * Calculate document relevance to industry
   */
  private calculateDocumentRelevance(analysis: DocumentAnalysis, solution: IndustrySolution): number {
    let relevanceScore = 0

    // Base relevance from document classification
    const industryKeywords: Record<string, string[]> = {
      legal: ['contract', 'agreement', 'legal', 'court', 'case', 'law', 'attorney', 'counsel'],
      healthcare: ['patient', 'medical', 'health', 'hipaa', 'phi', 'diagnosis', 'treatment'],
      real_estate: ['property', 'real estate', 'closing', 'deed', 'mortgage', 'listing'],
      financial_services: ['financial', 'investment', 'loan', 'credit', 'banking', 'securities']
    }

    const keywords = industryKeywords[solution.industry] || []
    const text = analysis.extractedData.text.toLowerCase()

    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        relevanceScore += 10
      }
    })

    // Normalize to 0-100 scale
    return Math.min(relevanceScore, 100)
  }

  /**
   * Get industry analytics
   */
  async getIndustryAnalytics(industry?: string): Promise<IndustryAnalytics[]> {
    const solutions = await this.listSolutions(industry as any)
    const analytics: IndustryAnalytics[] = []

    const industries = industry ? [industry] : ['legal', 'healthcare', 'real_estate', 'financial_services']

    for (const ind of industries) {
      const industrySolutions = solutions.filter(s => s.industry === ind)
      
      analytics.push({
        industry: ind,
        totalSolutions: industrySolutions.length,
        activeUsers: Math.floor(Math.random() * 1000) + 100, // Mock data
        documentVolume: Math.floor(Math.random() * 10000) + 1000,
        complianceScore: Math.floor(Math.random() * 20) + 80,
        automationRate: Math.floor(Math.random() * 30) + 60,
        timesSaved: Math.floor(Math.random() * 500) + 100,
        costSavings: Math.floor(Math.random() * 50000) + 10000,
        errorReduction: Math.floor(Math.random() * 40) + 50,
        customerSatisfaction: Math.floor(Math.random() * 2) + 4,
        trends: [
          {
            period: 'last_30_days',
            metrics: {
              documents_processed: Math.floor(Math.random() * 1000) + 500,
              automation_rate: Math.floor(Math.random() * 10) + 70,
              compliance_score: Math.floor(Math.random() * 10) + 85
            }
          }
        ]
      })
    }

    return analytics
  }
}
