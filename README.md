# 2028 생기부 연결 지도

한 학생의 실제 학교생활기록부 원문을 과목·학기별로 저장하고, 전체 기록에서 학업적 Thread와 현재 학기의 우선 행동을 찾는 개인용 전략 엔진입니다.

## 기능

- 단일 비밀번호 + 서명된 HttpOnly cookie 인증
- 과목과 생기부 원문/메모 CRUD
- 전체 기록을 한 번에 읽는 Gemini Structured Output 분석
- DROP / KEEP / EXTEND_NOW / RECOVER_LATER 전략 보드
- 실제 record ID 근거, 현재 실행 전략, 연결 타임라인
- 분석 snapshot 이력, SHA-256 stale 감지, 사용자 status override

## 로컬 실행

요구 사항: Node.js 20+, PostgreSQL(Neon 권장)

```bash
npm install
copy .env.example .env.local
npm run db:migrate
npm run dev
```

`.env.local`에 다음 값을 설정합니다.

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
APP_PASSWORD=...
AUTH_SECRET=충분히-긴-무작위-문자열
```

`GEMINI_API_KEY`와 `DATABASE_URL`은 Server Component/Server Action/Route Handler에서만 사용됩니다. 브라우저가 Gemini를 직접 호출하지 않습니다.

## 검증

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 데이터베이스

Drizzle schema는 `src/lib/db/schema.ts`, forward migration은 `drizzle/`에 있습니다. 운영 데이터 삭제·reset을 포함하는 migration은 허용하지 않습니다.

## 분석 실패 정책

Gemini 응답이 비었거나 JSON/Zod schema/record ID 검증을 통과하지 못하면 새 분석 결과를 저장하지 않습니다. 이전 성공 결과는 그대로 유지됩니다. 가짜 fallback 분석은 생성하지 않습니다.

설계 근거는 `docs/adr/001-analysis-architecture.md`를 참고하세요.
