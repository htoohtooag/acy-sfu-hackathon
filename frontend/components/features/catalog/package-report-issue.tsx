import { Flag } from "lucide-react";

interface PackageReportIssueProps {
  packageTitle: string;
}

export function PackageReportIssue({ packageTitle }: PackageReportIssueProps) {
  return <button type="button" aria-label={`Report an issue with ${packageTitle}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"><Flag aria-hidden="true" className="size-4" />Report an issue</button>;
}
