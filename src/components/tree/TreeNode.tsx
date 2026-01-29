"use client"

import { TreeNode as TreeNodeType } from "@/lib/treeUtils"
import { OrgNodeCard } from "./OrgNodeCard"

interface TreeNodeProps {
  node: TreeNodeType
  onAddChild: (parentId: string) => void
  onMoveNode: (draggedId: string, targetId: string) => void
  hoveredBridgeNodeId: string | null
  activeBridgeTargetIds: string[]
  onBridgeHover: (nodeId: string | null) => void
  collapsedNodeIds?: Set<string>
  onToggleCollapse?: (nodeId: string) => void
}

export function TreeNode({
  node,
  onAddChild,
  onMoveNode,
  hoveredBridgeNodeId,
  activeBridgeTargetIds,
  onBridgeHover,
  collapsedNodeIds = new Set(),
  onToggleCollapse,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isHoveredBridge = hoveredBridgeNodeId === node.id
  const isBridgePartner = activeBridgeTargetIds.includes(node.id)
  const isCollapsed = collapsedNodeIds.has(node.id)

  return (
    <li>
      <div className="inline-block relative z-10">
        <OrgNodeCard
          node={node}
          onAddChild={onAddChild}
          onMoveNode={onMoveNode}
          isHoveredBridge={isHoveredBridge}
          isBridgePartner={isBridgePartner}
          onBridgeHover={onBridgeHover}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse ? () => onToggleCollapse(node.id) : undefined}
        />
      </div>

      {hasChildren && !isCollapsed && (
        <ul>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onAddChild={onAddChild}
              onMoveNode={onMoveNode}
              hoveredBridgeNodeId={hoveredBridgeNodeId}
              activeBridgeTargetIds={activeBridgeTargetIds}
              onBridgeHover={onBridgeHover}
              collapsedNodeIds={collapsedNodeIds}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
