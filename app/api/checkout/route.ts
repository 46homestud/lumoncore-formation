import { NextResponse, type NextRequest } from "next/server";
import { PRICE_CENTS, PRODUCT_NAME, get_stripe } from "@/lib/stripe";
import { TEXTS, to_lang } from "@/lib/i18n";

/**
 * Crée une session Stripe Checkout et redirige l'acheteur vers la page de paiement Stripe.
 * Les moyens de paiement (carte, Apple Pay, Klarna en plusieurs fois…) s'activent dans le dashboard Stripe.
 */
export async function GET(request: NextRequest) {
  const origin = process.env.SITE_URL || request.nextUrl.origin;
  const stripe = get_stripe();
  // Langue choisie sur le site : page Stripe, email et page de remerciement dans la même langue
  const lang = to_lang(request.nextUrl.searchParams.get("lang"));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      process.env.STRIPE_PRICE_ID
        ? { price: process.env.STRIPE_PRICE_ID, quantity: 1 }
        : {
            price_data: {
              currency: "eur",
              unit_amount: PRICE_CENTS,
              product_data: { name: PRODUCT_NAME, description: "Create AI videos creatively & monetize them. Digital PDF." },
            },
            quantity: 1,
          },
    ],
    // Obligatoire en France pour un contenu numérique livré immédiatement : acceptation des CGV
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: {
        message: TEXTS[lang].terms_consent(`${origin}/cgv`),
      },
    },
    // Managed Payments (Stripe revendeur, commission en plus) désactivé : frais minimum
    managed_payments: { enabled: false },
    locale: lang,
    metadata: { lang },
    customer_creation: "always",
    invoice_creation: { enabled: true },
    success_url: `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });

  if (!session.url) return NextResponse.json({ error: "Session Stripe sans URL" }, { status: 500 });
  return NextResponse.redirect(session.url, 303);
}
