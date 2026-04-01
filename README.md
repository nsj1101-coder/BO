# SJCMS - Smart CMS Admin v0.001

범용 CMS 어드민 시스템. 어떤 디자인이든 녹아들 수 있는 확장 가능한 콘텐츠 관리 시스템.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript, React 19 |
| 스타일링 | Tailwind CSS 4, inline styles (유저 페이지) |
| ORM | Prisma 7 + PostgreSQL |
| 인증 | JWT (httpOnly cookie) + bcrypt |
| 디자인 연동 | Pencil MCP (.pen 파일 → 코드 변환) |
| AI 연동 | Anthropic Claude API (템플릿 자동 생성) |

## 프로젝트 구조

```
admin/
├── prisma/
│   └── schema.prisma          # DB 스키마 (20개 모델)
├── doc/
│   ├── table.md               # 테이블 구조 문서
│   ├── cms_config.md          # CMS 기획 문서
│   └── pen/                   # .pen 디자인 파일
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 클라이언트
│   │   ├── auth.ts            # JWT 인증 (signToken, verifyToken, getSession)
│   │   ├── log.ts             # 활동 로그 기록
│   │   ├── pen-parser.ts      # .pen 파일 구조 파서
│   │   └── pencil-mcp-client.ts  # Pencil MCP HTTP 클라이언트
│   └── app/
│       ├── (auth)/login/       # 어드민 로그인
│       ├── (admin)/            # 어드민 페이지 (사이드바 레이아웃)
│       │   ├── dashboard/
│       │   ├── design/         # 디자인 설정
│       │   ├── boards/         # 게시판 관리
│       │   ├── faq/            # FAQ 관리
│       │   ├── popups/         # 팝업 관리
│       │   ├── consultations/  # 상담 관리
│       │   ├── inquiries/      # 문의 관리
│       │   ├── reservations/   # 예약 관리
│       │   ├── members/        # 회원 관리
│       │   ├── admin-accounts/ # 계정 관리
│       │   └── settings/       # 시스템 설정
│       ├── (front)/            # 유저 페이지 (브랜드 무관 범용 디자인)
│       │   ├── preview/        # 서브 페이지 미리보기
│       │   ├── board/          # 게시판 (리스트형/앨범형)
│       │   ├── user-faq/       # FAQ
│       │   ├── register/       # 회원가입
│       │   ├── user-login/     # 유저 로그인
│       │   ├── consultation/   # 상담 신청
│       │   ├── inquiry/        # 문의하기
│       │   └── reservation/    # 예약 신청
│       ├── api/                # REST API (50개 라우트)
│       └── page.tsx            # 메인 페이지 (/) + 팝업
```

---

## 데이터베이스 구조 (20개 테이블)

### ERD (테이블 관계도)

```
admins ─────────< admin_logs
   │
   └─ role: super/admin
      permissions: 메뉴별 접근 제어
      can_manage_admins: 계정관리 접근

template_folders ───< templates ──< template_versions
                        │  │  │
                        │  │  └──< banners ({{BANNER:N}} 치환)
                        │  │
                        │  └─ self-ref (source_id → id, 원본/복제 관계)
                        │
                        └──< page_sections >── pages
                                │
                                └─ isFixed: true → 서브페이지에 자동 포함

boards ──< posts ──< comments
   │
   └─ boardType: list/album
      customCss: 게시판별 CSS
      권한: writeRole, listRole, readRole, commentRole

members (extraData: JSON) ←─ member_fields (동적 필드 정의)

form_configs (formType별 동적 폼 정의)
   │
   ├── consultations.data (JSON)
   └── reservations.data (JSON)

inquiries (고정 필드: name, phone, email, content)

popups (이미지/HTML, 기간 설정)
faqs (카테고리별, 아코디언)
system_settings (key-value, Claude API 키 등)
```

### 테이블별 역할

