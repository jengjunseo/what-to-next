import { DemoWorkbench } from "@/components/demo/workbench";

export const metadata = { title: "가상 기록 체험" };

export default function DemoPage() {
  const local = process.env.NODE_ENV === "development";
  return <DemoWorkbench live={local} homeLink="/login" reviewLink={local ? "/review-studio" : undefined} />;
}
