# PractiCode

A personal knowledge base for software engineering concepts, powered by AI. Paste raw notes, articles, or transcripts — AI structures them into validated entries covering best practices, anti-patterns, and refactoring guidance. Built for individual developers who want to capture and revisit what they learn.

## Features

- **AI extraction** — paste any text and get a structured knowledge entry (problem, explanation, best practices, anti-patterns, examples)
- **Batch extraction** — paste a long transcript and extract multiple entries at once
- **Human-in-the-loop** — AI drafts require manual review before publishing; nothing goes live automatically
- **Public knowledge base** — published entries are browsable without login, with full-text search and category navigation
- **AI-suggested related entries** — pgvector cosine similarity surfaces similar concepts automatically
- **Entry relationships** — link entries as `related_to`, `extends`, `contradicts`, or `refactors`
- **Version history** — every save snapshots the prior state
- **Context pack export** — select a set of entries and export as `skill.md`, `CLAUDE.md`, or GitHub Copilot instructions for use with AI coding agents
- **RSS feed** — `/feed.xml` for published entries
- **Editorial workflow** — editors draft and submit; only admin can publish

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| UI | React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui |
| Database | Supabase (PostgreSQL + pgvector), Drizzle ORM |
| Auth | Supabase SSR |
| AI | Vercel AI SDK + OpenRouter |
| Search | PostgreSQL full-text search (`tsvector`) + pgvector similarity |

## Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with the `pgvector` extension enabled
- An [OpenRouter](https://openrouter.ai) API key

### 1. Clone and install

```bash
git clone https://github.com/SzymekNawrocki/practicode.git
cd practicode
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in all values in `.env` — see `.env.example` for descriptions.

### 3. Enable pgvector in Supabase

In the Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Seed categories and tags

```bash
npm run db:seed        # 35 topic-first categories (7 parents × 5 children)
npm run db:seed-tags   # 10 system tags (TypeScript, Python, React, etc.)
```

### 6. Set yourself as admin

After signing up, promote your account in the Supabase SQL editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev           # start dev server
npm run build         # production build
npm run db:generate   # generate migrations from schema changes
npm run db:migrate    # apply migrations (uses DIRECT_DATABASE_URL)
npm run db:seed       # seed categories (idempotent)
npm run db:seed-tags  # seed system tags (idempotent)
npm run db:studio     # visual database explorer
```

## Editorial workflow

```
Editor creates entry → draft
Editor submits for review → in_review
Admin reviews at /admin → publishes
```

AI-extracted entries land in `in_review` automatically and still require admin approval before publishing.

## Open source

This project is currently a personal tool. Open-source release is planned once the core workflow is stable. Watch the repository for updates.

## License

MIT
