import type { ThreadStatus } from "@/lib/domain/analysis";

export const STATUS_META: Record<ThreadStatus, { label: string; short: string; description: string; className: string }> = {
  DROP: {
    label: "버릴 줄기",
    short: "DROP",
    description: "기록은 보존하되 더 반복하지 않을 연결",
    className: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  },
  KEEP: {
    label: "살릴 줄기",
    short: "KEEP",
    description: "이미 강해서 전체 기록의 자산으로 남길 연결",
    className: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  },
  EXTEND_NOW: {
    label: "2-2에서 이어갈 줄기",
    short: "EXTEND NOW",
    description: "이번 학기에 실제 행동으로 발전시킬 최우선 연결",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  RECOVER_LATER: {
    label: "3-1에서 회수할 줄기",
    short: "RECOVER LATER",
    description: "다음 학년에 다시 꺼내 깊이를 더할 연결",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  },
};
