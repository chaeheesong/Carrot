# env.md — 로그인/계정이 필요한 작업 체크리스트

> 코드 스캐폴딩은 끝났지만, **아래 항목들은 계정 로그인이 필요해서 제가 대신 못 합니다.**
> 전부 **무료 티어**로 가능합니다. 각 항목: `해야 할 일` → `어떻게`.
> 완료할 때마다 얻는 값(URL/키)을 `.env` 파일에 채우면 됩니다.

## 🎯 무료 구성 요약
| 역할 | 서비스 | 무료 여부 | 비고 |
|---|---|---|---|
| DB + 이미지 저장 | **Supabase** | 무료(Free plan) | Postgres 500MB + Storage 1GB |
| 백엔드(GraphQL+WS) 배포 | **Render** | 무료(Free Web Service) | WebSocket 지원. 15분 미사용 시 슬립(데모엔 OK) |
| 프론트 배포 | **Vercel** | 무료(Hobby) | Next.js 공식 |
| 코드 저장/자동배포 | **GitHub** | 무료 | Render·Vercel가 여기서 배포 |

> ⚠️ 기획서엔 백엔드를 Railway로 적었지만, Railway는 상시 무료 티어가 없어졌습니다(체험 크레딧만).
> **무료 유지가 목표라 Render Free로 대체**했습니다. (WebSocket 지원 O)

---

## 0. (로그인 불필요) 먼저 로컬에서 돌려보기

