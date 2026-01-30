"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUIStore } from "@/stores/uiStore"
import { useOrgStore } from "@/stores/orgStore"
import { useAuthStore } from "@/stores/authStore"
import { RankLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

// 직급 레벨 한글명
const rankLabels: Record<RankLevel, string> = {
  executive: "임원",
  head: "본부장",
  manager: "팀장",
  senior: "선임",
  staff: "사원",
}

export function NodeViewModal() {
  const { viewingNodeId, closeNodeView } = useUIStore()
  const { nodes } = useOrgStore()
  const { isEditor } = useAuthStore()

  const node = nodes.find((n) => n.id === viewingNodeId)

  // 편집자면 이 모달 대신 NodeDetailSheet 사용
  if (!node || isEditor) return null

  // tasks 배열 또는 scope에서 업무 목록 가져오기
  const taskList =
    node.tasks && node.tasks.length > 0
      ? [...node.tasks].sort((a, b) => a.order - b.order).map((t) => t.content)
      : node.scope
        ? node.scope.split("\n").filter((line) => line.trim())
        : []

  const isCompany = node.org === "company"

  return (
    <Dialog open={!!viewingNodeId} onOpenChange={(open) => !open && closeNodeView()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">{node.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 직책 */}
          {node.title && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">직책</p>
              <p
                className={cn(
                  "text-sm font-medium px-2 py-1 rounded inline-block",
                  isCompany
                    ? "bg-slate-100 text-slate-700"
                    : "bg-emerald-100 text-emerald-700"
                )}
              >
                {node.title}
              </p>
            </div>
          )}

          {/* 소속 부서 */}
          {node.department && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">소속 부서</p>
              <p className="text-sm">{node.department}</p>
            </div>
          )}

          {/* 직급 */}
          {node.rank && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">직급</p>
              <p className="text-sm">{rankLabels[node.rank]}</p>
            </div>
          )}

          {/* 업무 범위 */}
          {taskList.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">업무 범위</p>
              <ul
                className={cn(
                  "text-sm space-y-1.5 border-l-2 pl-3",
                  isCompany ? "border-slate-300" : "border-emerald-300"
                )}
              >
                {taskList.map((task, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    • {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 비고 */}
          {node.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">비고</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {node.notes}
              </p>
            </div>
          )}

          {/* 정보 없음 표시 */}
          {!node.title &&
            !node.department &&
            !node.rank &&
            taskList.length === 0 &&
            !node.notes && (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 상세 정보가 없습니다.
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
