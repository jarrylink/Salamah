import { sqlClient } from "@/db";
import { getCmsSections } from "@/lib/services/cms";
import { CmsEditorClient } from "@/features/dashboard/components/cms-editor-client";

export default async function CmsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const activeSectionKey = typeof query.section === "string" ? query.section : "hero";
  const sections = await getCmsSections();

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Landing Page CMS Engine
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Content Management System
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          0% Hardcoded Data • Every landing page section, tuition figure, and diplomatic campus address is loaded live from and written directly to Neon DB.
        </p>
      </div>

      <CmsEditorClient
        sections={sections}
        initialSectionKey={activeSectionKey}
      />
    </div>
  );
}
