import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserDocuments, addUserDocument, deleteUserDocument } from "@/lib/services/access-management";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId") || session.userId;

  // Non-admins can only see their own documents
  if (session.role !== "superadmin" && session.role !== "admin" && session.role !== "manager" && targetUserId !== session.userId) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const documents = await getUserDocuments(targetUserId);
    return NextResponse.json({ success: true, documents });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error fetching documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, title, docType, fileUrl, fileName, fileSize, category, notes } = body;

    if (!userId || !title || !fileUrl) {
      return NextResponse.json({ message: "userId, title, and fileUrl are required." }, { status: 400 });
    }

    const doc = await addUserDocument({
      userId,
      title,
      docType: docType || "other",
      fileUrl,
      fileName,
      fileSize,
      category,
      notes,
    });

    return NextResponse.json({ success: true, document: doc, message: "Document added to dossier." });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error adding document" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Super Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("id");

  if (!documentId) {
    return NextResponse.json({ message: "Document ID is required." }, { status: 400 });
  }

  try {
    await deleteUserDocument(documentId);
    return NextResponse.json({ success: true, message: "Document removed from dossier." });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error deleting document" }, { status: 500 });
  }
}
