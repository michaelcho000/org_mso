import React, { useState } from 'react';
import { OrgNode } from '../types';

interface NodeCardProps {
  node: OrgNode;
  onClick: (node: OrgNode) => void;
  onAddChild: (parentId: string) => void;
  isHoveredBridge?: boolean; // I am the bridge being hovered
  isBridgePartner?: boolean; // I am the partner of the hovered bridge
  setHoveredBridgeId?: (id: string | null) => void;
  onMoveNode: (draggedId: string, targetId: string) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({ 
  node, 
  onClick, 
  onAddChild,
  isHoveredBridge,
  isBridgePartner,
  setHoveredBridgeId,
  onMoveNode
}) => {
  const isCompany = node.orgType === 'company';
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Base Styles
  const borderColor = isCompany ? 'border-slate-200' : 'border-emerald-200';
  const bgColor = isCompany ? 'bg-white' : 'bg-emerald-50/50';
  const accentColor = isCompany ? 'bg-slate-700' : 'bg-emerald-600';
  
  // Highlight Styles
  const isHighlighted = isHoveredBridge || isBridgePartner;
  let highlightClass = '';
  
  if (isHighlighted) {
     highlightClass = isCompany 
       ? 'ring-4 ring-slate-400/50 shadow-xl scale-105 border-slate-400 z-20' 
       : 'ring-4 ring-emerald-400/50 shadow-xl scale-105 border-emerald-400 z-20';
  } else if (isDragOver) {
    // Drag Over Highlight
    highlightClass = 'ring-4 ring-blue-500 shadow-xl scale-105 border-blue-500 z-30 bg-blue-50';
  }

  const handleMouseEnter = () => {
    if (node.isBridge && node.bridgeId && setHoveredBridgeId) {
      setHoveredBridgeId(node.id);
    }
  };

  const handleMouseLeave = () => {
    if (setHoveredBridgeId) {
      setHoveredBridgeId(null);
    }
  };

  // --- Drag & Drop Handlers ---

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('nodeId', node.id);
    e.dataTransfer.effectAllowed = 'move';
    // Visual opacity reduced while dragging
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('nodeId');
    if (draggedId && draggedId !== node.id) {
      onMoveNode(draggedId, node.id);
    }
  };

  return (
    <div 
      className={`
        relative group flex flex-col items-center
        transition-all duration-300 ease-in-out
        ${highlightClass}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // Draggable Props
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual Line Connector Indicator */}
      {isHighlighted && (
        <div className={`absolute -top-6 text-xs font-bold px-2 py-0.5 rounded-full animate-bounce ${isCompany ? 'bg-slate-700 text-white' : 'bg-emerald-600 text-white'}`}>
           {isHoveredBridge ? '▼ 연결 기준' : '▼ 연결 대상'}
        </div>
      )}
      
      {/* Drag Over Indicator */}
      {isDragOver && (
         <div className="absolute -top-8 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-50 animate-pulse">
           이곳에 놓아 하위로 이동
         </div>
      )}

      {/* The Card Body */}
      <div 
        onClick={() => onClick(node)}
        className={`
          w-52 p-4 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing
          hover:shadow-md transition-all
          ${borderColor} ${bgColor}
        `}
      >
        <div className="flex justify-between items-start mb-2">
          <div className={`w-2 h-2 rounded-full ${accentColor}`} />
          
          {node.isBridge && (
             <div className="flex items-center space-x-1 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
               </svg>
               <span>가교(Bridge)</span>
             </div>
          )}
        </div>

        <div className="text-center mb-1 select-none">
          <p className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${isCompany ? 'text-slate-500' : 'text-emerald-600'}`}>
            {node.title}
          </p>
          <h3 className="font-bold text-gray-900 text-base truncate" title={node.name}>
            {node.name}
          </h3>
        </div>

        {node.scope && (
          <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-dashed border-gray-200 leading-tight text-center line-clamp-2 min-h-[2.5em] select-none">
            {node.scope}
          </p>
        )}
      </div>

      {/* Explicit Add Button (Below) */}
      <div className="h-4 w-px bg-gray-300 group-hover:bg-blue-400 transition-colors"></div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddChild(node.id);
        }}
        className="
          flex items-center space-x-1
          bg-white border border-gray-300 text-gray-500 rounded-full px-3 py-1 shadow-sm
          hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all
          z-20
        "
        title={`${node.name}님의 하위 조직원 추가`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-[10px] font-bold">하위 추가</span>
      </button>

    </div>
  );
};