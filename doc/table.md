# SJCMS Database Table Structure

## Database: cms_dev_sf (PostgreSQL)

---

### admins - 관리자 계정
| Column           | Type      | Constraints          | Description |
|-----------------|-----------|----------------------|-------------|
| id              | SERIAL    | PK, AUTO INCREMENT   | 관리자 ID    |
| login_id        | VARCHAR   | UNIQUE, NOT NULL     | 로그인 아이디 |
| password        | VARCHAR   | NOT NULL             | 비밀번호 (bcrypt) |
| name            | VARCHAR   | NOT NULL             | 관리자 이름   |
| role            | VARCHAR   | DEFAULT 'admin'      | 역할 (super/admin) |
| is_active       | BOOLEAN   | DEFAULT true         | 계정 활성화 여부 |
| permissions     | TEXT      | DEFAULT 'all'        | 메뉴 접근 권한 (쉼표 구분, "all"=전체) |
| can_manage_admins| BOOLEAN  | DEFAULT false        | 계정관리 메뉴 접근 권한 |
| created_at      | TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at      | TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### admin_logs - 관리자 활동 로그
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 로그 ID      |
| admin_id  | INTEGER   | FK → admins.id, CASCADE | 관리자 ID  |
| action    | VARCHAR   | NOT NULL             | 활동 (로그인/계정생성/템플릿수정 등) |
| detail    | TEXT      | DEFAULT ''           | 상세 내용    |
| ip        | VARCHAR   | DEFAULT ''           | 접근 IP      |
| user_agent| TEXT      | DEFAULT ''           | 브라우저 정보 |
| created_at| TIMESTAMP | DEFAULT NOW()        | 활동일시     |

**설명**: 로그인, 메뉴 접근, 템플릿 수정 등 모든 관리자 활동 이력 기록.

---

### template_versions - 템플릿 버전 관리
| Column       | Type      | Constraints          | Description |
|-------------|-----------|----------------------|-------------|
| id          | SERIAL    | PK, AUTO INCREMENT   | 버전 ID      |
| template_id | INTEGER   | FK → templates.id, CASCADE | 템플릿 ID |
| version     | INTEGER   | NOT NULL             | 버전 번호    |
| html_content| TEXT      | NOT NULL             | HTML 스냅샷  |
| css_content | TEXT      | DEFAULT ''           | CSS 스냅샷   |
| js_content  | TEXT      | DEFAULT ''           | JS 스냅샷    |
| memo        | TEXT      | DEFAULT ''           | 버전 메모    |
| created_at  | TIMESTAMP | DEFAULT NOW()        | 생성일시     |

**설명**: 템플릿 수정 시 자동 백업. 이전 버전으로 복원 가능.

---

### template_folders - 디자인 세트(폴더) 관리
| Column      | Type      | Constraints          | Description |
|------------|-----------|----------------------|-------------|
| id         | SERIAL    | PK, AUTO INCREMENT   | 폴더 ID      |
| name       | VARCHAR   | NOT NULL             | 폴더 이름     |
| description| TEXT      | DEFAULT ''           | 설명          |
| color      | VARCHAR   | DEFAULT '#3182F6'    | 폴더 컬러     |
| sort_order | INTEGER   | DEFAULT 0            | 정렬 순서     |
| created_at | TIMESTAMP | DEFAULT NOW()        | 생성일시      |
| updated_at | TIMESTAMP | AUTO UPDATE          | 수정일시      |

**설명**: 디자인 세트별로 템플릿을 그룹화. .pen 파일 업로드 시 자동 생성.

---

### templates - 템플릿(컨테이너) 관리
| Column       | Type      | Constraints          | Description |
|-------------|-----------|----------------------|-------------|
| id          | SERIAL    | PK, AUTO INCREMENT   | 템플릿 ID    |
| name        | VARCHAR   | NOT NULL             | 템플릿 이름   |
| slug        | VARCHAR   | UNIQUE, NOT NULL     | URL 슬러그   |
| folder_id   | INTEGER   | FK → template_folders.id, NULLABLE | 소속 폴더 ID |
| category    | VARCHAR   | DEFAULT 'general'    | 카테고리 (header/footer/hero/content/banner/general) |
| html_content| TEXT      | NOT NULL             | HTML 소스코드 |
| css_content | TEXT      | DEFAULT ''           | CSS 소스코드  |
| js_content  | TEXT      | DEFAULT ''           | JS 소스코드   |
| thumbnail   | VARCHAR   | NULLABLE             | 썸네일 이미지  |
| is_original | BOOLEAN   | DEFAULT true         | 원본 여부 (true=원본, false=복제본) |
| source_id   | INTEGER   | FK → templates.id, NULLABLE | 원본 템플릿 ID (복제 시) |
| created_at  | TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at  | TIMESTAMP | AUTO UPDATE          | 수정일시     |

