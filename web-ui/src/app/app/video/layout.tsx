/**
 * GVFI — Video route standalone layout (Win32 full-screen, no WorkspaceShell).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { LiquidGlassProvider } from "@/components/liquid-glass";
import { AppSplash } from "@/components/brand/app-splash";
import { PluginBootstrap } from "@/components/plugin-bootstrap";
import { MotionQualityProvider } from "@/components/motion-quality-provider";
import { ProcessWorkspaceProvider } from "@/components/process/process-workspace-context";
import { WorkspaceChromeProvider } from "@/components/workspace/workspace-chrome-context";

export default function VideoRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiquidGlassProvider>
      <MotionQualityProvider>
        <AppSplash />
        <PluginBootstrap />
        <WorkspaceChromeProvider>
          <ProcessWorkspaceProvider>
            {children}
          </ProcessWorkspaceProvider>
        </WorkspaceChromeProvider>
      </MotionQualityProvider>
    </LiquidGlassProvider>
  );
}
