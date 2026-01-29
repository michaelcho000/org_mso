# 조직도 웹앱 PRD (완전 상세본 · 파일 저장 베타 스택 반영 · 최종)

## 0. TL;DR

* 좌측 **Company 트리**, 우측 **Hospital 트리**, 중앙 **Bridge(가교/연락망) 영역**
* 카드 기반 노드를 **추가·수정·삭제(CRUD)** + **붙이기(아래/옆) Drag & Drop**로 구조를 만든다
* **배치(레이아웃)도 CRUD**: 수동 배치/자동 정렬/리셋/잠금
* Bridge는 조직 트리의 일부가 아니라 **양 조직을 잇는 연락·조율자**이며, **양쪽 조직에 자동 동기화 표시**
* **저장/공유(베타)**: 외부 DB 없이 **프로젝트 폴더의 JSON 파일에 저장**(서버가 파일 write 가능할 때). 링크로 누구나 보기(Viewer), 편집은 키(토큰)로 잠금 해제(Editor)
* UI는 **shadcn/ui** 스타일. 사이드바/푸터 없음. 상단은 텍스트만 있는 미니 바(“조직도 관리”)만 허용

---

## 1. 배경 및 목적

### 1.1 목적

회사 조직과 병원 조직이 동시에 존재하는 운영 구조에서, 양 조직을 각각 **기업형 조직도(대표→관리자→직원 트리)**로 관리하고, 두 조직 사이의 연락·조율을 담당하는 특정 인원(Bridge)을 명확히 시각화/관리하기 위함.

### 1.2 해결하려는 문제

* 인원을 추가해도 “어디에 붙여야 하는지” 모호함
* 트리/병렬 구조를 동시에 표현하기 어려움
* 연결선이 끊기거나 어긋나 신뢰도가 떨어짐
* Bridge 설정이 한쪽에만 반영되어 실제 운영 구조를 반영하지 못함
* 삭제/수정/저장의 안정성이 낮아 데이터가 틀어짐

---

## 2. 범위 (Scope)

### 2.1 In Scope

* Company/Hospital 2개 조직 트리 생성/편집
* 노드(인원) CRUD 및 상세 정보 편집
* 트리 구조 편집(붙이기 UX, Drag & Drop)
* 레이아웃(배치) CRUD (수동 배치/자동 레이아웃/리셋/잠금)
* Bridge(연락망 인원) CRUD 및 양방향 동기화 표시
* 저장/불러오기(외부 DB 없이 파일 기반)
* 공유 링크(보기) + 편집 키 기반 권한

### 2.2 Out of Scope (이번 베타)

* 외부 DB/클라우드 스토리지 연동
* 계정 기반 로그인/역할 관리(정식 Auth)
* 실시간 동시 편집(구글독스 수준)
* 다중 프로젝트(문서 여러 개) 관리
* 다국어 지원

### 2.3 운영 전제 (중요)

* 당분간 **단일 프로젝트(단일 조직도 데이터)만** 운영한다.
* 저장은 원칙적으로 **프로젝트 폴더 내 JSON 파일 1개**에 수행한다.

---

## 3. 사용자 및 권한 (베타)

### 3.1 사용자 유형

* **Viewer**: 링크로 열람만 가능
* **Editor**: 추가/수정/삭제/배치 변경/저장 가능

### 3.2 권한 규칙(베타 구현)

* 기본은 “링크 접근 = Viewer”
* Editor는 **편집 키(Edit Key / Token)**로 잠금 해제

  * 방법 A(권장): 서버 환경변수 `EDIT_TOKEN`과 일치하는 키 입력 시 편집 허용
  * 방법 B(대체): `?edit=TOKEN` 쿼리 파라미터로 세션 잠금 해제(보안 약함)
* Editor가 아닌 사용자는 편집 UI 비활성/숨김 처리

> 보안 주의(베타): 외부 DB/Auth 없이 운영하므로 강한 보안을 제공하지 않는다. 민감한 조직 정보를 다룰 경우 정식 Auth/DB 도입 전 내부망/제한된 배포를 권장.

---

## 4. 정보 구조(Information Architecture)

### 4.1 단일 데이터(One Project) 원칙

* 앱은 **단일 조직도 데이터 1개**만 다룬다.
* 공유 링크는 “문서 URL”이 아니라 **앱 URL 자체**다.

### 4.2 영역(Zones)

