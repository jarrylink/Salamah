import { NextResponse } from "next/server";
import { submitEnrollmentApplication } from "@/lib/services/applications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guardianName, guardianEmail, guardianPhone, guardianAddress, guardianOccupation, children, paymentMethod } = body;

    if (!guardianName || !guardianEmail || !guardianPhone || !guardianAddress || !children || children.length === 0) {
      return NextResponse.json({ message: "Please fill in all required guardian and child details." }, { status: 400 });
    }

    const application = await submitEnrollmentApplication({
      guardianName,
      guardianEmail,
      guardianPhone,
      guardianAddress,
      guardianOccupation,
      children,
      paymentMethod,
    });

    return NextResponse.json({ success: true, application });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error submitting enrollment application" }, { status: 500 });
  }
}
