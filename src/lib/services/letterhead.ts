import "server-only";
import { sqlClient } from "@/db";

export type LetterheadDoc = {
  id: string;
  reference_number: string;
  sender_title: string;
  sender_office: string;
  recipient_name: string;
  recipient_address: string | null;
  salutation: string;
  heading: string;
  content: string;
  closure: string;
  signatory_name: string;
  signatory_role: string;
  signature_url: string | null;
  letter_date: string;
  created_at: string;
  author_first_name?: string | null;
  author_last_name?: string | null;
};

export async function getLetterheadDocuments() {
  const documents = await sqlClient.query(`
    SELECT
      l.id,
      l.reference_number,
      l.sender_title,
      l.sender_office,
      l.recipient_name,
      l.recipient_address,
      l.salutation,
      l.heading,
      l.content,
      l.closure,
      l.signatory_name,
      l.signatory_role,
      l.signature_url,
      l.letter_date,
      l.created_at,
      p.first_name as author_first_name,
      p.last_name as author_last_name
    FROM letterhead_documents l
    LEFT JOIN users u ON u.id = l.author_user_id
    LEFT JOIN people p ON p.id = u.person_id
    ORDER BY l.created_at DESC
  `);
  return documents as LetterheadDoc[];
}

export async function createLetterheadDocument(input: {
  referenceNumber: string;
  senderTitle: string;
  senderOffice: string;
  recipientName: string;
  recipientAddress?: string;
  salutation: string;
  heading: string;
  content: string;
  closure: string;
  signatoryName: string;
  signatoryRole: string;
  signatureUrl?: string;
  letterDate?: string;
  authorUserId?: string;
}) {
  const [created] = await sqlClient.query(
    `INSERT INTO letterhead_documents (
      reference_number, sender_title, sender_office, recipient_name, recipient_address,
      salutation, heading, content, closure, signatory_name, signatory_role, signature_url,
      letter_date, author_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13::date, CURRENT_DATE), $14)
    RETURNING id, reference_number`,
    [
      input.referenceNumber,
      input.senderTitle,
      input.senderOffice,
      input.recipientName,
      input.recipientAddress || null,
      input.salutation,
      input.heading,
      input.content,
      input.closure,
      input.signatoryName,
      input.signatoryRole,
      input.signatureUrl || null,
      input.letterDate || null,
      input.authorUserId || null,
    ]
  );
  return created;
}
