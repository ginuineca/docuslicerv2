import { Node, Edge } from 'reactflow'
import { getDocumentType, canPerformOperation, getConversionOptions, DocumentOperation } from './documentTypes'
import { FormatAwareNodeData } from '../components/workflow/FormatAwareNode'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationError {
  nodeId: string
  type: 'format-incompatible' | 'missing-conversion' | 'invalid-operation' | 'circular-dependency'
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  nodeId: string
  type: 'format-suboptimal' | 'performance-impact' | 'quality-loss'
  message: string
}

export interface ValidationSuggestion {
  nodeId: string
  type: 'add-conversion' | 'reorder-nodes' | 'optimize-format'
  message: string
  action?: {
    type: 'insert-node' | 'modify-node' | 'reorder'
    data: any
  }
}

export class WorkflowValidator {
  private nodes: Node<FormatAwareNodeData>[]
  private edges: Edge[]
  private inputFiles: { name: string; type: string }[]

  constructor(nodes: Node<FormatAwareNodeData>[], edges: Edge[], inputFiles: { name: string; type: string }[] = []) {
    this.nodes = nodes
    this.edges = edges
    this.inputFiles = inputFiles
  }

  /**
   * Validate the entire workflow
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    // Check for circular dependencies
    const circularErrors = this.checkCircularDependencies()
    errors.push(...circularErrors)

    // Validate each node
    for (const node of this.nodes) {
      const nodeValidation = this.validateNode(node)
      errors.push(...nodeValidation.errors)
      warnings.push(...nodeValidation.warnings)
      suggestions.push(...nodeValidation.suggestions)
    }

    // Validate connections between nodes
    const connectionValidation = this.validateConnections()
    errors.push(...connectionValidation.errors)
    warnings.push(...connectionValidation.warnings)
    suggestions.push(...connectionValidation.suggestions)

    // Check workflow completeness
    const completenessValidation = this.validateCompleteness()
    errors.push(...completenessValidation.errors)
    warnings.push(...completenessValidation.warnings)
    suggestions.push(...completenessValidation.suggestions)

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Validate a single node
   */
  private validateNode(node: Node<FormatAwareNodeData>): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    const nodeData = node.data

    // Check if node has required configuration
    if (this.requiresConfiguration(nodeData.type) && !nodeData.config) {
      errors.push({
        nodeId: node.id,
        type: 'invalid-operation',
        message: `${nodeData.type} node requires configuration`,
        severity: 'error'
      })
    }

    // Check format compatibility for input nodes
    if (nodeData.type === 'input' && this.inputFiles.length > 0) {
      const incompatibleFiles = this.inputFiles.filter(file => {
        const docType = getDocumentType(file.name)
        if (!docType) return true
        
        if (nodeData.supportedFormats) {
          return !nodeData.supportedFormats.includes(docType.extension)
        }
        return false
      })

      if (incompatibleFiles.length > 0) {
        errors.push({
          nodeId: node.id,
          type: 'format-incompatible',
          message: `Input node doesn't support: ${incompatibleFiles.map(f => f.name).join(', ')}`,
          severity: 'error'
        })
      }
    }

