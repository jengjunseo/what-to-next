import type { ThreadStatus } from "@/lib/domain/analysis";

export const STATUS_META: Record<ThreadStatus, { label: string; short: string; description: string; className: string }> = {
  DROP: {
    label: "지금은 멈추기",
    short: "DROP",
    description: "기록은 남겨 두고 지금은 다른 질문을 살펴봐요.",
    className: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  },
  KEEP: {
    label: "이어가기",
    short: "KEEP",
    description: "지금까지 확인한 흐름을 이어가요.",
    className: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  },
  EXTEND_NOW: {
    label: "지금 확장하기",
    short: "EXTEND NOW",
    description: "지금 해볼 수 있는 작은 다음 단계예요.",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  RECOVER_LATER: {
    label: "나중에 살펴보기",
    short: "RECOVER LATER",
    description: "여건을 확인한 뒤 다시 살펴봐요.",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  },
};
