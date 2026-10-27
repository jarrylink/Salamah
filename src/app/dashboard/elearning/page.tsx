import { sqlClient } from "@/db";
import { getElearningResources } from "@/lib/services/elearning";
import { ElearningClient } from "@/features/dashboard/components/elearning-client";

export default async function ElearningPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialAction = typeof query.action === "string" ? query.action : undefined;
  const initialType = typeof query.type === "string" ? query.type : "url";

  const resources = await getElearningResources();
  const subjects = await sqlClient.query("SELECT id, name FROM subjects ORDER BY name");
  const classes = await sqlClient.query("SELECT id, name FROM classes ORDER BY name");

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Digital Learning Directorate
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          E-Learning Resources & Courseware
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Super Admin CRUD management for digital learning resources: curriculum notes (text), downloadable revision files, and external interactive links / test URLs.
        </p>
      </div>

      <ElearningClient
        resources={resources}
        subjects={subjects as unknown as { id: string; name: string }[]}
        classes={classes as unknown as { id: string; name: string }[]}
        initialAction={initialAction}
        initialType={initialType as "text" | "file" | "url"}
      />
    </div>
  );
}
