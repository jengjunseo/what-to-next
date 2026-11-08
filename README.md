# What to Next

흩어진 학교생활 기록을 연결해 다음 탐구의 방향을 제안하는 AI 도구입니다. 학생은 연결고리를 뒷받침하는 원문과 다음 활동 제안을 보고 직접 판단을 남길 수 있습니다.

## 실행 환경

| 환경 | 기능 | 저장 위치 |
| --- | --- | --- |
| GPT Sites 비공개 배포 | 가상 기록 CRUD, 연결 지도와 타임라인, 고정 응답·Gemini, 판단 변경, 분석 비교 | 이 브라우저 |
| 로컬 `/demo` | 같은 가상 기록 체험 | 이 브라우저 |
| 로컬 `/review-studio` | 독립 가상 데이터, 오류 재현, 진단, 평가와 검수 메모, 실제 테스트 결과 | 이 브라우저 및 로컬 테스트 결과 파일 |
| 로컬 `/` | 기존 단일 사용자 실제 기록과 분석 | 설정한 PostgreSQL |

### DB와 API 키 없이 체험

Node.js 24 LTS에서 다음 명령을 실행합니다.

```bash
npm ci
npm run dev -- --hostname 127.0.0.1
```

[학생용 가상 기록](http://127.0.0.1:3000/demo)과 [Review Studio](http://127.0.0.1:3000/review-studio)를 엽니다. Review Studio는 Next.js 개발 실행에서만 열립니다. Sites 배포에는 학생용 가상 데이터 화면만 제공됩니다. 두 로컬 화면의 저장소는 분리되어 있고, 어느 쪽도 PostgreSQL을 사용하지 않습니다.

### Gemini와 기존 개인 작업 공간

로컬 Gemini 실분석을 사용하려면 무시된 `.env.local`에 `GEMINI_API_KEY`를 설정하고 개발 서버를 재시작합니다. 모델은 `gemini-3.5-flash-lite`입니다. 실분석을 선택하면 화면의 가상 기록과 메모가 Google Gemini로 전송됩니다. Sites에서는 런타임 비밀 변수 `GEMINI_API_KEY`를 사용합니다.

개인 작업 공간이 필요하면 `.env.example`을 `.env.local`로 복사하고 `DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`을 설정합니다. 별도 개발용 PostgreSQL을 가리키는지 확인한 후 `npm run db:migrate`를 실행하고 `/login`에서 접속합니다. 분석은 실제 기록 ID를 참조하며 JSON/Zod 스키마와 근거 검증을 통과한 결과만 저장합니다. 원문은 실행 당시 스냅샷에서 조회합니다. 새 분석이 실패해도 저장된 결과는 보존되며 수동 판단은 분석의 판단과 별도로 유지됩니다. [설계 기록](docs/adr/001-analysis-architecture.md)

## 5–10분 인간 검수

1. `/demo`에서 **과목을 넘는 탐구**를 고릅니다. 과목 필터를 바꾸고 가상 기록을 하나 추가한 뒤 수정하고 삭제합니다.
2. **고정 응답 → 분석 실행**으로 지도를 엽니다. **정보 #103**을 선택해 센서 기록 원문을 확인하고 **타임라인**으로 전환합니다. **내 판단**을 KEEP으로 바꿔 분석의 원래 판단이 옆에 남는지 확인합니다.
3. 정보 기록을 수정하고 이전 지도에서 **기록 변경됨**과 분석 당시 원문을 확인합니다. 다시 실행하고 **분석 이력 → 최신 분석과 비교**에서 수정 건수와 두 제안을 대조합니다.
4. 로컬 **Review Studio**에서 연결이 약한 사례, 불완전한 사례, 반복 사례를 선택합니다. 고정 응답으로 분석한 뒤 다섯 항목을 평가하고 메모를 저장합니다. 새로고침해 평가가 남는지 확인합니다.
5. **잘못된 근거 ID 재현**을 실행합니다. 스키마 통과, 참조 실패와 ID `999999`를 확인합니다. **스키마 오류 재현**은 스키마 단계에서 실패합니다. 이력에서 이전 성공 결과를 다시 엽니다.
6. **기록 초기화·복구**에서 가상 기록을 비우고 분석 실패를 확인한 뒤 기본 기록을 복구합니다. 키가 있는 환경에서는 **Gemini 실분석**도 실행하고 고정 응답과 구분해 평가합니다.

## 자동 검증

```bash
npm run typecheck
npm run lint
npm run verify -- unit
npm run verify -- integration
npx playwright install chromium
npm run verify -- e2e
npm run build
npm run build:sites
```

통합 테스트는 Gemini 응답을 모의 처리해 서버의 요청·오류·응답 검증을 확인합니다. E2E는 로컬 서버를 3162 포트에서 실행하며 실제 API 키 없이 데스크톱과 모바일을 검사합니다. 설치된 Edge를 쓰려면 `WTN_BROWSER_CHANNEL=msedge`를 설정합니다. `verify`가 남긴 `.review/results.json`의 종료 코드·실행 환경·시각은 Studio에서 확인합니다. 시연 이력은 브라우저별 최대 24회, 평가는 최대 80개까지 유지됩니다.

GPT Sites 빌드는 `dist/server/index.js`에 학생용 작업 공간과 서버 측 Gemini 요청을 패키징합니다. 가상 기록은 브라우저 프로필에 남으므로 다른 브라우저나 기기에서 별도의 작업 공간이 열립니다.
