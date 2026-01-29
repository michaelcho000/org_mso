"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUIStore } from "@/stores/uiStore"
import { useAuthStore } from "@/stores/authStore"

export function EditKeyDialog() {
  const { isEditKeyDialogOpen, setEditKeyDialogOpen } = useUIStore()
  const { checkEditToken } = useAuthStore()
  const [token, setToken] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token.trim()) {
      setError("편집 키를 입력하세요")
      return
    }

    const isValid = checkEditToken(token.trim())
    if (isValid) {
      setToken("")
      setEditKeyDialogOpen(false)
    } else {
      setError("편집 키가 올바르지 않습니다")
    }
  }

  const handleClose = () => {
    setToken("")
    setError("")
    setEditKeyDialogOpen(false)
  }

  return (
    <Dialog open={isEditKeyDialogOpen} onOpenChange={setEditKeyDialogOpen}>
      <DialogContent onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>편집 잠금 해제</DialogTitle>
          <DialogDescription>
            조직도를 편집하려면 편집 키를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editKey">편집 키</Label>
              <Input
                id="editKey"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="편집 키를 입력하세요"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit">확인</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
