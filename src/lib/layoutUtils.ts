import { OrgNode } from "./types"

// 레이아웃 설정 상수
export const LAYOUT_CONFIG = {
  NODE_WIDTH: 200,          // 노드 너비
  NODE_HEIGHT: 100,         // 노드 높이
  HORIZONTAL_GAP: 40,       // 형제 노드 간 수평 간격
  VERTICAL_GAP: 80,         // 부모-자식 간 수직 간격
  PADDING: 50,              // 캔버스 여백
}

interface NodePosition {
  id: string
  x: number
  y: number
}

interface SubtreeInfo {
  width: number
  children: string[]
}

/**
 * 노드의 자식들을 찾습니다.
 */
function getChildren(nodeId: string, nodes: OrgNode[]): OrgNode[] {
  return nodes.filter((n) => n.parentId === nodeId)
}

/**
 * 루트 노드들을 찾습니다 (parentId가 null인 노드).
 */
function getRootNodes(nodes: OrgNode[]): OrgNode[] {
  return nodes.filter((n) => !n.parentId)
}

/**
 * 서브트리의 너비를 재귀적으로 계산합니다.
 * 리프 노드: NODE_WIDTH
 * 내부 노드: 모든 자식 서브트리 너비 합 + (자식수-1) * HORIZONTAL_GAP
 */
function calculateSubtreeWidth(
  nodeId: string,
  nodes: OrgNode[],
  widthCache: Map<string, number>
): number {
  // 캐시에 있으면 반환
  if (widthCache.has(nodeId)) {
    return widthCache.get(nodeId)!
  }

  const children = getChildren(nodeId, nodes)

  // 리프 노드인 경우
  if (children.length === 0) {
    widthCache.set(nodeId, LAYOUT_CONFIG.NODE_WIDTH)
    return LAYOUT_CONFIG.NODE_WIDTH
  }

  // 자식들의 서브트리 너비 합산
  let totalWidth = 0
  children.forEach((child, index) => {
    totalWidth += calculateSubtreeWidth(child.id, nodes, widthCache)
    if (index < children.length - 1) {
      totalWidth += LAYOUT_CONFIG.HORIZONTAL_GAP
    }
  })

  // 최소 너비는 노드 자체 너비
  const width = Math.max(totalWidth, LAYOUT_CONFIG.NODE_WIDTH)
  widthCache.set(nodeId, width)
  return width
}

/**
 * 노드의 깊이(레벨)를 계산합니다.
 */
function getNodeDepth(nodeId: string, nodes: OrgNode[]): number {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node || !node.parentId) return 0
  return 1 + getNodeDepth(node.parentId, nodes)
}

/**
 * 트리 레이아웃을 계산합니다.
 * Reingold-Tilford 알고리즘의 간단한 변형입니다.
 */
export function calculateTreeLayout(nodes: OrgNode[]): NodePosition[] {
  if (nodes.length === 0) return []

  const positions: NodePosition[] = []
  const widthCache = new Map<string, number>()

  // 모든 노드의 서브트리 너비 사전 계산
  nodes.forEach((node) => {
    calculateSubtreeWidth(node.id, nodes, widthCache)
  })

  // 루트 노드 찾기
  const roots = getRootNodes(nodes)

  // 여러 루트가 있을 경우 전체 너비 계산
  let totalRootsWidth = 0
  roots.forEach((root, index) => {
    totalRootsWidth += widthCache.get(root.id) || LAYOUT_CONFIG.NODE_WIDTH
    if (index < roots.length - 1) {
      totalRootsWidth += LAYOUT_CONFIG.HORIZONTAL_GAP
    }
  })

  // 루트들의 시작 X 위치 계산 (중앙 정렬)
  let currentX = LAYOUT_CONFIG.PADDING

  // 각 루트부터 재귀적으로 위치 계산
  roots.forEach((root) => {
    const rootSubtreeWidth = widthCache.get(root.id) || LAYOUT_CONFIG.NODE_WIDTH

    // 루트 노드 위치 (서브트리의 중앙)
    const rootX = currentX + rootSubtreeWidth / 2 - LAYOUT_CONFIG.NODE_WIDTH / 2
    const rootY = LAYOUT_CONFIG.PADDING

    positions.push({
      id: root.id,
      x: rootX,
      y: rootY,
    })

    // 자식 노드들 위치 계산
    calculateChildrenPositions(
      root.id,
      rootX + LAYOUT_CONFIG.NODE_WIDTH / 2, // 부모 노드의 중심 X
      rootY,
      nodes,
      widthCache,
      positions
    )

    currentX += rootSubtreeWidth + LAYOUT_CONFIG.HORIZONTAL_GAP
  })

  return positions
}

/**
 * 자식 노드들의 위치를 재귀적으로 계산합니다.
 */
function calculateChildrenPositions(
  parentId: string,
  parentCenterX: number,
  parentY: number,
  nodes: OrgNode[],
  widthCache: Map<string, number>,
  positions: NodePosition[]
): void {
  const children = getChildren(parentId, nodes)
  if (children.length === 0) return

  // 자식들의 전체 너비 계산
  let totalChildrenWidth = 0
  children.forEach((child, index) => {
    totalChildrenWidth += widthCache.get(child.id) || LAYOUT_CONFIG.NODE_WIDTH
    if (index < children.length - 1) {
      totalChildrenWidth += LAYOUT_CONFIG.HORIZONTAL_GAP
    }
  })

  // 첫 번째 자식의 시작 X 위치
  let childStartX = parentCenterX - totalChildrenWidth / 2
  const childY = parentY + LAYOUT_CONFIG.NODE_HEIGHT + LAYOUT_CONFIG.VERTICAL_GAP

  children.forEach((child) => {
    const childSubtreeWidth = widthCache.get(child.id) || LAYOUT_CONFIG.NODE_WIDTH

    // 자식 노드 위치 (자신의 서브트리 중앙)
    const childX = childStartX + childSubtreeWidth / 2 - LAYOUT_CONFIG.NODE_WIDTH / 2

    positions.push({
      id: child.id,
      x: childX,
      y: childY,
    })

    // 손자 노드들 위치 계산
    calculateChildrenPositions(
      child.id,
      childX + LAYOUT_CONFIG.NODE_WIDTH / 2, // 자식 노드의 중심 X
      childY,
      nodes,
      widthCache,
      positions
    )

    childStartX += childSubtreeWidth + LAYOUT_CONFIG.HORIZONTAL_GAP
  })
}

/**
 * 노드의 구조적 시그니처를 생성합니다.
 * parentId 관계만 추적하여 구조 변경 감지에 사용합니다.
 */
export function getStructureSignature(nodes: OrgNode[]): string {
  return nodes
    .map((n) => `${n.id}:${n.parentId || "root"}`)
    .sort()
    .join("|")
}
