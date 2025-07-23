interface IntegrationConfig {
  id: string
  name: string
  type: 'crm' | 'erp' | 'storage' | 'email' | 'productivity' | 'finance'
  provider: string
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
  webhookUrl?: string
  settings: Record<string, any>
  isActive: boolean
  lastSync?: Date
}

interface SyncResult {
  success: boolean
  recordsProcessed: number
  errors: string[]
  timestamp: Date
}

export class IntegrationHub {
  private integrations: Map<string, IntegrationConfig> = new Map()

  constructor() {
    this.loadIntegrations()
  }

  /**
   * Load saved integrations from storage
   */
  private loadIntegrations() {
    const saved = localStorage.getItem('docuslicer_integrations')
    if (saved) {
      const integrations = JSON.parse(saved)
      integrations.forEach((config: IntegrationConfig) => {
        this.integrations.set(config.id, config)
      })
    }
  }

  /**
   * Save integrations to storage
   */
  private saveIntegrations() {
    const integrations = Array.from(this.integrations.values())
    localStorage.setItem('docuslicer_integrations', JSON.stringify(integrations))
  }

  /**
   * Add or update an integration
   */
  addIntegration(config: IntegrationConfig): void {
    this.integrations.set(config.id, config)
    this.saveIntegrations()
  }

  /**
   * Remove an integration
   */
  removeIntegration(id: string): void {
    this.integrations.delete(id)
    this.saveIntegrations()
  }

