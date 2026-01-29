import { OrgNode, TreeData, OrgType } from './types';

// Convert flat list to hierarchical tree structure
export const buildTree = (nodes: OrgNode[], rootType: OrgType): TreeData[] => {
  const nodeMap = new Map<string, TreeData>();
  
  // Initialize map with children arrays
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  const roots: TreeData[] = [];

  nodes.forEach(node => {
    // Only process nodes of the requested type (unless we want a mixed tree, but req says separate)
    if (node.orgType !== rootType) return;

    const treeNode = nodeMap.get(node.id);
    if (!treeNode) return;

    if (node.parentId === null) {
      roots.push(treeNode);
    } else {
      // Check if parent exists in our map (it might be in the other org if data is weird, but we assume strict hierarchy within org)
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(treeNode);
      } else {
        // Fallback: if parent is missing or in another org, treat as root for visibility
        roots.push(treeNode);
      }
    }
  });

  return roots;
};

// Generate a random ID
export const generateId = (prefix: string = 'node'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

export const findNode = (nodes: OrgNode[], id: string): OrgNode | undefined => {
  return nodes.find(n => n.id === id);
};
