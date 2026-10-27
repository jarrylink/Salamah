import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createLetterheadDocument } from "@/lib/services/letterhead";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      referenceNumber,
      senderTitle,
      senderOffice,
      recipientName,
      recipientAddress,
      salutation,
      heading,
      content,
      closure,
      signatoryName,
      signatoryRole,
      signatureUrl,
      letterDate,
    } = body;

    if (!referenceNumber || !senderTitle || !recipientName || !heading || !content || !signatoryName) {
      return NextResponse.json({ message: "Missing required letterhead fields" }, { status: 400 });
    }

    const created = await createLetterheadDocument({
      referenceNumber,
      senderTitle,
      senderOffice: senderOffice || "Principal's Office",
      recipientName,
      recipientAddress,
      salutation: salutation || "Dear Sir/Madam,",
      heading,
      content,
      closure: closure || "Yours faithfully,",
      signatoryName,
      signatoryRole: signatoryRole || "Executive Principal",
      signatureUrl,
      letterDate,
      authorUserId: session.userId,
    });

    return NextResponse.json({ success: true, created });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error saving letterhead" }, { status: 500 });
  }
}
