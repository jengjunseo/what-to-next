"use client";

import { startTransition, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { setThreadStatus } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { THREAD_STATUSES, type ThreadStatus } from "@/lib/domain/analysis";
import { STATUS_META } from "@/lib/domain/status";

export function StatusOverride({ threadId, aiStatus, userStatus }: { threadId: number; aiStatus: ThreadStatus; userStatus: ThreadStatus | null }) {
  const [pending, setPending] = useState(false);
  const effective = userStatus ?? aiStatus;

  function update(status: ThreadStatus | null) {
    setPending(true);
    startTransition(async () => {
      try { await setThreadStatus(threadId, status); } finally { setPending(false); }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm" variant="outline" disabled={pending}>판단 변경</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>내 판단으로 분류</DropdownMenuLabel>
        {THREAD_STATUSES.map((status) => (
          <DropdownMenuItem key={status} onSelect={() => update(status)}>
            {effective === status ? <Check className="size-4" /> : <span className="size-4" />}
            {STATUS_META[status].label}
          </DropdownMenuItem>
        ))}
        {userStatus && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => update(null)}><RotateCcw className="size-4" />AI 판단으로 되돌리기</DropdownMenuItem></>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
