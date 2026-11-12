import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { buyer_label, get_stripe, is_paid } from "@/lib/stripe";
import { create_download_token } from "@/lib/download-token";
import { send_access_email } from "@/lib/send-access-email";
import { to_lang } from "@/lib/i18n";

/**
 * Webhook Stripe : à chaque paiement confirmé, envoie l'email avec le lien de téléchargement.
 * Gère la carte (confirmée tout de suite) et les paiements différés (async_payment_succeeded).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Signature absente" }, { status: 400 });

  // Le corps brut est nécessaire pour vérifier la signature Stripe
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = get_stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (is_paid(session)) {
      const { name, email } = buyer_label(session);
      const origin = process.env.SITE_URL || request.nextUrl.origin;
      const download_url = `${origin}/api/download?token=${create_download_token(session.id)}`;
      // En cas d'échec, Stripe réessaie automatiquement (réponse 500)
      await send_access_email({ to: email, name, download_url, session_id: session.id, lang: to_lang(session.metadata?.lang) });
    }
  }

  return NextResponse.json({ received: true });
}