| 테이블 | 역할 | 주요 관계 |
|--------|------|-----------|
| `admins` | 관리자 계정 | → admin_logs |
| `admin_logs` | 관리자 활동 이력 (로그인, 수정 등) | ← admins |
| `template_folders` | 디자인 세트(폴더) 그룹화 | → templates |
| `templates` | HTML/CSS/JS 템플릿 (컨테이너) | ← template_folders, → page_sections, banners, template_versions, self-ref(clones) |
| `template_versions` | 템플릿 버전 히스토리 (자동 백업) | ← templates |
| `pages` | 메인/서브 페이지 | → page_sections |
| `page_sections` | 페이지-템플릿 매핑 (순서, 고정, on/off) | ← pages, templates |
| `banners` | 배너 이미지 ({{BANNER:N}} 치환) | ← templates |
| `system_settings` | 시스템 설정 (key-value) | 독립 |
| `boards` | 게시판 설정 | → posts |
| `posts` | 게시글 | ← boards, → comments |
| `comments` | 댓글 | ← posts |
| `popups` | 팝업 (이미지/HTML, 노출 기간) | 독립 |
| `faqs` | 자주 묻는 질문 | 독립 |
| `member_fields` | 회원가입 동적 필드 정의 | 독립 (members.extraData와 연동) |
| `members` | 회원 | 독립 (extraData에 동적 필드 JSON) |
| `form_configs` | 폼 설정 (상담/예약 동적 필드) | 독립 |
| `consultations` | 상담 신청 | 독립 (data에 폼 데이터 JSON) |
| `inquiries` | 문의 | 독립 |
| `reservations` | 예약 신청 | 독립 (data에 폼 데이터 JSON) |

---

## 기능 정의

### 1. 디자인 설정

#### 1.1 메인 페이지 관리 (`/design/main-page`)
- **사용 테이블**: `pages`, `page_sections`, `templates`, `banners`
- **기능**: 메인 페이지의 섹션(템플릿) 추가/삭제/순서변경/on·off
- **상/하단 고정**: `page_sections.isFixed=true` → 서브페이지/게시판/FAQ 등에 자동 포함
- **배너 치환**: `{{BANNER:N}}` → `banners` 테이블에서 이미지 URL 치환
  - `url('{{BANNER:1}}')` → 배경 이미지 URL로 치환
  - `{{BANNER:1}}` (일반) → `<img>` 태그로 치환
- **드래그앤드랍**: 전체 행 드래그, 고스트 이미지 + 파란 하이라이트 효과

#### 1.2 서브 페이지 관리 (`/design/sub-page`)
- **사용 테이블**: `pages`, `page_sections`, `templates`
- **기능**: 서브 페이지 CRUD, 페이지별 on/off, 섹션 관리
- **정책**: 서브 페이지 생성 시 메인의 `isFixed=true` 섹션 자동 복제
- **미리보기**: `/preview?id=N`으로 실제 렌더링 확인

#### 1.3 템플릿 관리 (`/design/templates`)
- **사용 테이블**: `templates`, `template_folders`, `template_versions`, `banners`
- **2단계 뷰**: 폴더 리스트 → 폴더 내 템플릿 리스트 (좌측) + 미리보기 (우측)
- **코드 에디터**: `/design/templates/[id]` 에서 HTML/CSS/JS 편집 + 실시간 미리보기
- **버전 관리**: 저장 시 자동 백업, 이전 버전 미리보기/복원 가능 (`template_versions`)
- **원본/복제 정책**:
  - `templates.isOriginal=true`: 폴더에서 관리하는 원본
  - `templates.isOriginal=false`: 페이지에 등록 시 생성되는 복제본 (source_id로 원본 참조)
- **서브 페이지 생성**: 폴더의 모든 템플릿을 서브 페이지 섹션으로 한번에 등록

#### 1.4 팝업 관리 (`/popups`)
- **사용 테이블**: `popups`
- **유형**: 이미지 / HTML
- **노출 정책**: `isActive=true` + `startDate/endDate` 기간 체크
- **유저 노출**: `/` (메인 페이지) 접속 시 활성 팝업 자동 표시
- **"오늘 하루 안 보기"**: localStorage에 24시간 저장

