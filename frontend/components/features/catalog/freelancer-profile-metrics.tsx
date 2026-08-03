import { Medal, Timer } from "lucide-react";

import type { FreelancerProfilePresentation } from "@/features/catalog/mock-data";

interface FreelancerProfileMetricsProps {
  profile: FreelancerProfilePresentation;
}

export function FreelancerProfileMetrics({ profile }: FreelancerProfileMetricsProps) {
  return <dl className="grid grid-cols-2 gap-4 border-t border-border px-5 py-5 sm:grid-cols-4 sm:px-7"><div><dt className="text-xs text-muted-foreground">Job success</dt><dd className="mt-1 font-heading text-xl font-semibold text-foreground">{profile.successRate}%</dd></div><div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Medal aria-hidden="true" className="size-3.5 text-primary" />Status</dt><dd className="mt-1 font-semibold capitalize text-primary">{profile.ratingLabel}</dd></div><div><dt className="text-xs text-muted-foreground">Jobs completed</dt><dd className="mt-1 font-heading text-xl font-semibold text-foreground">{profile.completedCount}</dd></div><div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Timer aria-hidden="true" className="size-3.5" />Response time</dt><dd className="mt-1 font-heading text-xl font-semibold text-foreground">{profile.responseTime ?? "Within a day"}</dd></div></dl>;
}
