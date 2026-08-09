"use client";

import { useEffect } from "react";
import { ensurePluginsRegistered } from "@/plugins";

/** 应用启动时注册内置插件（幂等，供 Service 层使用） */
export function PluginBootstrap() {
  useEffect(() => {
    ensurePluginsRegistered();
  }, []);

  return null;
}
