import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JobDetail } from "@/components/features/jobs/job-detail";
import { getJob } from "@/features/jobs/job-data";

type JobDetailPageProps = { params: Promise<{ id: string }> };

async function loadJob(id: string) { try { return await getJob(id); } catch { return null; } }

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) return { title: "Project not found | Gigmatch", description: "This project is no longer available." };
  return { title: `${job.title} | Gigmatch`, description: job.description.slice(0, 160), openGraph: { title: `${job.title} | Gigmatch`, description: job.description.slice(0, 160) } };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) notFound();
  return <JobDetail job={job} />;
}
