/**
 * GVFI — Applies hardware-adaptive motion quality on mount.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useEffect } from"react";
import { applyMotionQuality, detectMotionQuality } from"@/lib/motion-quality";

export function MotionQualityProvider({
 children,
}: {
 children: React.ReactNode;
}) {
 useEffect(() => {
 applyMotionQuality(detectMotionQuality());

 const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
 const onChange = () => applyMotionQuality(detectMotionQuality());
 mq.addEventListener?.("change", onChange);
 return () => mq.removeEventListener?.("change", onChange);
 }, []);

 return <>{children}</>;
}
