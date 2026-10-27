import { SalamahCreativeLoader } from "@/components/ui/salamah-creative-loader";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#04111a] flex items-center justify-center">
      <SalamahCreativeLoader
        label="Connecting to Salamah School..."
        sublabel="Nurturing Islamic Excellence • Katsina, Nigeria"
        variant="inline"
      />
    </div>
  );
}
