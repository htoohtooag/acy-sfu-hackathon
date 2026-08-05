"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { SkillTagInput } from "@/components/features/onboarding/skill-tag-input";
import type { FreelancerDraft } from "@/components/features/onboarding/onboarding-wizard";
import { formatMyanmarPhoneInput, normalizeMyanmarPhoneInput } from "@/features/auth/phone-format";

export function FreelancerProfileStep({ register, setValue, errors, skills, phoneValue }: { register: UseFormRegister<FreelancerDraft>; setValue: UseFormSetValue<FreelancerDraft>; errors: FieldErrors<FreelancerDraft>; skills: string[]; phoneValue: string }) {
  const phoneField = register("phone_number");
  return <div className="space-y-7"><label className="block space-y-2"><span className="text-sm font-medium">Phone number</span><div className="flex items-center border-b border-input focus-within:border-primary"><span className="pb-3 text-muted-foreground">+95</span><input {...phoneField} value={formatMyanmarPhoneInput(phoneValue)} onChange={(event) => setValue("phone_number", normalizeMyanmarPhoneInput(event.target.value), { shouldValidate: true })} inputMode="tel" placeholder="9 753630248" className="h-12 flex-1 border-0 bg-transparent px-2 outline-none" /></div>{errors.phone_number ? <p className="text-sm text-destructive">{errors.phone_number.message}</p> : null}</label><label className="block space-y-2"><span className="text-sm font-medium">NRC number</span><input {...register("nrc_number")} placeholder="12/ABC(N)123456" className="h-12 w-full border-0 border-b border-input bg-transparent px-0 outline-none focus:border-primary" />{errors.nrc_number ? <p className="text-sm text-destructive">{errors.nrc_number.message}</p> : null}</label><label className="block space-y-2 text-center"><span className="text-sm font-medium">What do you do best?</span><input {...register("headline")} placeholder="Your professional headline" className="h-16 w-full border-0 border-b border-input bg-transparent px-0 text-center text-2xl font-heading outline-none focus:border-primary" />{errors.headline ? <p className="text-sm text-destructive">{errors.headline.message}</p> : null}</label><SkillTagInput value={skills} onChange={(next) => setValue("skills", next, { shouldValidate: true })} error={errors.skills?.message?.toString()} /></div>;
}
