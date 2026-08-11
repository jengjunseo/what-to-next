"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { records, subjects, threads } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { ThreadStatusSchema } from "@/lib/domain/analysis";

const optionalText = z.string().trim().transform((value) => value || null);
const subjectFormSchema = z.object({
  grade: z.coerce.number().int().min(1).max(3),
  semester: z.coerce.number().int().min(1).max(2),
  subjectName: z.string().trim().min(1, "과목명을 입력해 주세요."),
  category: optionalText,
});
const recordFormSchema = z.object({
  recordText: z.string().trim().min(1, "생기부 원문을 입력해 주세요."),
  memo: optionalText,
});

function refreshAll() {
  revalidatePath("/", "layout");
}

export async function createSubject(formData: FormData) {
  await requireSession();
  const subject = subjectFormSchema.parse(Object.fromEntries(formData));
  const recordText = String(formData.get("recordText") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const db = getDb();
  const id = await db.transaction(async (tx) => {
    const [created] = await tx.insert(subjects).values(subject).returning({ id: subjects.id });
    if (recordText) await tx.insert(records).values({ subjectId: created.id, recordText, memo });
    return created.id;
  });
  refreshAll();
  redirect(`/subjects/${id}`);
}

export async function updateSubject(id: number, formData: FormData) {
  await requireSession();
  const subject = subjectFormSchema.parse(Object.fromEntries(formData));
  await getDb().update(subjects).set({ ...subject, updatedAt: new Date() }).where(eq(subjects.id, id));
  refreshAll();
}

export async function deleteSubject(id: number) {
  await requireSession();
  await getDb().delete(subjects).where(eq(subjects.id, id));
  refreshAll();
  redirect("/subjects");
}

export async function createRecord(subjectId: number, formData: FormData) {
  await requireSession();
  const value = recordFormSchema.parse(Object.fromEntries(formData));
  await getDb().insert(records).values({ subjectId, ...value });
  refreshAll();
}

export async function updateRecord(id: number, formData: FormData) {
  await requireSession();
  const value = recordFormSchema.parse(Object.fromEntries(formData));
  await getDb().update(records).set({ ...value, updatedAt: new Date() }).where(eq(records.id, id));
  refreshAll();
}

export async function deleteRecord(id: number) {
  await requireSession();
  await getDb().delete(records).where(eq(records.id, id));
  refreshAll();
}

export async function setThreadStatus(threadId: number, status: string | null) {
  await requireSession();
  const userStatus = status === null ? null : ThreadStatusSchema.parse(status);
  await getDb()
    .update(threads)
    .set({ userStatus, updatedAt: new Date() })
    .where(eq(threads.id, threadId));
  refreshAll();
}
