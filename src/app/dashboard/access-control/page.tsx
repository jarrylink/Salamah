import { getAllAccessControlUsers, getAllStudentsForLink, getManagersList } from "@/lib/services/access-management";
import { AccessControlClient } from "@/features/dashboard/components/access-control-client";

export default async function AccessControlPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "all";

  const [allUsers, allStudents, managers] = await Promise.all([
    getAllAccessControlUsers(),
    getAllStudentsForLink(),
    getManagersList(),
  ]);

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Institutional Security &amp; Directory
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Access Control
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Unified control center for all 4 institutional roles: Superadmins, Managers, Faculty/Staff, and Scholars. Manage credentials, designations, student profile links, passport photos, activation states, and official dossier files.
        </p>
      </div>

      <AccessControlClient
        users={allUsers as any}
        students={allStudents as any}
        managers={managers as any}
        initialTab={initialTab}
      />
    </div>
  );
}
