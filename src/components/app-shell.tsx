import Link from "next/link";
import { BookOpenText, Clock3, History, Menu, Route, Sparkles } from "lucide-react";
import { logoutAction } from "@/components/logout-action";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { href: "/", label: "전략 보드", icon: Route },
  { href: "/subjects", label: "과목과 기록", icon: BookOpenText },
  { href: "/strategy/now", label: "지금 할 일", icon: Sparkles },
  { href: "/timeline", label: "연결 타임라인", icon: Clock3 },
  { href: "/history", label: "분석 이력", icon: History },
  { href: "/demo", label: "가상 기록 체험", icon: BookOpenText },
];

function Navigation() {
  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => (
        <Button key={href} asChild variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
          <Link href={href}><Icon className="size-4" />{label}</Link>
        </Button>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/70 bg-card/60 p-5 backdrop-blur lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Route className="size-4" /></div>
          <div><p className="text-sm font-semibold">What to Next</p><p className="font-mono text-[10px] tracking-widest text-muted-foreground">ADMISSION 2028</p></div>
        </Link>
        <Separator className="my-5" />
        <Navigation />
        <div className="mt-auto space-y-4">
          <Separator />
          <div className="px-2 text-xs leading-5 text-muted-foreground">현재 시점<br /><span className="font-medium text-foreground">고2 · 2학기</span></div>
          <form action={logoutAction}><Button variant="outline" size="sm" className="w-full">로그아웃</Button></form>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/85 px-5 backdrop-blur lg:hidden">
          <Link href="/" className="font-semibold">What to Next</Link>
          <Sheet>
            <SheetTrigger asChild><Button size="icon" variant="outline" aria-label="메뉴 열기"><Menu className="size-4" /></Button></SheetTrigger>
            <SheetContent side="right" className="p-5">
              <SheetHeader><SheetTitle>메뉴</SheetTitle></SheetHeader>
              <div className="mt-6"><Navigation /></div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
