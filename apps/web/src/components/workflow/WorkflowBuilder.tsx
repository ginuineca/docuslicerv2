import { useCallback, useState, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider
} from 'reactflow'
import 'reactflow/dist/style.css'

import { WorkflowNode, WorkflowNodeData } from './WorkflowNode'
import { WorkflowToolbar } from './WorkflowToolbar'
import { WorkflowSidebar } from './WorkflowSidebar'

const nodeTypes = {
  workflowNode: WorkflowNode
}

const initialNodes: Node<WorkflowNodeData>[] = [
  {
    id: '1',
    type: 'workflowNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'Upload PDF',
      type: 'input',
      status: 'idle'
    }
  }
]

const initialEdges: Edge[] = []

interface WorkflowBuilderProps {
  onSave?: (workflow: { nodes: Node[]; edges: Edge[] }) => void
  onRun?: (workflow: { nodes: Node[]; edges: Edge[] }) => void
  className?: string
}

export function WorkflowBuilder({ onSave, onRun, className = '' }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
      setSelectedNode(node)
    },
    []
  )

  const addNode = useCallback(
    (type: WorkflowNodeData['type'], label: string) => {
      const newNode: Node<WorkflowNodeData> = {
        id: `${nodes.length + 1}`,
        type: 'workflowNode',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100
        },
        data: {
          label,
          type,
          status: 'idle'
        }
      }
      setNodes((nds) => [...nds, newNode])
    },
    [nodes.length, setNodes]
  )

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      )
    },
    [setNodes]
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }
    },
    [setNodes, setEdges, selectedNode]
  )

  const runWorkflow = useCallback(async () => {
    if (isRunning) return

    setIsRunning(true)
    
    // Reset all nodes to idle status
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, status: 'idle' as const, progress: 0 }
      }))
    )

    // Simulate workflow execution
    const sortedNodes = [...nodes].sort((a, b) => {
      // Simple topological sort based on position (left to right)
      return a.position.x - b.position.x
    })

    for (const node of sortedNodes) {
      // Set node to running
      updateNodeData(node.id, { status: 'running', progress: 0 })

      // Simulate processing time
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        updateNodeData(node.id, { progress })
      }

      // Mark as completed
      updateNodeData(node.id, { status: 'completed', progress: 100 })
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsRunning(false)
    
    if (onRun) {
      onRun({ nodes, edges })
    }
  }, [nodes, edges, isRunning, updateNodeData, onRun])

  const saveWorkflow = useCallback(() => {
    if (onSave) {
      onSave({ nodes, edges })
    }
  }, [nodes, edges, onSave])

  const clearWorkflow = useCallback(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    setSelectedNode(null)
  }, [setNodes, setEdges])

  const nodeColors = useMemo(() => {
    return {
      input: '#3b82f6',
      split: '#8b5cf6',
      merge: '#10b981',
      extract: '#f59e0b',
      output: '#6b7280',
      condition: '#eab308'
    }
  }, [])

  return (
    <div className={`h-full flex ${className}`}>
      {/* Sidebar */}
      <WorkflowSidebar
        selectedNode={selectedNode}
        onAddNode={addNode}
        onUpdateNode={updateNodeData}
        onDeleteNode={deleteNode}
      />

      {/* Main Workflow Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <WorkflowToolbar
          onSave={saveWorkflow}
          onRun={runWorkflow}
          onClear={clearWorkflow}
          isRunning={isRunning}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />

        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const nodeData = node.data as WorkflowNodeData
                return nodeColors[nodeData.type] || '#6b7280'
              }}
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

// Wrapper component with ReactFlowProvider
export function WorkflowBuilderWrapper(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  )
}
