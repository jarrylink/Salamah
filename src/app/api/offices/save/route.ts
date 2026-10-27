import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createOrUpdateOffice } from "@/lib/services/offices";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, code, location, responsibilities, assignedUserId, status } = body;

    if (!name || !code || !responsibilities) {
      return NextResponse.json({ message: "Name, code and responsibilities are required" }, { status: 400 });
    }

    const result = await createOrUpdateOffice({
      id,
      name,
      code,
      location,
      responsibilities,
      assignedUserId,
      status: status || "active",
    });

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving office" }, { status: 500 });
  }
}
