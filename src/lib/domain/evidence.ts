import type { AnalysisSnapshot, SubjectInput } from "./analysis";

export type SnapshotEvidence = {
  subject: SubjectInput;
  record: SubjectInput["records"][number];
};

export function snapshotEvidence(snapshot?: AnalysisSnapshot) {
  const rows = snapshot?.subjects.flatMap((subject) =>
    subject.records.map((record) => [record.id, { subject, record }] as const)) ?? [];
  return new Map(rows);
}
