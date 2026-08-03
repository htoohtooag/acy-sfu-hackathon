"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type CatalogQueryChange = Record<string, string | null | undefined>;

export function useCatalogQueryControls() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateCatalogQuery(changes: CatalogQueryChange): void {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") nextParams.delete(key);
      else nextParams.set(key, value);
    });
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function clearCatalogQuery(): void {
    router.replace(pathname, { scroll: false });
  }

  return { updateCatalogQuery, clearCatalogQuery };
}
