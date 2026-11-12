"use client";

import { useSyncExternalStore } from "react";
import { LANG_COOKIE, to_lang, type Lang } from "@/lib/i18n";

// Abonnés notifiés quand la langue change
const listeners = new Set<() => void>();

/**
 * Lit la langue côté navigateur : cookie choisi par le visiteur, sinon langue du navigateur.
 */
function read_lang(): Lang {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=(fr|en)`));
  if (match) return to_lang(match[1]);
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/**
 * Abonne un composant aux changements de langue.
 */
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Enregistre la langue choisie (cookie 1 an, lu aussi par le serveur) et met à jour l'affichage.
 */
export function set_lang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

/**
 * Hook (nommé useLang : React exige le préfixe « use » en camelCase) : langue courante (anglais pendant le rendu serveur, puis langue réelle du visiteur).
 */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, read_lang, () => "en");
}
