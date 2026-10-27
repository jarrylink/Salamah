import "server-only";
import { sqlClient } from "@/db";
import { resolveAcademicContext } from "@/features/academic/lib/context";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  Layers,
  LogOut,
  Mail,
  Phone,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

export async function ManagerDashboard({ userId }: { userId: string }) {
  const context = await resolveAcademicContext();

  // Manager user profile
  const [manager] = await sqlClient.query(`
    SELECT
      u.id, u.email, u.role,
      p.first_name, p.last_name, p.phone, p.avatar_url,
      s.staff_number, s.department
    FROM users u
    JOIN people p ON p.id = u.person_id
    LEFT JOIN staff s ON s.person_id = p.id
    WHERE u.id = $1
  `, [userId]);

  // Staff supervised by this manager
  const assignedStaff = await sqlClient.query(`
    SELECT
      u.id as user_id,
      u.email,
      u.role,
      u.status,
      p.first_name,
      p.last_name,
      p.phone,
      p.avatar_url,
      s.staff_number,
      s.department,
      s.metadata,
      msa.notes as supervision_notes,
      (SELECT count(*)::int FROM offices o WHERE o.assigned_user_id = u.id) as assigned_offices_count,
      (SELECT count(*)::int FROM school_tasks st WHERE st.assigned_user_id = u.id) as assigned_tasks_count,
      (SELECT count(*)::int FROM teacher_subject_assignments tsa JOIN teachers t ON t.id = tsa.teacher_id JOIN staff stf ON stf.id = t.staff_id WHERE stf.person_id = p.id) as assigned_subjects_count
    FROM manager_staff_assignments msa
    JOIN users u ON u.id = msa.staff_user_id
    JOIN people p ON p.id = u.person_id
    LEFT JOIN staff s ON s.person_id = p.id
    WHERE msa.manager_user_id = $1 AND msa.status = 'active'
    ORDER BY p.first_name, p.last_name
  `, [userId]);

  const staffUserIds = assignedStaff.map((s) => s.user_id);

  // Recent weekly office logs from assigned staff
  const recentOfficeLogs = staffUserIds.length
    ? await sqlClient.query(`
      SELECT
        ol.id, ol.log_date, ol.week_summary, ol.daily_tasks_carried_out, ol.challenges, ol.next_week_plan, ol.status,
        o.name as office_name, o.code as office_code,
        p.first_name, p.last_name
      FROM office_logs ol
      JOIN offices o ON o.id = ol.office_id
      JOIN users u ON u.id = ol.author_user_id
      JOIN people p ON p.id = u.person_id
      WHERE ol.author_user_id = ANY($1::uuid[])
      ORDER BY ol.log_date DESC LIMIT 8
    `, [staffUserIds])
    : [];

  // Recent task logs from assigned staff
  const recentTaskLogs = staffUserIds.length
    ? await sqlClient.query(`
      SELECT
        tl.id, tl.log_date, tl.report, tl.status, tl.notes,
        st.title as task_title, st.category as task_category,
        p.first_name, p.last_name
      FROM school_task_logs tl
      JOIN school_tasks st ON st.id = tl.task_id
      JOIN users u ON u.id = tl.staff_user_id
      JOIN people p ON p.id = u.person_id
      WHERE tl.staff_user_id = ANY($1::uuid[])
      ORDER BY tl.log_date DESC LIMIT 8
    `, [staffUserIds])
    : [];

  // Offices directly assigned to manager
  const managerOffices = await sqlClient.query(`
    SELECT o.id, o.name, o.code, o.location, o.responsibilities,
           (SELECT count(*)::int FROM office_logs ol WHERE ol.office_id = o.id) as log_count
    FROM offices o
    WHERE o.assigned_user_id = $1 AND o.status = 'active'
  `, [userId]);

  return (
    <div className="min-h-screen bg-[#061824] text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-[#04141e]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-slate-950 font-bold">
              SIS
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white">
                Salamah International School
              </h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                Operations & Manager Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-white">
                {manager ? `${manager.first_name} ${manager.last_name}` : "Manager"}
              </p>
              <p className="text-[11px] text-teal-400">{manager?.department || "Administration"}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Welcome Banner */}
        <div className="rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-950/60 via-slate-900 to-[#082232] p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300">
                  Supervised by Super Admin
                </span>
                <span className="text-xs text-slate-400">
                  {context ? `${context.sessionName} • ${context.termName}` : "Active Academic Cycle"}
                </span>
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">
                Welcome, {manager?.first_name || "Manager"}.
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                You have managerial oversight over {assignedStaff.length} assigned school staff members, their offices, weekly duty updates, and academic allocations.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-teal-300">{assignedStaff.length}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Assigned Staff</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{managerOffices.length}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Managed Offices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Staff Assigned by Super Admin */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-400" />
              <h3 className="font-display text-xl font-bold text-white">
                Supervised Staff Members
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Assigned to you by Super Admin
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedStaff.map((staff) => (
              <div
                key={staff.user_id}
                className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-sm transition hover:border-teal-500/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/20 text-teal-300 font-bold">
                      {staff.first_name[0]}{staff.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {staff.first_name} {staff.last_name}
                      </h4>
                      <p className="text-xs text-teal-400">{staff.department || "Operations"}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                    {staff.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                  {staff.supervision_notes && (
                    <p className="mt-1 rounded-lg bg-slate-900/60 p-2 text-[11px] text-slate-400 italic">
                      &quot;{staff.supervision_notes}&quot;
                    </p>
                  )}
                </div>

                {/* Assignment Badges */}
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-950/60 px-2 py-1 text-[11px] font-medium text-blue-300">
                    <Building2 className="h-3 w-3" />
                    {staff.assigned_offices_count} Offices
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/60 px-2 py-1 text-[11px] font-medium text-amber-300">
                    <ClipboardList className="h-3 w-3" />
                    {staff.assigned_tasks_count} Tasks
                  </span>
                  {staff.assigned_subjects_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/60 px-2 py-1 text-[11px] font-medium text-emerald-300">
                      <GraduationCap className="h-3 w-3" />
                      {staff.assigned_subjects_count} Subjects
                    </span>
                  )}
                </div>
              </div>
            ))}

            {assignedStaff.length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-800 bg-[#092233] p-8 text-center text-slate-400">
                No staff members currently assigned to your supervision by Super Admin.
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Recent Weekly Office Logs from Assigned Staff */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-teal-400" />
              <h3 className="font-display text-xl font-bold text-white">
                Recent Office Weekly Logs & Updates
              </h3>
            </div>
            <span className="text-xs text-slate-400">Weekly reports from supervised offices</span>
          </div>

          <div className="mt-4 space-y-3">
            {recentOfficeLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-800 bg-[#092233] p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300">
                      {log.office_code}
                    </span>
                    <h4 className="font-bold text-white">{log.office_name}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{log.log_date}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-teal-300">By {log.first_name} {log.last_name}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-200">{log.week_summary}</p>
                  <div className="mt-2 rounded-xl bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                    {log.daily_tasks_carried_out}
                  </div>
                  {log.challenges && (
                    <p className="mt-2 text-xs text-amber-300">
                      <span className="font-semibold text-amber-400">Challenges: </span>
                      {log.challenges}
                    </p>
                  )}
                  {log.next_week_plan && (
                    <p className="mt-1 text-xs text-emerald-300">
                      <span className="font-semibold text-emerald-400">Next Week Plan: </span>
                      {log.next_week_plan}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {recentOfficeLogs.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-[#092233] p-6 text-center text-xs text-slate-400">
                No weekly office updates submitted yet by your supervised staff.
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Recent Task Reports */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h3 className="font-display text-xl font-bold text-white">
                General School Tasks Reports (Gardening, Security, Maintenance)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Execution logs from assigned staff</span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recentTaskLogs.map((tl) => (
              <div
                key={tl.id}
                className="rounded-2xl border border-slate-800 bg-[#092233] p-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
                    {tl.task_category}
                  </span>
                  <span className="text-slate-400">{tl.log_date}</span>
                </div>
                <h5 className="mt-2 font-bold text-white">{tl.task_title}</h5>
                <p className="mt-1 text-slate-300 leading-relaxed">{tl.report}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-slate-400">
                  <span>Reported by {tl.first_name} {tl.last_name}</span>
                  <span className="font-semibold text-emerald-400">{tl.status}</span>
                </div>
              </div>
            ))}

            {recentTaskLogs.length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-800 bg-[#092233] p-6 text-center text-slate-400">
                No task execution logs submitted yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
