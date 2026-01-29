export type OrgType = "company" | "hospital"

// 직급 레벨
export type RankLevel =
  | "executive"   // 대표, 원장
  | "head"        // 본부장, 부장
  | "manager"     // 팀장, 과장
  | "senior"      // 대리, 주임
  | "staff"       // 사원, 담당

// 연결선 스타일
export type EdgeLineStyle = "solid" | "dashed"

// 가교 역할
export type BridgeRole = "primary" | "creative" | "executive"

export interface OrgNode {
  id: string
  org: OrgType
  name: string
  title?: string
  scope?: string
  notes?: string
  parentId: string | null
  siblingGroupId?: string | null
  positionX?: number  // deprecated: CSS 기반 레이아웃 사용
  positionY?: number  // deprecated: CSS 기반 레이아웃 사용
  createdAt: string
  updatedAt: string
  // 확장 필드
  department?: string      // 소속 부서
  rank?: RankLevel         // 직급 레벨
}

export interface OrgEdge {
  id: string
  org: OrgType
  sourceId: string
  targetId: string
  type: "vertical" | "horizontal"
  // 확장 필드
  lineStyle?: EdgeLineStyle  // 실선/점선
}

export interface Bridge {
  id: string
  name: string
  title?: string
  scope?: string
  notes?: string
  companyTargetId: string
  hospitalTargetId: string
  createdAt: string
  updatedAt: string
  // 확장 필드
  role?: BridgeRole  // 가교 역할 타입
}

export interface AppSettings {
  id: string
  title: string
  companyLayoutMode: "auto" | "manual"
  companyLayoutLocked: boolean
  hospitalLayoutMode: "auto" | "manual"
  hospitalLayoutLocked: boolean
  updatedAt: string
}

export interface AppState {
  nodes: OrgNode[]
  edges: OrgEdge[]
  bridges: Bridge[]
  settings: AppSettings
}

// React Flow 변환용 타입
export interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: OrgNode
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  type: string
  data?: OrgEdge
}
