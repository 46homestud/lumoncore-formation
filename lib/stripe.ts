import Stripe from "stripe";

// Prix de la formation en centimes (50 €), modifiable via .env
export const PRICE_CENTS = Number(process.env.FORMATION_PRICE_CENTS || 5000);
export const PRODUCT_NAME = "LUMONCORE — The Method";

let client: Stripe | null = null;

/**
 * Retourne le client Stripe (clé secrète lue dans .env, jamais en dur).
 */
export function get_stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY manquante dans .env.local");
    client = new Stripe(key);
  }
  return client;
}

/**
 * Indique si une session Checkout est réellement payée (carte immédiate ou Klarna confirmé).
 */
export function is_paid(session: Stripe.Checkout.Session): boolean {
  return session.payment_status === "paid";
}

/**
 * Nom affiché sur le PDF : nom de l'acheteur, sinon son email.
 */
export function buyer_label(session: Stripe.Checkout.Session): { name: string; email: string } {
  const email = session.customer_details?.email || "";
  const name = session.customer_details?.name || email;
  return { name, email };
}
