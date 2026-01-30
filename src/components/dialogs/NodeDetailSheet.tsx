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
import { RankLevel, TaskItem } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react"

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
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [notes, setNotes] = useState("")

  const node = nodes.find((n) => n.id === editingNodeId)

  useEffect(() => {
    if (node) {
      setName(node.name)
      setTitle(node.title || "")
      setDepartment(node.department || "")
      setRank(node.rank || "")
      // tasks가 있으면 사용, 없으면 scope에서 변환
      if (node.tasks && node.tasks.length > 0) {
        setTasks([...node.tasks].sort((a, b) => a.order - b.order))
      } else if (node.scope) {
        const lines = node.scope.split('\n').filter(line => line.trim())
        setTasks(lines.map((line, index) => ({
          id: generateId(),
          content: line.trim(),
          order: index
        })))
      } else {
        setTasks([])
      }
      setNotes(node.notes || "")
    }
  }, [node])

  // 업무 항목 추가
  const addTask = () => {
    const newTask: TaskItem = {
      id: generateId(),
      content: "",
      order: tasks.length
    }
    setTasks([...tasks, newTask])
  }

  // 업무 항목 수정
  const updateTask = (taskId: string, content: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, content } : t))
  }

  // 업무 항목 삭제
  const removeTask = (taskId: string) => {
    const filtered = tasks.filter(t => t.id !== taskId)
    // order 재정렬
    setTasks(filtered.map((t, index) => ({ ...t, order: index })))
  }

  // 업무 항목 위로 이동
  const moveTaskUp = (index: number) => {
    if (index === 0) return
    const newTasks = [...tasks]
    const temp = newTasks[index]
    newTasks[index] = newTasks[index - 1]
    newTasks[index - 1] = temp
    // order 재정렬
    setTasks(newTasks.map((t, i) => ({ ...t, order: i })))
  }

  // 업무 항목 아래로 이동
  const moveTaskDown = (index: number) => {
    if (index === tasks.length - 1) return
    const newTasks = [...tasks]
    const temp = newTasks[index]
    newTasks[index] = newTasks[index + 1]
    newTasks[index + 1] = temp
    // order 재정렬
    setTasks(newTasks.map((t, i) => ({ ...t, order: i })))
  }

  const handleSave = async () => {
    if (!editingNodeId || !name.trim()) return

    // 빈 업무 항목 필터링
    const validTasks = tasks.filter(t => t.content.trim())
    // scope는 하위 호환성을 위해 유지
    const scopeText = validTasks.map(t => t.content.trim()).join('\n')

    await updateNode(editingNodeId, {
      name: name.trim(),
      title: title.trim() || undefined,
      department: department.trim() || undefined,
      rank: rank || undefined,
      tasks: validTasks.length > 0 ? validTasks : undefined,
      scope: scopeText || undefined,
      notes: notes.trim() || undefined,
    })

    closeNodeDetail()
  }

  const handleClose = () => {
    closeNodeDetail()
  }

  return (
    <Dialog open={isNodeDetailOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-6" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>노드 편집</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
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
            <Label>업무 범위</Label>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-1">
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveTaskUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveTaskDown(index)}
                      disabled={index === tasks.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={task.content}
                    onChange={(e) => updateTask(task.id, e.target.value)}
                    placeholder="업무 내용을 입력하세요"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTask}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                업무 추가
              </Button>
            </div>
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
