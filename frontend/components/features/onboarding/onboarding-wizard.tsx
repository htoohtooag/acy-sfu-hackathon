"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ClientOnboardingForm } from "@/components/features/onboarding/client-onboarding-form";
import { FreelancerExperienceStep } from "@/components/features/onboarding/freelancer-experience-step";
import { FreelancerProfileStep } from "@/components/features/onboarding/freelancer-profile-step";
import { OnboardingProgress } from "@/components/features/onboarding/onboarding-progress";
import { Button } from "@/components/ui/button";
import { completeOnboarding, getExperienceLevels, type ExperienceLevel } from "@/features/auth/auth-api";
import { ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/store/use-auth-store";
import { toMyanmarPhonePayload } from "@/features/auth/phone-format";

const clientDraftSchema = z.object({ phone_number: z.string().trim().min(7, "Enter a valid phone number.").max(20), nrc_number: z.string().trim().min(1, "Enter your NRC number.").max(50), company_name: z.string().trim().min(1, "Enter your company name.").max(255), industry: z.string().trim().min(1, "Choose an industry.").max(100) });
const freelancerProfileSchema = z.object({ phone_number: z.string().trim().min(7, "Enter a valid phone number.").max(20), nrc_number: z.string().trim().min(1, "Enter your NRC number.").max(50), headline: z.string().trim().min(1, "Enter your headline.").max(255), skills: z.array(z.string().trim().min(1).max(100)).min(1, "Add at least one skill.") });
const freelancerExperienceSchema = z.object({ years_of_experience: z.number().int("Enter a whole number.").nonnegative("Enter 0 or more years."), experience_level_id: z.string().uuid("Choose an experience level.") });

export type OnboardingDraft = { phone_number: string; nrc_number: string; company_name: string; industry: string; other_industry: string; headline: string; skills: string[]; experience_level_id?: string; years_of_experience: number };
export type FreelancerDraft = OnboardingDraft;

export function OnboardingWizard() {
  const router = useRouter();
  const role = useAuthStore((state) => state.selectedRole);
  const clear = useAuthStore((state) => state.clear);
  const [step, setStep] = useState(1);
  const [levels, setLevels] = useState<ExperienceLevel[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = role === "FREELANCER" ? 2 : 1;
  const form = useForm<OnboardingDraft>({
    defaultValues: { phone_number: "", nrc_number: "", company_name: "", industry: "", other_industry: "", headline: "", skills: [], experience_level_id: undefined, years_of_experience: 0 },
    mode: "onTouched",
  });
  const { register, setValue, getValues, formState: { errors, isSubmitting } } = form;

  if (!role) {
    return <div className="w-full max-w-md space-y-5"><h1 className="font-heading text-3xl font-semibold">Choose your role first</h1><Button type="button" className="rounded-full" onClick={() => router.replace("/signup")}>Back to signup</Button></div>;
  }

  async function nextStep(): Promise<void> {
    setError(null);
    const values = getValues();
    const result = step === 1 ? role === "CLIENT" ? clientDraftSchema.safeParse(values) : freelancerProfileSchema.safeParse(values) : freelancerExperienceSchema.safeParse(values);
    if (!result.success) { const first = result.error.issues[0]; if (first) form.setError(first.path[0] as keyof OnboardingDraft, { type: "validate", message: first.message }); return; }
    if (role === "FREELANCER" && step === 1) {
      setLoadingLevels(true);
      try { setLevels(await getExperienceLevels()); setStep(2); } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "Experience levels could not be loaded."); } finally { setLoadingLevels(false); }
      return;
    }
    await submit();
  }

  async function submit(): Promise<void> {
    const values = getValues();
    try {
      const base = { role, phone_number: toMyanmarPhonePayload(values.phone_number), nrc_number: values.nrc_number };
      const payload = role === "CLIENT" ? { ...base, role: "CLIENT" as const, company_name: values.company_name.trim(), industry: values.industry.trim() } : { ...base, role: "FREELANCER" as const, headline: values.headline.trim(), skills: values.skills, experience_level_id: values.experience_level_id ?? "", years_of_experience: values.years_of_experience };
      await completeOnboarding(payload);
      clear(); router.replace("/dashboard");
    } catch (caught: unknown) {
      if (caught instanceof ApiRequestError && caught.code === "ONBOARDING_ALREADY_COMPLETED") { clear(); router.replace("/dashboard"); return; }
      setError(caught instanceof Error ? caught.message : "We could not save your profile. Please try again.");
    }
  }

  return <div className="w-full max-w-xl space-y-8"><OnboardingProgress current={step} total={total} /><header className="space-y-3"><p className="text-sm font-semibold text-primary">Almost there</p><h1 className="font-heading text-4xl font-semibold tracking-tight">{role === "CLIENT" ? "Tell us about your work" : step === 1 ? "Tell us what you do" : "Tell us about your experience"}</h1><p className="text-muted-foreground">This helps us personalize Gigmatch for you.</p></header>{error ? <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}<form onSubmit={(event) => { event.preventDefault(); void nextStep(); }} className="space-y-8">{role === "CLIENT" ? <ClientOnboardingForm register={register} setValue={setValue} errors={errors} industry={getValues("industry")} phoneValue={getValues("phone_number")} /> : step === 1 ? <FreelancerProfileStep register={register} setValue={setValue} errors={errors} skills={getValues("skills")} phoneValue={getValues("phone_number")} /> : <FreelancerExperienceStep register={register} setValue={setValue} errors={errors} selected={getValues("experience_level_id") ?? ""} levels={levels} />}<div className="flex gap-3">{step > 1 ? <Button type="button" variant="outline" className="h-12 flex-1 rounded-full" onClick={() => setStep(1)}>Back</Button> : null}<Button type="submit" disabled={isSubmitting || loadingLevels} className="h-12 flex-1 rounded-full">{loadingLevels ? "Loading…" : isSubmitting ? "Saving…" : step < total ? "Continue" : "Finish profile"}</Button></div></form></div>;
}
