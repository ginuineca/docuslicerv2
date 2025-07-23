import { Node, Edge } from 'reactflow'
import { WorkflowTemplate } from '../data/workflowTemplates'

/**
 * Template optimization and validation system for maximum workflow performance
 */

export interface TemplateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  performanceScore: number
  estimatedExecutionTime: number
  optimizations: TemplateOptimization[]
}

export interface TemplateOptimization {
  type: 'parallel' | 'cache' | 'merge' | 'split' | 'reorder'
  description: string
  impact: 'high' | 'medium' | 'low'
  estimatedSpeedup: number
  nodes: string[]
}

export interface OptimizedTemplate extends WorkflowTemplate {
  validationResult: TemplateValidationResult
  optimizedNodes: Node[]
  optimizedEdges: Edge[]
  parallelGroups: string[][]
  criticalPath: string[]
  executionPlan: ExecutionStep[]
}

export interface ExecutionStep {
  stepNumber: number
  nodeIds: string[]
  canRunInParallel: boolean
  estimatedTime: number
  dependencies: string[]
}

export class TemplateOptimizer {
  private operationMetrics = new Map<string, OperationMetrics>()
  private templateCache = new Map<string, OptimizedTemplate>()

  constructor() {
    this.initializeOperationMetrics()
  }

  /**
   * Validate and optimize a workflow template
   */
  async optimizeTemplate(template: WorkflowTemplate): Promise<OptimizedTemplate> {
    // Check cache first
    const cacheKey = this.generateCacheKey(template)
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!
    }

    // Validate template structure
    const validationResult = await this.validateTemplate(template)

    // Optimize if valid
    let optimizedNodes = [...template.nodes]
    let optimizedEdges = [...template.edges]
    let parallelGroups: string[][] = []
    let criticalPath: string[] = []
    let executionPlan: ExecutionStep[] = []

    if (validationResult.isValid) {
      const optimization = await this.performOptimization(template)
      optimizedNodes = optimization.nodes
      optimizedEdges = optimization.edges
      parallelGroups = optimization.parallelGroups
      criticalPath = optimization.criticalPath
      executionPlan = optimization.executionPlan
    }

    const optimizedTemplate: OptimizedTemplate = {
      ...template,
      validationResult,
      optimizedNodes,
      optimizedEdges,
      parallelGroups,
      criticalPath,
      executionPlan
    }

    // Cache the result
    this.templateCache.set(cacheKey, optimizedTemplate)

