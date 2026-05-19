# Civic Research Hub

A TanStack Start + shadcn monorepo scaffold for a combined civic research site.
The first three seeded topics come from:

- `corruptionincongress`
- `deflock-michigan`
- `mi-data-center-fight`

## Structure

- `apps/web/src/routes/index.tsx` renders the combined topic index.
- `apps/web/src/routes/topics.$slug.tsx` renders any topic that matches the shared topic model.
- `apps/web/convex/schema.ts` defines the Convex `topics` table.
- `apps/web/convex/seedTopics.ts` is the initial seed data and the easiest place to model a future topic.
- `apps/web/convex/topics.ts` exposes list and detail queries.
- `apps/web/convex/seed.ts` upserts the seed topics into Convex.

## Convex setup

```bash
cd apps/web
pnpm convex:dev
```

After Convex creates the deployment and writes `.env.local`, seed the first
three topics:

```bash
pnpm convex:seed
```

The web app is wired to use Convex when `VITE_CONVEX_URL` is present. The
visible pages currently read the seed model directly so the scaffold can run
before a Convex project is created.

## Add a future topic

1. Add a new object to `apps/web/convex/seedTopics.ts`.
2. Keep claims tied to `sourceIndexes` so stats, arguments, and findings all
   point back to documents.
3. Run `pnpm --filter web convex:seed` after the Convex deployment exists.
4. If you later add AI deep research, store the generated findings in the same
   topic shape: `arguments`, `findings`, `stats`, `actions`, and `sources`.
