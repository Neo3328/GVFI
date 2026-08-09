/**
 * GVFI — Legal documents route.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { LegalHubPage } from "@/components/legal/legal-hub-page";
import type { LegalDocId } from "@/components/legal/legal-documents";

function normalizeTab(value: string | string[] | undefined): LegalDocId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "terms" || raw === "licenses" || raw === "privacy") return raw;
  return "privacy";
}

export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  return <LegalHubPage initialTab={normalizeTab(params.tab)} />;
}
