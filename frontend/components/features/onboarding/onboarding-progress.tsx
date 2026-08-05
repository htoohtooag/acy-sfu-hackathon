export function OnboardingProgress({ current, total }: { current: number; total: number }) {
  return <div className="space-y-3"><div className="flex items-center justify-between text-xs font-medium text-muted-foreground"><span>Profile setup</span><span>{current} of {total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(current / total) * 100}%` }} /></div></div>;
}