#### 1.5 .pen 파일 업로드
- **사용 테이블**: `templates`, `template_folders`, `system_settings`
- **프로세스**: .pen 업로드 → Pencil MCP로 구조 읽기 → Claude API로 HTML 변환 → 템플릿 자동 생성
- **필요 설정**: `/settings`에서 Claude API 키 등록
- **실시간 로그**: SSE 스트리밍으로 분석 단계별 진행상황 표시

### 2. 운영 관리

#### 2.1 게시판 관리 (`/boards`)
- **사용 테이블**: `boards`, `posts`, `comments`
- **게시판 유형**: 리스트형(`list`) / 앨범형(`album`)
- **권한 설정**: 글쓰기/리스트/글내용/댓글쓰기 각각 `admin`/`all` 설정
- **커스텀 CSS**: 게시판별 독립 CSS 적용 (풀스크린 에디터 + 실시간 미리보기)
- **비밀글**: `isSecret=true`, 비밀번호 설정
- **유저 페이지**: `/board/[boardId]` (리스트형: 토스 공지 스타일, 앨범형: 토스피드 카드 스타일)
- **게시글 상세**: `/board/[boardId]/[postId]` (댓글 포함)

#### 2.2 FAQ 관리 (`/faq`)
- **사용 테이블**: `faqs`
- **기능**: CRUD, 카테고리 분류, 순서 변경, 활성/비활성
- **유저 페이지**: `/user-faq` (토스 고객센터 스타일 아코디언)

#### 2.3 상담 신청 관리 (`/consultations`)
- **사용 테이블**: `consultations`, `form_configs`
- **동적 폼**: `/consultations/settings`에서 폼 필드 구성 → 유저 페이지에 자동 반영
- **상태 관리**: 대기(pending) → 처리중(processing) → 완료(completed)
- **관리자 메모**: 내부 메모 기능
- **유저 페이지**: `/consultation`

#### 2.4 문의 관리 (`/inquiries`)
- **사용 테이블**: `inquiries`
- **고정 필드**: 성함, 연락처, 이메일, 문의 내용
- **상태/메모**: 상담과 동일
- **유저 페이지**: `/inquiry`

#### 2.5 예약 관리 (`/reservations`)
- **사용 테이블**: `reservations`, `form_configs`
- **동적 폼**: 상담 신청과 동일한 패턴
- **유저 페이지**: `/reservation`

#### 2.6 계정 관리 (`/admin-accounts`)
- **사용 테이블**: `admins`, `admin_logs`
- **접근 제한**: `role=super` 또는 `canManageAdmins=true`만 접근
- **기능**: 계정 CRUD, 역할(super/admin), 메뉴별 권한, 활성/비활성
- **활동 로그**: 로그인 IP/시간, 템플릿 수정, 계정 변경 등 모든 활동 기록
- **상세 페이지**: 계정 정보 + 활동 로그 테이블

### 3. 회원 관리

#### 3.1 회원가입 설정 (`/members/settings`)
- **사용 테이블**: `member_fields`
- **동적 필드**: text, email, phone, textarea, select, checkbox, radio
- **필수값 설정**: 필드별 required 토글
- **옵션**: select/radio/checkbox용 쉼표 구분 옵션

#### 3.2 회원 리스트 (`/members`)
- **사용 테이블**: `members`, `member_fields`
- **검색**: 이름, 이메일, 연락처
- **엑셀 다운로드**: CSV 내보내기 (동적 필드 포함)
- **페이지네이션**: 기본 20명

#### 3.3 회원 상세 (`/members/[id]`)
- **사용 테이블**: `members`, `member_fields`
- **정책**: 삭제된 필드의 데이터도 유지 (회색/이탤릭 표시)
- **extraData**: JSON으로 동적 필드값 저장

#### 3.4 유저 회원가입/로그인
- **회원가입**: `/register` (동적 필드 자동 렌더링)
- **로그인**: `/user-login` (JWT 쿠키: `member_token`)
- **가입 완료**: `/register-complete`

### 4. 시스템 설정 (`/settings`)
- **사용 테이블**: `system_settings`
- **Claude API 키**: .pen 파일 자동 분석에 사용
- **모델 선택**: Sonnet 4 / Opus 4 / Haiku 4.5
- **연결 테스트**: 실제 API 호출 확인

