/**
 * GVFI — Legal documents hub (privacy / terms / licenses).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from"react";
import Link from"next/link";
import { GlassPanel } from"@/components/glass/glass-card";
import { GlassTabs } from"@/components/glass/glass-tabs";
import {
 LegalDocument,
 type LegalDocId,
} from"@/components/legal/legal-documents";
import { useWorkspaceChrome } from"@/components/workspace/workspace-chrome-context";
import { useT } from"@/hooks/use-t";

export function LegalHubPage({
 initialTab ="privacy",
}: {
 initialTab?: LegalDocId;
}) {
 const t = useT();
 const { setChrome } = useWorkspaceChrome();
 const [tab, setTab] = useState<LegalDocId>(initialTab);

 useEffect(() => {
 setTab(initialTab);
 }, [initialTab]);

 useEffect(() => {
 setChrome({
 title: t("legal.chromeTitle"),
 breadcrumbs: [
 { label: t("common.app"), href:"/app/dashboard" },
 { label: t("settings.title"), href:"/app/settings" },
 { label: t("legal.chromeTitle") },
 ],
 status:"idle",
 });
 }, [setChrome, t]);

 return (
 <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-2">
 <GlassTabs
 value={tab}
 onValueChange={(value) => setTab(value as LegalDocId)}
 items={[
 { value:"privacy", label: t("legal.tab.privacy") },
 { value:"terms", label: t("legal.tab.terms") },
 { value:"licenses", label: t("legal.tab.licenses") },
 ]}
 />
 <GlassPanel title={t("legal.chromeTitle")} padding="lg">
 <LegalDocument id={tab} />
 <p className="mt-6 text-[12px] text-[var(--text-muted)]">
 <Link
 href="/app/settings/about"
 className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
 >
 {t("about.chromeTitle")}
 </Link>
 </p>
 </GlassPanel>
 </div>
 );
}
