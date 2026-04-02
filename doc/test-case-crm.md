# CRM 테스트 케이스

## 테스트 일시: 2026-04-02

---

## 1. API 검수

### 1.1 CRM Dashboard API
- [x] TC-CD01: GET /api/crm/dashboard → totalLeads=5, totalCustomers=3, totalDeals=2 → PASS

### 1.2 리드 API
- [x] TC-CL01: GET /api/crm/leads → 5 leads → PASS
- [x] TC-CL02: GET /api/crm/leads?status=new → 필터 동작 → PASS
- [x] TC-CL03: GET /api/crm/leads/1 → 상세 (customer, assignee, consultations 포함) → PASS

### 1.3 고객 API
- [x] TC-CC01: GET /api/crm/customers → 3 customers → PASS
- [x] TC-CC02: GET /api/crm/customers/1 → 상세 (leads, deals 포함) → PASS

### 1.4 상담 API
- [x] TC-CS01: GET /api/crm/consultations → 2 consultations → PASS

### 1.5 후속일정 API
- [x] TC-CF01: GET /api/crm/followups → 3 followups → PASS

### 1.6 상태코드 API
- [x] TC-CSC01: GET /api/crm/status-codes → 8 codes → PASS

### 1.7 딜 API
- [x] TC-CDL01: GET /api/crm/deals → 2 deals → PASS
- [x] TC-CDL02: GET /api/crm/deals/1 → 상세 (quotes, contracts 포함) → PASS

### 1.8 견적 API
- [x] TC-CQ01: GET /api/crm/quotes → 4 quotes → PASS

### 1.9 계약 API
- [x] TC-CT01: GET /api/crm/contracts → 4 contracts → PASS

### 1.10 캠페인 API
- [x] TC-CM01: GET /api/crm/campaigns → 1 campaign → PASS

---

## 2. 페이지 검수 (200 OK)

### 2.1 CRM 페이지
- [x] TC-PG01: /crm/dashboard → 200 → PASS
- [x] TC-PG02: /crm/leads → 200 → PASS
- [x] TC-PG03: /crm/leads/1 → 200 → PASS
- [x] TC-PG04: /crm/customers → 200 → PASS
- [x] TC-PG05: /crm/customers/1 → 200 → PASS
- [x] TC-PG06: /crm/consultations → 200 → PASS
- [x] TC-PG07: /crm/followups → 200 → PASS
- [x] TC-PG08: /crm/status-codes → 200 → PASS
- [x] TC-PG09: /crm/deals → 200 → PASS
- [x] TC-PG10: /crm/deals/1 → 200 → PASS
- [x] TC-PG11: /crm/quotes → 200 → PASS
- [x] TC-PG12: /crm/contracts → 200 → PASS
- [x] TC-PG13: /crm/campaigns → 200 → PASS
- [x] TC-PG14: /crm/campaigns/1 → 200 → PASS
- [x] TC-PG15: /crm/analytics → 200 → PASS

### 2.2 기존 CMS 페이지 (비파괴 확인)
- [x] TC-CMS01: /dashboard → 200 → PASS
- [x] TC-CMS02: /design/main-page → 200 → PASS
- [x] TC-CMS03: /boards → 200 → PASS
- [x] TC-CMS04: /members → 200 → PASS
- [x] TC-CMS05: /faq → 200 → PASS
- [x] TC-CMS06: / (메인) → 200 → PASS
- [x] TC-CMS07: /plugins → 200 → PASS

---

## 3. 더미 데이터 확인

| 테이블 | 건수 | 상태 |
|--------|------|------|
| crm_leads | 5 | ✅ |
| crm_customers | 3 | ✅ |
| crm_consultations | 2 | ✅ |
| crm_followups | 3 | ✅ |
| crm_status_codes | 8 | ✅ |
| crm_deals | 2 | ✅ |
| crm_quotes | 4 | ✅ |
| crm_contracts | 4 | ✅ |
| crm_campaigns | 1 | ✅ |

---

## 4. 사이드바 메뉴 확인
- [x] CMS/CRM 토글 동작 → PASS
- [x] CRM 메뉴: 대시보드, 리드CRM(5개), 세일즈CRM(3개), 마케팅CRM(2개), 환경설정(3개) → PASS
- [x] CMS 메뉴: 기존 메뉴 그대로 유지 → PASS
