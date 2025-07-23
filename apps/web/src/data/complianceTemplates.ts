import { Node, Edge } from 'reactflow'
import { SubscriptionTier } from '../utils/templateTiers'

export interface ComplianceTemplate {
  id: string
  name: string
  description: string
  regulation: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI-DSS' | 'ISO-27001' | 'CCPA' | 'FERPA'
  industry: string[]
  tier: SubscriptionTier
  tags: string[]
  nodes: Node[]
  edges: Edge[]
  estimatedTime: string
  useCase: string
  complianceFeatures: string[]
  auditRequirements: string[]
  retentionPeriod?: string
  businessValue: string
}

export const complianceTemplates: ComplianceTemplate[] = [
  {
    id: 'gdpr-data-processing',
    name: 'GDPR Data Processing Workflow',
    description: 'Process documents with GDPR compliance including data subject rights and consent management',
    regulation: 'GDPR',
    industry: ['Legal', 'Healthcare', 'Finance', 'Technology'],
    tier: 'enterprise',
    tags: ['gdpr', 'privacy', 'data-protection', 'consent', 'audit'],
    estimatedTime: '12 minutes',
    useCase: 'Process personal data documents while maintaining GDPR compliance and audit trails',
    complianceFeatures: [
      'Automatic PII detection and redaction',
      'Consent verification tracking',
      'Data subject access request handling',
      'Right to erasure implementation',
      'Cross-border transfer controls',
      'Breach notification workflows'
    ],
    auditRequirements: [
      'Complete processing audit trail',
      'Consent records with timestamps',
      'Data retention policy enforcement',
      'Access control logs',
      'Data transfer documentation'
    ],
    retentionPeriod: '6 years',
    businessValue: 'Ensure GDPR compliance and avoid fines up to €20M or 4% of annual revenue',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Upload Documents',
          type: 'input',
          status: 'idle',
          supportedFormats: ['pdf', 'docx', 'xlsx'],
          config: {
            encryptionRequired: true,
            auditLogging: true
          }
        }
      },
      {
        id: 'scan-pii',
        type: 'workflowNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'Scan for PII',
          type: 'process',
          status: 'idle',
          inputFormats: ['pdf', 'docx', 'xlsx'],
          outputFormat: 'analyzed-document',
          config: {
            detectNames: true,
            detectEmails: true,
            detectPhones: true,
            detectAddresses: true,
            detectSSN: true,
            detectCreditCards: true,
            confidenceThreshold: 95
          }
        }
      },
      {
        id: 'consent-check',
        type: 'workflowNode',
        position: { x: 300, y: 400 },
        data: {
          label: 'Verify Consent',
          type: 'condition',
          status: 'idle',
          inputFormats: ['analyzed-document'],
          config: {
            condition: 'checkGDPRConsent',
            requireExplicitConsent: true,
            consentDatabase: 'gdpr-consent-db'
          }
        }
      },
      {
        id: 'redact-pii',
        type: 'workflowNode',
        position: { x: 500, y: 150 },
        data: {
          label: 'Redact PII',
          type: 'redact',
          status: 'idle',
          inputFormats: ['analyzed-document'],
          outputFormat: 'redacted-document',
          config: {
            redactionMethod: 'black-box',
            preserveLayout: true,
            auditRedactions: true,
            gdprCompliant: true
          }
        }
      },
      {
        id: 'pseudonymize',
        type: 'workflowNode',
        position: { x: 500, y: 300 },
        data: {
          label: 'Pseudonymize Data',
          type: 'process',
          status: 'idle',
          inputFormats: ['analyzed-document'],
          outputFormat: 'pseudonymized-document',
          config: {
            algorithm: 'AES-256',
            keyManagement: 'HSM',
            reversible: true
          }
        }
      },
      {
        id: 'audit-log',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Create Audit Log',
          type: 'process',
          status: 'idle',
          inputFormats: ['redacted-document', 'pseudonymized-document'],
          outputFormat: 'audit-record',
          config: {
            includeTimestamps: true,
            includeUserInfo: true,
            includeProcessingDetails: true,
            gdprArticle6Basis: true,
            retentionPeriod: '6 years'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 900, y: 300 },
        data: {
          label: 'Secure Output',
          type: 'output',
          status: 'idle',
          inputFormats: ['redacted-document', 'pseudonymized-document', 'audit-record'],
          config: {
            encryption: 'AES-256',
            accessControl: true,
            auditDownloads: true
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'scan-pii',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'consent-check',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'scan-pii',
        target: 'redact-pii',
        type: 'smoothstep',
        label: 'High Risk PII'
      },
      {
        id: 'e2-5',
        source: 'scan-pii',
        target: 'pseudonymize',
        type: 'smoothstep',
        label: 'Low Risk PII'
      },
      {
        id: 'e4-6',
        source: 'redact-pii',
        target: 'audit-log',
        type: 'smoothstep'
      },
      {
        id: 'e5-6',
        source: 'pseudonymize',
        target: 'audit-log',
        type: 'smoothstep'
      },
      {
        id: 'e6-7',
        source: 'audit-log',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'hipaa-medical-records',
    name: 'HIPAA Medical Records Processing',
    description: 'Process medical documents with HIPAA compliance for PHI protection',
    regulation: 'HIPAA',
    industry: ['Healthcare', 'Insurance', 'Legal'],
    tier: 'enterprise',
    tags: ['hipaa', 'phi', 'medical', 'healthcare', 'privacy'],
    estimatedTime: '10 minutes',
    useCase: 'Process medical records while maintaining HIPAA compliance and PHI protection',
    complianceFeatures: [
      'PHI identification and protection',
      'Minimum necessary standard enforcement',
      'Access control and authentication',
      'Audit logging and monitoring',
      'Breach notification procedures',
      'Business associate compliance'
    ],
    auditRequirements: [
      'PHI access logs with user identification',
      'Processing activity records',
      'Security incident documentation',
      'Risk assessment records',
      'Training completion records'
    ],
    retentionPeriod: '6 years from creation or last use',
    businessValue: 'Avoid HIPAA violations with fines up to $1.5M per incident',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 250 },
        data: {
          label: 'Upload Medical Records',
          type: 'input',
          status: 'idle',
          supportedFormats: ['pdf', 'docx', 'jpg', 'png'],
          config: {
            hipaaCompliant: true,
            encryptionRequired: true,
            accessControlRequired: true
          }
        }
      },
      {
        id: 'phi-detection',
        type: 'workflowNode',
        position: { x: 300, y: 150 },
        data: {
          label: 'Detect PHI',
          type: 'process',
          status: 'idle',
          inputFormats: ['pdf', 'docx', 'jpg', 'png'],
          outputFormat: 'phi-analyzed',
          config: {
            detectNames: true,
            detectDOB: true,
            detectSSN: true,
            detectMRN: true,
            detectDiagnoses: true,
            detectMedications: true,
            detectProviders: true,
            ocrEnabled: true
          }
        }
      },
      {
        id: 'minimum-necessary',
        type: 'workflowNode',
        position: { x: 300, y: 350 },
        data: {
          label: 'Apply Minimum Necessary',
          type: 'condition',
          status: 'idle',
          inputFormats: ['phi-analyzed'],
          config: {
            condition: 'minimumNecessaryCheck',
            purposeOfUse: 'treatment',
            requestorRole: 'healthcare-provider'
          }
        }
      },
      {
        id: 'de-identify',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'De-identify PHI',
          type: 'redact',
          status: 'idle',
          inputFormats: ['phi-analyzed'],
          outputFormat: 'de-identified',
          config: {
            method: 'safe-harbor',
            removeDirectIdentifiers: true,
            statisticalDisclosure: false,
            expertDetermination: false
          }
        }
      },
      {
        id: 'access-control',
        type: 'workflowNode',
        position: { x: 700, y: 150 },
        data: {
          label: 'Apply Access Controls',
          type: 'process',
          status: 'idle',
          inputFormats: ['de-identified'],
          outputFormat: 'access-controlled',
          config: {
            roleBasedAccess: true,
            userAuthentication: true,
            sessionTimeout: 15,
            auditAccess: true
          }
        }
      },
      {
        id: 'audit-trail',
        type: 'workflowNode',
        position: { x: 700, y: 300 },
        data: {
          label: 'Generate Audit Trail',
          type: 'process',
          status: 'idle',
          inputFormats: ['access-controlled'],
          outputFormat: 'audit-trail',
          config: {
            logAccess: true,
            logModifications: true,
            logDisclosures: true,
            tamperEvident: true,
            retentionPeriod: '6 years'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 900, y: 225 },
        data: {
          label: 'Secure Delivery',
          type: 'output',
          status: 'idle',
          inputFormats: ['access-controlled', 'audit-trail'],
          config: {
            encryptInTransit: true,
            encryptAtRest: true,
            digitalSignature: true,
            deliveryConfirmation: true
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'phi-detection',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'minimum-necessary',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'phi-detection',
        target: 'de-identify',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'de-identify',
        target: 'access-control',
        type: 'smoothstep'
      },
      {
        id: 'e4-6',
        source: 'de-identify',
        target: 'audit-trail',
        type: 'smoothstep'
      },
      {
        id: 'e5-7',
        source: 'access-control',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e6-7',
        source: 'audit-trail',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'sox-financial-controls',
    name: 'SOX Financial Document Controls',
    description: 'Process financial documents with Sarbanes-Oxley compliance controls',
    regulation: 'SOX',
    industry: ['Finance', 'Accounting', 'Public Companies'],
    tier: 'enterprise',
    tags: ['sox', 'financial', 'controls', 'audit', 'governance'],
    estimatedTime: '8 minutes',
    useCase: 'Process financial documents with SOX compliance for internal controls and audit trails',
    complianceFeatures: [
      'Internal control documentation',
      'Management assessment workflows',
      'Audit trail requirements',
      'Change control procedures',
      'Access control matrices',
      'Segregation of duties enforcement'
    ],
    auditRequirements: [
      'Complete audit trail of all changes',
      'User access and authorization logs',
      'Control testing documentation',
      'Management certifications',
      'External auditor work papers'
    ],
    retentionPeriod: '7 years',
    businessValue: 'Ensure SOX compliance and avoid criminal penalties up to $5M',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Financial Docs',
          type: 'input',
          status: 'idle',
          supportedFormats: ['pdf', 'xlsx', 'docx'],
          config: {
            soxCompliant: true,
            requiresApproval: true,
            segregationOfDuties: true
          }
        }
      },
      {
        id: 'classify-1',
        type: 'workflowNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'Classify Document',
          type: 'condition',
          status: 'idle',
          inputFormats: ['pdf', 'xlsx', 'docx'],
          config: {
            condition: 'classifyFinancialDocument',
            categories: ['financial-statement', 'internal-control', 'audit-evidence']
          }
        }
      },
      {
        id: 'control-test',
        type: 'workflowNode',
        position: { x: 500, y: 100 },
        data: {
          label: 'Test Internal Controls',
          type: 'process',
          status: 'idle',
          inputFormats: ['pdf', 'xlsx', 'docx'],
          outputFormat: 'control-tested',
          config: {
            testDesignEffectiveness: true,
            testOperatingEffectiveness: true,
            documentDeficiencies: true
          }
        }
      },
      {
        id: 'approval-1',
        type: 'workflowNode',
        position: { x: 500, y: 300 },
        data: {
          label: 'Management Approval',
          type: 'condition',
          status: 'idle',
          inputFormats: ['control-tested'],
          config: {
            condition: 'requireManagementApproval',
            approverRole: 'CFO',
            digitalSignatureRequired: true
          }
        }
      },
      {
        id: 'audit-log',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Create Audit Log',
          type: 'process',
          status: 'idle',
          inputFormats: ['control-tested'],
          outputFormat: 'sox-audit-log',
          config: {
            immutableLog: true,
            timestampAll: true,
            trackAllChanges: true,
            retentionPeriod: '7 years'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 900, y: 200 },
        data: {
          label: 'Archive Securely',
          type: 'output',
          status: 'idle',
          inputFormats: ['sox-audit-log'],
          config: {
            tamperEvident: true,
            longTermStorage: true,
            accessControlled: true
          }
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'classify-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-3',
        source: 'classify-1',
        target: 'control-test',
        type: 'smoothstep',
        label: 'Internal Control'
      },
      {
        id: 'e3-4',
        source: 'control-test',
        target: 'approval-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'approval-1',
        target: 'audit-log',
        type: 'smoothstep'
      },
      {
        id: 'e5-6',
        source: 'audit-log',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  }
]
