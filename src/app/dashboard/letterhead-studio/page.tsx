import { getLetterheadDocuments } from "@/lib/services/letterhead";
import { LetterheadStudioClient } from "@/features/dashboard/components/letterhead-studio-client";

export default async function LetterheadStudioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialTab = typeof query.tab === "string" ? query.tab : "composer";
  const archivedLetters = await getLetterheadDocuments();

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Executive Document Studio
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          School Letterhead Studio
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Compose official school letters with sender, recipient, salutation, heading, content, and closure. Upload signature file and preview the ready-made heraldic letterhead before printing.
        </p>
      </div>

      <LetterheadStudioClient
        archivedLetters={archivedLetters}
        initialTab={initialTab}
      />
    </div>
  );
}