---

## 권한 체계

```
super (최고 관리자)
├── 모든 메뉴 접근
├── 계정 관리 접근
├── 삭제 불가 (보호)
└── 최초 시드: admin / admin1234

admin (일반 관리자)
├── permissions 필드로 메뉴 접근 제어
│   ├── "all" → 전체 접근
│   └── "dashboard,boards,faq" → 해당 메뉴만
├── canManageAdmins → 계정 관리 접근 허용/제한
└── isActive → 계정 활성/비활성
```

사이드바 메뉴는 권한에 따라 자동 필터링됩니다.

---

## 유저 페이지 정책

### 상/하단 고정 템플릿
메인 페이지에서 `isFixed=true`로 설정된 섹션(헤더, 푸터 등)은 아래 유저 페이지에 자동 포함:
- `/board/[boardId]` (게시판)
- `/board/[boardId]/[postId]` (게시글 상세)
- `/user-faq` (FAQ)
- `/register`, `/user-login` (회원가입/로그인)
- `/consultation`, `/inquiry`, `/reservation` (상담/문의/예약)

### 디자인 원칙
- **배경**: 순백 `#fff` (어떤 브랜드에도 호환)
- **텍스트**: `#191f28` (다크), `#333d4b` (본문), `#8b95a1` (보조)
- **포인트**: `#3182f6` (토스 블루)
- **폰트**: Pretendard
- **참고**: 토스(toss.im), 숨고(soomgo.com) 디자인 스타일

---

## URL 구조

### 어드민 (로그인 필요)
| URL | 기능 |
|-----|------|
| `/login` | 어드민 로그인 |
| `/dashboard` | 대시보드 |
| `/design/main-page` | 메인 페이지 관리 |
| `/design/sub-page` | 서브 페이지 관리 |
| `/design/templates` | 템플릿 관리 (폴더/리스트) |
| `/design/templates/[id]` | 템플릿 코드 편집 + 버전 관리 |
| `/popups` | 팝업 관리 |
| `/boards` | 게시판 관리 |
| `/boards/[id]` | 게시글 관리 |
| `/faq` | FAQ 관리 |
| `/consultations` | 상담 리스트 |
| `/consultations/settings` | 상담 폼 설정 |
| `/consultations/[id]` | 상담 상세 |
| `/inquiries` | 문의 리스트 |
| `/inquiries/[id]` | 문의 상세 |
| `/reservations` | 예약 리스트 |
| `/reservations/settings` | 예약 폼 설정 |
| `/reservations/[id]` | 예약 상세 |
| `/members` | 회원 리스트 |
| `/members/settings` | 회원가입 설정 |
| `/members/[id]` | 회원 상세 |
| `/admin-accounts` | 계정 관리 |
| `/admin-accounts/[id]` | 계정 상세 + 활동 로그 |
| `/settings` | 시스템 설정 (Claude API) |

### 유저 (공개)
| URL | 기능 |
|-----|------|
| `/` | 메인 페이지 + 팝업 |
| `/preview?id=N` | 서브 페이지 |
| `/board/[boardId]` | 게시판 (리스트형/앨범형) |
| `/board/[boardId]/[postId]` | 게시글 상세 |
| `/user-faq` | FAQ |
| `/register` | 회원가입 |
| `/user-login` | 유저 로그인 |
| `/register-complete` | 가입 완료 |
| `/consultation` | 상담 신청 |
| `/inquiry` | 문의하기 |
| `/reservation` | 예약 신청 |

---

## 실행 방법

```bash
# 의존성 설치
npm install

# DB 생성 (PostgreSQL)
createdb cms_dev_sf

# 스키마 푸시
npx prisma db push --url "postgresql://USER@localhost:5432/cms_dev_sf"

# Prisma 클라이언트 생성
npx prisma generate

# 시드 데이터 (admin / admin1234)
npx tsx prisma/seed.ts

# 개발 서버
npm run dev
```

기본 관리자: `admin` / `admin1234` (role: super)

---

## API 구조 (50개 라우트)

