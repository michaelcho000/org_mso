import React, { useState, useEffect } from 'react';
import { OrgNode, OrgType } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';

interface NodeEditorProps {
  node?: OrgNode | null; // If null, we are adding a new node
  parentNodeId?: string | null;
  targetOrgType: OrgType;
  allNodes: OrgNode[]; // For bridge selection
  onSave: (node: Partial<OrgNode>) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ 
  node, 
  parentNodeId, 
  targetOrgType,
  allNodes,
  onSave, 
  onDelete, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Partial<OrgNode>>({
    name: '',
    title: '',
    scope: '',
    isBridge: false,
    bridgeId: '',
    orgType: targetOrgType
  });

  // Find parent node for display context
  const parentNode = parentNodeId ? allNodes.find(n => n.id === parentNodeId) : null;

  useEffect(() => {
    if (node) {
      setFormData({ ...node });
    } else {
      setFormData({
        name: '',
        title: '',
        scope: '',
        isBridge: false,
        bridgeId: '',
        parentId: parentNodeId || null,
        orgType: targetOrgType
      });
    }
  }, [node, parentNodeId, targetOrgType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.title) return; // Simple validation
    onSave(formData);
  };

  const handleDelete = (e: React.MouseEvent) => {
    // Prevent default form submission and bubbling
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Delete requested for node:', node?.id);

    if (node && onDelete) {
      onDelete(node.id);
    }
  };

  // Filter potential bridge targets: Must be in the OTHER organization
  const bridgeTargets = allNodes.filter(n => n.orgType !== formData.orgType);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Context Banner: Where is this node being added? */}
      {!node && parentNode && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-r-md">
          <p className="text-xs text-blue-500 font-bold uppercase mb-1">위치 지정됨</p>
          <p className="text-sm text-blue-900">
            <span className="font-bold">{parentNode.name}</span> ({parentNode.title}) 님의 <br/>
            <span className="font-bold underline">하위 조직원</span>으로 추가됩니다.
          </p>
        </div>
      )}
      {!node && !parentNode && (
        <div className="bg-slate-100 border-l-4 border-slate-500 p-3 mb-4 rounded-r-md">
           <p className="text-xs text-slate-500 font-bold uppercase mb-1">최상위 노드</p>
           <p className="text-sm text-slate-800">조직의 최상위 관리자(루트)를 생성합니다.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="이름"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="예: 김철수"
          required
        />
        <Input
          label="직책 / 역할"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="예: 팀장"
          required
        />
      </div>

      <TextArea
        label="업무 범위 / 책임"
        value={formData.scope || ''}
        onChange={e => setFormData({ ...formData, scope: e.target.value })}
        placeholder="이 조직원의 주요 업무와 책임을 입력하세요..."
        rows={3}
      />

      {/* Bridge Section */}
      <div className="border-2 border-dashed border-indigo-100 p-4 rounded-xl bg-indigo-50/50 space-y-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className="bg-indigo-100 p-1.5 rounded-full">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-indigo-900">조직 간 가교(Bridge) 설정</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isBridge"
            checked={formData.isBridge || false}
            onChange={e => setFormData({ 
              ...formData, 
              isBridge: e.target.checked,
              bridgeId: e.target.checked ? formData.bridgeId : undefined 
            })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isBridge" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
            이 인원을 <strong>연락 담당자</strong>로 지정합니다.
          </label>
        </div>

        {formData.isBridge && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 pl-6">
            <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wide">
              누구와 소통합니까? (상대 조직)
            </label>
            <select
              value={formData.bridgeId || ''}
              onChange={e => setFormData({ ...formData, bridgeId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="">-- 협력 대상 선택 --</option>
              {bridgeTargets.map