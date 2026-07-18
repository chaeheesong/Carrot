# 프로젝트 개요
동네장터 — 동네 기반 중고거래 GraphQL 웹앱 (당근마켓 오마주). 홈 피드 / 상품 상세 / 실시간 채팅이 핵심.
npm workspaces 모노레포: `apps/web`(Next.js 프론트) + `apps/server`(Apollo Server 백엔드). 두 앱이 GraphQL 타입을 공유.

## 기술 스택
- Frontend: Next.js 14 (App Router) + TypeScript + Apollo Client + TailwindCSS → Vercel
- Backend: Node.js 20 + Apollo Server(GraphQL) + graphql-ws(Subscription) + TypeScript → Render
- ORM/DB: Prisma + PostgreSQL (Supabase)
- 인증: JWT / 이미지: Supabase Storage (클라이언트 직접 업로드)

## 빌드/테스트 명령어
> 모든 명령은 **루트에서** 실행 (npm workspaces). 백엔드 4000, 프론트 3000 포트.
- 백엔드 개발 서버: `npm run dev:server`
- 프론트 개발 서버: `npm run dev:web`
- DB 마이그레이션: `npm run prisma:migrate`  (DB_PASSWORD를 URL 인코딩해 주입하는 `with-env.mjs` 래퍼 경유)
- 시드(데모 계정·상품): `npm run prisma:seed`
- 타입체크: `npm run typecheck -w @dongne/server` / `npm run typecheck -w @dongne/web`
- 빌드: `npm run build:server` / `npm run build:web`
- 린트(프론트): `npm run lint -w @dongne/web`
- ⚠️ 자동화된 테스트 스위트(Jest 등)는 아직 없음. 검증은 **타입체크 + 빌드 + 헤드리스 브라우저로 실제 구동 확인**으로 진행.

## 코드 규칙
- **ES Modules** 사용 (server는 `"type": "module"`). TS 상대 import는 **`.js` 확장자**로 작성 (예: `import { prisma } from "./prisma.js"`).
- TypeScript `strict` 모드 유지.
- **환경변수**: 서버는 `dotenv`(+ 특수문자 비번은 `__PW__` placeholder를 코드에서 URL 인코딩), 프론트는 `NEXT_PUBLIC_` 접두사. **`.env`는 커밋 금지**(.gitignore).
- **🔒 `.env`는 절대 읽지 말 것** — `.claude/settings.json`의 `permissions.deny`에 `Read(**/.env)` 등록됨. 비밀값은 앱 런타임만 사용, 값 존재 여부는 동작으로만 확인.
- **GraphQL 백엔드**: 스키마 `apps/server/src/schema.ts`, 리졸버 `resolvers.ts`. 로그인 필요한 리졸버는 `requireAuth(ctx.userId)` 로 인가. 조회(Query)는 게스트 공개, 액션(Mutation)만 인증.
- **GraphQL 프론트**: 모든 쿼리/뮤테이션/구독은 `apps/web/lib/graphql.ts`에 모음. Apollo 기본 `fetchPolicy`는 `cache-and-network`(캐시 즉시 + 네트워크 재검증).
- **프론트 구조**: App Router. 상호작용 페이지/컴포넌트는 최상단 `"use client"`. 디자인 토큰은 `tailwind.config.ts`(`carrot` 오렌지, `cream` 배경 등).
- Prisma 스키마 변경 시 → `npm run prisma:migrate` 후 `npm run prisma:generate` 반영.

## 참고 문서
- `docs/기획서.md` — 서비스 기획 / `docs/개발계획.md` — 단계별 로드맵