**관계**: self-referencing (source_id → id) - 원본/복제 관계 관리
**설명**: 템플릿 관리에서 등록된 원본(is_original=true)은 고유 소스. 메인/서브 페이지에서 사용 시 복제본(is_original=false) 생성.

---

### pages - 페이지 관리
| Column    | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 페이지 ID    |
| title     | VARCHAR   | NOT NULL             | 페이지 제목   |
| slug      | VARCHAR   | UNIQUE, NOT NULL     | URL 슬러그   |
| page_type | VARCHAR   | DEFAULT 'main'       | 페이지 타입 (main/sub) |
| is_active | BOOLEAN   | DEFAULT true         | 활성화 여부   |
| sort_order| INTEGER   | DEFAULT 0            | 정렬 순서    |
| created_at| TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

**설명**: main 타입은 1개(메인 페이지), sub 타입은 다수(서브 페이지, page?id=1, page?id=2...)

---

### page_sections - 페이지-섹션 매핑
| Column       | Type      | Constraints          | Description |
|-------------|-----------|----------------------|-------------|
| id          | SERIAL    | PK, AUTO INCREMENT   | 섹션 ID      |
| page_id     | INTEGER   | FK → pages.id, CASCADE | 페이지 ID    |
| template_id | INTEGER   | FK → templates.id    | 템플릿 ID (복제본) |
| sort_order  | INTEGER   | DEFAULT 0            | 정렬 순서    |
| is_active   | BOOLEAN   | DEFAULT true         | 섹션 활성화 여부 (on/off 토글) |
| is_fixed    | BOOLEAN   | DEFAULT false        | 상/하단 고정 여부 |
| fix_position| VARCHAR   | NULLABLE             | 고정 위치 (top/bottom) |
| html_content| TEXT      | DEFAULT ''           | 커스텀 HTML (섹션별 오버라이드) |
| css_content | TEXT      | DEFAULT ''           | 커스텀 CSS   |
| js_content  | TEXT      | DEFAULT ''           | 커스텀 JS    |
| created_at  | TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at  | TIMESTAMP | AUTO UPDATE          | 수정일시     |

**설명**: 페이지와 템플릿 복제본을 연결. 고정 섹션(is_fixed=true)은 서브 페이지 생성 시 자동 복제.

---

### banners - 배너 관리
| Column      | Type      | Constraints          | Description |
|------------|-----------|----------------------|-------------|
| id         | SERIAL    | PK, AUTO INCREMENT   | 배너 ID      |
| template_id| INTEGER   | FK → templates.id, CASCADE | 템플릿 ID  |
| slot_key   | VARCHAR   | NOT NULL             | 치환코드 키 (예: "1" → {{BANNER:1}}) |
| image_url  | VARCHAR   | NOT NULL             | 배너 이미지 URL |
| link_url   | VARCHAR   | NULLABLE             | 클릭 시 이동 URL |
| alt_text   | VARCHAR   | NULLABLE             | 이미지 대체 텍스트 |
| is_active  | BOOLEAN   | DEFAULT true         | 활성화 여부   |
| sort_order | INTEGER   | DEFAULT 0            | 정렬 순서    |
| created_at | TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at | TIMESTAMP | AUTO UPDATE          | 수정일시     |

**설명**: 템플릿 내 {{BANNER:N}} 치환코드에 매핑되는 배너 이미지 관리.

---

### system_settings - 시스템 설정
| Column     | Type      | Constraints          | Description |
|------------|-----------|----------------------|-------------|
| id         | SERIAL    | PK, AUTO INCREMENT   | 설정 ID      |
| key        | VARCHAR   | UNIQUE, NOT NULL     | 설정 키 (claude_api_key, claude_model 등) |
| value      | TEXT      | NOT NULL             | 설정 값      |
| created_at | TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at | TIMESTAMP | AUTO UPDATE          | 수정일시     |