* **Company Zone (좌측)**: Company 트리 캔버스
* **Bridge Zone (중앙)**: Bridge 카드 목록/관리 + 연결선 표시 기준축
* **Hospital Zone (우측)**: Hospital 트리 캔버스

---

## 5. 핵심 데이터 모델 (논리 모델)

> 물리 저장은 JSON이지만, 아래 논리 모델은 반드시 충족.

### 5.1 Node (조직원/노드)

* `id` (uuid)
* `org` ("company" | "hospital")
* `name` (필수)
* `title` (직책/역할)
* `scope` (업무 스콥, long text)
* `notes` (비고)
* `parentId` (nullable)
* `siblingGroupId` (nullable) — 옆(병렬) 구조를 그룹으로 묶기 위한 선택 필드
* `position` { `x`, `y` } — 수동 배치
* `createdAt`, `updatedAt`

### 5.2 Edge (조직 내부 연결선)

* `id`
* `org` ("company" | "hospital")
* `sourceId`
* `targetId`
* `type` ("vertical" | "horizontal")

### 5.3 Bridge (가교/연락망)

* `id`
* `name` (필수)
* `title`
* `scope` / `notes`
* `companyTargetId` (필수)
* `hospitalTargetId` (필수)
* `createdAt`, `updatedAt`

### 5.4 AppState (단일 프로젝트 저장 루트)

* `meta`: { `title`: "조직도 관리", `version`: number, `updatedAt`: string }
* `company`: { `nodes[]`, `edges[]`, `layout`: { `mode`: "auto"|"manual", `locked`: boolean } }
* `hospital`: { `nodes[]`, `edges[]`, `layout`: { `mode`: "auto"|"manual", `locked`: boolean } }
* `bridges[]`

---

## 6. UI/UX 요구사항 (최우선)

### 6.1 화면 구성 (불필요한 레이아웃 금지)

* **상단 미니 바**(허용): 텍스트만 표시

  * 텍스트: **"조직도 관리"** 고정
  * 좌측 아이콘/로고/브랜드명(OrgSync 등) **모두 금지**
  * 메뉴/사이드바/푸터 없음
* 본문 3열

  * 좌: Company 캔버스
  * 중: Bridge 패널(카드 목록 + “가교 추가”)
  * 우: Hospital 캔버스

### 6.2 노드 카드 UI

* shadcn Card 기반
* 카드 최소 표시: 이름(굵게), 직책(작게), 스코프(2줄 요약)
* 카드 클릭 → 상세 편집(Modal 또는 Side Sheet)

### 6.3 “붙이기” 중심의 조직 편집 UX (필수)

#### 6.3.1 노드 추가 UX

* 새 노드 생성 시 즉시 **"어디에 붙일지"** 안내 상태로 진입

  * 신규 카드에 안내 배지
  * 캔버스 Drop Zone 힌트 활성화

#### 6.3.2 Drag & Drop 연결 UX

* 노드 드래그 시 대상 노드에 **4방향 Drop Zone** 표시

  * 아래: 하위(보고)
  * 왼쪽/오른쪽: 옆(병렬/협업)
  * 위(선택): 부모 교체/상위 이동
* 드롭 시 즉시 관계 확정 + 연결선 자동 생성 + (Auto 모드일 때) 자동 재정렬

#### 6.3.3 대체 연결 UI

* 노드 메뉴에서 “아래에 추가 / 옆에 추가 / 부모 변경” 제공

### 6.4 레이아웃(배치) CRUD (필수)

* 수동 드래그(Manual)
* 자동 레이아웃(Auto) 토글
* “정렬/리셋”(영역별)
* “배치 잠금”(잠금 시 드래그 비활성)
* 확대/축소, 패닝

### 6.5 연결선(Line) 품질 규칙 (필수)

* 연결선은 노드 Anchor(Handle)에 정확히 스냅
* 끊김/어긋남/공중 라인 금지
* 노드 이동/리사이즈 시 연결선 즉시 재계산
* 조직 내부: 실선(라운드 코너), Bridge: 점선/다른 색

---

## 7. 기능 요구사항 (Functional Requirements)

### 7.1 조직 노드 CRUD

#### 7.1.1 생성(Create)

* Company/Hospital 각각 루트 생성 가능
* 특정 노드 기준: 하위 추가 / 옆 추가 / 재부착

#### 7.1.2 조회(Read)

* Viewer 포함 누구나 열람
* 검색(선택): 이름/직책/스코프 키워드

#### 7.1.3 수정(Update)

