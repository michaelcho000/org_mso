import { OrgNode } from './types';

export const INITIAL_NODES: OrgNode[] = [
  // Company Side
  {
    id: 'c-1',
    name: '김철수',
    title: '대표이사 (CEO)',
    orgType: 'company',
    parentId: null,
    scope: '전사 경영 전략 수립 및 총괄',
    isBridge: true,
    bridgeId: 'h-1'
  },
  {
    id: 'c-2',
    name: '이영희',
    title: '기술이사 (CTO)',
    orgType: 'company',
    parentId: 'c-1',
    scope: '기술 인프라 및 개발 총괄'
  },
  {
    id: 'c-3',
    name: '박민수',
    title: '재무이사 (CFO)',
    orgType: 'company',
    parentId: 'c-1',
    scope: '재무 기획 및 자금 관리'
  },
  {
    id: 'c-4',
    name: '최지훈',
    title: '개발 팀장',
    orgType: 'company',
    parentId: 'c-2',
    scope: '핵심 플랫폼 개발 리딩'
  },

  // Hospital Side
  {
    id: 'h-1',
    name: '정수진',
    title: '병원장',
    orgType: 'hospital',
    parentId: null,
    scope: '의료 운영 및 진료 총괄',
    isBridge: true,
    bridgeId: 'c-1'
  },
  {
    id: 'h-2',
    name: '강동원',
    title: '외과 과장',
    orgType: 'hospital',
    parentId: 'h-1',
    scope: '수술실 운영 및 외과 진료'
  },
  {
    id: 'h-3',
    name: '한미영',
    title: '수간호사',
    orgType: 'hospital',
    parentId: 'h-1',
    scope: '간호 인력 관리 및 환자 케어'
  },
  {
    id: 'h-4',
    name: '오지호',
    title: '내과 전문의',
    orgType: 'hospital',
    parentId: 'h-1',
    scope: '희귀 질환 진단 및 연구'
  }
];