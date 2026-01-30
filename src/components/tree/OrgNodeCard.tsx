"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrgNode, RankLevel } from "@/lib/types"
import { useOrgStore } from "@/stores/orgStore"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"
import { Plus, Trash2, Edit, Link, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrgNodeCardProps {
  node: OrgNode
  onAddChild: (parentId: string) => void
  onMoveNode: (draggedId: string, targetId: string) => void
  isHoveredBridge?: boolean
  isBridgePartner?: boolean
  onBridgeHover?: (nodeId: string | null) => void
  hasChildren?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// 가교별 고유 색상 팔레트
const bridgeColorPalette = [
  { ring: "ring-orange-400", text: "text-orange-500", bg: "bg-orange-100", hex: "#fb923c" },
  { ring: "ring-pink-400", text: "text-pink-500", bg: "bg-pink-100", hex: "#f472b6" },
  { ring: "ring-cyan-400", text: "text-cyan-500", bg: "bg-cyan-100", hex: "#22d3ee" },
  { ring: "ring-violet-400", text: "text-violet-500", bg: "bg-violet-100", hex: "#a78bfa" },
  { ring: "ring-lime-400", text: "text-lime-600", bg: "bg-lime-100", hex: "#a3e635" },
  { ring: "ring-rose-400", text: "text-rose-500", bg: "bg-rose-100", hex: "#fb7185" },
  { ring: "ring-teal-400", text: "text-teal-500", bg: "bg-teal-100", hex: "#2dd4bf" },
  { ring: "ring-indigo-400", text: "text-indigo-500", bg: "bg-indigo-100", hex: "#818cf8" },
]

// 다중 가교 시 그라데이션 생성
const buildGradient = (colors: typeof bridgeColorPalette) => {
  if (colors.length <= 1) return null
  const colorStops = colors.map((c, i) => {
    const percent = (i / (colors.length - 1)) * 100
    return `${c.hex} ${percent}%`
  })
  return `linear-gradient(135deg, ${colorStops.join(", ")})`
}

// 직급 레벨별 색상
const rankColors: Record<RankLevel, string> = {
  executive: "bg-amber-100 text-amber-800 border-amber-300",
  head: "bg-blue-100 text-blue-800 border-blue-300",
  manager: "bg-green-100 text-green-800 border-green-300",
  senior: "bg-purple-100 text-purple-800 border-purple-300",
  staff: "bg-gray-100 text-gray-800 border-gray-300",
}

// 직급 레벨 한글명
const rankLabels: Record<RankLevel, string> = {
  executive: "임원",
  head: "본부장",
  manager: "팀장",
  senior: "선임",
  staff: "사원",
}

export function OrgNodeCard({
  node,
  onAddChild,
  onMoveNode,
  isHoveredBridge,
  isBridgePartner,
  onBridgeHover,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
}: OrgNodeCardProps) {
  const { bridges } = useOrgStore()
  const { openNodeDetail, openDeleteDialog, openNodeView } = useUIStore()
  const { isEditor } = useAuthStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isTasksExpanded, setIsTasksExpanded] = useState(false)

  // tasks 배열 또는 scope에서 업무 목록 가져오기
  const taskList = node.tasks && node.tasks.length > 0
    ? [...node.tasks].sort((a, b) => a.order - b.order).map(t => t.content)
    : node.scope
      ? node.scope.split('\n').filter(line => line.trim())
      : []

  // 카드 클릭 핸들러 (비편집자용 상세보기)
  const handleCardClick = () => {
    if (!isEditor && taskList.length > 0) {
      openNodeView(node.id)
    }
  }

  const isCompany = node.org === "company"

  // 이 노드에 연결된 모든 브릿지 찾기 (한 사람이 여러 가교 가능)
  const linkedBridges = bridges.filter(
    (b) => b.companyTargetId === node.id || b.hospitalTargetId === node.id
  )

  // Company 노드 기준으로 고유 색상 결정 (Company가 색상의 주체)
  const getColorByCompanyId = (companyId: string) => {
    // 모든 고유한 Company ID들을 수집하고 정렬하여 일관된 인덱스 부여
    const uniqueCompanyIds = Array.from(new Set(bridges.map(b => b.companyTargetId))).sort()
    const index = uniqueCompanyIds.indexOf(companyId)
    return bridgeColorPalette[index % bridgeColorPalette.length]
  }

  // 각 브릿지의 색상 정보 (Company ID 기준)
  const linkedBridgeColors = linkedBridges.map((bridge) => {
    return getColorByCompanyId(bridge.companyTargetId)
  })

  // 브릿지 하이라이트 상태
  const isHighlighted = isHoveredBridge || isBridgePartner

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("nodeId", node.id)
    e.dataTransfer.effectAllowed = "move"
    // 드래그 중 투명도 낮추기
    ;(e.target as HTMLElement).style.opacity = "0.5"
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.target as HTMLElement).style.opacity = "1"
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const draggedId = e.dataTransfer.getData("nodeId")
    if (draggedId && draggedId !== node.id) {
      onMoveNode(draggedId, node.id)
    }
  }

  // 브릿지 호버
  const handleMouseEnter = () => {
    if (linkedBridges.length > 0 && onBridgeHover) {
      onBridgeHover(node.id)
    }
  }

  const handleMouseLeave = () => {
    if (onBridgeHover) {
      onBridgeHover(null)
    }
  }

  // 하이라이트 클래스
  let highlightClass = ""
  if (isHighlighted) {
    highlightClass = isCompany
      ? "ring-4 ring-slate-400/50 shadow-xl scale-105 z-20"
      : "ring-4 ring-emerald-400/50 shadow-xl scale-105 z-20"
  } else if (isDragOver) {
    highlightClass = "ring-4 ring-blue-500 shadow-xl scale-105 z-30 bg-blue-50"
  }

  // 카드 내용 렌더링
  const cardContent = (
    <>
      {/* 부서명 (있을 경우) */}
      {node.department && (
        <div className="text-[10px] text-muted-foreground mb-1 text-center truncate">
          {node.department}
        </div>
      )}

      {/* 이름 + 직책 (수직 중앙 배치) */}
      <div className="flex flex-col items-center text-center">
        {/* 이름 */}
        <p className="font-bold text-sm truncate w-full">{node.name}</p>

        {/* 직책 + 직급 레벨 */}
        <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
          {node.title && (
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded font-medium",
                isCompany
                  ? "bg-slate-100 text-slate-700"
                  : "bg-emerald-100 text-emerald-700"
              )}
            >
              {node.title}
            </span>
          )}
          {node.rank && (
            <span
              className={cn(
                "text-[10px] px-1 py-0.5 rounded border",
                rankColors[node.rank]
              )}
            >
              {rankLabels[node.rank]}
            </span>
          )}
        </div>

        {/* 브릿지 연결 아이콘 (여러 가교 지원) */}
        {linkedBridges.length > 0 && (
          <div className="mt-2 flex gap-0.5" title={`가교 ${linkedBridges.length}개 연결됨`}>
            {linkedBridgeColors.map((color, idx) => (
              <Link key={idx} className={cn("h-4 w-4", color.text)} />
            ))}
          </div>
        )}
      </div>

      {/* 업무 범위 */}
      {taskList.length > 0 && (
        <div className="mt-3 text-left w-full">
          <ul
            className={cn(
              "text-xs text-muted-foreground space-y-0.5 border-l-2 pl-2 tasks-list",
              isCompany ? "border-slate-300" : "border-emerald-300"
            )}
            data-tasks-expanded={isTasksExpanded ? "true" : "false"}
          >
            {(isTasksExpanded ? taskList : taskList.slice(0, 3)).map((task, idx) => (
              <li key={idx}>• {task}</li>
            ))}
          </ul>

          {/* 더보기/접기 버튼 (4개 이상일 때만) */}
          {taskList.length > 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsTasksExpanded(!isTasksExpanded)
              }}
              className={cn(
                "text-[10px] flex items-center justify-center gap-0.5 mt-1 hover:underline w-full",
                isCompany ? "text-slate-400" : "text-emerald-500"
              )}
            >
              {isTasksExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  +{taskList.length - 3}개 더보기
                </>
              )}
            </button>
          )}
        </div>
      )}

      {isEditor && (
        <div className="flex justify-center gap-1 mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              openNodeDetail(node.id)
            }}
            title="편집"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              openDeleteDialog(node.id, "node")
            }}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </>
  )

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center transition-all duration-300 ease-in-out",
        highlightClass
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={isEditor}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 브릿지 하이라이트 표시 */}
      {isHighlighted && (
        <div
          className={cn(
            "absolute -top-6 text-xs font-bold px-2 py-0.5 rounded-full animate-bounce",
            isCompany ? "bg-slate-700 text-white" : "bg-emerald-600 text-white"
          )}
        >
          {isCompany ? "▼ 연결 주체" : "▼ 연결 대상"}
        </div>
      )}

      {/* 드롭 대상 표시 */}
      {isDragOver && (
        <div className="absolute -top-8 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-50 animate-pulse">
          이곳에 놓아 하위로 이동
        </div>
      )}

      {/* 카드 본체 */}
      {linkedBridges.length > 1 ? (
        // 다중 가교: 그라데이션 테두리
        <div
          className="rounded-xl p-[2px]"
          style={{ background: buildGradient(linkedBridgeColors) || undefined }}
        >
          <Card
            data-card
            className={cn(
              "w-56 transition-shadow hover:shadow-md rounded-[10px] bg-background",
              isEditor ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
            )}
            onClick={handleCardClick}
          >
            <CardContent className="px-3 py-3">{cardContent}</CardContent>
          </Card>
        </div>
      ) : (
        // 단일 가교 또는 없음: 기존 ring 사용
        <Card
          data-card
          className={cn(
            "w-56 transition-shadow hover:shadow-md",
            isEditor ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
            linkedBridges.length > 0 && `ring-2 ${linkedBridgeColors[0]?.ring}`
          )}
          onClick={handleCardClick}
        >
          <CardContent className="px-3 py-3">{cardContent}</CardContent>
        </Card>
      )}

      {/* 하위 추가 버튼 + 접기/펼치기 버튼 */}
      {(isEditor || hasChildren) && (
        <>
          <div className="h-4 w-px bg-gray-300 group-hover:bg-blue-400 transition-colors" />
          <div className="flex items-center gap-1 z-20">
            {isEditor && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChild(node.id)
                }}
                className="
                  flex items-center space-x-1
                  bg-white border border-gray-300 text-gray-500 rounded-full px-3 py-1 shadow-sm
                  hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all
                "
                title={`${node.name}님의 하위 조직원 추가`}
              >
                <Plus className="w-3 h-3" />
                <span className="text-[10px] font-bold">하위 추가</span>
              </button>
            )}
            {/* 접기/펼치기 버튼 (자식이 있는 노드만) */}
            {hasChildren && onToggleCollapse && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleCollapse()
                }}
                className={cn(
                  "w-6 h-6 rounded-full border shadow-sm flex items-center justify-center",
                  "bg-white hover:bg-gray-50 transition-colors",
                  isCompany ? "border-slate-300 text-slate-600" : "border-emerald-300 text-emerald-600"
                )}
                title={isCollapsed ? "펼치기" : "접기"}
              >
                {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
