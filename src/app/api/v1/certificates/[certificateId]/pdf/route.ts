import { NextResponse } from "next/server";
import { handler } from "@/lib/api";
import { getSession } from "@/services/auth/session";
import { getCertificateForVerification } from "@/services/certificate.service";

/** Certificate PDF download (public verification + owner download). */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ certificateId: string }> }) => {
  const { certificateId } = await ctx.params;
  const info = await getCertificateForVerification(certificateId);
  void info;

  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.06, 0.09, 0.16);
  const indigo = rgb(0.31, 0.27, 0.9);
  const gray = rgb(0.35, 0.4, 0.47);

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 24, y: 24, width: 794, height: 547, borderColor: navy, borderWidth: 3 });
  page.drawRectangle({ x: 30, y: 30, width: 782, height: 535, borderColor: indigo, borderWidth: 1 });

  const center = (text: string, y: number, size: number, font = helvetica, color = navy) => {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (842 - width) / 2, y, size, font, color });
  };

  center("BICE ACADEMY", 505, 22, bold, indigo);
  center("Certificate of Completion", 452, 34, bold);
  center("This is to certify that", 405, 13, helvetica, gray);
  center(info.studentName, 355, 30, bold);
  center("has successfully completed the course", 318, 13, helvetica, gray);
  center(info.courseTitle, 275, 21, bold, navy);
  center(`Issued on ${new Date(info.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 225, 12, helvetica, gray);
  center(`Instructor: ${info.instructorName ?? "BICE Academy"}`, 200, 12, helvetica, gray);

  page.drawText(`Certificate ID: ${info.certificateId}`, { x: 70, y: 70, size: 11, font: helvetica, color: gray });
  page.drawText(`Verify at ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify-certificate/${info.certificateId}`, {
    x: 70, y: 52, size: 10, font: helvetica, color: gray,
  });
  page.drawText("Authorized Signature", { x: 610, y: 100, size: 11, font: helvetica, color: navy });
  page.drawLine({ start: { x: 610, y: 120 }, end: { x: 772, y: 120 }, color: navy, thickness: 1 });

  const bytes = await doc.save();
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BICE-Certificate-${certificateId}.pdf"`,
    },
  });
});
