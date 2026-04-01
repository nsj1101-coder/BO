# SJCMS 기능 테스트 케이스

## 테스트 일시: 2026-04-01

## 1. 예약 관리

### 1.1 예약 설정 (/reservations/settings)
- [x] TC-R01: 필드 추가 (key:name, label:이름, type:text, required:true) → PASS
- [x] TC-R02: 필드 추가 (key:phone, label:연락처, type:phone, required:true) → PASS
- [x] TC-R03: 필드 추가 (key:date, label:희망 날짜, type:text, required:true) → PASS
- [x] TC-R04: 필드 수정 → PASS
- [x] TC-R05: 필드 순서 변경 → PASS
- [x] TC-R06: 설정 조회 (4개 필드 유지) → PASS

### 1.2 유저 예약 페이지 (/reservation)
- [x] TC-R07: 설정한 필드 폼 노출 → PASS (key→fieldName 매핑 수정 후)
- [x] TC-R08: 필수 필드 체크 → PASS
- [x] TC-R09: 제출 → 성공 (id=1) → PASS
- [x] TC-R10: 상/하단 고정 템플릿 노출 → PASS

### 1.3 어드민 예약 리스트 (/reservations)
- [x] TC-R11: 리스트 노출 (1건) → PASS
- [x] TC-R12: 상태 필터 → PASS

### 1.4 어드민 예약 상세 (/reservations/[id])
- [x] TC-R13: 제출 데이터 노출 → PASS
- [x] TC-R14: 상태 변경 (pending→processing) → PASS
- [x] TC-R15: 관리자 메모 저장 → PASS

## 2. 상담 관리

### 2.1 상담 설정 (/consultations/settings)
- [x] TC-C01: 필드 추가 (4개: 성함, 연락처, 상담주제(select), 상담내용) → PASS
- [x] TC-C02: 새로고침 후 유지 → PASS

### 2.2 유저 상담 페이지 (/consultation)
- [x] TC-C03: 설정 필드 폼 노출 → PASS (key→fieldName 매핑 수정 후)
- [x] TC-C04: 제출 → 성공 → PASS
- [x] TC-C05: 상/하단 고정 템플릿 → PASS

### 2.3 어드민 상담 리스트 (/consultations)
- [x] TC-C06: 리스트 노출 (2건) → PASS
- [x] TC-C07: 사용자 페이지 바로가기 → PASS

### 2.4 어드민 상담 상세 (/consultations/[id])
- [x] TC-C08: 제출 데이터 노출 → PASS (JSON 문자열 파싱 수정 후)
- [x] TC-C09: 상태 변경 + 메모 저장 → PASS

## 3. 문의 관리

### 3.1 유저 문의 페이지 (/inquiry)
- [x] TC-I01: 성함/연락처/이메일/문의내용 폼 → PASS
- [x] TC-I02: 제출 → 성공 → PASS
- [x] TC-I03: 상/하단 고정 템플릿 → PASS

### 3.2 어드민 문의 리스트 (/inquiries)
- [x] TC-I04: 리스트 노출 (2건) → PASS
- [x] TC-I05: 사용자 페이지 바로가기 → PASS

### 3.3 어드민 문의 상세 (/inquiries/[id])
- [x] TC-I06: 필드 노출 → PASS
- [x] TC-I07: 상태 변경 (completed) + 메모 ("답변 완료") → PASS

## 4. 회원 관리

### 4.1 회원가입 설정 (/members/settings)
- [x] TC-M01: 동적 필드 추가 (회사명) → PASS
- [x] TC-M02: 필드 수정/삭제 → PASS

### 4.2 유저 회원가입 (/register)
- [x] TC-M03: 기본+동적 필드 노출 → PASS (fieldKey→fieldName 매핑 수정 후)
- [x] TC-M04: 가입 성공 → PASS
- [x] TC-M05: 중복 이메일 → "이미 사용 중인 이메일입니다." → PASS

### 4.3 유저 로그인 (/user-login)
- [x] TC-M06: 로그인 성공 → PASS
- [x] TC-M07: 잘못된 비밀번호 → 에러 메시지 → PASS
- [x] TC-M08: 상/하단 고정 템플릿 → PASS

### 4.4 어드민 회원 리스트 (/members)
- [x] TC-M09: 리스트 노출 (2명) → PASS
- [x] TC-M10: 검색 → PASS (URL 인코딩 필요)
- [x] TC-M11: CSV 다운로드 → PASS
- [x] TC-M12: 상세 버튼 → /members/[id] → PASS

### 4.5 어드민 회원 상세 (/members/[id])
- [x] TC-M13: extraData 파싱 → dict 타입 → PASS (이중 JSON 문자열 수정 후)
- [x] TC-M14: 삭제된 필드 데이터 유지 → PASS

## 수정 이력

| 날짜 | 문제 | 원인 | 수정 |
|------|------|------|------|
| 2026-04-01 | API data.data → undefined | API 키 불일치 | data.members 등으로 수정 |
| 2026-04-01 | form-configs 404 | 설정 없을 때 에러 | 자동 생성으로 변경 |
| 2026-04-01 | fields JSON 문자열 파싱 | DB TEXT 타입 | JSON.parse 추가 |
| 2026-04-01 | 유저 폼 필드 안 보임 | key→fieldName 불일치 | 매핑 변환 추가 |
| 2026-04-01 | extraData 이중 JSON | register API 이중 stringify | typeof 체크 추가 |
| 2026-04-01 | Object.entries 에러 | data 문자열에 직접 호출 | JSON.parse 추가 |
| 2026-04-01 | form-configs PUT 저장 안됨 | 배열→문자열 변환 안됨 | API에서 자동 stringify |
