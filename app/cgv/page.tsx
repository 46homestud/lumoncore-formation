import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "../legal-info";

export const metadata: Metadata = { title: "CGV — LUMONCORE" };

/**
 * Conditions générales de vente de la formation numérique (PDF).
 */
export default function CgvPage() {
  return (
    <main className="simple-page">
      <header className="topbar">
        <Link href="/" className="brand-mark">LUMONCORE</Link>
      </header>
      <article className="simple-content legal">
        <h1>Conditions générales de vente</h1>

        <h2>1. Vendeur</h2>
        <p>{LEGAL.seller_name}, {LEGAL.status}, nom commercial {LEGAL.trade_name}, SIRET {LEGAL.siret}, {LEGAL.address}. Contact : {LEGAL.email}.</p>

        <h2>2. Produit</h2>
        <p>« LUMONCORE — The Method » est une formation numérique au format PDF sur la création de vidéos IA et leur monétisation. Elle est livrée par téléchargement.</p>

        <h2>3. Prix</h2>
        <p>{LEGAL.price} TTC. {LEGAL.vat_note}.</p>

        <h2>4. Paiement</h2>
        <p>Le paiement est réalisé de façon sécurisée via Stripe (carte bancaire, Apple Pay, Google Pay et, lorsqu&apos;il est proposé, le paiement en plusieurs fois via Klarna). En cas de paiement fractionné, le contrat de crédit est conclu entre l&apos;acheteur et Klarna, selon les conditions de Klarna.</p>

        <h2>5. Livraison</h2>
        <p>Dès la confirmation du paiement, l&apos;acheteur accède à un lien de téléchargement personnel, affiché à l&apos;écran et envoyé par email. Ce lien est valable 7 jours. En cas de problème, il suffit d&apos;écrire à {LEGAL.email}.</p>

        <h2>6. Droit de rétractation</h2>
        <p>Conformément à l&apos;article L221-28 13° du Code de la consommation, le droit de rétractation ne peut être exercé pour un contenu numérique fourni sur un support immatériel dont l&apos;exécution a commencé avec l&apos;accord préalable exprès du consommateur et son renoncement exprès à son droit de rétractation. Lors de la commande, l&apos;acheteur demande l&apos;accès immédiat au contenu et renonce expressément à ce droit.</p>

        <h2>7. Licence d&apos;utilisation</h2>
        <p>L&apos;achat donne droit à une licence personnelle, non cessible. Chaque exemplaire est marqué au nom et à l&apos;email de l&apos;acheteur. Toute reproduction, revente ou diffusion, même partielle et gratuite, est interdite et peut donner lieu à des poursuites.</p>

        <h2>8. Données personnelles</h2>
        <p>Le nom et l&apos;email de l&apos;acheteur sont utilisés uniquement pour la livraison, la facturation et le marquage du PDF. Les données de paiement sont traitées par Stripe et ne sont jamais stockées par le vendeur. L&apos;acheteur peut demander l&apos;accès ou la suppression de ses données à {LEGAL.email}.</p>

        <h2>9. Médiation et litiges</h2>
        <p>En cas de litige, l&apos;acheteur peut recourir gratuitement au médiateur de la consommation : {LEGAL.mediator_name} ({LEGAL.mediator_url}). Les présentes conditions sont soumises au droit français.</p>
      </article>
    </main>
  );
}
