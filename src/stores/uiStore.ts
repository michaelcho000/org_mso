import { create } from "zustand"

interface UIState {
  // 패널 확장 상태
  expandedPanel: "company" | "client" | null
  setExpandedPanel: (panel: "company" | "client" | null) => void

  // 편집 모드
  isEditMode: boolean
  setEditMode: (value: boolean) => void

  // 선택된 노드
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void

  // 편집 키 다이얼로그
  isEditKeyDialogOpen: boolean
  setEditKeyDialogOpen: (value: boolean) => void

  // 노드 상세 시트
  isNodeDetailOpen: boolean
  editingNodeId: string | null
  openNodeDetail: (nodeId: string) => void
  closeNodeDetail: () => void

  // Bridge 다이얼로그
  isBridgeDialogOpen: boolean
  editingBridgeId: string | null
  openBridgeDialog: (bridgeId?: string) => void
  closeBridgeDialog: () => void

  // 삭제 확인 다이얼로그
  isDeleteDialogOpen: boolean
  deleteTargetId: string | null
  deleteTargetType: "node" | "bridge" | null
  openDeleteDialog: (id: string, type: "node" | "bridge") => void
  closeDeleteDialog: () => void
}

export const useUIStore = create<UIState>((set) => ({
  expandedPanel: null,
  setExpandedPanel: (panel) => set({ expandedPanel: panel }),

  isEditMode: false,
  setEditMode: (value) => set({ isEditMode: value }),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  isEditKeyDialogOpen: false,
  setEditKeyDialogOpen: (value) => set({ isEditKeyDialogOpen: value }),

  isNodeDetailOpen: false,
  editingNodeId: null,
  openNodeDetail: (nodeId) => set({ isNodeDetailOpen: true, editingNodeId: nodeId }),
  closeNodeDetail: () => set({ isNodeDetailOpen: false, editingNodeId: null }),

  isBridgeDialogOpen: false,
  editingBridgeId: null,
  openBridgeDialog: (bridgeId) =>
    set({ isBridgeDialogOpen: true, editingBridgeId: bridgeId || null }),
  closeBridgeDialog: () => set({ isBridgeDialogOpen: false, editingBridgeId: null }),

  isDeleteDialogOpen: false,
  deleteTargetId: null,
  deleteTargetType: null,
  openDeleteDialog: (id, type) =>
    set({ isDeleteDialogOpen: true, deleteTargetId: id, deleteTargetType: type }),
  closeDeleteDialog: () =>
    set({ isDeleteDialogOpen: false, deleteTargetId: null, deleteTargetType: null }),
}))