### 인증
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/auth/login` | - | 어드민 로그인 |
| POST | `/api/auth/logout` | - | 로그아웃 |
| GET | `/api/auth/me` | admin | 현재 세션 |
| POST | `/api/auth/register` | - | 유저 회원가입 |
| POST | `/api/auth/user-login` | - | 유저 로그인 |

### 디자인
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET/POST | `/api/templates` | admin | 템플릿 CRUD |
| GET/PUT/DELETE | `/api/templates/[id]` | admin | 템플릿 상세 (PUT 시 자동 버전 백업) |
| GET/POST | `/api/templates/[id]/versions` | admin | 버전 조회/복원 |
| GET/POST | `/api/folders` | admin | 폴더 CRUD |
| PUT/DELETE | `/api/folders/[id]` | admin | 폴더 수정/삭제 |
| GET/POST | `/api/pages` | admin | 페이지 CRUD |
| PUT/DELETE | `/api/pages/[id]` | admin | 페이지 수정/삭제 |
| POST | `/api/pages/[id]/sections` | admin | 섹션 추가 |
| PATCH/DELETE | `/api/pages/[id]/sections/[sectionId]` | admin | 섹션 수정/삭제 |
| PUT | `/api/pages/[id]/sections/reorder` | admin | 섹션 순서 변경 |
| GET/POST | `/api/banners` | admin | 배너 CRUD |
| PUT/DELETE | `/api/banners/[id]` | admin | 배너 수정/삭제 |
| GET | `/api/front` | - | 메인/서브 페이지 렌더링 데이터 |
| GET | `/api/front/fixed-sections` | - | 고정 섹션 HTML |

### 운영
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET/POST | `/api/boards` | admin(GET), admin(POST) | 게시판 |
| GET/PUT/DELETE | `/api/boards/[id]` | admin | 게시판 상세 |
| GET/POST | `/api/posts` | -/- | 게시글 (GET은 공개) |
| GET/PUT/DELETE | `/api/posts/[id]` | admin(PUT,DELETE) | 게시글 상세 |
| POST/DELETE | `/api/posts/[id]/comments` | - | 댓글 |
| GET/POST | `/api/popups` | admin | 팝업 |
| PUT/DELETE | `/api/popups/[id]` | admin | 팝업 수정/삭제 |
| GET | `/api/popups/active` | - | 활성 팝업 조회 |
| GET/POST | `/api/faqs` | admin(POST) | FAQ |
| PUT/DELETE | `/api/faqs/[id]` | admin | FAQ 수정/삭제 |
| GET/PUT | `/api/settings` | admin | 시스템 설정 |
| POST | `/api/settings/test` | admin | Claude API 연결 테스트 |

### 회원
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET/POST | `/api/member-fields` | admin | 회원 필드 설정 |
| PUT/DELETE | `/api/member-fields/[id]` | admin | 필드 수정/삭제 |
| GET | `/api/members` | admin | 회원 리스트 (검색/페이지네이션) |
| GET/PUT/DELETE | `/api/members/[id]` | admin | 회원 상세 |
| GET | `/api/members/export` | admin | CSV 내보내기 |

### 상담/문의/예약
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET/POST | `/api/consultations` | admin(GET), -(POST) | 상담 |
| GET/PUT/DELETE | `/api/consultations/[id]` | admin | 상담 상세 |
| GET/POST | `/api/inquiries` | admin(GET), -(POST) | 문의 |
| GET/PUT/DELETE | `/api/inquiries/[id]` | admin | 문의 상세 |
| GET/POST | `/api/reservations` | admin(GET), -(POST) | 예약 |
| GET/PUT/DELETE | `/api/reservations/[id]` | admin | 예약 상세 |
| GET/PUT | `/api/form-configs/[formType]` | -(GET), admin(PUT) | 폼 설정 |

### 계정
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET/POST | `/api/admins` | super/canManage | 관리자 계정 |
| GET/PUT/DELETE | `/api/admins/[id]` | super/canManage | 계정 상세 |
| GET | `/api/admins/[id]/logs` | super/canManage | 활동 로그 |
