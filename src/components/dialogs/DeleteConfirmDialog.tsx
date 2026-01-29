"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/stores/uiStore"
import { useOrgStore } from "@/stores/orgStore"
import { AlertTriangle } from "lucide-react"

export function DeleteConfirmDialog() {
  const {
    isDeleteDialogOpen,
    deleteTargetId,
    deleteTargetType,
    closeDeleteDialog,
  } = useUIStore()
  const { nodes, bridges, deleteNode, deleteBridge, getChildNodes } = useOrgStore()

  const target =
    deleteTargetType === "node"
      ? nodes.find((n) => n.id === deleteTargetId)
      : bridges.find((b) => b.id === deleteTargetId)

  const childCount =
    deleteTargetType === "node" && deleteTargetId
      ? getChildNodes(deleteTargetId).length
      : 0

  const handleDelete = async () => {
    if (!deleteTargetId || !deleteTargetType) return

    if (deleteTargetType === "node") {
      await deleteNode(deleteTargetId)
    } else {
      await deleteBridge(deleteTargetId)
    }

    closeDeleteDialog()
  }

  const targetName = target
    ? "name" in target
      ? target.name
      : ""
    : ""

  return (
    <Dialog
      open={isDeleteDialogOpen}
      onOpenChange={(open) => !open && closeDeleteDialog()}
    >
      <DialogContent onClose={closeDeleteDialog}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            삭제 확인
          </DialogTitle>
          <DialogDescription>
            {deleteTargetType === "node" ? (
              <>
                <span className="font-medium">{targetName}</span>을(를)
                삭제하시겠습니까?
                {childCount > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    하위 조직원 {childCount}명도 모두 삭제됩니다.
                  </span>
                )}
              </>
            ) : (
              <>
                가교 <span className="font-medium">{targetName}</span>을(를)
                삭제하시겠습니까?
                <span className="block mt-2">
                  양쪽 조직의 연결 표시도 함께 제거됩니다.
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={closeDeleteDialog}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
