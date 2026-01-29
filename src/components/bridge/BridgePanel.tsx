"use client"

import { useOrgStore } from "@/stores/orgStore"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Link2 } from "lucide-react"
import { BridgeRole } from "@/lib/types"
import { cn } from "@/lib/utils"

// 가교 역할별 스타일
const bridgeRoleStyles: Record<BridgeRole, { bg: string; text: string; label: string }> = {
  primary: { bg: "bg-blue-100", text: "text-blue-700", label: "Primary" },
  creative: { bg: "bg-purple-100", text: "text-purple-700", label: "Creative" },
  executive: { bg: "bg-amber-100", text: "text-amber-700", label: "Executive" },
}

// 가교별 고유 색상 팔레트 (OrgNodeCard와 동일)
const bridgeColorPalette = [
  { border: "border-l-orange-400", dot: "bg-orange-400" },
  { border: "border-l-pink-400", dot: "bg-pink-400" },
  { border: "border-l-cyan-400", dot: "bg-cyan-400" },
  { border: "border-l-violet-400", dot: "bg-violet-400" },
  { border: "border-l-lime-400", dot: "bg-lime-500" },
  { border: "border-l-rose-400", dot: "bg-rose-400" },
  { border: "border-l-teal-400", dot: "bg-teal-400" },
  { border: "border-l-indigo-400", dot: "bg-indigo-400" },
]

export function BridgePanel() {
  const { bridges, nodes } = useOrgStore()
  const { openBridgeDialog, openDeleteDialog } = useUIStore()
  const { isEditor } = useAuthStore()

  const getNodeName = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    return node?.name || "알 수 없음"
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm">Bridge (가교)</h2>
          {isEditor && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openBridgeDialog()}
              className="h-7"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          양 조직을 연결하는 담당자
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {bridges.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>등록된 가교가 없습니다</p>
            {isEditor && (
              <p className="text-xs mt-1">
                위 추가 버튼을 눌러 가교를 등록하세요
              </p>
            )}
          </div>
        ) : (
          bridges.map((bridge) => {
            const role = bridge.role || "primary"
            const roleStyle = bridgeRoleStyles[role]
            // Company 노드 기준으로 색상 결정 (Company가 색상의 주체)
            const uniqueCompanyIds = Array.from(new Set(bridges.map(b => b.companyTargetId))).sort()
            const companyIndex = uniqueCompanyIds.indexOf(bridge.companyTargetId)
            const bridgeColor = bridgeColorPalette[companyIndex % bridgeColorPalette.length]

            return (
            <Card key={bridge.id} className={cn("overflow-hidden border-l-4", bridgeColor.border)}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", bridgeColor.dot)} />
                      <p className="font-medium text-sm truncate">{bridge.name}</p>
                    </div>
                    {bridge.title && (
                      <p className="text-xs text-muted-foreground truncate">
                        {bridge.title}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                    roleStyle.bg,
                    roleStyle.text
                  )}>
                    {roleStyle.label}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t space-y-1">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-blue-600 font-medium">C:</span>
                    <span className="truncate">
                      {getNodeName(bridge.companyTargetId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-green-600 font-medium">Cli:</span>
                    <span className="truncate">
                      {getNodeName(bridge.hospitalTargetId)}
                    </span>
                  </div>
                </div>

                {bridge.scope && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      <span className="font-medium text-foreground">업무:</span>{" "}
                      {bridge.scope}
                    </p>
                  </div>
                )}

                {isEditor && (
                  <div className="flex gap-1 mt-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openBridgeDialog(bridge.id)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(bridge.id, "bridge")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}))
        }
      </div>
    </div>
  )
}
