/**
 * GVFI /app 路由（新默认主页）
 * 把视频处理工作台设为根路由默认主页；旧 /app/dashboard 文件保留但不再作为默认页。
 *
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

import VideoWorkspacePage from "@/components/workspace/video-workspace-page";

export default function AppIndexPage() {
  /* 不再 redirect，直接挂载新默认主页 VideoWorkspacePage */
  return <VideoWorkspacePage />;
}
