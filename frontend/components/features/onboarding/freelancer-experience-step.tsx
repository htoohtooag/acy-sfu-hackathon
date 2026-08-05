"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import type { ExperienceLevel } from "@/features/auth/auth-api";
import type { FreelancerDraft } from "@/components/features/onboarding/onboarding-wizard";

export function FreelancerExperienceStep({ register, setValue, errors, selected, levels }: { register: UseFormRegister<FreelancerDraft>; setValue: UseFormSetValue<FreelancerDraft>; errors: FieldErrors<FreelancerDraft>; selected: string; levels: ExperienceLevel[] }) {
  return <div className="space-y-9"><label className="block space-y-2"><span className="text-sm font-medium">Years of experience</span><input {...register("years_of_experience", { valueAsNumber: true })} type="number" min={0} step={1} inputMode="numeric" aria-describedby="years-of-experience-help" className="h-12 w-full border-0 border-b border-input bg-transparent px-0 text-lg outline-none focus:border-primary focus:ring-0" /><span id="years-of-experience-help" className="block text-xs text-muted-foreground">Enter a whole number, from 0 upward.</span>{errors.years_of_experience ? <p className="text-sm text-destructive">{errors.years_of_experience.message}</p> : null}</label><fieldset className="space-y-3"><legend className="text-sm font-medium">Experience level</legend><div className="grid gap-2 sm:grid-cols-3">{levels.map((level) => <button key={level.id} type="button" onClick={() => setValue("experience_level_id", level.id, { shouldValidate: true })} className={`rounded-full border px-4 py-3 text-sm ${selected === level.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{level.display_name ?? level.name}</button>)}</div>{errors.experience_level_id ? <p className="text-sm text-destructive">{errors.experience_level_id.message}</p> : null}</fieldset></div>;
}
