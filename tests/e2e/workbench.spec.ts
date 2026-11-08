import { expect, test } from "@playwright/test";

test("creates, edits, filters and deletes a record, and compares immutable evidence", async ({ page }, info) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "다음 탐구를 찾아보세요" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("records.png"), fullPage: true });
  await page.getByRole("button", { name: "기록 추가" }).click();
  await page.getByRole("textbox", { name: "과목" }).fill("가상 물리");
  await page.getByRole("textbox", { name: "기록 원문" }).fill("가상 실험의 파장과 시간을 비교했다.");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.getByLabel("과목 필터").selectOption("가상 물리");
  const record = page.getByRole("listitem").filter({ hasText: "가상 물리" });
  await expect(record).toHaveCount(1);
  await record.getByRole("button", { name: "수정" }).click();
  await page.getByRole("textbox", { name: "기록 원문" }).fill("가상 실험의 파장을 세 번 측정했다.");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(record).toContainText("세 번 측정했다");
  await record.getByRole("button", { name: "삭제", exact: true }).click();
  await record.getByRole("button", { name: "삭제 확인" }).click();
  await expect(record).toHaveCount(0);
  await page.getByRole("button", { name: "분석 실행" }).click();
  await expect(page.getByRole("heading", { name: "탐구 연결 지도" })).toBeVisible();
  await page.getByRole("button", { name: /정보.*#103/ }).click();
  await expect(page.getByText("원문 기록 #103 · 정보")).toBeVisible();
  await page.getByRole("button", { name: "타임라인", exact: true }).click();
  await expect(page.getByText("2-2 · 정보 · #103")).toBeVisible();
  await page.getByLabel("내 판단").selectOption("KEEP");
  await expect(page.getByText("고정 응답의 판단 · EXTEND NOW")).toBeVisible();
  await page.screenshot({ path: info.outputPath("connections.png"), fullPage: true });

  await page.getByRole("button", { name: "기록", exact: true }).click();
  const infoRecord = page.getByRole("listitem").filter({ hasText: "#103" });
  await infoRecord.getByRole("button", { name: "수정" }).click();
  await page.getByRole("textbox", { name: "기록 원문" }).fill("바뀐 센서 원문");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.getByRole("button", { name: "연결 지도", exact: true }).click();
  await expect(page.getByText(/기록 변경됨/)).toBeVisible();
  await page.getByRole("button", { name: /정보.*#103/ }).click();
  await expect(page.getByText(/온도 센서로 5분마다/)).toBeVisible();
  await page.getByRole("button", { name: "분석 실행" }).click();
  await expect(page.getByText("편집한 가상 기록", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "분석 이력", exact: true }).click();
  await expect(page.getByText("추가 0 · 수정 1 · 삭제 0")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "분석 이력", exact: true }).click();
  await expect(page.getByRole("heading", { name: "최신 분석과 비교" })).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("keeps Review Studio isolated, saves evaluations, and reproduces invalid IDs", async ({ page }, info) => {
  await page.goto("/demo");
  await page.getByRole("link", { name: "Review Studio" }).click();
  await expect(page.getByRole("heading", { name: "Review Studio" })).toBeVisible();
  await page.getByLabel("가상 시나리오").selectOption("incomplete");
  await page.getByRole("button", { name: "분석 실행" }).click();
  await expect(page.getByRole("heading", { name: "분석 성공" })).toBeVisible();
  for (const group of await page.locator("fieldset").all()) {
    await group.getByLabel("점수").selectOption("4");
    await group.getByLabel("검수 메모").fill("원문과 대조했습니다.");
  }
  await page.getByRole("button", { name: "평가 저장" }).click();
  await expect(page.getByText("검수 평가를 저장했습니다.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "이전 평가와 비교" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("review.png"), fullPage: true });

  await page.getByLabel("분석 방식").selectOption("bad-id");
  await page.getByRole("button", { name: "분석 실행" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("999999");
  await expect(page.getByText("참조 ID 무결성")).toBeVisible();
  await page.getByRole("button", { name: "분석 이력", exact: true }).click();
  await expect(page.getByRole("button", { name: "결과 보기" })).toHaveCount(1);
  await page.getByRole("link", { name: "학생용 화면" }).click();
  await expect(page.getByLabel("가상 시나리오")).toHaveValue("connected");
});

test("shows real endpoint configuration failures, empty input and recovery", async ({ page }) => {
  await page.goto("/demo");
  await page.getByLabel("분석 방식").selectOption("gemini");
  await page.getByRole("button", { name: "분석 실행" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("서버에 Gemini 키가 설정되지 않았습니다.");
  await page.getByLabel("분석 방식").selectOption("fixed");
  await page.getByRole("button", { name: "기록 초기화·복구" }).click();
  await page.getByRole("button", { name: "가상 기록 비우기" }).click();
  await page.getByRole("button", { name: "분석 실행" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("분석할 기록을 먼저 추가해 주세요.");
  await page.getByRole("button", { name: "기록 초기화·복구" }).click();
  await page.getByRole("button", { name: "기본 기록 복구" }).click();
  await page.getByRole("button", { name: "분석 실행" }).click();
  await expect(page.getByRole("heading", { name: "탐구 연결 지도" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});
