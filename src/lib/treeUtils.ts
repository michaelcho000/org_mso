import { OrgNode, OrgType } from "./types"

// 트리 노드 타입 (자식 포함)
export interface TreeNode extends OrgNode {
  children: TreeNode[]
}

/**
 * 플랫 노드 배열을 계층적 트리 구조로 변환합니다.
 * @param nodes 플랫 노드 배열
 * @param orgType 필터링할 조직 타입
 * @returns 트리 구조의 루트 노드 배열
 */
export function buildTree(nodes: OrgNode[], orgType: OrgType): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()

  // 1. 모든 노드를 children 배열과 함께 맵에 추가
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] })
  })

  const roots: TreeNode[] = []

  // 2. 부모-자식 관계 구축
  nodes.forEach((node) => {
    // 해당 조직 타입만 처리
    if (node.org !== orgType) return

    const treeNode = nodeMap.get(node.id)
    if (!treeNode) return

    if (node.parentId === null) {
      // 루트 노드
      roots.push(treeNode)
    } else {
      // 부모 노드 찾기
      const parent = nodeMap.get(node.parentId)
      if (parent) {
        parent.children.push(treeNode)
      } else {
        // 부모가 없거나 다른 조직에 있으면 루트로 처리
        roots.push(treeNode)
      }
    }
  })

  return roots
}

/**
 * 특정 노드가 다른 노드의 자손인지 확인합니다.
 * 순환 참조 방지를 위해 사용됩니다.
 * @param nodes 모든 노드 배열
 * @param potentialParentId 잠재적 부모 노드 ID
 * @param potentialChildId 잠재적 자식 노드 ID
 * @returns 순환 참조가 발생하면 true
 */
export function isDescendant(
  nodes: OrgNode[],
  potentialParentId: string,
  potentialChildId: string
): boolean {
  // 같은 노드면 순환
  if (potentialParentId === potentialChildId) return true

  // 잠재적 부모의 부모 체인을 타고 올라가며 확인
  const parentNode = nodes.find((n) => n.id === potentialParentId)
  if (!parentNode || !parentNode.parentId) return false

  return isDescendant(nodes, parentNode.parentId, potentialChildId)
}

/**
 * 노드와 그 모든 자손의 ID를 수집합니다.
 * 삭제 시 cascading에 사용됩니다.
 * @param nodes 모든 노드 배열
 * @param nodeId 시작 노드 ID
 * @returns 삭제할 노드 ID Set
 */
export function collectDescendantIds(
  nodes: OrgNode[],
  nodeId: string
): Set<string> {
  const idsToDelete = new Set<string>()
  const stack = [nodeId]

  while (stack.length > 0) {
    const currentId = stack.pop()
    if (!currentId || idsToDelete.has(currentId)) continue

    idsToDelete.add(currentId)

    // 자식 노드들을 스택에 추가
    const children = nodes.filter((n) => n.parentId === currentId)
    children.forEach((child) => stack.push(child.id))
  }

  return idsToDelete
}

/**
 * 노드의 자식들을 가져옵니다.
 */
export function getChildren(nodes: OrgNode[], parentId: string): OrgNode[] {
  return nodes.filter((n) => n.parentId === parentId)
}

/**
 * 루트 노드들을 가져옵니다.
 */
export function getRootNodes(nodes: OrgNode[], orgType: OrgType): OrgNode[] {
  return nodes.filter((n) => n.org === orgType && !n.parentId)
}
