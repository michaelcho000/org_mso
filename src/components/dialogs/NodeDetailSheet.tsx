"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useUIStore } from "@/stores/uiStore"
import { useOrgStore } from "@/stores/orgStore"
import { RankLevel } from "@/lib/types"

// 직급 레벨 옵션
const rankOptions: { value: RankLevel | ""; label: string }[] = [
  { value: "", label: "선택 안 함" },
  { value: "executive", label: "임원 (대표, 원장)" },
  { value: "head", label: "본부장 (부장)" },
  { value: "manager", label: "팀장 (과장)" },
  { value: "senior", label: "선임 (대리, 주임)" },
  { value: "staff", label: "사원 (담당)" },
]

export function NodeDetailSheet() {
  const { isNodeDetailOpen, editingNodeId, closeNodeDetail } = useUIStore()
  const { nodes, updateNode } = useOrgStore()

  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [rank, setRank] = useState<RankLevel | "">("")
  const [scope, setScope] = useState("")
  const [notes, setNotes] = useState("")

  const node = nodes.find((n) => n.id === editingNodeId)

  useEffect(() => {
    if (node) {
      setName(node.name)
      setTitle(node.title || "")
      setDepartment(node.department || "")
      setRank(node.rank || "")
      setScope(node.scope || "")
      setNotes(node.notes || "")
    }
  }, [node])

  const handleSave = async () => {
    if (!editingNodeId || !name.trim()) return

    await updateNode(editingNodeId, {
      name: name.trim(),
      title: title.trim() || undefined,
      department: department.trim() || undefined,
      rank: rank || undefined,
      scope: scope.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    closeNodeDetail()
  }

  const handleClose = () => {
    closeNodeDetail()
  }

  return (
    <Dialog open={isNodeDetailOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>노드 편집</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">직책</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="직책을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">소속 부서</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="소속 부서를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rank">직급 레벨</Label>
            <select
              id="rank"
              value={rank}
              onChange={(e) => setRank(e.target.value as RankLevel | "")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rankOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">업무 범위</Label>
            <Textarea
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="업무 범위를 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="비고를 입력하세요"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
