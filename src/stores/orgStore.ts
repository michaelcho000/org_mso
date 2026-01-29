import { create } from "zustand"
import { OrgNode, OrgEdge, Bridge, AppSettings, OrgType } from "@/lib/types"
import { generateId, formatDate } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { generateAllSeedData } from "@/lib/seedData"
import { useToastStore } from "./toastStore"

interface OrgState {
  // 데이터
  nodes: OrgNode[]
  edges: OrgEdge[]
  bridges: Bridge[]
  settings: AppSettings

  // 로딩 상태
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // 초기화
  initialize: () => Promise<void>

  // Node CRUD
  addNode: (org: OrgType, name: string, parentId?: string | null) => Promise<OrgNode>
  updateNode: (id: string, updates: Partial<OrgNode>) => Promise<void>
  deleteNode: (id: string) => Promise<void>

  // Edge CRUD
  addEdge: (org: OrgType, sourceId: string, targetId: string, type?: "vertical" | "horizontal") => Promise<OrgEdge>
  deleteEdge: (id: string) => Promise<void>

  // Bridge CRUD
  addBridge: (name: string, companyTargetId: string, hospitalTargetId: string) => Promise<Bridge>
  updateBridge: (id: string, updates: Partial<Bridge>) => Promise<void>
  deleteBridge: (id: string) => Promise<void>

  // 위치 업데이트
  updateNodePosition: (id: string, x: number, y: number) => Promise<void>

  // 재배치 (드래그 앤 드롭)
  reparentNode: (nodeId: string, newParentId: string | null) => Promise<void>

  // 헬퍼
  getNodesByOrg: (org: OrgType) => OrgNode[]
  getEdgesByOrg: (org: OrgType) => OrgEdge[]
  getChildNodes: (parentId: string) => OrgNode[]
}

const defaultSettings: AppSettings = {
  id: "main",
  title: "조직도 관리",
  companyLayoutMode: "auto",
  companyLayoutLocked: false,
  hospitalLayoutMode: "auto",
  hospitalLayoutLocked: false,
  updatedAt: new Date().toISOString(),
}