    // Check operation compatibility
    if (nodeData.type !== 'input' && nodeData.type !== 'output') {
      const operation = this.getOperationForNodeType(nodeData.type)
      if (operation && nodeData.inputFormats) {
        const incompatibleFormats = nodeData.inputFormats.filter(format => {
          return !canPerformOperation(`file.${format}`, operation)
        })

        if (incompatibleFormats.length > 0) {
          warnings.push({
            nodeId: node.id,
            type: 'format-suboptimal',
            message: `Operation ${nodeData.type} may not work optimally with: ${incompatibleFormats.join(', ')}`
          })
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Validate connections between nodes
   */
  private validateConnections(): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    for (const edge of this.edges) {
      const sourceNode = this.nodes.find(n => n.id === edge.source)
      const targetNode = this.nodes.find(n => n.id === edge.target)

      if (!sourceNode || !targetNode) continue

      const sourceData = sourceNode.data
      const targetData = targetNode.data

      // Check format compatibility between connected nodes
      if (sourceData.outputFormat && targetData.inputFormats) {
        if (!targetData.inputFormats.includes(sourceData.outputFormat)) {
          // Check if conversion is possible
          const conversionOptions = getConversionOptions(sourceData.outputFormat)
          const compatibleFormat = targetData.inputFormats.find(format => 
            conversionOptions.includes(format)
          )

          if (compatibleFormat) {
            suggestions.push({
              nodeId: edge.id,
              type: 'add-conversion',
              message: `Add conversion node between ${sourceData.label} and ${targetData.label}`,
              action: {
                type: 'insert-node',
                data: {
                  type: 'convert',
                  inputFormat: sourceData.outputFormat,
                  outputFormat: compatibleFormat
                }
              }
            })
          } else {
            errors.push({
              nodeId: edge.id,
              type: 'format-incompatible',
              message: `${sourceData.label} output (${sourceData.outputFormat}) incompatible with ${targetData.label} input`,
              severity: 'error'
            })
          }
        }
      }

      // Check for potential quality loss
      if (this.causesQualityLoss(sourceData, targetData)) {
        warnings.push({
          nodeId: edge.id,
          type: 'quality-loss',
          message: `Connection from ${sourceData.label} to ${targetData.label} may cause quality loss`
        })
      }
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Validate workflow completeness
   */
  private validateCompleteness(): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    // Check for input nodes
    const inputNodes = this.nodes.filter(n => n.data.type === 'input')
    if (inputNodes.length === 0) {
      errors.push({
        nodeId: 'workflow',
        type: 'invalid-operation',
        message: 'Workflow must have at least one input node',
        severity: 'error'
      })
    }

    // Check for output nodes
    const outputNodes = this.nodes.filter(n => n.data.type === 'output')
    if (outputNodes.length === 0) {
      errors.push({
        nodeId: 'workflow',
        type: 'invalid-operation',
        message: 'Workflow must have at least one output node',
        severity: 'error'
      })
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set([
      ...this.edges.map(e => e.source),
      ...this.edges.map(e => e.target)
    ])

    const disconnectedNodes = this.nodes.filter(n => !connectedNodeIds.has(n.id))
    if (disconnectedNodes.length > 0) {
      warnings.push({
        nodeId: 'workflow',
        type: 'performance-impact',
        message: `${disconnectedNodes.length} disconnected nodes will not be executed`
      })
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Check for circular dependencies
   */
  private checkCircularDependencies(): ValidationError[] {
    const errors: ValidationError[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        errors.push({
          nodeId,
          type: 'circular-dependency',
          message: 'Circular dependency detected in workflow',
          severity: 'error'
        })
        return true
      }

      if (visited.has(nodeId)) return false

      visited.add(nodeId)
      recursionStack.add(nodeId)

      const outgoingEdges = this.edges.filter(e => e.source === nodeId)
      for (const edge of outgoingEdges) {
        if (dfs(edge.target)) return true
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id)
      }
    }

    return errors
  }

  /**
   * Check if node type requires configuration
   */
  private requiresConfiguration(nodeType: string): boolean {
    return ['split', 'extract', 'convert', 'compress', 'ocr'].includes(nodeType)
  }

  /**
   * Get operation type for node type
   */
  private getOperationForNodeType(nodeType: string): DocumentOperation | null {
    const operationMap: Record<string, DocumentOperation> = {
      'split': 'split',
      'merge': 'merge',
      'extract': 'extract',
      'convert': 'convert',
      'compress': 'compress',
      'ocr': 'ocr'
    }
    return operationMap[nodeType] || null
  }

  /**
   * Check if connection causes quality loss
   */
  private causesQualityLoss(sourceData: FormatAwareNodeData, targetData: FormatAwareNodeData): boolean {
    // Define quality loss scenarios
    const lossyConversions = [
      { from: 'pdf', to: 'jpg' },
      { from: 'png', to: 'jpg' },
      { from: 'tiff', to: 'jpg' },
      { from: 'docx', to: 'txt' }
    ]

    if (sourceData.outputFormat && targetData.inputFormats) {
      return lossyConversions.some(conversion => 
        sourceData.outputFormat === conversion.from &&
        targetData.inputFormats!.includes(conversion.to)
      )
    }

    return false
  }
}