**설명**: Claude API 키 등 시스템 설정값 저장. key-value 구조.

---

### boards - 게시판 관리
| Column       | Type      | Constraints          | Description |
|-------------|-----------|----------------------|-------------|
| id          | SERIAL    | PK, AUTO INCREMENT   | 게시판 ID    |
| board_id    | VARCHAR   | UNIQUE, NOT NULL     | 게시판 슬러그 (URL용) |
| name        | VARCHAR   | NOT NULL             | 게시판명     |
| board_type  | VARCHAR   | DEFAULT 'list'       | 유형 (list/album) |
| is_secret   | BOOLEAN   | DEFAULT false        | 비밀글 허용 여부 |
| use_comment | BOOLEAN   | DEFAULT true         | 댓글 허용 여부 |
| write_role  | VARCHAR   | DEFAULT 'admin'      | 글쓰기 권한 (admin/all) |
| list_role   | VARCHAR   | DEFAULT 'all'        | 리스트 권한 |
| read_role   | VARCHAR   | DEFAULT 'all'        | 글내용 권한 |
| comment_role| VARCHAR   | DEFAULT 'all'        | 댓글쓰기 권한 |
| custom_css  | TEXT      | DEFAULT ''           | 게시판별 커스텀 CSS |
| is_active   | BOOLEAN   | DEFAULT true         | 활성화 여부 |
| created_at  | TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at  | TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### posts - 게시글
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 게시글 ID    |
| board_id  | INTEGER   | FK → boards.id, CASCADE | 게시판 ID |
| title     | VARCHAR   | NOT NULL             | 제목         |
| content   | TEXT      | NOT NULL             | 내용         |
| author    | VARCHAR   | NOT NULL             | 작성자       |
| password  | VARCHAR   | NULLABLE             | 비밀글 비밀번호 |
| is_secret | BOOLEAN   | DEFAULT false        | 비밀글 여부   |
| view_count| INTEGER   | DEFAULT 0            | 조회수       |
| image_url | VARCHAR   | NULLABLE             | 이미지 URL (앨범형) |
| created_at| TIMESTAMP | DEFAULT NOW()        | 작성일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### comments - 댓글
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 댓글 ID      |
| post_id   | INTEGER   | FK → posts.id, CASCADE | 게시글 ID  |
| content   | TEXT      | NOT NULL             | 댓글 내용    |
| author    | VARCHAR   | NOT NULL             | 작성자       |
| created_at| TIMESTAMP | DEFAULT NOW()        | 작성일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### popups - 팝업 관리
| Column       | Type      | Constraints          | Description |
|-------------|-----------|----------------------|-------------|
| id          | SERIAL    | PK, AUTO INCREMENT   | 팝업 ID      |
| title       | VARCHAR   | NOT NULL             | 팝업 제목    |
| description | TEXT      | DEFAULT ''           | 팝업 설명/메모 |
| popup_type  | VARCHAR   | DEFAULT 'image'      | 유형 (image/html) |
| image_url   | VARCHAR   | NULLABLE             | 이미지 URL   |
| html_content| TEXT      | DEFAULT ''           | HTML 코드    |
| link_url    | VARCHAR   | NULLABLE             | 클릭 시 이동 URL |
| is_active   | BOOLEAN   | DEFAULT true         | 활성화 여부   |
| start_date  | TIMESTAMP | NULLABLE             | 노출 시작일   |
| end_date    | TIMESTAMP | NULLABLE             | 노출 종료일   |
| created_at  | TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at  | TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### faqs - FAQ 관리
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | FAQ ID       |
| question  | TEXT      | NOT NULL             | 질문         |
| answer    | TEXT      | NOT NULL             | 답변         |
| category  | VARCHAR   | DEFAULT '일반'       | 카테고리     |
| sort_order| INTEGER   | DEFAULT 0            | 정렬순서     |
| is_active | BOOLEAN   | DEFAULT true         | 활성화 여부   |
| created_at| TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### member_fields - 회원가입 필드 설정
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 필드 ID      |
| field_key | VARCHAR   | UNIQUE, NOT NULL     | 필드 키 (영문) |
| label     | VARCHAR   | NOT NULL             | 필드 라벨 (한글) |
| field_type| VARCHAR   | DEFAULT 'text'       | 타입 (text/email/phone/textarea/select/checkbox/radio) |
| required  | BOOLEAN   | DEFAULT false        | 필수 여부    |
| options   | TEXT      | DEFAULT ''           | 선택 옵션 (쉼표 구분, select/radio/checkbox용) |
| sort_order| INTEGER   | DEFAULT 0            | 정렬 순서    |
| is_active | BOOLEAN   | DEFAULT true         | 활성화 여부   |
| created_at| TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

