import { Resend } from "resend";
import { TEXTS, type Lang } from "@/lib/i18n";

/**
 * Envoie à l'acheteur l'email avec son lien de téléchargement personnel (Resend).
 * La clé d'idempotence évite un double envoi si Stripe rejoue le webhook.
 */
export async function send_access_email(params: { to: string; name: string; download_url: string; session_id: string; lang: Lang }) {
  const t = TEXTS[params.lang];
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM; // ex. "LUMONCORE <method@lumoncorestudio.com>"
  if (!key || !from) throw new Error("RESEND_API_KEY ou EMAIL_FROM manquante dans .env.local");

  const resend = new Resend(key);
  const first_name = params.name.includes("@") ? "" : ` ${params.name.split(" ")[0]}`;

  const { error } = await resend.emails.send(
    {
      from,
      to: params.to,
      subject: t.email_subject,
      text: [
        t.email_title(first_name),
        "",
        t.email_text,
        params.download_url,
        "",
        TEXTS[params.lang].headline,
        "— LUMONCORE",
      ].join("\n"),
      html: `
        <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;background:#000;color:#fff;padding:40px 24px">
          <div style="max-width:480px;margin:0 auto">
            <p style="font-size:13px;letter-spacing:-0.02em;margin:0 0 32px">LUMONCORE</p>
            <p style="font-size:22px;margin:0 0 12px">${t.email_title(first_name)}</p>
            <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 28px">${t.email_text}</p>
            <a href="${params.download_url}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:15px">${t.email_cta}</a>
            <p style="color:#666;font-size:12px;margin:36px 0 0">${t.headline.replace("&", "&amp;")}</p>
          </div>
        </div>`,
    },
    { idempotencyKey: `access-${params.session_id}` },
  );
  if (error) throw new Error(`Resend : ${error.message}`);
}