  /**
   * Get all integrations
   */
  getIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values())
  }

  /**
   * Get integration by ID
   */
  getIntegration(id: string): IntegrationConfig | undefined {
    return this.integrations.get(id)
  }

  /**
   * Test integration connection
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const integration = this.integrations.get(id)
    if (!integration) {
      return { success: false, message: 'Integration not found' }
    }

    try {
      switch (integration.provider) {
        case 'salesforce':
          return await this.testSalesforceConnection(integration)
        case 'hubspot':
          return await this.testHubSpotConnection(integration)
        case 'google-drive':
          return await this.testGoogleDriveConnection(integration)
        case 'dropbox':
          return await this.testDropboxConnection(integration)
        case 'onedrive':
          return await this.testOneDriveConnection(integration)
        case 'gmail':
          return await this.testGmailConnection(integration)
        case 'outlook':
          return await this.testOutlookConnection(integration)
        default:
          return { success: false, message: 'Unsupported integration provider' }
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` }
    }
  }

  /**
   * Sync documents with external system
   */
  async syncDocuments(integrationId: string, documents: any[]): Promise<SyncResult> {
    const integration = this.integrations.get(integrationId)
    if (!integration || !integration.isActive) {
      return {
        success: false,
        recordsProcessed: 0,
        errors: ['Integration not found or inactive'],
        timestamp: new Date()
      }
    }

    try {
      switch (integration.provider) {
        case 'salesforce':
          return await this.syncToSalesforce(integration, documents)
        case 'hubspot':
          return await this.syncToHubSpot(integration, documents)
        case 'google-drive':
          return await this.syncToGoogleDrive(integration, documents)
        case 'dropbox':
          return await this.syncToDropbox(integration, documents)
        case 'onedrive':
          return await this.syncToOneDrive(integration, documents)
        default:
          return {
            success: false,
            recordsProcessed: 0,
            errors: ['Unsupported sync provider'],
            timestamp: new Date()
          }
      }
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        errors: [`Sync failed: ${error}`],
        timestamp: new Date()
      }
    }
  }

  /**
   * Salesforce integration methods
   */
  private async testSalesforceConnection(config: IntegrationConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${config.baseUrl}/services/data/v58.0/sobjects/`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'Salesforce connection successful' }
    } else {
      return { success: false, message: 'Failed to connect to Salesforce' }
    }
  }

  private async syncToSalesforce(config: IntegrationConfig, documents: any[]): Promise<SyncResult> {
    let processed = 0
    const errors: string[] = []

    for (const doc of documents) {
      try {
        const attachment = {
          Name: doc.name,
          Body: doc.content, // Base64 encoded
          ContentType: doc.mimeType,
          ParentId: config.settings.defaultParentId || null
        }

        const response = await fetch(`${config.baseUrl}/services/data/v58.0/sobjects/Attachment/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attachment)
        })

        if (response.ok) {
          processed++
        } else {
          errors.push(`Failed to sync ${doc.name}: ${response.statusText}`)
        }
      } catch (error) {
        errors.push(`Error syncing ${doc.name}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors,
      timestamp: new Date()
    }
  }

  /**
   * HubSpot integration methods
   */
  private async testHubSpotConnection(config: IntegrationConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'HubSpot connection successful' }
    } else {
      return { success: false, message: 'Failed to connect to HubSpot' }
    }
  }

  private async syncToHubSpot(config: IntegrationConfig, documents: any[]): Promise<SyncResult> {
    let processed = 0
    const errors: string[] = []

    for (const doc of documents) {
      try {
        // Upload file to HubSpot Files API
        const formData = new FormData()
        formData.append('file', doc.file)
        formData.append('options', JSON.stringify({
          access: 'PUBLIC_INDEXABLE',
          ttl: 'P3M',
          overwrite: false
        }))

        const response = await fetch('https://api.hubapi.com/files/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: formData
        })

        if (response.ok) {
          processed++
        } else {
          errors.push(`Failed to sync ${doc.name}: ${response.statusText}`)
        }
      } catch (error) {
        errors.push(`Error syncing ${doc.name}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors,
      timestamp: new Date()
    }
  }

  /**
   * Google Drive integration methods
   */
  private async testGoogleDriveConnection(config: IntegrationConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'Google Drive connection successful' }
    } else {
      return { success: false, message: 'Failed to connect to Google Drive' }
    }
  }

  private async syncToGoogleDrive(config: IntegrationConfig, documents: any[]): Promise<SyncResult> {
    let processed = 0
    const errors: string[] = []

    for (const doc of documents) {
      try {
        const metadata = {
          name: doc.name,
          parents: config.settings.folderId ? [config.settings.folderId] : undefined
        }

        const form = new FormData()
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        form.append('file', doc.file)

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: form
        })

        if (response.ok) {
          processed++
        } else {
          errors.push(`Failed to sync ${doc.name}: ${response.statusText}`)
        }
      } catch (error) {
        errors.push(`Error syncing ${doc.name}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors,
      timestamp: new Date()
    }
  }

  /**
   * Dropbox integration methods
   */
  private async testDropboxConnection(config: IntegrationConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'Dropbox connection successful' }
    } else {
      return { success: false, message: 'Failed to connect to Dropbox' }
    }
  }

  private async syncToDropbox(config: IntegrationConfig, documents: any[]): Promise<SyncResult> {
    let processed = 0
    const errors: string[] = []

    for (const doc of documents) {
      try {
        const path = `${config.settings.folderPath || ''}/${doc.name}`
        
        const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path: path,
              mode: 'add',
              autorename: true
            })
          },
          body: doc.file
        })

        if (response.ok) {
          processed++
        } else {
          errors.push(`Failed to sync ${doc.name}: ${response.statusText}`)
        }
      } catch (error) {
        errors.push(`Error syncing ${doc.name}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors,
      timestamp: new Date()
    }
  }

  /**
   * OneDrive integration methods
   */
  private async testOneDriveConnection(config: IntegrationConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'OneDrive connection successful' }
    } else {
      return { success: false, message: 'Failed to connect to OneDrive' }
    }
  }

  private async syncToOneDrive(config: IntegrationConfig, documents: any[]): Promise<SyncResult> {
    let processed = 0
    const errors: string[] = []

    for (const doc of documents) {
      try {
        const path = config.settings.folderPath || '/Documents'
        const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${path}/${doc.name}:/content`
        
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': doc.mimeType
          },
          body: doc.file
        })

        if (response.ok) {
          processed++
        } else {
          errors.push(`Failed to sync ${doc.name}: ${response.statusText}`)
        }
      } catch (error) {
        errors.push(`Error syncing ${doc.name}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: processed,
      errors,
      timestamp: new Date()
    }
  }

  /**
   * Gmail integration methods
   */
  private async testGmailConnection(config: IntegrationConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'Gmail connection successful' }
    } else {
      return { success: false, message: 'Failed to connect to Gmail' }
    }
  }

  /**
   * Outlook integration methods
   */
  private async testOutlookConnection(config: IntegrationConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'Outlook connection successful' }
    } else {
      return { success: false, message: 'Failed to connect to Outlook' }
    }
  }

  /**
   * Send email with document attachments
   */
  async sendEmail(integrationId: string, emailData: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    attachments?: { name: string; content: string; mimeType: string }[]
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const integration = this.integrations.get(integrationId)
    if (!integration || !integration.isActive) {
      return { success: false, error: 'Integration not found or inactive' }
    }

    try {
      if (integration.provider === 'gmail') {
        return await this.sendGmailEmail(integration, emailData)
      } else if (integration.provider === 'outlook') {
        return await this.sendOutlookEmail(integration, emailData)
      } else {
        return { success: false, error: 'Unsupported email provider' }
      }
    } catch (error) {
      return { success: false, error: `Failed to send email: ${error}` }
    }
  }

  private async sendGmailEmail(config: IntegrationConfig, emailData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Implementation for Gmail API email sending
    // This would construct the email message and send via Gmail API
    return { success: true, messageId: 'gmail-message-id' }
  }

  private async sendOutlookEmail(config: IntegrationConfig, emailData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Implementation for Outlook API email sending
    // This would construct the email message and send via Microsoft Graph API
    return { success: true, messageId: 'outlook-message-id' }
  }
}
