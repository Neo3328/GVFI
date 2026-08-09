/**
 * GVFI — Active job / health status store.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { create } from "zustand";
import type { GvfiGpu, GvfiModel, JobTask } from "@/lib/gvfi-types";
import { tr } from "@/lib/i18n/runtime";

export interface JobStoreState {
  taskId: string | null;
  activeTask: JobTask | null;
  progress: number;
  stageLabel: string;
  isRendering: boolean;
  lastOutputPath: string;
  taskLogs: string[];
  errorLogs: string[];
  serviceReady: boolean | null;
  queueCount: number;
  models: GvfiModel[];
  gpus: GvfiGpu[];
  outputDir: string;

  setTaskId: (id: string | null) => void;
  setActiveTask: (task: JobTask | null) => void;
  setProgress: (progress: number) => void;
  setStageLabel: (label: string) => void;
  setIsRendering: (value: boolean) => void;
  setLastOutputPath: (path: string) => void;
  appendTaskLog: (message: string) => void;
  appendErrorLog: (message: string) => void;
  setServiceReady: (ready: boolean | null) => void;
  setQueueCount: (count: number) => void;
  setHealthData: (data: {
    models: GvfiModel[];
    gpus: GvfiGpu[];
    outputDir: string;
  }) => void;
  resetLogs: () => void;
}

export const useJobStore = create<JobStoreState>((set) => ({
  taskId: null,
  activeTask: null,
  progress: 0,
  stageLabel: tr("process.stage.wrap", {
    detail: tr("process.stage.connecting"),
  }),
  isRendering: false,
  lastOutputPath: "",
  taskLogs: [],
  errorLogs: [],
  serviceReady: null,
  queueCount: 0,
  models: [],
  gpus: [],
  outputDir: "",

  setTaskId: (taskId) => set({ taskId }),
  setActiveTask: (activeTask) => set({ activeTask }),
  setProgress: (progress) => set({ progress }),
  setStageLabel: (stageLabel) => set({ stageLabel }),
  setIsRendering: (isRendering) => set({ isRendering }),
  setLastOutputPath: (lastOutputPath) => set({ lastOutputPath }),
  appendTaskLog: (message) =>
    set((state) => ({ taskLogs: [...state.taskLogs, message] })),
  appendErrorLog: (message) =>
    set((state) => ({ errorLogs: [...state.errorLogs, message] })),
  setServiceReady: (serviceReady) => set({ serviceReady }),
  setQueueCount: (queueCount) => set({ queueCount }),
  setHealthData: ({ models, gpus, outputDir }) =>
    set({ models, gpus, outputDir }),
  resetLogs: () => set({ taskLogs: [], errorLogs: [] }),
}));
