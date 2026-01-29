"use client"

import { memo } from "react"
import { Handle, Position, NodeProps } from "@xyflow/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrgNode, RankLevel } from "@/lib/types"
import { useOrgStore } from "@/stores/orgStore"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"
import { Plus, Trash2, Edit, Link } from "lucide-react"
import { cn } from "@/lib/utils"

type OrgNodeCardProps = NodeProps & {
  data: OrgNode | Record<string, unknown>
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

export const OrgNodeCard = memo(function OrgNodeCard({
  data: rawData,
  selected,
}: OrgNodeCardProps) {
  const data = rawData as OrgNode
  const { addNode, addEdge, updateNodePosition, bridges } = useOrgStore()
  const { openNodeDetail, openDeleteDialog } = useUIStore()
  const { isEditor } = useAuthStore()

  // 이 노드에 연결된 브릿지가 있는지 확인
  const linkedBridge = bridges.find(
    (b) => b.companyTargetId === data.id || b.hospitalTargetId === data.id
  )

  const handleAddChild = async () => {
    if (!isEditor) {
      console.log("[OrgNodeCard] Not in editor mode, skipping")
      return
    }

    console.log("[OrgNodeCard] Adding child node to:", data.id)
    const name = data.org === "company" ? "새 직원" : "새 의료진"
    const newNode = await addNode(data.org, name, data.id)

    // 자동 위치 (부모 아래)
    updateNodePosition(newNode.id, data.positionX ?? 0, (data.positionY ?? 0) + 150)

    // 엣지 추가
    addEdge(data.org, data.id, newNode.id, "vertical")
    console.log("[OrgNodeCard] Child node added successfully")
  }

  return (
    <div className="relative">
      {/* 상단 핸들 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary"
      />

      <Card
        className={cn(
          "w-52 cursor-pointer transition-shadow hover:shadow-md",
          selected && "ring-2 ring-primary",
          linkedBridge && "ring-2 ring-orange-400"
        )}
      >
        <CardContent className="p-3">
          {/* 부서명 (있을 경우) */}
          {data.department && (
            <div className="text-[10px] text-muted-foreground mb-1 truncate">
              {data.department}
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 이름 */}
              <p className="font-bold text-sm truncate">{data.name}</p>

              {/* 직책 + 직급 레벨 */}
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                {data.title && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                    {data.title}
                  </span>
                )}
                {data.rank && (
                  <span className={cn(
                    "text-[10px] px-1 py-0.5 rounded border whitespace-nowrap",
                    rankColors[data.rank]
                  )}>
                    {rankLabels[data.rank]}
                  </span>
                )}
              </div>
            </div>

            {linkedBridge && (
              <div className="flex-shrink-0" title="가교 연결됨">
                <Link className="h-4 w-4 text-orange-500" />
              </div>
            )}
          </div>

          {/* 업무 스콥 */}
          {data.scope && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 border-l-2 border-primary/30 pl-2">
              {data.scope}
            </p>
          )}

          {isEditor && (
            <div className="flex gap-1 mt-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openNodeDetail(data.id)}
                title="편집"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleAddChild}
                title="하위 추가"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => openDeleteDialog(data.id, "node")}
                title="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 하단 핸들 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />

      {/* 좌우 핸들 (병렬 연결용) */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-secondary"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-secondary"
      />
    </div>
  )
})
