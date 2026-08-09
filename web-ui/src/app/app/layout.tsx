/**
 * GVFI — App workspace layout.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import { LiquidGlassProvider } from "@/components/liquid-glass";
import { AppSplash } from "@/components/brand/app-splash";
import { PluginBootstrap } from "@/components/plugin-bootstrap";
import { MotionQualityProvider } from "@/components/motion-quality-provider";
import { ProcessWorkspaceProvider } from "@/components/process/process-workspace-context";
import { WorkspaceChromeProvider } from "@/components/workspace/workspace-chrome-context";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function AppWorkspaceLayout({
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
            <WorkspaceShell>{children}</WorkspaceShell>
          </ProcessWorkspaceProvider>
        </WorkspaceChromeProvider>
      </MotionQualityProvider>
    </LiquidGlassProvider>
  );
}
