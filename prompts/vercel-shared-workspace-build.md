# Vercel Shared Workspace Build Fix

## Goal

Make a Vercel deployment of the `frontend` workspace reliably resolve imports from `shared/schemas`.

## Cause

The frontend imports the local npm workspace package `shared`, whose public exports point to generated `shared/dist` files. Vercel currently starts the Next.js build without first compiling that workspace, so module resolution fails.

## Files to modify

1. `frontend/package.json`
2. `.ai/CURRENT_PHASE.md`

## Required changes

1. Add a frontend `prebuild` script that compiles the root `shared` workspace before `next build` runs.
2. Keep the existing frontend `build` script as `next build`.
3. Do not copy shared source files into frontend, change import paths, or publish `shared` to npm.
4. Update the session notes with the verified Vercel workspace build fix and the required Vercel project settings.

## Vercel project settings

1. Application Preset: `Next.js`.
2. Root Directory: `frontend`.
3. Enable `Include source files outside of the Root Directory` if Vercel shows the option.
4. Leave the build command at its default. Vercel will run the frontend `prebuild` hook, which builds `shared`, followed by `next build`.

## Verification

From the repository root, run:

```bash
npm run build --workspace frontend
```

Then confirm that `shared/dist/schemas/index.js` exists and that the frontend production build completes or reports only the existing external Google Fonts network limitation.