**설명**: 회원가입 폼의 동적 필드 정의. 어드민에서 추가/수정/삭제 가능.

---

### members - 회원
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 회원 ID      |
| email     | VARCHAR   | UNIQUE, NOT NULL     | 이메일       |
| password  | VARCHAR   | NOT NULL             | 비밀번호 (bcrypt) |
| name      | VARCHAR   | NOT NULL             | 이름         |
| phone     | VARCHAR   | DEFAULT ''           | 연락처       |
| is_active | BOOLEAN   | DEFAULT true         | 활성화 여부   |
| extra_data| TEXT      | DEFAULT '{}'         | 동적 필드 데이터 (JSON) |
| created_at| TIMESTAMP | DEFAULT NOW()        | 가입일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

**설명**: 회원 정보. extra_data에 member_fields 기반 동적 필드값 JSON 저장.

---

### form_configs - 폼 설정 (상담/예약 등)
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 설정 ID      |
| form_type | VARCHAR   | UNIQUE, NOT NULL     | 폼 타입 (consultation/inquiry/reservation) |
| fields    | TEXT      | DEFAULT '[]'         | 필드 정의 JSON 배열 |
| is_active | BOOLEAN   | DEFAULT true         | 활성화 여부   |
| created_at| TIMESTAMP | DEFAULT NOW()        | 생성일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

**설명**: 상담/예약 신청 폼의 동적 필드 설정. [{key, label, type, required, options}] 형태.

---

### consultations - 상담 신청
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 상담 ID      |
| data      | TEXT      | DEFAULT '{}'         | 신청 데이터 (JSON) |
| status    | VARCHAR   | DEFAULT 'pending'    | 상태 (pending/processing/completed) |
| admin_memo| TEXT      | DEFAULT ''           | 관리자 메모   |
| created_at| TIMESTAMP | DEFAULT NOW()        | 신청일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### inquiries - 문의
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 문의 ID      |
| name      | VARCHAR   | NOT NULL             | 성함         |
| phone     | VARCHAR   | DEFAULT ''           | 연락처       |
| email     | VARCHAR   | DEFAULT ''           | 이메일       |
| content   | TEXT      | NOT NULL             | 문의 내용    |
| status    | VARCHAR   | DEFAULT 'pending'    | 상태         |
| admin_memo| TEXT      | DEFAULT ''           | 관리자 메모   |
| created_at| TIMESTAMP | DEFAULT NOW()        | 문의일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

### reservations - 예약
| Column     | Type      | Constraints          | Description |
|-----------|-----------|----------------------|-------------|
| id        | SERIAL    | PK, AUTO INCREMENT   | 예약 ID      |
| data      | TEXT      | DEFAULT '{}'         | 예약 데이터 (JSON) |
| status    | VARCHAR   | DEFAULT 'pending'    | 상태 (pending/processing/completed) |
| admin_memo| TEXT      | DEFAULT ''           | 관리자 메모   |
| created_at| TIMESTAMP | DEFAULT NOW()        | 예약일시     |
| updated_at| TIMESTAMP | AUTO UPDATE          | 수정일시     |

---

## CRM 테이블

### crm_leads - 리드 통합함
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 리드 ID |
| lead_type | VARCHAR | DEFAULT 'inquiry' | 유형 (inquiry/consultation/reservation/signup/manual) |
| customer_name | VARCHAR | NOT NULL | 고객명 |
| phone | VARCHAR | DEFAULT '' | 연락처 |
| email | VARCHAR | DEFAULT '' | 이메일 |
| company_name | VARCHAR | DEFAULT '' | 회사명 |
| content | TEXT | DEFAULT '' | 내용 |
| landing_page_url | VARCHAR | DEFAULT '' | 랜딩 페이지 URL |
| referrer_url | VARCHAR | DEFAULT '' | 리퍼러 URL |
| utm_source/medium/campaign | VARCHAR | DEFAULT '' | UTM 파라미터 |
| status_code | VARCHAR | DEFAULT 'new' | 상태 코드 |
| priority | VARCHAR | DEFAULT 'normal' | 우선순위 |
| assignee_id | INTEGER | FK → admins.id, NULLABLE | 담당자 |
| customer_id | INTEGER | FK → crm_customers.id, NULLABLE | 연결된 고객 |
| next_action_date | TIMESTAMP | NULLABLE | 다음 액션일 |

