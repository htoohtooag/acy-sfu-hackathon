"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";

export function SkillTagInput({ value, onChange, error }: { value: string[]; onChange: (skills: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState("");
  function addSkill(): void {
    const skill = draft.trim();
    if (skill && !value.some((item) => item.toLowerCase() === skill.toLowerCase())) onChange([...value, skill]);
    setDraft("");
  }
  return <div className="space-y-3"><label className="block space-y-2"><span className="text-sm font-medium">Skills</span><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} onBlur={addSkill} placeholder="Type a skill and press Enter" className="h-12 w-full border-0 border-b border-input bg-transparent px-0 outline-none placeholder:text-muted-foreground focus:border-primary" /></label><div className="flex min-h-8 flex-wrap gap-2">{value.map((skill) => <Badge key={skill} className="gap-1 rounded-full px-3 py-1">{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => onChange(value.filter((item) => item !== skill))}><X className="size-3" /></button></Badge>)}</div>{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}
