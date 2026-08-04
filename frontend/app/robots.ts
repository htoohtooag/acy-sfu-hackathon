import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/features/jobs/job-data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/login", "/signup", "/auth/", "/dashboard/", "/app/", "/orders/", "/messages/", "/settings/", "/posts/"] },
    sitemap: getPublicSiteUrl("/sitemap.xml"),
  };
}
