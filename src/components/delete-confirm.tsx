"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DeleteConfirm({ action, title, description, label = "삭제" }: { action: () => Promise<void>; title: string; description: string; label?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button type="button" variant="outline" size="sm"><Trash2 className="size-4" />{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><form action={action}><AlertDialogAction type="submit" className="bg-destructive text-white hover:bg-destructive/90">삭제하기</AlertDialogAction></form></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
