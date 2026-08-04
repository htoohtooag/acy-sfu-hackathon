import type { MetadataRoute } from "next";

import { getJobsForSitemap, getPackagesForSitemap, getPublicSiteUrl } from "@/features/jobs/job-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: getPublicSiteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: getPublicSiteUrl("/freelancers"), changeFrequency: "daily", priority: 0.9 },
    { url: getPublicSiteUrl("/jobs"), changeFrequency: "hourly", priority: 0.9 },
  ];

  const [packages, jobs] = await Promise.allSettled([getPackagesForSitemap(), getJobsForSitemap()]);
  const packageItems = packages.status === "fulfilled" ? packages.value : [];
  const jobItems = jobs.status === "fulfilled" ? jobs.value : [];
  const freelancerIds = [...new Set(packageItems.map((item) => item.freelancer.id))];

  return [
    ...staticRoutes,
    ...packageItems.map((item) => ({ url: getPublicSiteUrl(`/freelancers/${item.id}`), lastModified: new Date(item.updated_at), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...freelancerIds.map((id) => ({ url: getPublicSiteUrl(`/freelancers/profile/${id}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...jobItems.map((item) => ({ url: getPublicSiteUrl(`/jobs/${item.id}`), lastModified: new Date(item.updated_at), changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
