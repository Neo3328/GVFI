/**
 * GVFI — Privacy policy, terms, and third-party license surfaces.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useT } from"@/hooks/use-t";
import { APP_NAME, COPYRIGHT_LINE, DEVELOPER_LINE } from"@/lib/brand";

export type LegalDocId ="privacy" |"terms" |"licenses";

export function LegalDocument({ id }: { id: LegalDocId }) {
 const t = useT();

 if (id ==="privacy") {
 return (
 <article className="space-y-3 text-[13px] leading-relaxed text-[var(--text-normal)]">
 <h2 className="text-[16px] font-semibold text-[var(--text-strong)]">
 {t("legal.privacy.title")}
 </h2>
 <p>{t("legal.privacy.updated")}</p>
 <p>{t("legal.privacy.p1", { app: APP_NAME })}</p>
 <p>{t("legal.privacy.p2")}</p>
 <p>{t("legal.privacy.p3")}</p>
 <p>{t("legal.privacy.p4")}</p>
 <p>{t("legal.privacy.p5")}</p>
 <p className="text-[12px] text-[var(--text-muted)]">
 {DEVELOPER_LINE}
 <br />
 {COPYRIGHT_LINE}
 </p>
 </article>
 );
 }

 if (id ==="terms") {
 return (
 <article className="space-y-3 text-[13px] leading-relaxed text-[var(--text-normal)]">
 <h2 className="text-[16px] font-semibold text-[var(--text-strong)]">
 {t("legal.terms.title")}
 </h2>
 <p>{t("legal.terms.updated")}</p>
 <p>{t("legal.terms.p1", { app: APP_NAME })}</p>
 <p>{t("legal.terms.p2")}</p>
 <p>{t("legal.terms.p3")}</p>
 <p>{t("legal.terms.p4")}</p>
 <p className="text-[12px] text-[var(--text-muted)]">{COPYRIGHT_LINE}</p>
 </article>
 );
 }

 return (
 <article className="space-y-3 text-[13px] leading-relaxed text-[var(--text-normal)]">
 <h2 className="text-[16px] font-semibold text-[var(--text-strong)]">
 {t("legal.licenses.title")}
 </h2>
 <p>{t("legal.licenses.p1")}</p>
 <ul className="list-disc space-y-1 pl-5">
 <li>{t("legal.licenses.item.next")}</li>
 <li>{t("legal.licenses.item.electron")}</li>
 <li>{t("legal.licenses.item.rife")}</li>
 <li>{t("legal.licenses.item.ffmpeg")}</li>
 <li>{t("legal.licenses.item.llm")}</li>
 </ul>
 <p>{t("legal.licenses.p2")}</p>
 <p className="text-[12px] text-[var(--text-muted)]">
 {t("legal.licenses.fileHint")}
 </p>
 </article>
 );
}