* 이름/직책/스코프/비고 수정
* 수정 즉시 화면 반영

#### 7.1.4 삭제(Delete) — 안전성 필수

* “삭제하기” 클릭 시 확인 모달 필수:

  * `삭제 하시겠습니까?`
  * `하위 조직원도 모두 삭제됩니다`
* 확인 시:

  * 해당 노드 + 모든 하위 노드 삭제
  * 연결된 Edge 삭제
  * 연결된 Bridge 관계 제거
  * 레이아웃 재계산
* 삭제 실패 시 토스트 + 롤백

### 7.2 Bridge(가교/연락망) CRUD

#### 7.2.1 생성

* 중앙 패널에서 “가교 추가”
* 플로우: 가교 정보 입력 → Company 대상 선택 → Hospital 대상 선택 → 생성

#### 7.2.2 양방향 자동 동기화(필수)

* Bridge 설정 즉시:

  * Company 대상 노드에 “가교 연결” 표시 자동 부착
  * Hospital 대상 노드에도 동일 자동 부착
* 단방향 금지(companyTargetId, hospitalTargetId 모두 필수)

#### 7.2.3 수정/삭제

* 정보 수정 및 대상 변경(양쪽 재선택)
* 삭제 시 양쪽 표시/연결선 동시 제거

### 7.3 저장/불러오기 (외부 DB 없음 · 파일 기반)

#### 7.3.1 저장 대상(필수)

* 노드 데이터(세부정보)
* 트리/병렬 구조(parentId, siblingGroupId)
* 배치(position, layout mode/locked)
* Edge
* Bridge

#### 7.3.2 저장 방식 (2가지 모드)

**모드 A: 파일 저장 모드(권장, 서버가 파일 write 가능할 때)**

* 서버가 프로젝트 폴더의 `data/orgchart.json`에 AppState를 저장
* 저장은 원자적(Atomic)으로 수행:

  * `orgchart.json.tmp`에 먼저 쓰고 → 성공 시 rename으로 교체
* 백업(권장): 저장 시 `data/backups/orgchart.YYYYMMDD-HHMMSS.json` 스냅샷 생성(최근 N개 유지)

**모드 B: 브라우저 로컬 저장 모드(대체, 정적 호스팅/쓰기 불가 환경)**

* 서버 저장이 불가능한 배포 환경에서는 브라우저 `localStorage` 또는 `IndexedDB`에 저장
* 공유 링크로 타인이 접속하면 로컬 데이터는 공유되지 않으므로,

  * “Export JSON / Import JSON” 기능을 필수 제공하여 이동/백업을 보완

> PRD 기본은 모드 A로 구현하고, 배포 환경이 정적 호스팅이면 모드 B로 자동 폴백한다.

#### 7.3.3 저장 UX

* 자동 저장(기본 ON 권장)

  * 변경 감지 후 Debounce(800~1500ms)
  * 상태 표시: “저장 중… / 저장됨 / 저장 실패”
* 수동 저장 버튼(선택)
* 저장 실패 시: 재시도 버튼 + 마지막 정상 상태로 복구 옵션

#### 7.3.4 Export/Import (필수)

* Export: 현재 AppState를 JSON 다운로드
* Import: JSON 업로드로 상태 복원(검증 실패 시 거부)

### 7.4 공유/권한(베타)

* 링크 접근은 기본 Viewer
* 편집은 Edit Key로 잠금 해제(Editor)
* 편집 잠금 해제 후에도, 저장 API 호출 시 서버가 키를 검증해야 함

---

## 8. 상태/오류 처리 (필수)

* 저장 실패: 토스트 + 재시도 + 백업 복구 안내
* 삭제 실패: 토스트 + UI 롤백
* 권한 없음: 편집 컨트롤 숨김 + “보기 전용” 배지
* 파일 로드 실패/손상: 최신 백업 선택 복구(가능하면)

---

## 9. 비기능 요구사항 (NFR)

* 성능: 200~500 노드에서도 편집이 끊기지 않도록
* 접근성: 키보드로 선택/삭제(권한자), 모달 포커스 트랩
* 반응형: 데스크톱 우선, 모바일은 열람 중심
* 신뢰성: 연결선 끊김/삭제 미동작/브리지 단방향/저장 손상 같은 치명 버그 0

---

## 10. 권장 기술 스택 & 개발/배포 워크플로

### 10.1 Frontend

