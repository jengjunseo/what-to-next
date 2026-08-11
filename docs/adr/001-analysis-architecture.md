# ADR 001: 전체 기록 기반 분석 아키텍처

- 상태: Accepted
- 날짜: 2026-08-11

## 맥락

이 제품은 한 학생의 과목별 생기부 기록에서 시간적·논리적 발전 관계인 Thread를 찾는다. 데이터 규모는 한 사람의 고교 기록으로 제한되며, 결과는 실제 record ID로 검증할 수 있어야 한다.

## 결정

1. RAG·embedding·vector DB 없이 모든 현재 기록을 학년/학기/과목/record ID 순으로 정규화해 Gemini에 한 번에 전달한다. 이 규모에서는 전체 맥락을 잃는 분할 검색보다 정확하고 단순하다.
2. Gemini 모델은 `gemini-3.5-flash-lite` 하나로 고정하고 `@google/genai`의 JSON Schema structured output을 사용한다. 응답은 Zod를 통과하고 evidence ID가 입력 snapshot에 실제로 존재하는지 확인된 뒤에만 저장한다.
3. PostgreSQL/Drizzle의 `analysis_runs`에 입력 hash와 불변 snapshot, 원본 구조화 결과를 저장하고 `threads`를 실행별로 추가한다. 재분석은 과거 결과를 덮어쓰지 않는다.
4. `ai_status`와 `user_status`를 분리한다. UI의 유효 상태는 `user_status ?? ai_status`이며 override를 취소하면 AI 판단으로 돌아간다.
5. subject/record 정규화 JSON의 SHA-256을 최신 분석 hash와 비교한다. 다르면 stale 배너만 표시하며 Gemini를 자동 호출하지 않는다.
6. 인증은 다중 사용자 계정 대신 `APP_PASSWORD`와 HMAC 서명 HttpOnly cookie를 사용하는 단일 비밀번호 게이트로 제한한다.

## 결과

- 분석 실패나 schema 위반은 기존 성공 결과를 훼손하지 않고 닫힌 상태로 실패한다.
- 과거 분석의 근거는 당시 snapshot으로 계속 확인할 수 있다.
- 현재 규모에 필요하지 않은 검색 인프라와 사용자 모델을 만들지 않는다.
