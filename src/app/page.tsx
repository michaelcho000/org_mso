"use client"

import { MiniHeader } from "@/components/layout/MiniHeader"
import { OrgTreeView } from "@/components/tree/OrgTreeView"
import { BridgePanel } from "@/components/bridge/BridgePanel"
import { BridgeOverlay } from "@/components/bridge/BridgeOverlay"
import { EditKeyDialog } from "@/components/dialogs/EditKeyDialog"
import { NodeDetailSheet } from "@/components/dialogs/NodeDetailSheet"
import { NodeViewModal } from "@/components/dialogs/NodeViewModal"
import { BridgeFormDialog } from "@/components/dialogs/BridgeFormDialog"
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog"
import { ToastContainer } from "@/components/ui/toast"
import { useUIStore } from "@/stores/uiStore"

export default function Home() {
  const { expandedPanel } = useUIStore()

  return (
    <main className="h-screen flex flex-col">
      <MiniHeader />
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Company Zone (좌측) - Client 확장 시 숨김 */}
        {expandedPanel !== "client" && (
          <div className="flex-1 min-w-0 overflow-hidden border-r border-border bg-slate-50/50">
            <OrgTreeView org="company" />
          </div>
        )}

        {/* Bridge Zone (중앙) - 확장 모드 시 숨김 */}
        {expandedPanel === null && (
          <div className="w-64 flex-shrink-0 border-r border-border bg-muted/30">
            <BridgePanel />
          </div>
        )}

        {/* Client Zone (우측) - Company 확장 시 숨김 */}
        {expandedPanel !== "company" && (
          <div className="flex-1 min-w-0 overflow-hidden bg-white">
            <OrgTreeView org="hospital" />
          </div>
        )}
      </div>

      {/* 가교 연결선 오버레이 */}
      <BridgeOverlay />

      {/* 다이얼로그들 */}
      <EditKeyDialog />
      <NodeDetailSheet />
      <NodeViewModal />
      <BridgeFormDialog />
      <DeleteConfirmDialog />
      <ToastContainer />
    </main>
  )
}
