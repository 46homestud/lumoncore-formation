import { createHmac, timingSafeEqual } from "node:crypto";

// Durée de validité d'un lien de téléchargement : 7 jours
export const LINK_TTL_SECONDS = 7 * 24 * 3600;

/**
 * Signature HMAC-SHA256 avec le secret serveur (DOWNLOAD_SECRET dans .env).
 */
function sign(payload: string): string {
  const secret = process.env.DOWNLOAD_SECRET;
  if (!secret) throw new Error("DOWNLOAD_SECRET manquante dans .env.local");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Crée un jeton de téléchargement temporaire lié à une session Stripe.
 * Format : base64url(session_id.expiration).signature
 */
export function create_download_token(session_id: string, ttl_seconds = LINK_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttl_seconds;
  const payload = Buffer.from(`${session_id}.${exp}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * Vérifie un jeton : signature valide et non expiré. Retourne l'id de session Stripe ou null.
 */
export function verify_download_token(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  const [session_id, exp] = Buffer.from(payload, "base64url").toString().split(".");
  if (!session_id || !exp || Number(exp) < Date.now() / 1000) return null;
  return session_id;
}
