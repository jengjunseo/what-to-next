# Project memory

- 개인용 single-user 생기부 전략 도구다. 회원가입·공유·결제 기능을 추가하지 않는다.
- 실제 `records`를 근거로만 분석하며 존재하지 않는 evidence ID를 허용하지 않는다.
- 전체 Context를 `gemini-3.5-flash-lite`에 전달한다. RAG·embedding·fallback 모델을 추가하지 않는다.
- Gemini 결과는 Structured Output + Zod + evidence 검증을 모두 통과해야 저장한다. 실패 시 fail closed.
- PostgreSQL/Drizzle과 forward-only migration을 사용한다. 기존 데이터에 destructive migration을 적용하지 않는다.
- AI/user status는 분리하며 effective status는 `user_status ?? ai_status`다.
- secret은 서버 환경 변수에서만 읽고 저장소와 클라이언트 번들에 넣지 않는다.
- 주요 결정은 `docs/adr/001-analysis-architecture.md`를 따른다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
