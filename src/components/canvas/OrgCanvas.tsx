"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { OrgType } from "@/lib/types"
import { useOrgStore } from "@/stores/orgStore"
import { useAuthStore } from "@/stores/authStore"
import { OrgNodeCard } from "@/components/nodes/OrgNodeCard"
import { OrgEdge } from "@/components/edges/OrgEdge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { calculateTreeLayout, getStructureSignature } from "@/lib/layoutUtils"

interface OrgCanvasProps {
  org: OrgType
}

const nodeTypes: NodeTypes = {
  orgNode: OrgNodeCard,
}

const edgeTypes: EdgeTypes = {
  orgEdge: OrgEdge,
}

function OrgCanvasInner({ org }: OrgCanvasProps) {
  const { nodes: allNodes, edges: allEdges, addNode, addEdge: addOrgEdge, updateNodePosition, reparentNode, isLoading, error, initialize } = useOrgStore()
  const { isEditor } = useAuthStore()
  const reactFlowInstance = useReactFlow()
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [isLayoutApplied, setIsLayoutApplied] = useState(false)
  const prevStructureRef = useRef<string>("")

  // 디버깅 로그 (개발 중에만)
  // console.log(`[OrgCanvas:${org}] isEditor:`, isEditor, "isLoading:", isLoading, "error:", error, "nodes:", allNodes.length)

  // 해당 조직의 노드와 엣지만 필터링
  const orgNodes = useMemo(
    () => allNodes.filter((n) => n.org === org),
    [allNodes, org]
  )

  const orgEdges = useMemo(
    () => allEdges.filter((e) => e.org === org),
    [allEdges, org]
  )

  // React Flow 형식으로 변환
  const initialNodes = useMemo(
    () =>
      orgNodes.map((node) => ({
        id: node.id,
        type: "orgNode",
        position: { x: node.positionX ?? 0, y: node.positionY ?? 0 },
        data: node as unknown as Record<string, unknown>,
      })),
    [orgNodes]
  )

  const initialEdges = useMemo(
    () =>
      orgEdges.map((edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        type: "orgEdge",
        data: edge as unknown as Record<string, unknown>,
      })),
    [orgEdges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 초기화
  useEffect(() => {
    initialize()
  }, [initialize])

  // 스토어 데이터 변경 시 업데이트
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // 자동 레이아웃 적용
  useEffect(() => {
    if (orgNodes.length === 0 || isLoading) return

    // 구조 시그니처 계산
    const currentStructure = getStructureSignature(orgNodes)

    // 구조가 변경되었거나 첫 로드인 경우에만 레이아웃 적용
    if (currentStructure !== prevStructureRef.current || !isLayoutApplied) {
      console.log(`[OrgCanvas:${org}] Applying auto-layout...`)

      const layoutedPositions = calculateTreeLayout(orgNodes)

      // 각 노드 위치 업데이트
      layoutedPositions.forEach(({ id, x, y }) => {
        updateNodePosition(id, x, y)
      })

      prevStructureRef.current = currentStructure
      setIsLayoutApplied(true)

      // fitView로 전체 조직도가 화면에 맞게 표시
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 })
      }, 100)
    }
  }, [orgNodes, isLoading, org, updateNodePosition, reactFlowInstance, isLayoutApplied])

  // 노드 드래그 시작
  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setDraggedNodeId(node.id)
    },
    []
  )

  // 노드 드래그 종료 시 위치 저장 및 재배치 확인
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!isEditor) return

      // 드래그된 노드의 위치 저장
      updateNodePosition(node.id, node.position.x, node.position.y)

      // 드롭 대상 노드 찾기 (현재 노드와 겹치는 다른 노드)
      const allFlowNodes = reactFlowInstance.getNodes()
      const draggedNode = allFlowNodes.find((n) => n.id === node.id)

      if (!draggedNode) return

      // 드래그된 노드와 겹치는 다른 노드 찾기
      const dropTarget = allFlowNodes.find((n) => {
        if (n.id === node.id) return false

        // 노드 영역 계산 (대략적인 크기: 208x120)
        const nodeWidth = 208
        const nodeHeight = 120

        const targetLeft = n.position.x
        const targetRight = n.position.x + nodeWidth
        const targetTop = n.position.y
        const targetBottom = n.position.y + nodeHeight

        const draggedCenterX = draggedNode.position.x + nodeWidth / 2
        const draggedCenterY = draggedNode.position.y + nodeHeight / 2

        // 드래그된 노드의 중심이 대상 노드 영역 안에 있는지 확인
        return (
          draggedCenterX >= targetLeft &&
          draggedCenterX <= targetRight &&
          draggedCenterY >= targetTop &&
          draggedCenterY <= targetBottom
        )
      })

      if (dropTarget) {
        // 현재 부모가 아닌 경우에만 재배치
        const currentParentId = orgNodes.find((n) => n.id === node.id)?.parentId
        if (dropTarget.id !== currentParentId) {
          reparentNode(node.id, dropTarget.id)
        }
      }

      setDraggedNodeId(null)
    },
    [isEditor, updateNodePosition, reactFlowInstance, orgNodes, reparentNode]
  )

  // 새 연결 생성
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isEditor || !params.source || !params.target) return

      // 엣지 추가
      addOrgEdge(org, params.source, params.target, "vertical")
    },
    [isEditor, org, addOrgEdge]
  )

  // 루트 노드 추가
  const handleAddRootNode = async () => {
    if (!isEditor) return

    const name = org === "company" ? "새 직원" : "새 의료진"
    const existingRoots = orgNodes.filter((n) => !n.parentId)
    const newNode = await addNode(org, name, null)

    // 자동 위치 지정
    updateNodePosition(
      newNode.id,
      100 + existingRoots.length * 200,
      100
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <span className="text-sm font-medium px-2 py-1 bg-background/80 rounded">
          {org === "company" ? "Company" : "Hospital"}
        </span>
        {isEditor ? (
          <Button size="sm" variant="outline" onClick={handleAddRootNode}>
            <Plus className="h-4 w-4 mr-1" />
            노드 추가
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            보기 전용
          </span>
        )}
      </div>

      {error && (
        <div className="absolute top-2 right-2 z-10 bg-destructive/10 text-destructive text-sm px-3 py-1 rounded">
          {error}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={isEditor}
        nodesConnectable={isEditor}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

// ReactFlowProvider로 감싼 컴포넌트 export
export function OrgCanvas({ org }: OrgCanvasProps) {
  return (
    <ReactFlowProvider>
      <OrgCanvasInner org={org} />
    </ReactFlowProvider>
  )
}
