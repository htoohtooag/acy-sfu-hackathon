"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthRole = "CLIENT" | "FREELANCER";

type AuthStore = {
  selectedRole: AuthRole | null;
  signupStep: "role" | "account";
  setSelectedRole: (role: AuthRole) => void;
  setSignupStep: (step: AuthStore["signupStep"]) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      selectedRole: null,
      signupStep: "role",
      setSelectedRole: (selectedRole) => set({ selectedRole, signupStep: "account" }),
      setSignupStep: (signupStep) => set({ signupStep }),
      clear: () => set({ selectedRole: null, signupStep: "role" }),
    }),
    { name: "talentscout-auth-context" },
  ),
);
