# PractiCode — Domain Glossary

## Category

A two-level classification node that answers "what kind of concept is this?"

The taxonomy is topic-first and AI-era oriented. There are 11 parent categories, each with 5 subcategories (55 total). Categories are seeded via `db/seed.ts` and wiped-and-reinserted on each seed run.

Parent categories (in curriculum order):
1. Programming Fundamentals
2. System Design & Architecture
3. AI Engineering & Integration
4. AI Workflow & Automation
5. AI-Assisted Development
6. Backend Development
7. Cloud & DevOps
8. Security
9. Product Thinking
10. Soft Skills
11. Frontend & Design

Child slug pattern: `{parent-slug}-{child-slug}` (e.g. `ai-engineering-rag`).

## System Tag

A permanent, protected tag that answers "what technology is this about?" System tags are canonical tech filters across the entire knowledge base. They must not be deleted.

18 system tags are seeded via `db/seed-tags.ts` (idempotent upsert):
TypeScript, JavaScript, Python, React, Next.js, Node.js, FastAPI, Docker, PostgreSQL, SQL, Redis, Kubernetes, Kafka, LangChain, OpenAI SDK, Anthropic API, AWS, Go.

Non-system tags may be added per-entry by contributors and are not protected.

## Knowledge Entry

A structured engineering concept stored in `knowledge_entries`. Fields: title, slug, summary, problem, explanation, best_practices[], anti_patterns[], examples[] (with code), refactoring_guidance, related_concepts[], category, tags, embedding.

Status lifecycle: `draft` → `in_review` → `published`. AI never auto-publishes — a human must explicitly promote to `published`.

## Draft

An AI-extracted knowledge entry awaiting human review. Stored in `ai_drafts` with `status = 'pending'`. A human accepts it (→ creates a `knowledge_entry` at `in_review`) or rejects it. Accepting a draft fires an embedding generation in the background.
