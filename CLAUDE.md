# CLAUDE.md - 조직도 관리 앱

## 프로젝트 개요

Company와 Client(Hospital) 조직을 시각적으로 관리하는 Next.js 웹앱.

## 기술 스택

- **Framework**: Next.js 16.1 (Turbopack)
- **UI**: React 19, Tailwind CSS 3.4, shadcn/ui
- **State**: Zustand 5 (persist middleware)
- **Database**: Supabase (PostgreSQL + RLS)
- **Export**: html-to-image (PNG 내보내기)
- **Font**: Noto Sans KR (한글), Inter (영문)

## 주요 구조

```
src/
├── app/
│   ├── layout.tsx      # 루트 레이아웃 (폰트 설정)
│   ├── globals.css     # 전역 스타일 + 내보내기 모드 CSS
│   └── page.tsx        # 메인 페이지 (Company/Client 패널)
├── components/
│   ├── tree/
│   │   ├── OrgTreeView.tsx   # 조직도 뷰 (줌, 내보내기)
│   │   ├── OrgNodeCard.tsx   # 노드 카드 컴포넌트
│   │   └── TreeNode.tsx      # 트리 노드 래퍼
│   └── ui/             # shadcn/ui 컴포넌트
├── stores/
│   ├── orgStore.ts     # 조직 데이터 (Supabase 연동)
│   ├── authStore.ts    # 편집 권한 (localStorage)
│   └── uiStore.ts      # UI 상태
└── lib/
    ├── supabase.ts     # Supabase 클라이언트
    └── types.ts        # 타입 정의
```

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_EDIT_TOKEN=your_edit_token
```

## 주요 기능

### 1. 편집 모드
- `NEXT_PUBLIC_EDIT_TOKEN`과 일치하는 키 입력 시 편집 가능
- localStorage에 상태 저장 (브라우저별 독립)

### 2. PNG 내보내기
- `html-to-image` 라이브러리 사용 (SVG foreignObject 방식)
- 내보내기 시 `export-mode` 클래스 적용하여 레이아웃 고정
- `document.fonts.ready`로 폰트 로드 대기

### 3. Supabase RLS
- `anon` 역할에 SELECT/INSERT/UPDATE/DELETE 허용
- 앱은 Supabase Auth 미사용 (edit key 방식)

## 개발 명령어

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## Git 워크플로우

```bash
# GitHub PAT 토큰으로 푸시
# PAT는 .env.local 파일의 GITHUB_PAT 변수에 저장됨
git push https://<PAT_TOKEN>@github.com/michaelcho000/org_mso_app.git main
```

> **Note**: `.env.local`은 .gitignore에 포함되어 커밋되지 않음

## 알려진 이슈

- PNG 내보내기 시 `flex-wrap` 요소는 `export-mode` CSS로 강제 `nowrap` 처리
- Supabase 연결 실패 시 더미 클라이언트로 폴백 (에러 방지)

## 배포

- **Vercel**: GitHub 연동 자동 배포
- **Supabase**: 프로젝트 ID `imjitqtskfzxrgsxeaqv`
