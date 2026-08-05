"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createJobPostSchema, updateJobPostSchema, type CatalogJobPost, type CreateJobPostRequest, type UpdateJobPostRequest } from "shared/schemas";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type JobFormValues = CreateJobPostRequest;

export function JobPostFormDialog({ open, job, pending, onOpenChange, onSubmit }: { open: boolean; job: CatalogJobPost | null; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: CreateJobPostRequest | UpdateJobPostRequest) => void }): React.ReactNode {
  const editing = job !== null;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobFormValues>({ resolver: zodResolver(createJobPostSchema), defaultValues: { title: "", description: "", budget_min_mmk: null, budget_max_mmk: null, expected_deadline: null } });
  useEffect(() => { reset(job ? { title: job.title, description: job.description, budget_min_mmk: job.budget_min_mmk, budget_max_mmk: job.budget_max_mmk, expected_deadline: job.expected_deadline } : { title: "", description: "", budget_min_mmk: null, budget_max_mmk: null, expected_deadline: null }); }, [job, reset, open]);

  function submit(values: JobFormValues): void {
    const parsed = editing ? updateJobPostSchema.safeParse(values) : createJobPostSchema.safeParse(values);
    if (parsed.success) onSubmit(parsed.data);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{editing ? "Edit job post" : "Create a job post"}</DialogTitle><DialogDescription>Give capable freelancers enough context to decide if the work is right for them.</DialogDescription></DialogHeader><form className="space-y-5" onSubmit={(event) => { void handleSubmit(submit)(event); }}><div className="space-y-2"><Label htmlFor="job-title">Title</Label><Input id="job-title" {...register("title")} placeholder="Build a launch page for a new service" />{errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}</div><div className="space-y-2"><Label htmlFor="job-description">Description</Label><Textarea id="job-description" {...register("description")} placeholder="Describe the work, context, and expected outcome." />{errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}</div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="job-budget-min">Minimum budget in MMK</Label><Input id="job-budget-min" inputMode="numeric" {...register("budget_min_mmk")} placeholder="500000" /></div><div className="space-y-2"><Label htmlFor="job-budget-max">Maximum budget in MMK</Label><Input id="job-budget-max" inputMode="numeric" {...register("budget_max_mmk")} placeholder="900000" />{errors.root ? <p className="text-xs text-destructive">Budget minimum cannot exceed maximum.</p> : null}</div><div className="space-y-2 sm:col-span-2"><Label htmlFor="job-deadline">Expected deadline</Label><Input id="job-deadline" type="date" {...register("expected_deadline")} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Publish job post"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

