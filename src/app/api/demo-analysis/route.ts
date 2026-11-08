import { handleDemoAnalysis } from "@/lib/demo/analysis-request";

export const maxDuration = 60;

export function POST(request: Request) {
  const host = request.headers.get("host") ?? "";
  if (process.env.NODE_ENV !== "development" || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) {
    return Response.json({ stage: "input", message: "로컬 개발 환경에서 사용할 수 있습니다." }, { status: 404 });
  }
  return handleDemoAnalysis(request, process.env.GEMINI_API_KEY, "http://" + host);
}
