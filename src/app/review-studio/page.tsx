import { headers } from "next/headers";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { DemoWorkbench } from "@/components/demo/workbench";
import type { TestReport } from "@/components/demo/review-panels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review Studio" };

export default async function ReviewStudioPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const host = (await headers()).get("host") ?? "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) notFound();
  let reports: TestReport[] = [];
  try {
    const value: unknown = JSON.parse(await readFile(join(process.cwd(), ".review", "results.json"), "utf8"));
    if (Array.isArray(value)) reports = value;
  } catch {
    // The local report is written only after a test actually runs.
  }
  return <DemoWorkbench review live homeLink="/demo" reports={reports} />;
}
