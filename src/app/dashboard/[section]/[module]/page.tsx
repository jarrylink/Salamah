import { and, asc, count, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { resolveAcademicContext } from "@/features/academic/lib/context";
import { db } from "@/db";
import { assessmentScores, assessments, attendanceRecords, classes, gradeSections, people, sections, studentEnrollments, students, subjectCombinations, subjects, subjectSections, classSubjectCombinations } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

const sectionCodes = { nursery: "NURSERY", primary: "PRIMARY", secondary: "SECONDARY" } as const;
const permittedModules = new Set(["students", "classes", "subjects", "combinations", "results", "attendance"]);

export default async function SectionOperationsPage({ params, searchParams }: PageProps<"/dashboard/[section]/[module]">) {
  const [{ section: slug, module }, query] = await Promise.all([params, searchParams]);
  if (slug === "administration" && ["staff", "students", "teachers", "guardians", "accounts", "people"].includes(module)) redirect(`/dashboard/manage/${module}`);
  const code = sectionCodes[slug as keyof typeof sectionCodes];
  if (!code || !permittedModules.has(module)) notFound();
  const user = await getSession();
  if (!user) redirect("/");
  if (!["superadmin", "admin"].includes(user.role)) redirect("/dashboard");
  const context = await resolveAcademicContext({ sessionId: typeof query.sessionId === "string" ? query.sessionId : undefined, termId: typeof query.termId === "string" ? query.termId : undefined });
  const [section] = await db.select().from(sections).where(eq(sections.code, code)).limit(1);
  if (!section) notFound();
  const sectionClasses = await db.select({ id: classes.id, name: classes.name, code: classes.code }).from(classes).innerJoin(gradeSections, eq(gradeSections.gradeId, classes.gradeId)).where(eq(gradeSections.sectionId, section.id)).orderBy(asc(classes.name));
  const classIds = sectionClasses.map((item) => item.id);
  const title = `${section.name} ${module === "classes" ? "classes" : module}`;
  let content: React.ReactNode;
  if (module === "students") {
    const rows = context && classIds.length ? await db.select({ id: students.id, admission: students.admissionNumber, firstName: people.firstName, lastName: people.lastName, className: classes.name, status: students.status }).from(studentEnrollments).innerJoin(students, eq(students.id, studentEnrollments.studentId)).innerJoin(people, eq(people.id, students.personId)).innerJoin(classes, eq(classes.id, studentEnrollments.classId)).where(and(eq(studentEnrollments.sessionId, context.sessionId), eq(studentEnrollments.status, "active"), eq(gradeSections.sectionId, section.id))).innerJoin(gradeSections, eq(gradeSections.gradeId, classes.gradeId)).orderBy(asc(people.lastName)) : [];
    content = <DataTable headers={["Admission no.", "Student", "Class", "Status"]} rows={rows.map((row) => [row.admission, `${row.firstName} ${row.lastName}`, row.className, row.status])} empty="No students are enrolled in this section for the selected session." />;
  } else if (module === "classes") {
    const enrolmentCounts = context && classIds.length ? await db.select({ classId: studentEnrollments.classId, value: count() }).from(studentEnrollments).where(and(eq(studentEnrollments.sessionId, context.sessionId), eq(studentEnrollments.status, "active"))).groupBy(studentEnrollments.classId) : [];
    const counts = Object.fromEntries(enrolmentCounts.map((row) => [row.classId, row.value]));
    content = <DataTable headers={["Class", "Code", "Active enrolments"]} rows={sectionClasses.map((row) => [row.name, row.code, String(counts[row.id] ?? 0)])} empty="No classes have been created for this section." />;
  } else if (module === "subjects") {
    const rows = await db.select({ name: subjects.name, code: subjects.code, shortName: subjects.shortName, status: subjects.status }).from(subjects).innerJoin(subjectSections, eq(subjectSections.subjectId, subjects.id)).where(eq(subjectSections.sectionId, section.id)).orderBy(asc(subjects.name));
    content = <DataTable headers={["Subject", "Code", "Short name", "Status"]} rows={rows.map((row) => [row.name, row.code, row.shortName ?? "—", row.status])} empty="No subjects are configured." />;
  } else if (module === "combinations") {
    const rows = context ? await db.selectDistinct({ name: subjectCombinations.name, description: subjectCombinations.description, status: subjectCombinations.status }).from(subjectCombinations).innerJoin(classSubjectCombinations, eq(classSubjectCombinations.combinationId, subjectCombinations.id)).innerJoin(classes, eq(classes.id, classSubjectCombinations.classId)).innerJoin(gradeSections, eq(gradeSections.gradeId, classes.gradeId)).where(and(eq(gradeSections.sectionId, section.id), eq(classSubjectCombinations.sessionId, context.sessionId))).orderBy(asc(subjectCombinations.name)) : [];
    content = <DataTable headers={["Combination", "Description", "Status"]} rows={rows.map((row) => [row.name, row.description ?? "—", row.status])} empty="No subject combinations are configured." />;
  } else if (module === "attendance") {
    const rows = context && classIds.length ? await db.select({ className: classes.name, total: count() }).from(attendanceRecords).innerJoin(classes, eq(classes.id, attendanceRecords.classId)).innerJoin(gradeSections, eq(gradeSections.gradeId, classes.gradeId)).where(and(eq(attendanceRecords.sessionId, context.sessionId), eq(attendanceRecords.termId, context.termId), eq(gradeSections.sectionId, section.id))).groupBy(classes.name).orderBy(asc(classes.name)) : [];
    content = <DataTable headers={["Class", "Recorded attendance entries"]} rows={rows.map((row) => [row.className, String(row.total)])} empty="No attendance has been recorded for this context." />;
  } else {
    const rows = context && classIds.length ? await db.select({ className: classes.name, subjectName: subjects.name, assessmentName: assessments.name, scoreCount: count(assessmentScores.id) }).from(assessments).innerJoin(classes, eq(classes.id, assessments.classId)).innerJoin(gradeSections, eq(gradeSections.gradeId, classes.gradeId)).innerJoin(subjects, eq(subjects.id, assessments.subjectId)).leftJoin(assessmentScores, eq(assessmentScores.assessmentId, assessments.id)).where(and(eq(assessments.sessionId, context.sessionId), eq(assessments.termId, context.termId), eq(gradeSections.sectionId, section.id))).groupBy(classes.name, subjects.name, assessments.name).orderBy(asc(classes.name), asc(subjects.name)) : [];
    content = <DataTable headers={["Class", "Subject", "Assessment", "Scores"]} rows={rows.map((row) => [row.className, row.subjectName, row.assessmentName, String(row.scoreCount)])} empty="No assessments are configured for this context." />;
  }
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10"><p className="text-xs font-bold tracking-[.18em] text-[#1e8c7a] uppercase">{section.name} section · {context ? `${context.sessionName} / ${context.termName}` : "Academic context required"}</p><h1 className="mt-2 font-display text-4xl capitalize text-[#03283a]">{title}</h1><p className="mt-2 text-sm text-slate-600">Operational records shown from PostgreSQL for the selected academic context.</p><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{content}</section></main>;
}

function DataTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) { return rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs tracking-[.1em] text-slate-500 uppercase"><tr>{headers.map((header) => <th key={header} className="px-3 py-3 font-bold">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.join("-")}-${index}`} className="border-b border-slate-100 last:border-0">{row.map((value, cell) => <td key={`${value}-${cell}`} className="px-3 py-3 text-slate-700">{value}</td>)}</tr>)}</tbody></table></div> : <p className="rounded-xl border border-dashed border-slate-300 p-7 text-sm text-slate-500">{empty}</p>; }

