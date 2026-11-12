import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb } from "@pdfme/pdf-lib";

// PDF maître : hors de /public, donc jamais accessible directement par une URL
export const MASTER_PDF_PATH = path.join(process.cwd(), "private", "methode.pdf");

/**
 * Retire les caractères que la police standard du PDF ne sait pas dessiner (emoji, etc.).
 */
function safe_text(text: string): string {
  return text.normalize("NFC").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

/**
 * Charge le PDF maître et marque chaque page : filigrane diagonal « LUMONCORE » très léger
 * + une ligne discrète en pied de page (nom de l'acheteur et numéro de commande, sans adresse email).
 */
export async function watermark_pdf(buyer: { name: string; email: string; order: string }): Promise<Uint8Array> {
  const bytes = await readFile(MASTER_PDF_PATH);
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  // Le nom seul (jamais l'email) ; si Stripe n'a pas de nom, on n'affiche que la commande
  const name = buyer.name && !buyer.name.includes("@") ? `${buyer.name} · ` : "";
  const footer = safe_text(`Licence personnelle : ${name}commande ${buyer.order.slice(-10)} · partage interdit`);
  const diagonal = "LUMONCORE";

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    // Pied de page lisible
    const size = 7;
    const text_width = font.widthOfTextAtSize(footer, size);
    page.drawText(footer, {
      x: Math.max(12, (width - text_width) / 2),
      y: 12,
      size,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.8,
    });
    // Filigrane diagonal « LUMONCORE », presque invisible
    page.drawText(diagonal, {
      x: width * 0.16,
      y: height * 0.28,
      size: Math.min(64, width / 8),
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.07,
      rotate: degrees(35),
    });
  }

  // Métadonnées invisibles : l'acheteur reste identifiable en cas de fuite
  pdf.setAuthor("LUMONCORE");
  pdf.setSubject(safe_text(`Licence ${buyer.email} – ${buyer.order}`));
  pdf.setKeywords([safe_text(buyer.email), buyer.order]);

  return pdf.save();
}
