import { SalamahCreativeLoader } from "@/components/ui/salamah-creative-loader";

export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <SalamahCreativeLoader
        label="Loading Salamah Portal..."
        sublabel="Accessing verified school database & academic ledger"
        variant="inline"
      />
    </div>
  );
}
