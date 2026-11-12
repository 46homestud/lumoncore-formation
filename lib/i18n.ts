// Langues du site : anglais par défaut, français en option (bouton en bas de page)
export type Lang = "en" | "fr";
export const LANG_COOKIE = "lang";

/**
 * Normalise une valeur quelconque (cookie, paramètre d'URL, métadonnée Stripe) en langue supportée.
 */
export function to_lang(value: string | null | undefined): Lang {
  return value === "fr" ? "fr" : "en";
}

export const TEXTS = {
  en: {
    headline: "Let's create & monetize.",
    cta: "Get the method",
    price: "€50",
    work: "Work",
    terms: "Terms",
    legal: "Legal",
    switch_label: "Français",
    thanks_title: "Welcome in.",
    thanks_text: "Your copy is ready. We also sent the link to your email (valid 7 days).",
    thanks_cta: "Download the method",
    pending_title: "Almost there.",
    pending_text: "Your payment is being confirmed. You'll receive your download link by email in a few minutes.",
    terms_consent: (url: string) =>
      `I accept the [terms of sale](${url}) and request immediate access to the digital content, waiving my 14-day right of withdrawal.`,
    email_subject: "Your LUMONCORE method is ready",
    email_title: (first: string) => `Your method is ready${first}.`,
    email_text: "Here is your personal download link, valid for 7 days. Your copy is tied to your purchase, please don't share it.",
    email_cta: "Download the method",
  },
  fr: {
    headline: "Créer & monétiser.",
    cta: "Obtenir la méthode",
    price: "50 €",
    work: "Portfolio",
    terms: "CGV",
    legal: "Mentions légales",
    switch_label: "English",
    thanks_title: "Bienvenue.",
    thanks_text: "Ton exemplaire est prêt. Le lien t'a aussi été envoyé par email (valable 7 jours).",
    thanks_cta: "Télécharger la méthode",
    pending_title: "Presque fini.",
    pending_text: "Ton paiement est en cours de confirmation. Tu recevras ton lien de téléchargement par email d'ici quelques minutes.",
    terms_consent: (url: string) =>
      `J'accepte les [conditions générales de vente](${url}) et je demande l'accès immédiat au contenu numérique, en renonçant à mon droit de rétractation de 14 jours.`,
    email_subject: "Ta méthode LUMONCORE est prête",
    email_title: (first: string) => `Ta méthode est prête${first}.`,
    email_text: "Voici ton lien de téléchargement personnel, valable 7 jours. Ton exemplaire est lié à ton achat, merci de ne pas le partager.",
    email_cta: "Télécharger la méthode",
  },
} as const;
