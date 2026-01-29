import React, { useState, useMemo } from 'react';
import { INITIAL_NODES } from './constants';
import { OrgNode, OrgType } from './types';
import { buildTree, generateId } from './utils';
import { OrgTreeRenderer } from './components/OrgTreeRenderer';
import { Modal } from './components/ui/Modal';
import { NodeEditor } from './components/NodeEditor';
import { Button } from './components/ui/Button';

export default function App() {
  const [nodes, setNodes] = useState<OrgNode[]>(INITIAL_NODES);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [addingChildToId, setAddingChildToId] = useState<string | null>(null);
  const [targetOrgForAdd, setTargetOrgForAdd] = useState<OrgType>('company'); // Default

  // Bridge Interaction State
  const [hoveredBridgeNodeId, setHoveredBridgeNodeId] = useState<string | null>(null);
  
  const activeBridgeTargetId = useMemo(() => {
    if (!hoveredBridgeNodeId) return null;
    const node = nodes.find(n => n.id === hoveredBridgeNodeId);
    return node && node.isBridge ? node.bridgeId || null : null;
  }, [hoveredBridgeNodeId, nodes]);

  // Derived State: Trees
  const companyTree = useMemo(() => buildTree(nodes, 'company'), [nodes]);
  const hospitalTree = useMemo(() => buildTree(nodes, 'hospital'), [nodes]);

  // --- Logic Helpers ---

  // Check if target is a descendant of dragged node (to prevent cycles)
  const isDescendant = (allNodes: OrgNode[], potentialParentId: string, potentialChildId: string): boolean => {
    if (potentialParentId === potentialChildId) return true;
    const parentNode = allNodes.find(n => n.id === potentialParentId);
    if (!parentNode || !parentNode.parentId) return false;
    return isDescendant(allNodes, parentNode.parentId, potentialChildId);
  };

  // --- Actions ---

  const handleMoveNode = (draggedId: string, targetId: string) => {
    // 1. Basic validation
    if (draggedId === targetId) return;

    // 2. Find nodes
    const draggedNode = nodes.find(n => n.id === draggedId);
    const targetNode = nodes.find(n => n.id === targetId);

    if (!draggedNode || !targetNode) return;

    // 3. Org Type Constraint: Don't allow mixing Company/Hospital hierarchies for now (optional)
    if (draggedNode.orgType !== targetNode.orgType) {
      alert("다른 조직 유형으로 이동할 수 없습니다.");
      return;
    }

    // 4. Cycle Prevention: Cannot move a parent into its own child
    if (isDescendant(nodes, targetId, draggedId)) {
      alert("상위 조직원을 하위 조직원으로 이동할 수 없습니다.");
      return;
    }

    // 5. Update state
    setNodes(prev => prev.map(n => 
      n.id === draggedId ? { ...n, parentId: targetId } : n
    ));
  };

  const handleNodeClick = (node: OrgNode) => {
    setEditingNode(node);
    setAddingChildToId(null);
    setTargetOrgForAdd(node.orgType);
    setIsModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    setEditingNode(null);
    setAddingChildToId(parentId);
    setTargetOrgForAdd(parent.orgType);
    setIsModalOpen(true);
  };

  const handleAddRoot = (type: OrgType) => {
    setEditingNode(null);
    setAddingChildToId(null);
    setTargetOrgForAdd(type);
    setIsModalOpen(true);
  };

  const saveNode = (nodeData: Partial<OrgNode>) => {
    // Determine if we are editing or creating
    const nodeId = editingNode ? editingNode.id : generateId();
    
    // Construct the final node object
    const finalNode: OrgNode = editingNode 
      ? { ...editingNode, ...nodeData } as OrgNode
      : {
          id: nodeId,
          name: nodeData.name || '새로운 노드',
          title: nodeData.title || '직책',
          orgType: nodeData.orgType || targetOrgForAdd,
          parentId: addingChildToId,
          scope: nodeData.scope,
          note: nodeData.note,
          isBridge: nodeData.isBridge,
          bridgeId: nodeData.bridgeId,
        };

    setNodes(prev => {
      let nextNodes = [...prev];

      // 1. Bidirectional Bridge Sync
      // If the current node is set as a bridge and points to a target,
      // update the target node to point back to the current node automatically.
      if (finalNode.isBridge && finalNode.bridgeId) {
        nextNodes = nextNodes.map(n => {
          if (n.id === finalNode.bridgeId) {
            // Update the partner node
            return {
              ...n,
              isBridge: true,
              bridgeId: finalNode.id
            };
          }
          return n;
        });
      }

      // 2. Update or Insert the current node
      if (editingNode) {
        nextNodes = nextNodes.map(n => n.id === nodeId ? finalNode : n);
      } else {
        nextNodes.push(finalNode);
      }

      return nextNodes;
    });

    closeModal();
  };

  const deleteNode = (id: string) => {
    if (!id) return;
    
    // Use window.confirm for safety check
    const confirmed = window.confirm('삭제 하시겠습니까? 하위 조직원도 모두 삭제됩니다');
    
    if (confirmed) {
      setNodes(prevNodes => {
        // 1. Identify all nodes to delete (Target + Descendants) using Iterative DFS
        const idsToDelete = new Set<string>();
        const stack = [id];
        
        while (stack.length > 0) {
          const currentId = stack.pop();
          if (!currentId || idsToDelete.has(currentId)) continue;
          
          idsToDelete.add(currentId);
          
          // Add children to stack
          const children = prevNodes.filter(n => n.parentId === currentId);
          children.forEach(child => stack.push(child.id));
        }
        
        // 2. Filter out deleted nodes
        const remainingNodes = prevNodes.filter(n => !idsToDelete.has(n.id));

        // 3. Cleanup Bridge References in remaining nodes
        // (If any remaining node was pointing to a deleted node, clear that connection)
        return remainingNodes.map(node => {
          if (node.isBridge && node.bridgeId && idsToDelete.has(node.bridgeId)) {
            return { ...node, isBridge: false, bridgeId: undefined };
          }
          return node;
        });
      });
      
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNode(null);
    setAddingChildToId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-30">
        <div className="flex items-center space-x-2">
          {/* Icon Removed as requested */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">조직도 관리</h1>
            <p className="text-xs text-gray-500 mt-0.5">이원 조직 관리 시스템</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => {
            const json = JSON.stringify(nodes, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'org-chart.json';
            a.click();
          }}>
            JSON 내보내기
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if(window.confirm('모든 변경사항이 초기화됩니다. 계속하시겠습니까?')) {
               setNodes(INITIAL_NODES)
            }
          }}>
            데이터 초기화
          </Button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 overflow-auto relative bg-gray-50">
        <div className="min-h-full min-w-full flex">
          
          {/* Company Column */}
          <div className="flex-1 border-r border-gray-200 bg-slate-50/50 flex flex-col min-w-[500px] shadow-[inset_-10px_0_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
               <h2 className="font-bold text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-slate-700 shadow-sm"></span>
                 회사 조직도 (Company)
               </h2>
               <Button size="sm" variant="secondary" className="shadow-sm border border-slate-200" onClick={() => handleAddRoot('company')}>+ 임원(Root) 추가</Button>
            </div>
            <div className="p-8 pb-32">
              {companyTree.length === 0 ? (
                 <div className="text-center text-gray-400 mt-20 p-8 border-2 border-dashed border-gray-200 rounded-xl">
                   노드가 없습니다.<br/>우측 상단 버튼을 눌러 임원을 추가하세요.
                 </div>
              ) : (
                <OrgTreeRenderer 
                  data={companyTree} 
                  onNodeClick={handleNodeClick} 
                  onAddChild={handleAddChild}
                  hoveredBridgeNodeId={hoveredBridgeNodeId}
                  activeBridgeTargetId={activeBridgeTargetId}
                  setHoveredBridgeId={setHoveredBridgeNodeId}
                  onMoveNode={handleMoveNode}
                />
              )}
            </div>
          </div>

          {/* Hospital Column */}
          <div className="flex-1 bg-white flex flex-col min-w-[500px]">
             <div className="sticky top-0 z-20 bg-emerald-50/95 backdrop-blur-sm border-b border-emerald-100 px-6 py-3 flex justify-between items-center shadow-sm">
               <h2 className="font-bold text-emerald-800 uppercase tracking-wide text-sm flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm"></span>
                 병원 조직도 (Hospital)
               </h2>
               <Button size="sm" variant="secondary" className="shadow-sm border border-emerald-200 text-emerald-800 bg-emerald-50" onClick={() => handleAddRoot('hospital')}>+ 관리자(Root) 추가</Button>
            </div>
            <div className="p-8 pb-32">
               {hospitalTree.length === 0 ? (
                 <div className="text-center text-gray-400 mt-20 p-8 border-2 border-dashed border-gray-200 rounded-xl">
                   노드가 없습니다.<br/>우측 상단 버튼을 눌러 관리자를 추가하세요.
                 </div>
              ) : (
                <OrgTreeRenderer 
                  data={hospitalTree} 
                  onNodeClick={handleNodeClick} 
                  onAddChild={handleAddChild}
                  hoveredBridgeNodeId={hoveredBridgeNodeId}
                  activeBridgeTargetId={activeBridgeTargetId}
                  setHoveredBridgeId={setHoveredBridgeNodeId}
                  onMoveNode={handleMoveNode}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit/Add Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editingNode ? '정보 수정' : `${targetOrgForAdd === 'company' ? '회사' : '병원'} 구성원 추가`}
      >
        <NodeEditor 
          node={editingNode}
          parentNodeId={addingChildToId}
          targetOrgType={targetOrgForAdd}
          allNodes={nodes}
          onSave={saveNode}
          onDelete={editingNode ? deleteNode : undefined}
          onCancel={closeModal}
        />
      </Modal>

      {/* Footer Info */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex justify-between z-40 shadow-lg">
        <div className="flex items-center space-x-4">
           <span className="flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
             <span><strong>가교(Bridge) 인원</strong>에 마우스를 올리면 연결된 상대방이 강조됩니다.</span>
           </span>
           <span className="w-px h-3 bg-gray-300"></span>
           <span>카드를 <strong>드래그</strong>하여 다른 카드 위에 놓으면 하위 조직원으로 이동합니다.</span>
        </div>
        <div className="font-mono">OrgSync v1.2</div>
      </footer>
    </div>
  );
}