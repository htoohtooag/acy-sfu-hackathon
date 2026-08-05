"use client";

import { create } from "zustand";

export type AppRole = "CLIENT" | "FREELANCER";

type AppStore = {
  activeRole: AppRole;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setActiveRole: (activeRole: AppRole) => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  activeRole: "CLIENT",
  sidebarOpen: false,
  sidebarCollapsed: false,
  setActiveRole: (activeRole) => set({ activeRole }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
