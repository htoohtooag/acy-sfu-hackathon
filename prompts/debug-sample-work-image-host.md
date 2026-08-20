# Debug prompt: sample work image host

## Goal

Fix the dashboard sample work rendering error caused by signed Supabase Storage URLs being rejected by `next/image`.

## Proven root cause

The sample work API returns signed URLs from `https://kdyyyvlblpgemgziqsbx.supabase.co/storage/v1/object/sign/...`. The frontend passes those URLs to `next/image`, but `frontend/next.config.ts` only allows `images.unsplash.com` in `images.remotePatterns`.

## Files to modify

Modify only:

* `frontend/next.config.ts`

Add an HTTPS remote pattern for the Supabase project hostname with the Storage object path scope. Preserve the existing Unsplash pattern and the current config style. Do not use the deprecated `images.domains` option. Do not expose or hardcode a signed token.

## Verification

Recommend running:

* the focused frontend lint command used by this repository
* `npm run build` from `frontend` if the environment permits
* a source check confirming both `sample-work-card.tsx` and `public-sample-work-gallery.tsx` can use the signed Supabase URL through the configured pattern

The expected result is that the Settings sample work card and public sample work gallery render signed Supabase images without the `next/image` unconfigured hostname error.

## Scope boundary

Do not change upload behavior, API contracts, Supabase bucket configuration, image URLs, unrelated remote hosts, or other frontend components.
