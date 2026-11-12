import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "../legal-info";

export const metadata: Metadata = { title: "Mentions légales — LUMONCORE" };

/**
 * Mentions légales obligatoires (LCEN) : éditeur et hébergeur du site.
 */
export default function MentionsLegalesPage() {
  return (
    <main className="simple-page">
      <header className="topbar">
        <Link href="/" className="brand-mark">LUMONCORE</Link>
      </header>
      <article className="simple-content legal">
        <h1>Mentions légales</h1>
        <h2>Éditeur</h2>
        <p>{LEGAL.seller_name}, {LEGAL.status}, nom commercial {LEGAL.trade_name}. SIRET {LEGAL.siret}. {LEGAL.address}. Contact : {LEGAL.email}. Directeur de la publication : {LEGAL.seller_name}.</p>
        <h2>Hébergeur</h2>
        <p>{LEGAL.host}</p>
        <h2>Paiement</h2>
        <p>Les paiements sont traités par Stripe Payments Europe Ltd. Le vendeur n&apos;a jamais accès aux données bancaires.</p>
      </article>
    </main>
  );
}
