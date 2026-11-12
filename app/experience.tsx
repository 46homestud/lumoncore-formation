"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ChromePill from "./chrome-pill/chrome-pill";
import { TEXTS } from "@/lib/i18n";
import { set_lang, useLang } from "./use-lang";

/**
 * Expérience complète : gélule chrome qui s'ouvre en deux sur fond noir pur, puis titre + bouton.
 * Bilingue anglais / français (bouton en bas de page).
 */
export default function Experience() {
  const [revealed, set_revealed] = useState(false);
  const lang = useLang();
  const t = TEXTS[lang];

  // Garde l'attribut lang du document aligné avec la langue affichée (accessibilité, traduction auto)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <main className={`stage ${revealed ? "is-revealed" : ""}`}>
      <div className="pill-layer">
        <ChromePill reveal openOn="hover" autoOpenAfter={2} onReveal={() => set_revealed(true)} />
      </div>

      {/* Logo en haut à gauche, présent dès l'arrivée (façon Apple) */}
      <header className="topbar">
        <span className="brand-mark">LUMONCORE</span>
        {/* Accès discret au portfolio : ne concurrence pas le bouton d'achat */}
        <a href="https://work.lumoncorestudio.com" className="nav-link">{t.work}</a>
      </header>

      <div className="content">
        <h1 className="headline reveal" style={{ transitionDelay: "0.3s" }}>{t.headline}</h1>
        {/* Le délai d'apparition est porté par le conteneur : le survol du bouton reste instantané */}
        <div className="cta-wrap reveal" style={{ transitionDelay: "0.85s" }}>
          <a href={`/api/checkout?lang=${lang}`} className="cta">
            {/* Texte doublé : au survol la copie du dessous « roule » vers le haut */}
            <span className="cta-roll">
              <span className="cta-roll-inner">
                <span>{t.cta}</span>
                <span aria-hidden="true">{t.cta}</span>
              </span>
            </span>
            <span className="cta-price">{t.price}</span>
            <span className="cta-chip" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </a>
          {/* Téléphone : le prix passe sous le bouton pour que tout tienne entre les deux moitiés */}
          <p className="price-note">{t.price}</p>
        </div>
      </div>

      {/* Bas de page discret : liens légaux + changement de langue */}
      <nav className="footer-links" aria-label="Footer">
        <Link href="/cgv">{t.terms}</Link>
        <Link href="/mentions-legales">{t.legal}</Link>
        <button type="button" className="lang-switch" onClick={() => set_lang(lang === "fr" ? "en" : "fr")}>
          {t.switch_label}
        </button>
      </nav>
    </main>
  );
}
