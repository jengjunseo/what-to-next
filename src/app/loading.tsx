import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() { return <div className="mx-auto w-full max-w-6xl space-y-5 px-6 py-10"><Skeleton className="h-10 w-64" /><Skeleton className="h-5 w-96 max-w-full" /><div className="grid gap-4 pt-6 md:grid-cols-3">{[1,2,3].map((item) => <Skeleton key={item} className="h-48" />)}</div></div>; }