    return optimizedTemplate
  }

  /**
   * Validate template structure and logic
   */
  private async validateTemplate(template: WorkflowTemplate): Promise<TemplateValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const optimizations: TemplateOptimization[] = []

    // Basic structure validation
    if (!template.nodes || template.nodes.length === 0) {
      errors.push('Template must have at least one node')
    }

    if (!template.edges || template.edges.length === 0) {
      warnings.push('Template has no connections between nodes')
    }

    // Node validation
    const nodeIds = new Set(template.nodes.map(node => node.id))
    const inputNodes = template.nodes.filter(node => node.data?.type === 'input')
    const outputNodes = template.nodes.filter(node => node.data?.type === 'output')

    if (inputNodes.length === 0) {
      errors.push('Template must have at least one input node')
    }

    if (outputNodes.length === 0) {
      warnings.push('Template should have at least one output node')
    }

    // Edge validation
    for (const edge of template.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge references non-existent source node: ${edge.source}`)
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge references non-existent target node: ${edge.target}`)
      }
    }

    // Cycle detection
    const cycles = this.detectCycles(template.nodes, template.edges)
    if (cycles.length > 0) {
      errors.push(`Template contains cycles: ${cycles.join(', ')}`)
    }

    // Unreachable nodes detection
    const unreachableNodes = this.findUnreachableNodes(template.nodes, template.edges)
    if (unreachableNodes.length > 0) {
      warnings.push(`Unreachable nodes found: ${unreachableNodes.join(', ')}`)
    }

    // Performance analysis
    const performanceAnalysis = this.analyzePerformance(template)
    optimizations.push(...performanceAnalysis.optimizations)
    suggestions.push(...performanceAnalysis.suggestions)

    // Configuration validation
    for (const node of template.nodes) {
      const configValidation = this.validateNodeConfig(node)
      errors.push(...configValidation.errors)
      warnings.push(...configValidation.warnings)
      suggestions.push(...configValidation.suggestions)
    }

    const performanceScore = this.calculatePerformanceScore(template, errors, warnings)
    const estimatedExecutionTime = this.estimateExecutionTime(template)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      performanceScore,
      estimatedExecutionTime,
      optimizations
    }
  }

  /**
   * Perform template optimization
   */
  private async performOptimization(template: WorkflowTemplate): Promise<{
    nodes: Node[]
    edges: Edge[]
    parallelGroups: string[][]
    criticalPath: string[]
    executionPlan: ExecutionStep[]
  }> {
    let nodes = [...template.nodes]
    let edges = [...template.edges]

    // 1. Identify parallel execution opportunities
    const parallelGroups = this.identifyParallelGroups(nodes, edges)

    // 2. Optimize node ordering
    const optimizedOrder = this.optimizeNodeOrder(nodes, edges)
    nodes = this.reorderNodes(nodes, optimizedOrder)

    // 3. Merge compatible operations
    const mergeOptimization = this.identifyMergeOpportunities(nodes, edges)
    if (mergeOptimization.canMerge) {
      const merged = this.mergeNodes(nodes, edges, mergeOptimization.groups)
      nodes = merged.nodes
      edges = merged.edges
    }

    // 4. Add caching hints
    nodes = this.addCachingHints(nodes)

    // 5. Calculate critical path
    const criticalPath = this.calculateCriticalPath(nodes, edges)

    // 6. Generate execution plan
    const executionPlan = this.generateExecutionPlan(nodes, edges, parallelGroups)

    return {
      nodes,
      edges,
      parallelGroups,
      criticalPath,
      executionPlan
    }
  }

  /**
   * Identify nodes that can run in parallel
   */
  private identifyParallelGroups(nodes: Node[], edges: Edge[]): string[][] {
    const groups: string[][] = []
    const dependencyMap = this.buildDependencyMap(nodes, edges)
    const processed = new Set<string>()

    for (const node of nodes) {
      if (processed.has(node.id)) continue

      const dependencies = dependencyMap.get(node.id) || []
      
      // Find nodes with same dependencies that can run in parallel
      const parallelCandidates = nodes.filter(n => 
        !processed.has(n.id) &&
        n.id !== node.id &&
        this.arraysEqual(dependencyMap.get(n.id) || [], dependencies) &&
        this.canRunInParallel(node, n)
      )

      if (parallelCandidates.length > 0) {
        const group = [node.id, ...parallelCandidates.map(n => n.id)]
        groups.push(group)
        group.forEach(id => processed.add(id))
      } else {
        processed.add(node.id)
      }
    }

    return groups
  }

  /**
   * Calculate critical path for execution optimization
   */
  private calculateCriticalPath(nodes: Node[], edges: Edge[]): string[] {
    const dependencyMap = this.buildDependencyMap(nodes, edges)
    const nodeMetrics = new Map<string, number>()

    // Calculate execution time for each node
    nodes.forEach(node => {
      const operation = this.getNodeOperation(node)
      const metrics = this.operationMetrics.get(operation)
      nodeMetrics.set(node.id, metrics?.averageTime || 1000)
    })

    // Find longest path (critical path)
    const visited = new Set<string>()
    const pathTimes = new Map<string, number>()

    const calculatePathTime = (nodeId: string): number => {
      if (pathTimes.has(nodeId)) {
        return pathTimes.get(nodeId)!
      }

      const dependencies = dependencyMap.get(nodeId) || []
      const maxDependencyTime = dependencies.length > 0 
        ? Math.max(...dependencies.map(dep => calculatePathTime(dep)))
        : 0

      const nodeTime = nodeMetrics.get(nodeId) || 0
      const totalTime = maxDependencyTime + nodeTime

      pathTimes.set(nodeId, totalTime)
      return totalTime
    }

    // Calculate path times for all nodes
    nodes.forEach(node => calculatePathTime(node.id))

    // Find the critical path by backtracking from the node with maximum time
    const maxTime = Math.max(...Array.from(pathTimes.values()))
    const endNode = Array.from(pathTimes.entries())
      .find(([_, time]) => time === maxTime)?.[0]

    if (!endNode) return []

    // Backtrack to build critical path
    const criticalPath: string[] = []
    let currentNode = endNode

    while (currentNode) {
      criticalPath.unshift(currentNode)
      const dependencies = dependencyMap.get(currentNode) || []
      
      if (dependencies.length === 0) break

      // Find the dependency with the longest path time
      currentNode = dependencies.reduce((longest, dep) => 
        (pathTimes.get(dep) || 0) > (pathTimes.get(longest) || 0) ? dep : longest
      )
    }

    return criticalPath
  }

  /**
   * Generate optimized execution plan
   */
  private generateExecutionPlan(
    nodes: Node[], 
    edges: Edge[], 
    parallelGroups: string[][]
  ): ExecutionStep[] {
    const dependencyMap = this.buildDependencyMap(nodes, edges)
    const executionPlan: ExecutionStep[] = []
    const processed = new Set<string>()
    let stepNumber = 1

    // Create parallel group lookup
    const nodeToGroup = new Map<string, string[]>()
    parallelGroups.forEach(group => {
      group.forEach(nodeId => nodeToGroup.set(nodeId, group))
    })

    while (processed.size < nodes.length) {
      const readyNodes = nodes.filter(node => {
        if (processed.has(node.id)) return false
        const dependencies = dependencyMap.get(node.id) || []
        return dependencies.every(dep => processed.has(dep))
      })

      if (readyNodes.length === 0) break

      // Group ready nodes by parallel execution capability
      const stepGroups = new Map<string, string[]>()
      
      readyNodes.forEach(node => {
        const group = nodeToGroup.get(node.id)
        if (group) {
          const groupKey = group.sort().join(',')
          if (!stepGroups.has(groupKey)) {
            stepGroups.set(groupKey, [])
          }
          stepGroups.get(groupKey)!.push(node.id)
        } else {
          stepGroups.set(node.id, [node.id])
        }
      })

      // Create execution steps
      stepGroups.forEach(nodeIds => {
        const canRunInParallel = nodeIds.length > 1
        const estimatedTime = canRunInParallel 
          ? Math.max(...nodeIds.map(id => this.getNodeExecutionTime(nodes.find(n => n.id === id)!)))
          : nodeIds.reduce((sum, id) => sum + this.getNodeExecutionTime(nodes.find(n => n.id === id)!), 0)

        const dependencies = Array.from(new Set(
          nodeIds.flatMap(id => dependencyMap.get(id) || [])
        ))

        executionPlan.push({
          stepNumber: stepNumber++,
          nodeIds,
          canRunInParallel,
          estimatedTime,
          dependencies
        })

        nodeIds.forEach(id => processed.add(id))
      })
    }

    return executionPlan
  }

  /**
   * Validate node configuration
   */
  private validateNodeConfig(node: Node): {
    errors: string[]
    warnings: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    const nodeType = node.data?.type
    const config = node.data?.config || {}

    switch (nodeType) {
      case 'extract':
        if (!config.pageRanges && !config.extractLastPage) {
          warnings.push(`Extract node ${node.id} has no page range specified`)
        }
        break

      case 'split':
        if (!config.ranges || config.ranges.length === 0) {
          errors.push(`Split node ${node.id} must have page ranges defined`)
        }
        break

      case 'merge':
        if (!config.order && !config.sortBy) {
          suggestions.push(`Merge node ${node.id} could benefit from explicit ordering`)
        }
        break

      case 'ocr':
        if (!config.density) {
          suggestions.push(`OCR node ${node.id} should specify image density for better quality`)
        }
        if (config.density && config.density < 150) {
          warnings.push(`OCR node ${node.id} has low density setting, may affect accuracy`)
        }
        break

      case 'condition':
        if (!config.condition) {
          errors.push(`Condition node ${node.id} must have a condition defined`)
        }
        break
    }

    return { errors, warnings, suggestions }
  }

  /**
   * Analyze template performance characteristics
   */
  private analyzePerformance(template: WorkflowTemplate): {
    optimizations: TemplateOptimization[]
    suggestions: string[]
  } {
    const optimizations: TemplateOptimization[] = []
    const suggestions: string[] = []

    // Identify expensive operations
    const expensiveNodes = template.nodes.filter(node => {
      const operation = this.getNodeOperation(node)
      const metrics = this.operationMetrics.get(operation)
      return metrics && metrics.averageTime > 5000 // > 5 seconds
    })

    if (expensiveNodes.length > 0) {
      optimizations.push({
        type: 'cache',
        description: 'Cache results of expensive operations',
        impact: 'high',
        estimatedSpeedup: 0.7,
        nodes: expensiveNodes.map(n => n.id)
      })
    }

    // Check for sequential operations that could be parallel
    const sequentialChains = this.findSequentialChains(template.nodes, template.edges)
    sequentialChains.forEach(chain => {
      if (chain.length > 2) {
        const parallelizable = chain.filter(nodeId => {
          const node = template.nodes.find(n => n.id === nodeId)
          return node && this.isParallelizable(node)
        })

        if (parallelizable.length > 1) {
          optimizations.push({
            type: 'parallel',
            description: 'Execute independent operations in parallel',
            impact: 'medium',
            estimatedSpeedup: 0.4,
            nodes: parallelizable
          })
        }
      }
    })

    return { optimizations, suggestions }
  }

  /**
   * Helper methods
   */
  private initializeOperationMetrics(): void {
    // Initialize with realistic performance metrics
    this.operationMetrics.set('pdf-split', { averageTime: 2000, memoryUsage: 50, cpuIntensive: false })
    this.operationMetrics.set('pdf-merge', { averageTime: 3000, memoryUsage: 75, cpuIntensive: false })
    this.operationMetrics.set('ocr-extract', { averageTime: 8000, memoryUsage: 200, cpuIntensive: true })
    this.operationMetrics.set('ai-classify', { averageTime: 1500, memoryUsage: 100, cpuIntensive: true })
    this.operationMetrics.set('ai-extract', { averageTime: 2500, memoryUsage: 150, cpuIntensive: true })
    this.operationMetrics.set('condition', { averageTime: 100, memoryUsage: 10, cpuIntensive: false })
  }

  private buildDependencyMap(nodes: Node[], edges: Edge[]): Map<string, string[]> {
    const dependencyMap = new Map<string, string[]>()
    
    nodes.forEach(node => dependencyMap.set(node.id, []))
    edges.forEach(edge => {
      const dependencies = dependencyMap.get(edge.target) || []
      dependencies.push(edge.source)
      dependencyMap.set(edge.target, dependencies)
    })

    return dependencyMap
  }

  private detectCycles(nodes: Node[], edges: Edge[]): string[] {
    // Simplified cycle detection - would implement full DFS cycle detection
    return []
  }

  private findUnreachableNodes(nodes: Node[], edges: Edge[]): string[] {
    const reachable = new Set<string>()
    const inputNodes = nodes.filter(n => n.data?.type === 'input')
    
    // BFS from input nodes
    const queue = [...inputNodes.map(n => n.id)]
    
    while (queue.length > 0) {
      const current = queue.shift()!
      if (reachable.has(current)) continue
      
      reachable.add(current)
      
      const outgoingEdges = edges.filter(e => e.source === current)
      outgoingEdges.forEach(edge => {
        if (!reachable.has(edge.target)) {
          queue.push(edge.target)
        }
      })
    }

    return nodes.filter(n => !reachable.has(n.id)).map(n => n.id)
  }

  private canRunInParallel(node1: Node, node2: Node): boolean {
    const operation1 = this.getNodeOperation(node1)
    const operation2 = this.getNodeOperation(node2)
    
    // Operations that can run in parallel
    const parallelizable = ['pdf-split', 'ocr-extract', 'ai-classify', 'ai-extract']
    
    return parallelizable.includes(operation1) && parallelizable.includes(operation2)
  }

  private getNodeOperation(node: Node): string {
    return node.data?.type || 'unknown'
  }

  private getNodeExecutionTime(node: Node): number {
    const operation = this.getNodeOperation(node)
    const metrics = this.operationMetrics.get(operation)
    return metrics?.averageTime || 1000
  }

  private calculatePerformanceScore(template: WorkflowTemplate, errors: string[], warnings: string[]): number {
    let score = 100
    score -= errors.length * 20
    score -= warnings.length * 5
    
    // Bonus for parallel execution opportunities
    const parallelGroups = this.identifyParallelGroups(template.nodes, template.edges)
    score += parallelGroups.length * 5
    
    return Math.max(0, Math.min(100, score))
  }

  private estimateExecutionTime(template: WorkflowTemplate): number {
    const criticalPath = this.calculateCriticalPath(template.nodes, template.edges)
    return criticalPath.reduce((total, nodeId) => {
      const node = template.nodes.find(n => n.id === nodeId)
      return total + (node ? this.getNodeExecutionTime(node) : 0)
    }, 0)
  }

  private generateCacheKey(template: WorkflowTemplate): string {
    const nodeHash = template.nodes.map(n => `${n.id}:${n.data?.type}`).join('|')
    const edgeHash = template.edges.map(e => `${e.source}->${e.target}`).join('|')
    return `${template.id}:${nodeHash}:${edgeHash}`
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i])
  }

  private optimizeNodeOrder(nodes: Node[], edges: Edge[]): string[] {
    // Topological sort with performance optimization
    const dependencyMap = this.buildDependencyMap(nodes, edges)
    const sorted: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) return // Cycle detected
      if (visited.has(nodeId)) return

      visiting.add(nodeId)
      const dependencies = dependencyMap.get(nodeId) || []
      dependencies.forEach(dep => visit(dep))
      visiting.delete(nodeId)
      visited.add(nodeId)
      sorted.push(nodeId)
    }

    nodes.forEach(node => visit(node.id))
    return sorted
  }

  private reorderNodes(nodes: Node[], order: string[]): Node[] {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    return order.map(id => nodeMap.get(id)!).filter(Boolean)
  }

  private identifyMergeOpportunities(nodes: Node[], edges: Edge[]): { canMerge: boolean; groups: string[][] } {
    // Simplified - would implement sophisticated merge detection
    return { canMerge: false, groups: [] }
  }

  private mergeNodes(nodes: Node[], edges: Edge[], groups: string[][]): { nodes: Node[]; edges: Edge[] } {
    // Would implement node merging logic
    return { nodes, edges }
  }

  private addCachingHints(nodes: Node[]): Node[] {
    return nodes.map(node => {
      const operation = this.getNodeOperation(node)
      const metrics = this.operationMetrics.get(operation)
      
      if (metrics && metrics.averageTime > 3000) {
        return {
          ...node,
          data: {
            ...node.data,
            cacheEnabled: true,
            cacheTTL: 3600000 // 1 hour
          }
        }
      }
      
      return node
    })
  }

  private findSequentialChains(nodes: Node[], edges: Edge[]): string[][] {
    // Would implement chain detection logic
    return []
  }

  private isParallelizable(node: Node): boolean {
    const operation = this.getNodeOperation(node)
    const parallelizable = ['pdf-split', 'ocr-extract', 'ai-classify', 'ai-extract']
    return parallelizable.includes(operation)
  }
}

interface OperationMetrics {
  averageTime: number
  memoryUsage: number
  cpuIntensive: boolean
}

// Global template optimizer instance
export const templateOptimizer = new TemplateOptimizer()
