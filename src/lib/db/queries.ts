import { hashAnalysisInput } from "@/lib/domain/analysis-hash";
import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { analysisRuns, records, subjects, threads } from "@/lib/db/schema";
import {
  effectiveStatus,
  isAnalysisStale,
  normalizeAnalysisInput,
  type AnalysisSnapshot,
  type SubjectInput,
} from "@/lib/domain/analysis";

export async function getSubjectInputs(): Promise<SubjectInput[]> {
  const db = getDb();
  const [subjectRows, recordRows] = await Promise.all([
    db.select().from(subjects).orderBy(asc(subjects.grade), asc(subjects.semester), asc(subjects.subjectName)),
    db.select().from(records).orderBy(asc(records.id)),
  ]);

  return subjectRows.map((subject) => ({
    id: subject.id,
    grade: subject.grade,
    semester: subject.semester,
    subjectName: subject.subjectName,
    category: subject.category,
    records: recordRows
      .filter((record) => record.subjectId === subject.id)
      .map((record) => ({
        id: record.id,
        recordText: record.recordText,
        memo: record.memo,
      })),
  }));
}

export async function getCurrentSnapshot(): Promise<AnalysisSnapshot> {
  return normalizeAnalysisInput(await getSubjectInputs());
}

export async function getLatestAnalysis() {
  const db = getDb();
  const [run] = await db.select().from(analysisRuns).orderBy(desc(analysisRuns.createdAt)).limit(1);
  if (!run) return null;
  const runThreads = await db
    .select()
    .from(threads)
    .where(eq(threads.analysisRunId, run.id))
    .orderBy(asc(threads.priorityRank), asc(threads.id));
  return {
    run,
    threads: runThreads.map((thread) => ({
      ...thread,
      effectiveStatus: effectiveStatus(thread.aiStatus, thread.userStatus),
    })),
  };
}

export async function getDashboardData() {
  const [subjectInputs, latest] = await Promise.all([getSubjectInputs(), getLatestAnalysis()]);
  const snapshot = normalizeAnalysisInput(subjectInputs);
  const currentHash = hashAnalysisInput(snapshot);
  const recordCount = subjectInputs.reduce((sum, subject) => sum + subject.records.length, 0);
  return {
    subjects: subjectInputs,
    subjectCount: subjectInputs.length,
    recordCount,
    latest,
    currentHash,
    stale: isAnalysisStale(currentHash, latest?.run.inputHash),
  };
}

export async function getSubjectDetail(id: number) {
  const db = getDb();
  const [subject] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  if (!subject) return null;
  const subjectRecords = await db
    .select()
    .from(records)
    .where(eq(records.subjectId, id))
    .orderBy(asc(records.id));
  const latest = await getLatestAnalysis();
  const recordIds = new Set(subjectRecords.map((record) => record.id));
  const relatedThreads = latest?.threads.filter((thread) =>
    thread.evidenceRecordIds.some((recordId) => recordIds.has(recordId)),
  ) ?? [];
  const linkedSubjectIds = new Set<number>();
  if (latest && relatedThreads.length > 0) {
    const evidenceIds = relatedThreads.flatMap((thread) => thread.evidenceRecordIds);
    const linkedRecords = evidenceIds.length
      ? await db.select().from(records).where(inArray(records.id, evidenceIds))
      : [];
    linkedRecords.forEach((record) => {
      if (record.subjectId !== id) linkedSubjectIds.add(record.subjectId);
    });
  }
  const linkedSubjects = linkedSubjectIds.size
    ? await db.select().from(subjects).where(inArray(subjects.id, [...linkedSubjectIds]))
    : [];
  return { subject, records: subjectRecords, relatedThreads, linkedSubjects };
}

export async function getAnalysisHistory() {
  const db = getDb();
  const runs = await db.select().from(analysisRuns).orderBy(desc(analysisRuns.createdAt));
  return runs.map((run) => ({
    ...run,
    recordCount: run.inputSnapshot.subjects.reduce((sum, subject) => sum + subject.records.length, 0),
  }));
}

export async function getAnalysisRun(id: number) {
  const db = getDb();
  const [run] = await db.select().from(analysisRuns).where(eq(analysisRuns.id, id)).limit(1);
  if (!run) return null;
  const runThreads = await db
    .select()
    .from(threads)
    .where(eq(threads.analysisRunId, id))
    .orderBy(asc(threads.priorityRank), asc(threads.id));
  return { run, threads: runThreads };
}
