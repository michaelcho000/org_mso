"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { OrgType } from "@/lib/types"
import { useOrgStore } from "@/stores/orgStore"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"
import { buildTree, isDescendant } from "@/lib/treeUtils"
import { TreeNode } from "./TreeNode"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Maximize2, RotateCcw, Expand, Shrink, ChevronsDownUp, ChevronsUpDown, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrgTreeViewProps {
  org: OrgType
}

export function OrgTreeView({ org }: OrgTreeViewProps) {
  const {
    nodes,
    bridges,
    isLoading,
    error,
    initialize,
    addNode,
    reparentNode,
  } = useOrgStore()
  const { openNodeDetail, expandedPanel, setExpandedPanel } = useUIStore()
  const { isEditor } = useAuthStore()

  // 패널 확장 상태
  const panelType = org === "company" ? "company" : "client"
  const isExpanded = expandedPanel === panelType

  // 브릿지 호버 상태
  const [hoveredBridgeNodeId, setHoveredBridgeNodeId] = useState<string | null>(null)

  // 접기/펼치기 상태
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())

  // 줌 상태
  const [zoom, setZoom] = useState(1) // 기본 100% (초기 로드 후 자동 맞춤)
  const [zoomInputValue, setZoomInputValue] = useState("100") // 줌 입력 필드용
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 })
  const [isInitialFitDone, setIsInitialFitDone] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  // 드래그 패닝 상태
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })

  // 해당 조직의 노드만 필터링
  const orgNodes = useMemo(() => nodes.filter((n) => n.org === org), [nodes, org])

  // 트리 구조로 변환
  const tree = useMemo(() => buildTree(nodes, org), [nodes, org])

  // 브릿지 파트너 ID들 계산 (한 노드가 여러 가교에 연결될 수 있음)
  const activeBridgeTargetIds = useMemo(() => {
    if (!hoveredBridgeNodeId) return []
    // 호버된 노드와 연결된 모든 가교 찾기
    const linkedBridges = bridges.filter(
      (b) =>
        b.companyTargetId === hoveredBridgeNodeId ||
        b.hospitalTargetId === hoveredBridgeNodeId
    )
    // 각 가교의 상대방 ID 수집
    return linkedBridges.map((bridge) =>
      hoveredBridgeNodeId === bridge.companyTargetId
        ? bridge.hospitalTargetId
        : bridge.companyTargetId
    )
  }, [hoveredBridgeNodeId, bridges])

  // 초기화
  useEffect(() => {
    initialize()
  }, [initialize])

  // zoom 변경 시 입력 필드 동기화
  useEffect(() => {
    setZoomInputValue(String(Math.round(zoom * 100)))
  }, [zoom])

  // 트리 크기 측정
  useEffect(() => {
    const treeEl = treeRef.current
    if (!treeEl || tree.length === 0) return

    // 약간의 지연 후 크기 측정 (렌더링 완료 대기)
    const timer = setTimeout(() => {
      const rect = treeEl.getBoundingClientRect()
      // 현재 줌 보정하여 원본 크기 계산
      const originalWidth = rect.width / zoom
      const originalHeight = rect.height / zoom

      setContentSize({
        width: originalWidth,
        height: originalHeight
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [tree, zoom])

  // 초기 로드 시 자동 맞춤 + 가운데 정렬
  useEffect(() => {
    if (!isInitialFitDone && contentSize.width > 0 && tree.length > 0) {
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.clientWidth - 32
      const containerHeight = container.clientHeight - 32

      // 화면에 맞는 줌 계산
      const zoomX = containerWidth / contentSize.width
      const zoomY = containerHeight / contentSize.height
      const fittingZoom = Math.min(1, Math.min(zoomX, zoomY) * 0.9)
      const newZoom = Math.max(fittingZoom, 0.3)
      setZoom(newZoom)
      setIsInitialFitDone(true)

      // 가운데로 스크롤 (약간의 지연 후)
      setTimeout(() => {
        if (!container) return
        const scaledWidth = contentSize.width * newZoom + 200
        const scrollX = Math.max(0, (scaledWidth - containerWidth) / 2)
        container.scrollLeft = scrollX
      }, 150)
    }
  }, [contentSize, tree.length, isInitialFitDone])

  // 루트 노드 추가
  const handleAddRoot = useCallback(async () => {
    if (!isEditor) return
    const name = org === "company" ? "새 임원" : "새 관리자"
    await addNode(org, name, null)
  }, [isEditor, org, addNode])

  // 하위 노드 추가 (모달 열기)
  const handleAddChild = useCallback(
    (parentId: string) => {
      if (!isEditor) return
      // NodeDetailSheet를 열어서 추가 모드로 사용
      // 또는 직접 노드 추가 후 편집 시트 열기
      const parent = nodes.find((n) => n.id === parentId)
      if (!parent) return

      const name = org === "company" ? "새 직원" : "새 의료진"
      addNode(org, name, parentId).then((newNode) => {
        // 생성 후 바로 편집 모달 열기
        openNodeDetail(newNode.id)
      })
    },
    [isEditor, org, nodes, addNode, openNodeDetail]
  )

  // 노드 이동 (드래그 앤 드롭)
  const handleMoveNode = useCallback(
    (draggedId: string, targetId: string) => {
      // 1. 자기 자신으로 이동 방지
      if (draggedId === targetId) return

      // 2. 노드 찾기
      const draggedNode = nodes.find((n) => n.id === draggedId)
      const targetNode = nodes.find((n) => n.id === targetId)

      if (!draggedNode || !targetNode) return

      // 3. 다른 조직으로 이동 방지
      if (draggedNode.org !== targetNode.org) {
        alert("다른 조직 유형으로 이동할 수 없습니다.")
        return
      }

      // 4. 순환 참조 방지 (부모를 자기 자식으로 이동 불가)
      if (isDescendant(nodes, targetId, draggedId)) {
        alert("상위 조직원을 하위 조직원으로 이동할 수 없습니다.")
        return
      }

      // 5. reparentNode로 노드 이동 + 엣지 업데이트 + DB 저장
      reparentNode(draggedId, targetId)
    },
    [nodes, reparentNode]
  )

  // 브릿지 호버 핸들러
  const handleBridgeHover = useCallback((nodeId: string | null) => {
    setHoveredBridgeNodeId(nodeId)
  }, [])

  // 접기/펼치기 핸들러
  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const collapseAll = useCallback(() => {
    // 자식이 있는 모든 노드 ID 수집
    const parentIds = orgNodes.filter(n =>
      orgNodes.some(child => child.parentId === n.id)
    ).map(n => n.id)
    setCollapsedNodeIds(new Set(parentIds))
  }, [orgNodes])

  const expandAll = useCallback(() => {
    setCollapsedNodeIds(new Set())
  }, [])

  // PNG 내보내기 핸들러 (html-to-image 사용)
  const handleExport = useCallback(async () => {
    if (!treeRef.current) return

    // 현재 줌 저장 후 100%로 변경
    const originalZoom = zoom
    setZoom(1)

    // 내보내기 모드 클래스 추가 (줄바꿈 방지)
    treeRef.current.classList.add('export-mode')

    // 트랜지션 완료 대기
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      // Dynamic import for SSR compatibility
      const { toPng } = await import("html-to-image")

      // 폰트 로드 완료 대기
      await document.fonts.ready

      const dataUrl = await toPng(treeRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'none',
          transition: 'none',
        },
      })

      const link = document.createElement("a")
      link.download = `${org === "company" ? "Company" : "Client"}_조직도.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Export failed:", error)
    }

    // 내보내기 모드 클래스 제거
    treeRef.current?.classList.remove('export-mode')

    // 줌 복원
    setZoom(originalZoom)
  }, [zoom, org])

  // 줌 컨트롤 핸들러
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 1.5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.3))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
  }, [])

  const handleFitToView = useCallback(() => {
    const container = containerRef.current
    if (!container || contentSize.width === 0) return

    const containerWidth = container.clientWidth - 32 // padding 제외
    const containerHeight = container.clientHeight - 32

    // 화면에 맞는 줌 계산 (가로/세로 중 작은 값)
    const zoomX = containerWidth / contentSize.width
    const zoomY = containerHeight / contentSize.height
    const fittingZoom = Math.min(1, Math.min(zoomX, zoomY) * 0.9)
    setZoom(Math.max(fittingZoom, 0.3)) // 최소 30%

    // 줌 적용 후 가운데로 스크롤
    setTimeout(() => {
      if (!container) return
      const scaledWidth = contentSize.width * fittingZoom
      const scaledHeight = contentSize.height * fittingZoom
      const scrollX = Math.max(0, (scaledWidth - containerWidth) / 2)
      const scrollY = Math.max(0, (scaledHeight - containerHeight) / 2)
      container.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: "smooth"
      })
    }, 50)
  }, [contentSize])

  // 드래그 패닝 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 카드나 버튼 클릭 시 패닝 시작 안함
    const target = e.target as HTMLElement
    if (target.closest("button, [data-card]")) return

    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    setScrollStart({
      x: containerRef.current?.scrollLeft ?? 0,
      y: containerRef.current?.scrollTop ?? 0,
    })
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return

      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y

      if (containerRef.current) {
        containerRef.current.scrollLeft = scrollStart.x - dx
        containerRef.current.scrollTop = scrollStart.y - dy
      }
    },
    [isPanning, panStart, scrollStart]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // 마우스 휠 줌
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      setZoom((prev) => Math.min(Math.max(prev + delta, 0.3), 1.5))
    }

    container.addEventListener("wheel", wheelHandler, { passive: false })
    return () => container.removeEventListener("wheel", wheelHandler)
  }, [])

  const isCompany = org === "company"

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div
        className={cn(
          "sticky top-0 z-20 backdrop-blur-sm border-b px-4 py-2 flex justify-between items-center shadow-sm gap-2",
          isCompany
            ? "bg-slate-100/95 border-slate-200"
            : "bg-emerald-50/95 border-emerald-100"
        )}
      >
        <h2
          className={cn(
            "font-bold uppercase tracking-wide text-sm flex items-center gap-2 flex-shrink-0",
            isCompany ? "text-slate-800" : "text-emerald-800"
          )}
        >
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full shadow-sm",
              isCompany ? "bg-slate-700" : "bg-emerald-600"
            )}
          />
          {isCompany ? "Company" : "Client"}
        </h2>

        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-1 bg-background/50 rounded-lg px-1 py-0.5 border">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleZoomOut}
            title="축소"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <input
            type="text"
            value={zoomInputValue}
            onChange={(e) => {
              // 숫자만 허용
              const value = e.target.value.replace(/[^0-9]/g, '')
              setZoomInputValue(value)
            }}
            onBlur={() => {
              const value = parseInt(zoomInputValue, 10)
              if (isNaN(value) || value < 30) {
                setZoom(0.3)
              } else if (value > 150) {
                setZoom(1.5)
              } else {
                setZoom(value / 100)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className="text-xs w-10 text-center font-medium tabular-nums bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded"
          />
          <span className="text-xs">%</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleZoomIn}
            title="확대"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleZoomReset}
            title="100%로 리셋"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleFitToView}
            title="화면에 맞춤"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setExpandedPanel(isExpanded ? null : panelType)}
            title={isExpanded ? "원래 크기로" : "패널 확장"}
          >
            {isExpanded ? <Shrink className="h-3 w-3" /> : <Expand className="h-3 w-3" />}
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={collapseAll}
            title="전체 접기"
          >
            <ChevronsDownUp className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={expandAll}
            title="전체 펼치기"
          >
            <ChevronsUpDown className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleExport}
            title="PNG 내보내기"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>

        {isEditor && (
          <Button
            size="sm"
            variant="secondary"
            className={cn(
              "shadow-sm border flex-shrink-0",
              isCompany
                ? "border-slate-200"
                : "border-emerald-200 text-emerald-800 bg-emerald-50"
            )}
            onClick={handleAddRoot}
          >
            <Plus className="h-4 w-4 mr-1" />
            직원 추가
          </Button>
        )}
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mx-4 mt-2 bg-destructive/10 text-destructive text-sm px-3 py-1 rounded">
          {error}
        </div>
      )}

      {/* 트리 컨테이너 */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-auto org-tree-container p-4 select-none",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tree.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 p-8 border-2 border-dashed border-gray-200 rounded-xl">
            노드가 없습니다.
            <br />
            {isEditor
              ? "상단 버튼을 눌러 구성원을 추가하세요."
              : "편집 모드에서 구성원을 추가할 수 있습니다."}
          </div>
        ) : (
          /* Wrapper: 드래그 가능한 충분한 공간 확보 + 가운데 정렬 */
          <div
            className="flex items-start justify-center min-w-full min-h-full"
            style={{
              width: contentSize.width > 0 ? contentSize.width * zoom + 200 : "100%",
              height: contentSize.height > 0 ? contentSize.height * zoom + 200 : "100%",
              paddingTop: 20,
              paddingBottom: 100,
            }}
          >
            {/* 실제 트리 콘텐츠에 scale 적용 */}
            <div
              ref={treeRef}
              className="org-tree"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease-out",
              }}
            >
              <ul>
                {tree.map((rootNode) => (
                  <TreeNode
                    key={rootNode.id}
                    node={rootNode}
                    onAddChild={handleAddChild}
                    onMoveNode={handleMoveNode}
                    hoveredBridgeNodeId={hoveredBridgeNodeId}
                    activeBridgeTargetIds={activeBridgeTargetIds}
                    onBridgeHover={handleBridgeHover}
                    collapsedNodeIds={collapsedNodeIds}
                    onToggleCollapse={toggleCollapse}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
