"use client"

import { useAuthStore } from "@/stores/authStore"
import { useUIStore } from "@/stores/uiStore"
import { useOrgStore } from "@/stores/orgStore"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Loader2, RefreshCw, Check } from "lucide-react"

export function MiniHeader() {
  const { isEditor, logout } = useAuthStore()
  const { setEditKeyDialogOpen } = useUIStore()
  const { isSaving, initialize } = useOrgStore()

  const handleRefresh = async () => {
    await initialize()
  }

  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-background">
      <h1 className="text-lg font-medium">조직도 관리</h1>

      <div className="flex items-center gap-2">
        {isSaving ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>저장 중...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>저장됨</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isSaving}
          title="새로고침"
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        {isEditor ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Unlock className="h-4 w-4" />
              편집 모드
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              잠금
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditKeyDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <Lock className="h-4 w-4" />
            편집 잠금 해제
          </Button>
        )}
      </div>
    </header>
  )
}