계정 만들기 전에 로컬에서 확인하려면 Postgres 하나만 있으면 됩니다.
- 가장 쉬운 무료 방법: **Supabase 무료 DB**를 그대로 로컬 개발에도 사용(아래 1번).
- 완전 로컬로 하고 싶으면: [Postgres.app](https://postgresapp.com) 설치 후 `DATABASE_URL=postgresql://localhost:5432/dongne`.

**JWT_SECRET 생성** (로그인 불필요, 터미널에서):
```bash
openssl rand -base64 32
```
→ 나온 문자열을 `apps/server/.env`의 `JWT_SECRET`에 붙여넣기.

---

## 1. Supabase — DB + 이미지 저장소 (필수)

### 해야 할 일 A: 프로젝트 생성 + DB 연결 문자열 확보
1. https://supabase.com 접속 → GitHub 계정으로 로그인(무료).
2. **New project** → 이름(`dongne-jangteo`), DB 비밀번호 설정(메모해두기), Region은 `Northeast Asia (Seoul)` 권장.
3. 생성 후 상단 **Connect → ORMs → Prisma** (또는 Connection string) 에서 두 URL 확보.
4. `apps/server/.env` 생성(`apps/server/.env.example` 복사) 후 채우기:
   - **비밀번호는 `DB_PASSWORD` 한 곳에만** 원본 그대로 넣습니다. (URL엔 직접 넣지 않음)
   - `DATABASE_URL`/`DIRECT_URL`의 비밀번호 자리는 반드시 **`__PW__`** 로 그대로 둡니다.
     → 서버/Prisma 실행 시 코드가 `DB_PASSWORD`를 URL 인코딩해서 `__PW__`에 끼워넣습니다(특수문자 안전).
   - ⚠️ **`DB_PASSWORD` 값은 반드시 큰따옴표로 감싸기**: `#`·공백·`$` 등이 있으면 따옴표 없이는 잘립니다.
   - 비밀번호에 `"`(큰따옴표)나 `\`(백슬래시)가 있으면 알려주세요(추가 처리 필요).

### 해야 할 일 B: 스키마를 DB에 반영(마이그레이션)
`.env` 채운 뒤 터미널에서:
```bash
cd apps/server
npm run prisma:migrate    # 최초 실행 시 마이그레이션 이름 입력(예: init)
npm run seed              # 데모 계정 + 상품 20개 시드
```
> 데모 계정: `june@demo.com` / `minji@demo.com` (비밀번호 `password123`)

### 해야 할 일 C: Storage 버킷 + 키 (상품 이미지 업로드용)
1. **Storage → New bucket** → 이름 `product-images`, **Public bucket** 체크.
2. **업로드 정책 추가** (이게 없으면 업로드가 403으로 막힘). SQL Editor에서:
   ```sql
   create policy "public upload product-images"
     on storage.objects for insert to anon with check (bucket_id = 'product-images');
   ```
   > 읽기(SELECT) 정책은 불필요. Public 버킷은 공개 URL로 이미지가 그대로 보이며,
   > SELECT 정책은 "파일 목록 노출" 경고를 유발함. 이미 넣었다면 Remove policy로 삭제.
3. **API 키 복사** (Supabase 새 키 체계):
   - **Publishable Key**(`sb_publishable_...`) → 브라우저용, 이걸 사용 ✅
   - Secret Key(`sb_secret_...`)는 서버 전용 → **프론트에 넣지 말 것** ❌
   - (구버전 대시보드면 `anon public`(JWT) 키를 써도 됨)
4. `apps/web/.env`에 추가 후 `npm run dev:web` 재시작:
   ```
   NEXT_PUBLIC_SUPABASE_URL="https://tgipathnscdhybwzmqql.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."   # Publishable Key
   ```
> 미설정이어도 등록 폼은 "이미지 없이" 동작합니다(안내 배너 표시).

### ✅ 이미지 업로드가 안 될 때 — 내가 확인할 체크리스트

> 증상: 등록 시 "이미지 업로드가 아직 설정되지 않았어요" 에러 → 앱이 env 값을 못 읽는 것.

**1. 파일 위치가 맞는가**
- 반드시 **`apps/web/.env`** (❌ `apps/server/.env` 아님, ❌ 루트 `.env` 아님)

**2. 변수 이름이 정확한가** (오타/접두사 주의)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- → `NEXT_PUBLIC_` 접두사가 없으면 브라우저에서 절대 안 보임

**3. 값이 실제로 채워졌는가** (빈 `""`, 붙여넣기 누락 아닌지)
- 값은 안 보이고 **키 상태만** 확인하는 명령 (터미널에서 `!` 붙여 실행):
  ```bash
  awk -F= '/^NEXT_PUBLIC_SUPABASE/{print $1, (length($2)>2?"✅ 값있음":"❌ 비었음")}' apps/web/.env
  ```
  → 두 줄 다 `✅ 값있음` 이어야 정상.

**4. URL 형식**
- `https://<프로젝트ref>.supabase.co` (우리 프로젝트: `tgipathnscdhybwzmqql`)
- 끝에 `/` 없이, `http` 아니라 `https`

**5. 저장 후 dev 서버 재시작했는가**
- `NEXT_PUBLIC_*` 값은 서버 시작 시 번들에 박히므로 **.env 수정 = 반드시 재시작**
  ```bash
  # 기존 서버 종료 후
  npm run dev:web
  ```

**6. 버킷·정책이 존재하는가** (위 1·2번 단계 완료 확인)
- 버킷 `product-images` 있음 + Public
- Storage → Policies 에 insert/select 정책 있음 (없으면 값이 맞아도 업로드가 403)

> 3번 명령 결과(키 상태)만 알려주면 어디가 문제인지 바로 짚어드립니다.

---

## 2. GitHub — 코드 올리기 (배포 전 필수)

### 해야 할 일: 리포 생성 + 푸시
1. https://github.com 로그인 → **New repository** (`dongne-jangteo`, Private 가능).
2. 로컬에서:
   ```bash
   cd /Users/chaeheesong/Carrot
   git init
   git add .
   git commit -m "init: 동네장터 scaffolding"
   git branch -M main
   git remote add origin https://github.com/<본인아이디>/dongne-jangteo.git
   git push -u origin main
   ```
> `.env`는 `.gitignore`에 있어 커밋되지 않습니다(`.env.example`만 올라감). ✅

---

## 3. Render — 백엔드(GraphQL + WebSocket) 배포 (필수)

### 해야 할 일: Web Service 생성
1. https://render.com → GitHub로 로그인(무료).
2. **New → Web Service** → 방금 만든 GitHub 리포 연결.
3. 설정:
   - **Root Directory**: `apps/server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build && npm run prisma:deploy`
     (`prisma:deploy`는 `__PW__` 치환 래퍼를 거치므로 특수문자 비번도 안전)
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. **Environment** 탭에서 환경변수 추가 (로컬 `.env`와 동일한 방식):
   | Key | Value |
   |---|---|
   | `DB_PASSWORD` | Supabase DB 비밀번호 원본 (따옴표 없이 값만) |
   | `DATABASE_URL` | pooling URL, 비번 자리는 `__PW__` 그대로 (`?pgbouncer=true` 포함) |
   | `DIRECT_URL` | direct URL, 비번 자리는 `__PW__` 그대로 |
   | `JWT_SECRET` | `openssl rand -base64 32` 결과 |
   | `CORS_ORIGIN` | Vercel 프론트 URL (4번 완료 후 채움, 처음엔 `*`) |
5. 배포 완료되면 URL 확보: `https://dongne-server.onrender.com`
   - GraphQL HTTP: `https://dongne-server.onrender.com/graphql`
   - GraphQL WS: `wss://dongne-server.onrender.com/graphql`
> Free 인스턴스는 15분 미사용 시 잠들어 첫 요청이 느립니다(데모엔 무방).

---

## 4. Vercel — 프론트(Next.js) 배포 (필수)

### 해야 할 일: 프로젝트 임포트
1. https://vercel.com → GitHub로 로그인(무료).
2. **Add New → Project** → 같은 GitHub 리포 임포트.
3. 설정:
   - **Root Directory**: `apps/web`
   - Framework Preset: Next.js (자동 감지)
4. **Environment Variables** 추가:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_GRAPHQL_HTTP_URL` | `https://dongne-server.onrender.com/graphql` |
   | `NEXT_PUBLIC_GRAPHQL_WS_URL` | `wss://dongne-server.onrender.com/graphql` |
5. Deploy → `https://dongne-jangteo.vercel.app` 확보.
6. **다시 Render(3번)로 가서** `CORS_ORIGIN`을 이 Vercel URL로 바꾸고 재배포.

---

## ✅ 최종 체크리스트 (순서대로)
- [ ] 1-A. Supabase 프로젝트 → `DATABASE_URL`, `DIRECT_URL` 확보
- [ ] 0. `JWT_SECRET` 생성 → `apps/server/.env` 작성
- [ ] 1-B. `prisma:migrate` + `seed` 실행 (DB에 테이블·데이터 생성)
- [ ] 로컬 확인: `npm run dev:server` + `npm run dev:web` → http://localhost:3000/login 에서 데모 계정 로그인
- [ ] 2. GitHub 푸시
- [ ] 3. Render 백엔드 배포 + 환경변수
- [ ] 4. Vercel 프론트 배포 + 환경변수
- [ ] 3-후속. Render `CORS_ORIGIN`을 Vercel URL로 갱신
- [ ] 1-C. (3단계 시작 시) Supabase Storage 버킷 + anon 키

---

## 📌 내가(=Claude) 할 수 있는 것 / 없는 것
| 할 수 있음 | 못 함(위 로그인 필요) |
|---|---|
| 코드 작성, 스키마/리졸버, 로컬 빌드·타입체크 | Supabase/Render/Vercel/GitHub 계정 로그인 |
| `.env.example` 준비, 마이그레이션 명령 안내 | 실제 클라우드 프로젝트 생성·배포 버튼 클릭 |
| 로컬 DB만 있으면 `prisma migrate`·`seed`도 실행 가능 | 외부 URL/시크릿 발급 |

> 로컬에서 바로 돌려보고 싶으면, Supabase 연결 문자열만 주시면(또는 로컬 Postgres 띄우면)
> 제가 migrate·seed·dev 서버 실행까지 이어서 해드릴 수 있습니다.