export const useOrgStore = create<OrgState>((set, get) => ({
  nodes: [],
  edges: [],
  bridges: [],
  settings: defaultSettings,
  isLoading: true,
  isSaving: false,
  error: null,

  initialize: async () => {
    console.log("[OrgStore] Initializing...")

    if (!isSupabaseConfigured()) {
      console.warn("[OrgStore] Supabase not configured, using seed data for local mode")
      const seedData = generateAllSeedData()
      set({
        nodes: seedData.nodes,
        edges: seedData.edges,
        bridges: seedData.bridges || [],
        isLoading: false
      })
      return
    }

    try {
      set({ isLoading: true, error: null })
      console.log("[OrgStore] Fetching data from Supabase...")

      const [nodesRes, edgesRes, bridgesRes, settingsRes] = await Promise.all([
        supabase.from("nodes").select("*"),
        supabase.from("edges").select("*"),
        supabase.from("bridges").select("*"),
        supabase.from("app_settings").select("*").eq("id", "main").single(),
      ])

      console.log("[OrgStore] Nodes response:", nodesRes)
      console.log("[OrgStore] Edges response:", edgesRes)
      console.log("[OrgStore] Bridges response:", bridgesRes)
      console.log("[OrgStore] Settings response:", settingsRes)

      // snake_case를 camelCase로 변환
      const nodes: OrgNode[] = (nodesRes.data || []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        org: n.org as OrgType,
        name: n.name as string,
        title: n.title as string | undefined,
        scope: n.scope as string | undefined,
        notes: n.notes as string | undefined,
        parentId: n.parent_id as string | null,
        siblingGroupId: n.sibling_group_id as string | undefined,
        positionX: n.position_x as number,
        positionY: n.position_y as number,
        createdAt: n.created_at as string,
        updatedAt: n.updated_at as string,
        // 확장 필드
        department: n.department as string | undefined,
        rank: n.rank as OrgNode["rank"],
      }))

      const edges: OrgEdge[] = (edgesRes.data || []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        org: e.org as OrgType,
        sourceId: e.source_id as string,
        targetId: e.target_id as string,
        type: e.type as "vertical" | "horizontal",
        // 확장 필드
        lineStyle: (e.line_style as OrgEdge["lineStyle"]) || "solid",
      }))

      const bridges: Bridge[] = (bridgesRes.data || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        name: b.name as string,
        title: b.title as string | undefined,
        scope: b.scope as string | undefined,
        notes: b.notes as string | undefined,
        companyTargetId: b.company_target_id as string,
        hospitalTargetId: b.hospital_target_id as string,
        createdAt: b.created_at as string,
        updatedAt: b.updated_at as string,
        // 확장 필드
        role: (b.role as Bridge["role"]) || "primary",
      }))

      const settings: AppSettings = settingsRes.data
        ? {
            id: settingsRes.data.id,
            title: settingsRes.data.title,
            companyLayoutMode: settingsRes.data.company_layout_mode,
            companyLayoutLocked: settingsRes.data.company_layout_locked,
            hospitalLayoutMode: settingsRes.data.hospital_layout_mode,
            hospitalLayoutLocked: settingsRes.data.hospital_layout_locked,
            updatedAt: settingsRes.data.updated_at,
          }
        : defaultSettings

      // 노드가 없으면 시드 데이터 생성
      if (nodes.length === 0) {
        console.log("[OrgStore] No nodes found, generating seed data...")
        const seedData = generateAllSeedData()

        // Supabase에 시드 데이터 저장
        if (isSupabaseConfigured()) {
          try {
            // 노드 저장 (확장 필드 포함)
            const nodeInserts = seedData.nodes.map((n) => ({
              id: n.id,
              org: n.org,
              name: n.name,
              title: n.title,
              scope: n.scope,
              notes: n.notes,
              parent_id: n.parentId,
              position_x: n.positionX,
              position_y: n.positionY,
              created_at: n.createdAt,
              updated_at: n.updatedAt,
              department: n.department,
              rank: n.rank,
            }))
            await supabase.from("nodes").insert(nodeInserts)

            // 엣지 저장 (확장 필드 포함)
            const edgeInserts = seedData.edges.map((e) => ({
              id: e.id,
              org: e.org,
              source_id: e.sourceId,
              target_id: e.targetId,
              type: e.type,
              line_style: e.lineStyle || "solid",
            }))
            await supabase.from("edges").insert(edgeInserts)

            // 가교 저장 (확장 필드 포함)
            if (seedData.bridges && seedData.bridges.length > 0) {
              const bridgeInserts = seedData.bridges.map((b) => ({
                id: b.id,
                name: b.name,
                title: b.title,
                scope: b.scope,
                notes: b.notes,
                company_target_id: b.companyTargetId,
                hospital_target_id: b.hospitalTargetId,
                created_at: b.createdAt,
                updated_at: b.updatedAt,
                role: b.role || "primary",
              }))
              await supabase.from("bridges").insert(bridgeInserts)
            }

            console.log("[OrgStore] Seed data saved to Supabase")
          } catch (error) {
            console.error("[OrgStore] Failed to save seed data:", error)
          }
        }

        set({
          nodes: seedData.nodes,
          edges: seedData.edges,
          bridges: seedData.bridges || [],
          settings,
          isLoading: false
        })
        return
      }

      set({ nodes, edges, bridges, settings, isLoading: false })
    } catch (error) {
      console.error("Failed to initialize:", error)
      set({ error: "데이터 로드 실패", isLoading: false })
    }
  },

  addNode: async (org, name, parentId = null) => {
    console.log("[OrgStore] Adding node:", { org, name, parentId })

    const now = formatDate(new Date())
    const newNode: OrgNode = {
      id: generateId(),
      org,
      name,
      parentId,
      positionX: 0,
      positionY: 0,
      createdAt: now,
      updatedAt: now,
    }

    console.log("[OrgStore] New node created:", newNode)

    // 낙관적 업데이트
    set((state) => ({ nodes: [...state.nodes, newNode] }))
    console.log("[OrgStore] State updated with new node")

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        console.log("[OrgStore] Saving to Supabase...")
        const result = await supabase.from("nodes").insert({
          id: newNode.id,
          org: newNode.org,
          name: newNode.name,
          parent_id: newNode.parentId,
          position_x: newNode.positionX,
          position_y: newNode.positionY,
          department: newNode.department,
          rank: newNode.rank,
          created_at: newNode.createdAt,
          updated_at: newNode.updatedAt,
        })
        console.log("[OrgStore] Supabase insert result:", result)
        if (result.error) {
          throw result.error
        }
        useToastStore.getState().addToast("노드가 추가되었습니다", "success")
      } catch (error) {
        console.error("[OrgStore] Failed to add node:", error)
        // 롤백
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== newNode.id),
          error: "노드 추가 실패",
        }))
        useToastStore.getState().addToast("노드 추가 실패", "error")
      } finally {
        set({ isSaving: false })
      }
    }

    return newNode
  },

  updateNode: async (id, updates) => {
    const now = formatDate(new Date())

    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: now } : n
      ),
    }))

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        const dbUpdates: Record<string, unknown> = { updated_at: now }
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.scope !== undefined) dbUpdates.scope = updates.scope
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes
        if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId
        if (updates.positionX !== undefined) dbUpdates.position_x = updates.positionX
        if (updates.positionY !== undefined) dbUpdates.position_y = updates.positionY
        if (updates.department !== undefined) dbUpdates.department = updates.department
        if (updates.rank !== undefined) dbUpdates.rank = updates.rank

        await supabase.from("nodes").update(dbUpdates).eq("id", id)
        useToastStore.getState().addToast("저장되었습니다", "success")
      } catch (error) {
        console.error("Failed to update node:", error)
        set({ error: "노드 수정 실패" })
        useToastStore.getState().addToast("수정 실패", "error")
      } finally {
        set({ isSaving: false })
      }
    }
  },

  deleteNode: async (id) => {
    const state = get()
    const nodeToDelete = state.nodes.find((n) => n.id === id)
    if (!nodeToDelete) return

    // 하위 노드들도 찾기
    const getAllDescendants = (parentId: string): string[] => {
      const children = state.nodes.filter((n) => n.parentId === parentId)
      return children.flatMap((child) => [child.id, ...getAllDescendants(child.id)])
    }
    const descendantIds = getAllDescendants(id)
    const allIdsToDelete = [id, ...descendantIds]

    // 낙관적 업데이트
    set((state) => ({
      nodes: state.nodes.filter((n) => !allIdsToDelete.includes(n.id)),
      edges: state.edges.filter(
        (e) => !allIdsToDelete.includes(e.sourceId) && !allIdsToDelete.includes(e.targetId)
      ),
      bridges: state.bridges.filter(
        (b) =>
          !allIdsToDelete.includes(b.companyTargetId) &&
          !allIdsToDelete.includes(b.hospitalTargetId)
      ),
    }))

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        // CASCADE 삭제가 설정되어 있으므로 부모만 삭제하면 됨
        await supabase.from("nodes").delete().eq("id", id)
        useToastStore.getState().addToast("삭제되었습니다", "success")
      } catch (error) {
        console.error("Failed to delete node:", error)
        set({ error: "노드 삭제 실패" })
        useToastStore.getState().addToast("삭제 실패", "error")
      } finally {
        set({ isSaving: false })
      }
    }
  },

  addEdge: async (org, sourceId, targetId, type = "vertical") => {
    const newEdge: OrgEdge = {
      id: generateId(),
      org,
      sourceId,
      targetId,
      type,
    }

    set((state) => ({ edges: [...state.edges, newEdge] }))

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        await supabase.from("edges").insert({
          id: newEdge.id,
          org: newEdge.org,
          source_id: newEdge.sourceId,
          target_id: newEdge.targetId,
          type: newEdge.type,
        })
      } catch (error) {
        console.error("Failed to add edge:", error)
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== newEdge.id),
          error: "연결선 추가 실패",
        }))
      } finally {
        set({ isSaving: false })
      }
    }

    return newEdge
  },

  deleteEdge: async (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }))

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        await supabase.from("edges").delete().eq("id", id)
      } catch (error) {
        console.error("Failed to delete edge:", error)
        set({ error: "연결선 삭제 실패" })
      } finally {
        set({ isSaving: false })
      }
    }
  },

  addBridge: async (name, companyTargetId, hospitalTargetId) => {
    const now = formatDate(new Date())
    const newBridge: Bridge = {
      id: generateId(),
      name,
      companyTargetId,
      hospitalTargetId,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ bridges: [...state.bridges, newBridge] }))

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        await supabase.from("bridges").insert({
          id: newBridge.id,
          name: newBridge.name,
          company_target_id: newBridge.companyTargetId,
          hospital_target_id: newBridge.hospitalTargetId,
          created_at: newBridge.createdAt,
          updated_at: newBridge.updatedAt,
        })
      } catch (error) {
        console.error("Failed to add bridge:", error)
        set((state) => ({
          bridges: state.bridges.filter((b) => b.id !== newBridge.id),
          error: "가교 추가 실패",
        }))
      } finally {
        set({ isSaving: false })
      }
    }

    return newBridge
  },

  updateBridge: async (id, updates) => {
    const now = formatDate(new Date())

    set((state) => ({
      bridges: state.bridges.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: now } : b
      ),
    }))

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        const dbUpdates: Record<string, unknown> = { updated_at: now }
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.title !== undefined) dbUpdates.title = updates.title
        if (updates.scope !== undefined) dbUpdates.scope = updates.scope
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes
        if (updates.companyTargetId !== undefined) dbUpdates.company_target_id = updates.companyTargetId
        if (updates.hospitalTargetId !== undefined) dbUpdates.hospital_target_id = updates.hospitalTargetId

        await supabase.from("bridges").update(dbUpdates).eq("id", id)
      } catch (error) {
        console.error("Failed to update bridge:", error)
        set({ error: "가교 수정 실패" })
      } finally {
        set({ isSaving: false })
      }
    }
  },

  deleteBridge: async (id) => {
    set((state) => ({
      bridges: state.bridges.filter((b) => b.id !== id),
    }))

    if (isSupabaseConfigured()) {
      try {
        set({ isSaving: true })
        await supabase.from("bridges").delete().eq("id", id)
      } catch (error) {
        console.error("Failed to delete bridge:", error)
        set({ error: "가교 삭제 실패" })
      } finally {
        set({ isSaving: false })
      }
    }
  },

  updateNodePosition: async (id, x, y) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, positionX: x, positionY: y } : n
      ),
    }))

    // 위치 업데이트는 디바운스 처리 필요 (나중에 useAutoSave 훅에서 처리)
  },

  reparentNode: async (nodeId, newParentId) => {
    const state = get()
    const node = state.nodes.find((n) => n.id === nodeId)
    if (!node) return

    const oldParentId = node.parentId

    // 자기 자신을 부모로 설정하려는 경우 무시
    if (newParentId === nodeId) return

    // 순환 참조 방지: 새 부모가 현재 노드의 자손인지 확인
    const isDescendant = (parentId: string, targetId: string): boolean => {
      const children = state.nodes.filter((n) => n.parentId === parentId)
      for (const child of children) {
        if (child.id === targetId) return true
        if (isDescendant(child.id, targetId)) return true
      }
      return false
    }

    if (newParentId && isDescendant(nodeId, newParentId)) {
      console.warn("[OrgStore] Cannot reparent to a descendant node")
      return
    }

    console.log(`[OrgStore] Reparenting node ${nodeId} from ${oldParentId} to ${newParentId}`)

    // 노드의 parentId 업데이트
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, parentId: newParentId } : n
      ),
    }))

    // 기존 엣지 삭제
    if (oldParentId) {
      const oldEdge = state.edges.find(
        (e) => e.sourceId === oldParentId && e.targetId === nodeId
      )
      if (oldEdge) {
        await get().deleteEdge(oldEdge.id)
      }
    }

    // 새 엣지 생성
    if (newParentId) {
      await get().addEdge(node.org, newParentId, nodeId, "vertical")
    }

    // Supabase에 parentId 업데이트
    if (isSupabaseConfigured()) {
      try {
        const now = formatDate(new Date())
        await supabase.from("nodes").update({
          parent_id: newParentId,
          updated_at: now
        }).eq("id", nodeId)
        useToastStore.getState().addToast("조직 구조가 변경되었습니다", "success")
      } catch (error) {
        console.error("[OrgStore] Failed to reparent node:", error)
        useToastStore.getState().addToast("조직 구조 변경 실패", "error")
      }
    }
  },

  getNodesByOrg: (org) => {
    return get().nodes.filter((n) => n.org === org)
  },

  getEdgesByOrg: (org) => {
    return get().edges.filter((e) => e.org === org)
  },

  getChildNodes: (parentId) => {
    return get().nodes.filter((n) => n.parentId === parentId)
  },
}))
