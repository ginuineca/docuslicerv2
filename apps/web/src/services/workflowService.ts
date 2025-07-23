import { Node, Edge } from 'reactflow'

export interface WorkflowNode {
  id: string
  type: string
  label: string
  operation: string
  config: Record<string, any>
  position: { x: number; y: number }
  status: 'idle' | 'running' | 'completed' | 'error'
  progress: number
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  triggers: Array<{
    id: string
    type: string
    config: Record<string, any>
    isActive: boolean
  }>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startedAt: Date
  completedAt?: Date
  error?: string
  inputFiles: string[]
  outputFiles: string[]
}

export class WorkflowService {
  private baseUrl = '/api/workflow'

  async getWorkflows(): Promise<Workflow[]> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`)
      if (!response.ok) {
        if (response.status === 500) {
          console.warn('⚠️ Workflow service not available, returning empty list')
          return []
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data.workflows.map((w: any) => ({
        ...w,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt)
      }))
    } catch (error) {
      console.warn('⚠️ Failed to fetch workflows, returning empty list:', error)
      return []
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await fetch(`${this.baseUrl}/workflows/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch workflow')
    }
    const data = await response.json()
    return {
      ...data.workflow,
      createdAt: new Date(data.workflow.createdAt),
      updatedAt: new Date(data.workflow.updatedAt)
    }
  }

  async createWorkflow(workflowData: {
    name: string
    description: string
    nodes: Node[]
    edges: Edge[]
  }): Promise<Workflow> {
    const payload = {
      name: workflowData.name,
      description: workflowData.description,
      nodes: workflowData.nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        operation: this.getOperationFromNodeType(node.data.type),
        config: node.data.config || {},
        position: node.position,
        status: 'idle',
        progress: 0
      })),
      edges: workflowData.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target
      })),
      triggers: [{
        id: 'manual',
        type: 'manual',
        config: {},
        isActive: true
      }],
      isActive: true
    }

    const response = await fetch(`${this.baseUrl}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Failed to create workflow')
    }

    const data = await response.json()
    return {
      ...data.workflow,
      createdAt: new Date(data.workflow.createdAt),
      updatedAt: new Date(data.workflow.updatedAt)
    }
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const response = await fetch(`${this.baseUrl}/workflows/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Failed to update workflow')
    }

    const data = await response.json()
    return {
      ...data.workflow,
      createdAt: new Date(data.workflow.createdAt),
      updatedAt: new Date(data.workflow.updatedAt)
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workflows/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete workflow')
    }
  }

  async executeWorkflow(workflowId: string, files: File[]): Promise<WorkflowExecution> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('workflowId', workflowId)

    const response = await fetch(`${this.baseUrl}/execute`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to execute workflow')
    }

    const data = await response.json()
    return {
      ...data.execution,
      startedAt: new Date(data.execution.startedAt),
      completedAt: data.execution.completedAt ? new Date(data.execution.completedAt) : undefined
    }
  }

  async getExecution(id: string): Promise<WorkflowExecution> {
    const response = await fetch(`${this.baseUrl}/executions/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch execution')
    }
    const data = await response.json()
    return {
      ...data.execution,
      startedAt: new Date(data.execution.startedAt),
      completedAt: data.execution.completedAt ? new Date(data.execution.completedAt) : undefined
    }
  }

  async getExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    const url = workflowId 
      ? `${this.baseUrl}/executions?workflowId=${workflowId}`
      : `${this.baseUrl}/executions`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch executions')
    }
    const data = await response.json()
    return data.executions.map((e: any) => ({
      ...e,
      startedAt: new Date(e.startedAt),
      completedAt: e.completedAt ? new Date(e.completedAt) : undefined
    }))
  }

  async getTemplates(): Promise<Workflow[]> {
    const response = await fetch(`${this.baseUrl}/templates`)
    if (!response.ok) {
      throw new Error('Failed to fetch templates')
    }
    const data = await response.json()
    return data.templates.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt)
    }))
  }

  private getOperationFromNodeType(type: string): string {
    const operationMap: Record<string, string> = {
      'input': 'file-input',
      'split': 'pdf-split',
      'merge': 'pdf-merge',
      'extract': 'pdf-extract-pages',
      'output': 'file-output',
      'condition': 'condition'
    }
    return operationMap[type] || type
  }
}

export const workflowService = new WorkflowService()