* React + TypeScript
* Next.js(권장, API Routes로 파일 저장 구현 쉬움) 또는 Vite + 별도 Node 서버
* **React Flow**: 노드/엣지/핸들(Anchor) 안정성, 줌/패닝, 커스텀 엣지
* **dnd-kit**: 4방향 Drop Zone 구현, 드래그 오버레이
* shadcn/ui: Card, Dialog, Sheet, Button, DropdownMenu, Toast
* 상태관리: Zustand
* 폼: React Hook Form + Zod

### 10.2 Backend/Storage (DB 없음)

* **파일 기반 저장 API**

  * Next.js API Routes 또는 Express
  * 읽기: `GET /api/state`
  * 쓰기: `PUT /api/state` (Editor 키 검증)
  * 백업 목록: `GET /api/backups` (선택)
  * 백업 복구: `POST /api/restore` (선택)
* 저장 파일 경로(권장): `./data/orgchart.json`

### 10.3 권한(베타)

* 서버 환경변수 `EDIT_TOKEN`
* 클라이언트는 편집 시 토큰을 입력하고, 저장 요청에 포함
* 서버는 토큰 불일치 시 401 반환

### 10.4 (중요) React 중복 로드/Hook 오류 방지 (번들러 기준)

`Cannot read properties of null (reading 'useRef')` 류의 Hook 오류는 대개 React 중복 로드/버전 충돌에서 발생한다. 본 프로젝트는 번들러 기반이므로 아래를 준수한다.

* `react`, `react-dom` 버전 고정(권장: 18.2.0)
* lockfile에서 React가 중복 설치되지 않도록 점검
* 모노레포/링크 패키지 사용 시 `alias/dedupe`로 단일 React 보장
* 배포 빌드에서 React Flow 드래그/편집 시 Hook 오류 0

### 10.5 (중요) ResizeObserver 경고/루프 방지 정책

* ResizeObserver 콜백에서 즉시 레이아웃/상태 업데이트 연쇄 금지
* 측정과 반영을 rAF/디바운스로 분리
* Auto 레이아웃은 100~300ms 윈도우로 묶어 1회만 재정렬
* 노드 카드 높이 급변 최소화(스코프 2줄 clamp, 상세는 모달/시트)

### 10.6 개발/배포 방식 (Claude Code CLI + Git)

* 구현은 Claude Code CLI로 로컬에서 생성/수정
* Git 저장소에 커밋 후 배포
* 배포 권장안:

  * **자체 서버/VM에 Node 앱으로 배포**(파일 저장 모드 A를 안정적으로 유지)
  * 정적 호스팅(Vercel/Netlify/GitHub Pages)일 경우 파일 write 불가/비영속 가능 → 모드 B(브라우저 저장+Export/Import)로 운영

---

## 11. QA/수용 기준 (Acceptance Criteria)

### 11.1 핵심 플로우

* (A) Company 트리에서 대표→관리자→직원 10명 이상을 Drag&Drop으로 붙여 생성 가능
* (B) Hospital 트리도 동일
* (C) 노드 상세(이름/직책/스코프) 입력·수정이 즉시 반영
* (D) 배치 변경 후 저장 및 재접속 시 유지

  * 모드 A: 서버 재시작 후에도 `data/orgchart.json` 기준 유지
  * 모드 B: 같은 브라우저에서 재접속 시 유지
* (E) Bridge 1개 생성 시 양쪽 대상 노드에 가교 표시 자동 부착
* (F) Bridge 삭제 시 양쪽 표시도 함께 제거

### 11.2 버그 방지 기준

* 연결선이 노드에서 떨어져 보이는 현상 0
* “삭제하기” → 확인 모달 → 확인 시 실제 삭제 100%
* 부모 삭제 시 하위 노드가 남는 현상 0
* 삭제 후 엣지/가교 잔존 0
* 일반 편집 동작 중 `ResizeObserver loop completed with undelivered notifications` 경고가 반복 재현되지 않음
* React Hook 관련 런타임 오류(useRef 등) 0

---

## 12. 릴리즈 단계(권장)

* 베타(1차): CRUD + 붙이기 UX + Bridge + 파일 저장(모드 A) + 편집 키
* 안정화(2차): 백업/복구 UI + 검색 + 간단 변경 이력

---

## 13. 제품 정의 한 줄

> 이 웹앱은 “조직도 생성기”가 아니라, **두 조직을 붙이고 잇고 파일로 저장·공유하는 조직 운영 캔버스**다.
