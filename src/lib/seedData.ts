import { OrgNode, OrgEdge, Bridge, RankLevel, BridgeRole } from "./types"
import { generateId, formatDate } from "./utils"

interface SeedResult {
  nodes: OrgNode[]
  edges: OrgEdge[]
}

interface SeedResultWithBridges extends SeedResult {
  bridges: Bridge[]
}

// 노드 ID 매핑을 위한 타입
interface NodeIdMap {
  [key: string]: string
}

// 광고대행사 조직도 템플릿
export function generateAdvertisingAgencyTemplate(): SeedResult {
  const now = formatDate(new Date())
  const nodes: OrgNode[] = []
  const edges: OrgEdge[] = []
  const nodeIds: NodeIdMap = {}

  // 대표이사
  const ceoId = generateId()
  nodeIds["ceo"] = ceoId
  nodes.push({
    id: ceoId,
    org: "company",
    name: "대표이사",
    title: "CEO",
    scope: "회사 전체 경영 총괄",
    parentId: null,
    positionX: 0,  // 자동 레이아웃이 계산
    positionY: 0,  // 자동 레이아웃이 계산
    department: undefined,
    rank: "executive",
    createdAt: now,
    updatedAt: now,
  })

  // 본부 구조 정의 (위치는 자동 레이아웃이 계산)
  const departments = [
    {
      key: "경영지원",
      name: "경영지원본부장",
      title: "본부장",
      scope: "경영지원 총괄",
      members: [
        { key: "경영지원팀장", name: "경영지원팀장", title: "팀장", scope: "인사/총무/재무 관리", rank: "manager" as RankLevel },
        { key: "인사담당", name: "인사담당", title: "담당", scope: "인사관리", rank: "staff" as RankLevel },
        { key: "재무담당", name: "재무담당", title: "담당", scope: "재무/회계", rank: "staff" as RankLevel },
      ]
    },
    {
      key: "AE",
      name: "AE본부장",
      title: "본부장",
      scope: "클라이언트 관리 총괄",
      members: [
        { key: "AE팀장", name: "AE팀장", title: "팀장", scope: "프로젝트 관리 및 클라이언트 커뮤니케이션", rank: "manager" as RankLevel },
        { key: "AE", name: "AE", title: "AE", scope: "캠페인 실행 및 리포팅", rank: "staff" as RankLevel },
      ]
    },
    {
      key: "크리에이티브",
      name: "CD",
      title: "Creative Director",
      scope: "크리에이티브 총괄",
      members: [
        { key: "AD", name: "AD", title: "Art Director", scope: "비주얼 디렉션", rank: "manager" as RankLevel },
        { key: "카피라이터", name: "카피라이터", title: "카피라이터", scope: "카피 개발", rank: "senior" as RankLevel },
        { key: "디자이너", name: "디자이너", title: "디자이너", scope: "그래픽 제작", rank: "staff" as RankLevel },
      ]
    },
    {
      key: "미디어",
      name: "미디어본부장",
      title: "본부장",
      scope: "미디어 전략 총괄",
      members: [
        { key: "미디어팀장", name: "미디어팀장", title: "팀장", scope: "미디어 플래닝", rank: "manager" as RankLevel },
        { key: "미디어플래너", name: "미디어플래너", title: "플래너", scope: "매체 운영", rank: "senior" as RankLevel },
      ]
    },
    {
      key: "디지털마케팅",
      name: "디지털마케팅본부장",
      title: "본부장",
      scope: "디지털 마케팅 총괄",
      members: [
        { key: "디지털마케팅팀장", name: "디지털마케팅팀장", title: "팀장", scope: "디지털 캠페인 관리", rank: "manager" as RankLevel },
        { key: "퍼포먼스마케터", name: "퍼포먼스마케터", title: "마케터", scope: "퍼포먼스 광고 운영", rank: "senior" as RankLevel },
        { key: "콘텐츠기획자", name: "콘텐츠기획자", title: "기획자", scope: "소셜/콘텐츠 기획", rank: "senior" as RankLevel },
      ]
    },
  ]

  // 본부장 노드 생성 (위치는 자동 레이아웃이 계산)
  departments.forEach((dept) => {
    const headId = generateId()
    nodeIds[dept.key + "_head"] = headId

    nodes.push({
      id: headId,
      org: "company",
      name: dept.name,
      title: dept.title,
      scope: dept.scope,
      parentId: ceoId,
      positionX: 0,  // 자동 레이아웃이 계산
      positionY: 0,  // 자동 레이아웃이 계산
      department: dept.key + "본부",
      rank: "head",
      createdAt: now,
      updatedAt: now,
    })

    edges.push({
      id: generateId(),
      org: "company",
      sourceId: ceoId,
      targetId: headId,
      type: "vertical",
      lineStyle: "solid",
    })

    // 팀원 노드 생성
    dept.members.forEach((member) => {
      const memberId = generateId()
      nodeIds[member.key] = memberId

      nodes.push({
        id: memberId,
        org: "company",
        name: member.name,
        title: member.title,
        scope: member.scope,
        parentId: headId,
        positionX: 0,  // 자동 레이아웃이 계산
        positionY: 0,  // 자동 레이아웃이 계산
        department: dept.key + "본부",
        rank: member.rank,
        createdAt: now,
        updatedAt: now,
      })

      edges.push({
        id: generateId(),
        org: "company",
        sourceId: headId,
        targetId: memberId,
        type: "vertical",
        lineStyle: "solid",
      })
    })
  })

  return { nodes, edges }
}

