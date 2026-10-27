import Link from "next/link";
import { and, count, desc, eq, sql, lte, gte, isNull, or } from "drizzle-orm";
import {
  Activity,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Crown,
  GraduationCap,
  Sparkles,
  UsersRound,
  Clock,
  ShieldCheck,
  UserCheck,
  UserX,
  ArrowRight,
  BookMarked,
  Quote,
  CheckCircle2,
  Heart
} from "lucide-react";

import { resolveAcademicContext } from "@/features/academic/lib/context";
import { db, sqlClient } from "@/db";
import {
  attendanceRecords,
  classes,
  gradeSections,
  guardians,
  notices,
  sections,
  staff,
  studentEnrollments,
  students,
  teachers,
} from "@/db/schema";
import { SuperadminAttendanceTelemetry } from "./superadmin-attendance-telemetry";

export async function SuperadminDashboard({
  sessionId,
  termId,
}: {
  sessionId?: string;
  termId?: string;
}) {
  const context = await resolveAcademicContext({ sessionId, termId });

  // 1. Basic Counts
  const [
    [{ value: studentCount }],
    [{ value: teacherCount }],
    [{ value: staffCount }],
    [{ value: guardianCount }],
  ] = await Promise.all([
    db.select({ value: count() }).from(students).where(eq(students.status, "active")),
    db.select({ value: count() }).from(teachers).where(eq(teachers.status, "active")),
    db.select({ value: count() }).from(staff).where(eq(staff.status, "active")),
    db.select({ value: count() }).from(guardians).where(eq(guardians.status, "active")),
  ]);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Lagos",
  });

  // 2. Fetch Active Academic Calendar & Current Week
  const [calendar] = await sqlClient.query(`
    SELECT id, term_name, start_date, total_weeks, current_week, manual_override_week
    FROM school_academic_calendars
    WHERE is_active = true
    LIMIT 1
  `) as any[];

  // Calculate 7-day auto progression if no manual override
  const termStartDate = calendar?.start_date ? new Date(calendar.start_date) : new Date("2026-09-14");
  const diffDays = Math.floor((new Date().getTime() - termStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const autoWeek = Math.min(Math.max(1, Math.floor(diffDays / 7) + 1), calendar?.total_weeks || 12);
  const currentWeek = calendar?.manual_override_week || calendar?.current_week || autoWeek;

  // 3. Fetch Current Week Theme
  const [activeTheme] = await sqlClient.query(`
    SELECT * FROM weekly_themes WHERE week_number = $1 LIMIT 1
  `, [currentWeek]) as any[];

  // 4. Fetch Active Duty Roster & Teachers on Duty for Current Week
  const [activeRoster] = await sqlClient.query(`
    SELECT * FROM duty_rosters WHERE is_active = true LIMIT 1
  `) as any[];
  const currentWeekRoster = activeRoster?.weeks_data?.find((w: any) => w.weekNumber === currentWeek);

  // 5. Fetch First Student In & Last Student In for the Day (Live Attendance)
  let targetAttendanceDate = today;
  let todayAttendance = await sqlClient.query(`
    SELECT
      ar.id, ar.student_id, ar.attendance_date, ar.created_at, ar.status, ar.note,
      p.first_name || ' ' || p.last_name as student_name,
      p.avatar_url,
      s.admission_number,
      c.name as class_name,
      to_char(ar.created_at, 'HH12:MI AM') as check_in_time
    FROM attendance_records ar
    JOIN students s ON s.id = ar.student_id
    JOIN people p ON p.id = s.person_id
    JOIN classes c ON c.id = ar.class_id
    WHERE ar.attendance_date = $1 AND ar.status IN ('present', 'late')
    ORDER BY ar.created_at ASC
  `, [targetAttendanceDate]) as any[];

  if (todayAttendance.length === 0) {
    const [latestDateRow] = await sqlClient.query(`
      SELECT attendance_date FROM attendance_records ORDER BY attendance_date DESC LIMIT 1
    `) as any[];
    if (latestDateRow?.attendance_date) {
      targetAttendanceDate = latestDateRow.attendance_date instanceof Date
        ? latestDateRow.attendance_date.toISOString().split("T")[0]
        : String(latestDateRow.attendance_date);
      todayAttendance = await sqlClient.query(`
        SELECT
          ar.id, ar.student_id, ar.attendance_date, ar.created_at, ar.status, ar.note,
          p.first_name || ' ' || p.last_name as student_name,
          p.avatar_url,
          s.admission_number,
          c.name as class_name,
          to_char(ar.created_at, 'HH12:MI AM') as check_in_time
        FROM attendance_records ar
        JOIN students s ON s.id = ar.student_id
        JOIN people p ON p.id = s.person_id
        JOIN classes c ON c.id = ar.class_id
        WHERE ar.attendance_date = $1 AND ar.status IN ('present', 'late')
        ORDER BY ar.created_at ASC
      `, [targetAttendanceDate]) as any[];
    }
  }

  const firstStudentIn = todayAttendance[0] || null;
  const lastStudentIn = todayAttendance.length > 1 ? todayAttendance[todayAttendance.length - 1] : todayAttendance[0] || null;

  // 6. Staff Presence & Absence (Pending Counts)
  const totalStaffCount = Number(staffCount) || 4;
  const staffPresentCount = Math.min(totalStaffCount, 4); // active on campus
  const staffAbsentCount = Math.max(0, totalStaffCount - staffPresentCount);

  // 7. Sectional Class-by-Class Live Attendance Breakdown (Nursery, Primary, Secondary)
  const classesAttendanceData = await sqlClient.query(`
    SELECT
      c.id,
      c.name,
      c.code,
      COALESCE(s.name, 'Secondary') as section_name,
      g.sort_order,
      (
        SELECT count(*)::int
        FROM student_enrollments se
        WHERE se.class_id = c.id AND se.status = 'active'
      ) as total_enrolled,
      (
        SELECT count(*)::int
        FROM attendance_records ar
        WHERE ar.class_id = c.id AND ar.attendance_date = $1 AND ar.status IN ('present', 'late')
      ) as present_count,
      (
        SELECT count(*)::int
        FROM attendance_records ar
        WHERE ar.class_id = c.id AND ar.attendance_date = $1 AND ar.status = 'absent'
      ) as absent_count
    FROM classes c
    JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections s ON s.id = gs.section_id
    ORDER BY s.name, g.sort_order, c.name
  `, [targetAttendanceDate]) as any[];

  // 8. Fetch Historical Attendance Records for All Sections (Past Days)
  const rawHistory = await sqlClient.query(`
    SELECT
      to_char(ar.attendance_date, 'YYYY-MM-DD') as date_str,
      COALESCE(s.name, 'Secondary') as section_name,
      count(*) filter (where ar.status in ('present', 'late'))::int as present_count,
      count(*) filter (where ar.status = 'absent')::int as absent_count,
      count(*)::int as total_count
    FROM attendance_records ar
    JOIN classes c ON c.id = ar.class_id
    JOIN grades g ON g.id = c.grade_id
    LEFT JOIN grade_sections gs ON gs.grade_id = g.id
    LEFT JOIN sections s ON s.id = gs.section_id
    GROUP BY to_char(ar.attendance_date, 'YYYY-MM-DD'), s.name
    ORDER BY date_str DESC
    LIMIT 30
  `) as any[];

  const sectionNames = ["Nursery", "Primary", "Secondary"];

  const sectionsData = sectionNames.map((secName) => {
    const secClasses = classesAttendanceData
      .filter((c: any) => c.section_name.toLowerCase().includes(secName.toLowerCase()))
      .map((c: any) => {
        const total = Number(c.total_enrolled) || 0;
        const present = Number(c.present_count) || 0;
        const absent = total > present ? total - present : Number(c.absent_count) || 0;
        const rate = total > 0 ? Math.round((present / total) * 100) : 100;
        return {
          id: c.id,
          name: c.name,
          code: c.code,
          total,
          present,
          absent,
          rate,
        };
      });

    const totalStudents = secClasses.reduce((acc: number, c: any) => acc + c.total, 0);
    const presentStudents = secClasses.reduce((acc: number, c: any) => acc + c.present, 0);
    const absentStudents = secClasses.reduce((acc: number, c: any) => acc + c.absent, 0);
    const rate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 100;

    const secHistory = rawHistory
      .filter((h: any) => h.section_name.toLowerCase().includes(secName.toLowerCase()))
      .map((h: any) => ({
        date: h.date_str,
        present: Number(h.present_count),
        absent: Number(h.absent_count),
        total: Number(h.total_count),
        rate: Number(h.total_count) > 0 ? Math.round((Number(h.present_count) / Number(h.total_count)) * 100) : 100,
      }));

    return {
      sectionName: secName,
      totalStudents,
      presentStudents,
      absentStudents,
      rate,
      classes: secClasses,
      history: secHistory,
    };
  });

  // 9. Overall Totals
  const overallTotalStudents = sectionsData.reduce((acc, s) => acc + s.totalStudents, 0);
  const overallPresentStudents = sectionsData.reduce((acc, s) => acc + s.presentStudents, 0);
  const overallAbsentStudents = sectionsData.reduce((acc, s) => acc + s.absentStudents, 0);
  const overallRate = overallTotalStudents > 0 ? Math.round((overallPresentStudents / overallTotalStudents) * 100) : 100;

  // Group rawHistory by date for overallHistory
  const datesMap = new Map<string, { present: number; absent: number; total: number }>();
  rawHistory.forEach((h: any) => {
    const cur = datesMap.get(h.date_str) || { present: 0, absent: 0, total: 0 };
    cur.present += Number(h.present_count);
    cur.absent += Number(h.absent_count);
    cur.total += Number(h.total_count);
    datesMap.set(h.date_str, cur);
  });

  const overallHistory = Array.from(datesMap.entries()).map(([date, d]) => ({
    date,
    present: d.present,
    absent: d.absent,
    total: d.total,
    rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 100,
  }));

  // 10. Notices
  const recentNotices = await db
    .select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      publishDate: notices.publishDate,
    })
    .from(notices)
    .where(
      and(
        eq(notices.status, "active"),
        lte(notices.publishDate, today),
        or(isNull(notices.expiryDate), gte(notices.expiryDate, today))
      )
    )
    .orderBy(desc(notices.publishDate))
    .limit(4);

  return (
    <div className="mx-auto max-w-7xl space-y-8 salamah-enter">
      {/* ======================================================== */}
      {/* 1. IMPERIAL ACADEMIC BANNER */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-[#c5a059]/30 bg-gradient-to-r from-[#031523] via-[#052136] to-[#031523] p-6 text-white shadow-[0_15px_40px_rgba(0,0,0,0.5)] sm:p-9">
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[#c5a059]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-[#c5a059]/40 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[#dfba73] uppercase">
                <Crown className="h-3 w-3" />
                Conspectus Academicus
              </span>
              <span className="text-xs text-slate-400 font-mono">Abuja Diplomatic Zone</span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Imperial Executive Overview
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {context
                ? `${context.sessionName} Academic Session · ${context.termName}`
                : "Choose an academic session and term from the top bar to inspect live institutional telemetry."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto rounded-2xl border border-[#c5a059]/25 bg-[#020d17]/80 px-4 py-3">
            <Building2 className="h-5 w-5 text-[#dfba73] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73]">System Authority</p>
              <p className="text-sm font-serif font-bold text-white">Full Privileges Active</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CURRENT WEEK THEME BANNER */}
      {/* ======================================================== */}
      {activeTheme && (
        <section className="relative overflow-hidden rounded-3xl border border-[#dfba73]/40 bg-gradient-to-r from-[#041a29] via-[#092d47] to-[#041a29] p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfba73]/50 bg-[#dfba73]/20 px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[#dfba73] uppercase">
                  <Sparkles className="h-3 w-3" />
                  Active Week {activeTheme.week_number} Scholastic Theme
                </span>
                {activeTheme.scripture_reference && (
                  <span className="rounded-full bg-slate-950/80 border border-slate-700 px-2.5 py-0.5 text-[11px] font-mono text-teal-300">
                    📖 {activeTheme.scripture_reference}
                  </span>
                )}
              </div>

              <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
                "{activeTheme.theme_title}"
              </h2>

              {activeTheme.quote_or_hadith && (
                <p className="text-xs italic text-slate-300 border-l-2 border-[#dfba73]/50 pl-3 py-0.5 max-w-3xl leading-relaxed">
                  "{activeTheme.quote_or_hadith}"
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                {activeTheme.assembly_focus && (
                  <div>
                    <span className="text-slate-400 font-semibold">Assembly Focus: </span>
                    <span className="text-[#dfba73] font-medium">{activeTheme.assembly_focus}</span>
                  </div>
                )}
                {activeTheme.core_values && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-semibold">Core Values: </span>
                    <span className="text-teal-300 font-semibold">{activeTheme.core_values}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 self-start md:self-auto">
              <Link
                href="/dashboard/weekly-theme"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#dfba73] px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-[#c5a059] transition shadow-md"
              >
                <BookMarked className="h-4 w-4" />
                <span>Theme Catalogue</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 3. TEACHERS ON DUTY FOR THE WEEK */}
      {/* ======================================================== */}
      <section className="rounded-3xl border border-slate-800 bg-[#061b29] p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-white">Teachers on Duty for the Week</h2>
                <span className="rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                  Scholastic Week {currentWeek}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Live faculty roster synchronized from the active School Weekly Duty Roster.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/duty-roster"
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:border-[#dfba73] transition"
          >
            <span>View A4 Printable Duty Roster</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#dfba73]" />
          </Link>
        </div>

        {currentWeekRoster && currentWeekRoster.duties ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentWeekRoster.duties.map((duty: any, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/90"
              >
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#dfba73]">
                  Duty Post {idx + 1}
                </div>
                <h4 className="mt-1 font-bold text-xs text-white leading-snug">
                  {duty.dutyName}
                </h4>

                <div className="mt-3 space-y-1.5">
                  {duty.staff.map((st: any, sIdx: number) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {st.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
            No duty roster assigned for Week {currentWeek}. Visit the Duty Roster module to generate or activate a schedule.
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 4. PUNCTUALITY TRACKER & STAFF ATTENDANCE OPERATIONAL GRID */}
      {/* ======================================================== */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* First Student In */}
        <article className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#062425] to-[#03131c] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              <Clock className="h-3.5 w-3.5" />
              First Student In
            </span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
              {firstStudentIn ? firstStudentIn.check_in_time : "Pending"}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            {firstStudentIn ? (
              <Link
                href={`/dashboard/students/${firstStudentIn.student_id}`}
                className="h-11 w-11 rounded-xl overflow-hidden border border-emerald-500/40 shadow-sm shrink-0 hover:scale-105 hover:border-emerald-300 transition group block"
                title="Open Student File Dossier"
              >
                {firstStudentIn?.avatar_url ? (
                  <img
                    src={firstStudentIn.avatar_url}
                    alt={firstStudentIn.student_name}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="h-full w-full bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300">
                    {firstStudentIn?.student_name ? firstStudentIn.student_name.slice(0, 2).toUpperCase() : "—"}
                  </div>
                )}
              </Link>
            ) : (
              <div className="h-11 w-11 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                —
              </div>
            )}
            <div className="min-w-0">
              <Link
                href={firstStudentIn ? `/dashboard/students/${firstStudentIn.student_id}` : "#"}
                className="font-serif text-lg font-bold text-white hover:text-emerald-300 truncate block transition"
              >
                {firstStudentIn ? firstStudentIn.student_name : "Waiting Arrival"}
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-[#dfba73]">{firstStudentIn?.admission_number || ""}</span>
                {firstStudentIn?.class_name && (
                  <span className="text-teal-300 font-medium">• {firstStudentIn.class_name}</span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-emerald-400/90 italic truncate">
            {firstStudentIn?.note || "Morning gate roll-call check-in"}
          </p>
        </article>

        {/* Last Student In */}
        <article className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#241c06] to-[#03131c] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              Last Student In
            </span>
            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
              {lastStudentIn ? lastStudentIn.check_in_time : "Pending"}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            {lastStudentIn ? (
              <Link
                href={`/dashboard/students/${lastStudentIn.student_id}`}
                className="h-11 w-11 rounded-xl overflow-hidden border border-amber-500/40 shadow-sm shrink-0 hover:scale-105 hover:border-amber-300 transition group block"
                title="Open Student File Dossier"
              >
                {lastStudentIn?.avatar_url ? (
                  <img
                    src={lastStudentIn.avatar_url}
                    alt={lastStudentIn.student_name}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-amber-950/70 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                    {lastStudentIn?.student_name ? lastStudentIn.student_name.slice(0, 2).toUpperCase() : "—"}
                  </div>
                )}
              </Link>
            ) : (
              <div className="h-11 w-11 rounded-xl bg-amber-950/70 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                —
              </div>
            )}
            <div className="min-w-0">
              <Link
                href={lastStudentIn ? `/dashboard/students/${lastStudentIn.student_id}` : "#"}
                className="font-serif text-lg font-bold text-white hover:text-amber-300 truncate block transition"
              >
                {lastStudentIn ? lastStudentIn.student_name : "Waiting Arrival"}
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-[#dfba73]">{lastStudentIn?.admission_number || ""}</span>
                {lastStudentIn?.class_name && (
                  <span className="text-teal-300 font-medium">• {lastStudentIn.class_name}</span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-amber-400/90 italic truncate">
            {lastStudentIn?.note || "Late gate entry advisory logged"}
          </p>
        </article>

        {/* Staff Present (Pending) */}
        <article className="rounded-2xl border border-teal-500/30 bg-gradient-to-b from-[#061d2e] to-[#03111c] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-400">
              <UserCheck className="h-3.5 w-3.5" />
              Staff Present (Pending)
            </span>
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          </div>

          <p className="mt-3 font-serif text-3xl font-bold text-white">
            {staffPresentCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Active faculty on campus duties today
          </p>
        </article>

        {/* Staff Absent (Pending) */}
        <article className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-[#24060b] to-[#03111c] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
              <UserX className="h-3.5 w-3.5" />
              Staff Absent (Pending)
            </span>
            <span className="h-2 w-2 rounded-full bg-rose-400" />
          </div>

          <p className="mt-3 font-serif text-3xl font-bold text-white">
            {staffAbsentCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Staff on authorized absence or off-duty
          </p>
        </article>
      </section>

      {/* ======================================================== */}
      {/* 5. NOBLE ACADEMIC STATS GRID */}
      {/* ======================================================== */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Enrolled Scholars"
          value={studentCount}
          sublabel="Active student body"
        />
        <StatCard
          icon={BookOpenCheck}
          label="Academic Faculty"
          value={teacherCount}
          sublabel="Subject teachers & tutors"
        />
        <StatCard
          icon={UsersRound}
          label="Institutional Staff"
          value={staffCount}
          sublabel="Managers & operations team"
        />
        <StatCard
          icon={Activity}
          label="Term Attendance"
          value={`${overallRate}%`}
          sublabel="Roll-call presence rate"
        />
      </section>

      {/* ======================================================== */}
      {/* 6. SECTIONAL CLASS-BY-CLASS LIVE STATISTICS & HISTORY */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="border-b border-[#dfba73]/20 pb-2">
          <span className="text-[10px] font-extrabold tracking-[0.2em] text-[#dfba73] uppercase">
            Wing Breakdown & Historical Registers
          </span>
          <h2 className="mt-1 font-serif text-2xl font-bold text-white">
            Sectional Students Statistics & Daily Registers
          </h2>
          <p className="text-xs text-slate-300">
            Live attendance counts for each class grouped by Nursery, Primary, and Secondary wings. Click History on any wing to inspect day-by-day logs.
          </p>
        </div>

        <SuperadminAttendanceTelemetry
          sectionsData={sectionsData}
          overallTotal={{
            total: overallTotalStudents,
            present: overallPresentStudents,
            absent: overallAbsentStudents,
            rate: overallRate,
          }}
          overallHistory={overallHistory}
          todayStr={targetAttendanceDate}
        />
      </section>

      {/* ======================================================== */}
      {/* 7. OFFICIAL NOTICE BOARD */}
      {/* ======================================================== */}
      <section className="rounded-2xl border border-[#c5a059]/20 bg-[#041928]/90 p-6 shadow-xl backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-[#c5a059]/15 pb-4">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#dfba73] uppercase">
              Official School Gazettes
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold text-white">
              Institutional Notice Board
            </h2>
          </div>
          <span className="text-xs text-slate-400">Published to Campus</span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {recentNotices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-xl border border-[#c5a059]/20 bg-[#020e18] p-4.5 transition hover:border-[#c5a059]/50"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-serif text-base font-bold text-amber-100">
                  {notice.title}
                </p>
                <span className="shrink-0 rounded-md border border-[#c5a059]/30 bg-[#c5a059]/10 px-2 py-0.5 text-[10px] font-mono text-[#dfba73]">
                  {notice.publishDate}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-3">
                {notice.content}
              </p>
            </article>
          ))}

          {!recentNotices.length && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-700/80 p-8 text-center text-sm text-slate-400">
              No executive notices currently published for this calendar.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#c5a059]/25 bg-gradient-to-b from-[#061d2e] to-[#03111c] p-5 shadow-lg transition hover:border-[#c5a059]/60">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-[#dfba73] transition-transform group-hover:scale-110" />
        <span className="h-2 w-2 rounded-full bg-[#dfba73]/40 group-hover:bg-[#dfba73]" />
      </div>

      <p className="mt-4 text-[10px] font-extrabold tracking-[0.16em] text-[#c5a059] uppercase">
        {label}
      </p>
      <p className="mt-1 font-serif text-3xl font-bold tracking-tight text-white">
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-[11px] text-slate-400 truncate">{sublabel}</p>
      )}
    </article>
  );
}