### crm_customers - 고객 카드
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | 고객 ID |
| customer_type | VARCHAR | DEFAULT 'individual' | 구분 (individual/corporate) |
| name | VARCHAR | NOT NULL | 이름 |
| company_name | VARCHAR | DEFAULT '' | 회사명 |
| phone/email | VARCHAR | DEFAULT '' | 연락처 |
| grade | VARCHAR | DEFAULT '일반' | 등급 |
| tags | TEXT | DEFAULT '' | 태그 (쉼표구분) |
| consent_sms/email | BOOLEAN | DEFAULT false | 수신동의 |
| main_assignee_id | INTEGER | FK → admins.id | 담당자 |
| expected_revenue | INTEGER | DEFAULT 0 | 예상매출 |
| is_blacklisted | BOOLEAN | DEFAULT false | 블랙리스트 |

### crm_consultations - 상담 관리
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 상담 ID |
| lead_id/customer_id | INTEGER | 연결된 리드/고객 |
| consult_type | VARCHAR | 유형 (phone/visit/kakao/email/video) |
| content/summary | TEXT | 상담 내용/요약 |
| needs/budget | VARCHAR | 고객 니즈/예산 |
| result | VARCHAR | 결과 (pending/success/hold/fail) |

### crm_followups - 후속 일정
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 일정 ID |
| title | VARCHAR | 제목 |
| task_type | VARCHAR | 유형 (call/quote/revisit/document/contract) |
| lead_id/customer_id | INTEGER | 연결된 리드/고객 |
| status | VARCHAR | 상태 (pending/completed/cancelled) |
| priority | VARCHAR | 우선순위 |
| due_date | TIMESTAMP | 마감일 |

### crm_lead_status_history - 리드 상태 변경 이력
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 이력 ID |
| lead_id | INTEGER | 리드 ID |
| from_status/to_status | VARCHAR | 변경 전/후 상태 |
| changed_by | INTEGER | 변경자 |

### crm_status_codes - 상태 코드 관리
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 코드 ID |
| code | VARCHAR | 코드 (unique) |
| label | VARCHAR | 라벨 |
| color | VARCHAR | 색상 |
| is_default/is_final | BOOLEAN | 기본값/종료상태 |

### crm_deals - 영업 파이프라인
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 딜 ID |
| title | VARCHAR | 딜 제목 |
| customer_id/lead_id | INTEGER | 연결된 고객/리드 |
| stage | VARCHAR | 단계 |
| amount | INTEGER | 금액 |
| probability | INTEGER | 확률(%) |
| won_lost | VARCHAR | Won/Lost |
| lost_reason | VARCHAR | 실패 사유 |

### crm_quotes - 견적 관리
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 견적 ID |
| deal_id | INTEGER | 딜 ID |
| quote_number | VARCHAR | 견적 번호 (Q-YYYY-XXX) |
| items | TEXT | 항목 JSON |
| total_amount | INTEGER | 총액 |
| status | VARCHAR | 상태 (draft/sent/accepted/rejected) |

### crm_contracts - 계약 관리
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 계약 ID |
| deal_id | INTEGER | 딜 ID |
| contract_number | VARCHAR | 계약 번호 (C-YYYY-XXX) |
| amount | INTEGER | 금액 |
| start_date/end_date | TIMESTAMP | 계약 기간 |
| status | VARCHAR | 상태 (draft/active/completed/cancelled) |

### crm_campaigns - 캠페인 관리
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | 캠페인 ID |
| name | VARCHAR | 캠페인명 |
| campaign_type | VARCHAR | 유형 (email/sms/push) |
| status | VARCHAR | 상태 (draft/scheduled/sent/completed) |
| sent/open/click/convert_count | INTEGER | 발송/오픈/클릭/전환 수 |