// 병원 조직도 템플릿
export function generateHospitalClinicTemplate(): SeedResult {
  const now = formatDate(new Date())
  const nodes: OrgNode[] = []
  const edges: OrgEdge[] = []
  const nodeIds: NodeIdMap = {}

  // 병원장
  const directorId = generateId()
  nodeIds["director"] = directorId
  nodes.push({
    id: directorId,
    org: "hospital",
    name: "병원장",
    title: "원장",
    scope: "병원 운영 총괄",
    parentId: null,
    positionX: 0,  // 자동 레이아웃이 계산
    positionY: 0,  // 자동 레이아웃이 계산
    department: undefined,
    rank: "executive",
    createdAt: now,
    updatedAt: now,
  })

  // 부서 구조 정의 (위치는 자동 레이아웃이 계산)
  const departments = [
    {
      key: "진료부",
      name: "진료부장",
      title: "부장",
      scope: "진료 업무 총괄",
      members: [
        { key: "전문의_내과", name: "전문의(내과)", title: "전문의", scope: "내과 진료", rank: "senior" as RankLevel },
        { key: "전문의_외과", name: "전문의(외과)", title: "전문의", scope: "외과 진료", rank: "senior" as RankLevel },
        { key: "전공의", name: "전공의", title: "전공의", scope: "진료 보조", rank: "staff" as RankLevel },
      ]
    },
    {
      key: "간호부",
      name: "간호부장",
      title: "부장",
      scope: "간호 업무 총괄",
      members: [
        { key: "수간호사", name: "수간호사", title: "수간호사", scope: "병동 간호 관리", rank: "manager" as RankLevel },
        { key: "간호사A", name: "간호사", title: "간호사", scope: "병동 간호", rank: "staff" as RankLevel },
      ]
    },
    {
      key: "원무부",
      name: "원무과장",
      title: "과장",
      scope: "원무 업무 총괄",
      members: [
        { key: "원무팀원", name: "원무팀원", title: "팀원", scope: "수납/접수", rank: "staff" as RankLevel },
      ]
    },
    {
      key: "마케팅홍보부",
      name: "마케팅팀장",
      title: "팀장",
      scope: "마케팅/홍보 총괄",
      members: [
        { key: "마케팅담당자", name: "마케팅담당자", title: "담당", scope: "마케팅 실무", rank: "staff" as RankLevel },
      ]
    },
    {
      key: "행정부",
      name: "행정부장",
      title: "부장",
      scope: "행정 업무 총괄",
      members: [
        { key: "행정담당", name: "행정담당", title: "담당", scope: "행정지원", rank: "staff" as RankLevel },
      ]
    },
  ]

  // 부서장 노드 생성 (위치는 자동 레이아웃이 계산)
  departments.forEach((dept) => {
    const headId = generateId()
    nodeIds[dept.key + "_head"] = headId

    nodes.push({
      id: headId,
      org: "hospital",
      name: dept.name,
      title: dept.title,
      scope: dept.scope,
      parentId: directorId,
      positionX: 0,  // 자동 레이아웃이 계산
      positionY: 0,  // 자동 레이아웃이 계산
      department: dept.key,
      rank: "head",
      createdAt: now,
      updatedAt: now,
    })

    edges.push({
      id: generateId(),
      org: "hospital",
      sourceId: directorId,
      targetId: headId,
      type: "vertical",
      lineStyle: "solid",
    })

    // 팀원 노드 생성
    dept.members.forEach((member) => {
      const memberId = generateId()
      nodeIds[member.key] = memberId

      nodes.push({
        id: memberId,
        org: "hospital",
        name: member.name,
        title: member.title,
        scope: member.scope,
        parentId: headId,
        positionX: 0,  // 자동 레이아웃이 계산
        positionY: 0,  // 자동 레이아웃이 계산
        department: dept.key,
        rank: member.rank,
        createdAt: now,
        updatedAt: now,
      })

      edges.push({
        id: generateId(),
        org: "hospital",
        sourceId: headId,
        targetId: memberId,
        type: "vertical",
        lineStyle: "solid",
      })
    })
  })

  return { nodes, edges }
}

