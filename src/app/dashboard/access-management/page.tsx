import { redirect } from "next/navigation";

export default async function AccessManagementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const tab = typeof query.tab === "string" ? query.tab : "";
  redirect(tab ? `/dashboard/access-control?tab=${tab}` : "/dashboard/access-control");
}
