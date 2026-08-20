# MVP Production CORS and Socket.IO Deployment Fix

## Goal

Allow the deployed Vercel frontend to make authenticated REST API requests and establish authenticated Socket.IO connections to the deployed Render backend, without weakening development behavior.

## Files to modify

1. `backend/src/config/env.ts`
2. `backend/src/app.ts`
3. `backend/src/config/socket.ts`
4. `backend/.env.example`
5. `.ai/CURRENT_PHASE.md`

## Required changes

1. Add a validated `FRONTEND_ORIGIN` environment variable to the backend environment schema. It must be optional in development and required in production. Its value is one absolute URL with no path, for example `https://talentscout.vercel.app`.
2. Keep development CORS permissive for the existing local workflow.
3. In production, configure both Express `cors` and Socket.IO `cors` to allow only `env.FRONTEND_ORIGIN` and credentials. Do not allow all origins, and do not change Socket.IO authentication or room authorization.
4. Document `FRONTEND_ORIGIN` in `backend/.env.example`, leaving it blank or using a safe placeholder.
5. Update the session notes in `.ai/CURRENT_PHASE.md` with the completed deployment compatibility fix and the next deployment step.

## Constraints

- Do not expose backend secrets to the frontend.
- Do not hardcode a Vercel domain.
- Do not change API routes, response envelopes, database code, or Socket.IO event contracts.
- Do not use `any` or access environment variables outside `src/config/env.ts`.
- Keep the patch minimal and TypeScript-strict.

## Verification

From the repository root, run:

```bash
npm run build --workspace shared
npm run build --workspace backend
```

Then inspect the diff to confirm the only behavior change is the origin allow-list for production REST and Socket.IO traffic.

## Deployment handoff

After deploying the backend to Render, set:

```env
NODE_ENV=production
FRONTEND_ORIGIN=https://your-real-vercel-domain.vercel.app
```

The user will then deploy the frontend to Vercel using the Render URL as `NEXT_PUBLIC_API_URL`.
