import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center"><p className="font-mono text-sm text-primary">404</p><h1 className="mt-3 text-2xl font-semibold">기록을 찾을 수 없습니다</h1><p className="mt-2 text-sm text-muted-foreground">삭제되었거나 존재하지 않는 주소입니다.</p><Button asChild className="mt-5"><Link href="/">전략 보드로 돌아가기</Link></Button></main>; }
