import { handleDemoAnalysis } from "@/lib/demo/analysis-request";

// Replaced with the matching assets by the build script.
declare const CLIENT_JS: string;
declare const CLIENT_CSS: string;

const HTML = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>What to Next</title><meta name="description" content="학교생활 기록을 연결해 다음 탐구의 방향을 찾는 가상 데이터 작업 공간">
<link rel="stylesheet" href="/workbench.css"></head>
<body style="margin:0"><div id="root">What to Next</div><noscript>가상 기록 작업 공간은 자바스크립트가 필요합니다.</noscript>
<script type="module" src="/workbench.js"></script></body></html>`;

function asset(body: string, type: string) {
  return new Response(body, { headers: { "Content-Type": type + "; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}

const worker = {
  fetch(request: Request, env: { GEMINI_API_KEY?: string }) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/demo-analysis" && request.method === "POST") {
      if (!request.headers.get("oai-authenticated-user-id")) {
        return Response.json({ stage: "input", message: "ChatGPT 로그인이 필요합니다." }, { status: 401 });
      }
      return handleDemoAnalysis(request, env.GEMINI_API_KEY);
    }
    if (request.method === "GET") {
      if (pathname === "/" || pathname === "/demo") return asset(HTML, "text/html");
      if (pathname === "/workbench.js") return asset(CLIENT_JS, "text/javascript");
      if (pathname === "/workbench.css") return asset(CLIENT_CSS, "text/css");
    }
    return new Response("Not found", { status: 404 });
  },
};

export default worker;
