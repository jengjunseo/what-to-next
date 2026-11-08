import { COURSE_GROUPS, isCurriculumCourse } from "@/lib/domain/courses";

export function CourseOptions({ existing }: { existing?: string }) {
  return <>
    <option value="" disabled>과목을 골라 주세요</option>
    {existing && !isCurriculumCourse(existing) && <option value={existing}>{existing} · 기존 과목</option>}
    {Object.entries(COURSE_GROUPS).map(([group, courses]) =>
      <optgroup key={group} label={group}>{courses.map((course) => <option key={course}>{course}</option>)}</optgroup>)}
  </>;
}