// 기본 가교 매핑 생성 (노드 이름 기반 매칭)
export function generateDefaultBridges(
  companyNodes: OrgNode[],
  hospitalNodes: OrgNode[]
): Bridge[] {
  const now = formatDate(new Date())
  const bridges: Bridge[] = []

  // 가교 매핑 정의
  const bridgeMappings: Array<{
    companyName: string
    hospitalName: string
    bridgeName: string
    role: BridgeRole
    scope: string
  }> = [
    {
      companyName: "AE팀장",
      hospitalName: "마케팅팀장",
      bridgeName: "계정관리 가교",
      role: "primary",
      scope: "일상적인 커뮤니케이션 및 프로젝트 관리",
    },
    {
      companyName: "CD",
      hospitalName: "마케팅담당자",
      bridgeName: "크리에이티브 가교",
      role: "creative",
      scope: "크리에이티브 승인 및 피드백",
    },
    {
      companyName: "대표이사",
      hospitalName: "병원장",
      bridgeName: "경영진 가교",
      role: "executive",
      scope: "전략적 의사결정 및 주요 안건",
    },
  ]

  bridgeMappings.forEach((mapping) => {
    const companyNode = companyNodes.find((n) => n.name === mapping.companyName)
    const hospitalNode = hospitalNodes.find((n) => n.name === mapping.hospitalName)

    if (companyNode && hospitalNode) {
      bridges.push({
        id: generateId(),
        name: mapping.bridgeName,
        title: `${mapping.companyName} ↔ ${mapping.hospitalName}`,
        scope: mapping.scope,
        companyTargetId: companyNode.id,
        hospitalTargetId: hospitalNode.id,
        role: mapping.role,
        createdAt: now,
        updatedAt: now,
      })
    }
  })

  return bridges
}

// 전체 시드 데이터 생성 (가교 포함)
export function generateAllSeedData(): SeedResultWithBridges {
  const company = generateAdvertisingAgencyTemplate()
  const hospital = generateHospitalClinicTemplate()
  const bridges = generateDefaultBridges(company.nodes, hospital.nodes)

  return {
    nodes: [...company.nodes, ...hospital.nodes],
    edges: [...company.edges, ...hospital.edges],
    bridges,
  }
}
