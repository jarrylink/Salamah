import { sqlClient } from "@/db";
import { getAdmissionApplications } from "@/lib/services/applications";
import { getSystemSettings } from "@/lib/services/settings";
import {
  ApplicationsManagerClient,
  type ApplicationItem,
} from "@/features/dashboard/components/applications-manager-client";

export default async function ApplicationsPage() {
  const applications = await getAdmissionApplications();
  const settings = await getSystemSettings();
  const admissionsConfig = (settings["admissions_configuration"] as Record<string, unknown>) || {};
  const feePerChildKobo = (admissionsConfig["applicationFeeKobo"] as number) || 2500000;

  return (
    <div className="space-y-6 salamah-enter">
      <div className="border-b border-[#c5a059]/20 pb-4">
        <span className="rounded-full border border-[#c5a059]/35 bg-[#c5a059]/15 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
          Admissions Directorate
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Student Admission Applications
        </h1>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
          Review incoming guardian applications from the landing page hero form, manage application fee pricing, and admit students directly into the school database.
        </p>
      </div>

      <ApplicationsManagerClient
        applications={applications as unknown as ApplicationItem[]}
        initialFeeKobo={feePerChildKobo}
      />
    </div>
  );
}
