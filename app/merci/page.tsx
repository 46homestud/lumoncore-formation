import type { Metadata } from "next";
import Link from "next/link";
import { get_stripe, is_paid } from "@/lib/stripe";
import { create_download_token } from "@/lib/download-token";
import { TEXTS, to_lang, type Lang } from "@/lib/i18n";

export const metadata: Metadata = { title: "Thank you — LUMONCORE", robots: { index: false } };

/**
 * Page de remerciement après paiement : lien de téléchargement immédiat (le même lien part aussi par email).
 */
export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let download_url: string | null = null;
  let lang: Lang = "en";

  if (session_id) {
    try {
      const session = await get_stripe().checkout.sessions.retrieve(session_id);
      lang = to_lang(session.metadata?.lang);
      if (is_paid(session)) download_url = `/api/download?token=${create_download_token(session.id)}`;
    } catch {
      download_url = null;
    }
  }

  const t = TEXTS[lang];
  return (
    <main className="simple-page" lang={lang}>
      <header className="topbar">
        <Link href="/" className="brand-mark">LUMONCORE</Link>
      </header>
      <div className="simple-content">
        {download_url ? (
          <>
            <h1 className="headline">{t.thanks_title}</h1>
            <p className="simple-text">{t.thanks_text}</p>
            <a href={download_url} className="cta simple-cta">
              <span>{t.thanks_cta}</span>
            </a>
          </>
        ) : (
          <>
            <h1 className="headline">{t.pending_title}</h1>
            <p className="simple-text">{t.pending_text}</p>
          </>
        )}
      </div>
    </main>
  );
}
