import { NextResponse, type NextRequest } from "next/server";
import { buyer_label, get_stripe, is_paid } from "@/lib/stripe";
import { verify_download_token } from "@/lib/download-token";
import { watermark_pdf } from "@/lib/watermark";

/**
 * Téléchargement : vérifie le jeton temporaire, revérifie le paiement chez Stripe,
 * puis génère à la volée un PDF tatoué au nom de l'acheteur.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const session_id = verify_download_token(token);
  if (!session_id) {
    return new NextResponse("This link has expired. Reply to your purchase email to get a new one.", { status: 410 });
  }

  const session = await get_stripe().checkout.sessions.retrieve(session_id);
  if (!is_paid(session)) return new NextResponse("Payment not confirmed.", { status: 402 });

  const { name, email } = buyer_label(session);
  const pdf = await watermark_pdf({ name, email, order: session.id });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="LUMONCORE-The-Method.pdf"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
