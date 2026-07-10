#!/usr/bin/env node
// Guardrail against migration-journal drift.
//
// Root cause of the 2026-07 Supabase incident: migration files 0004-0007 existed
// on disk but were missing from db/migrations/meta/_journal.json, so
// `drizzle-kit migrate` never applied them (RLS stayed off, audit_log was never
// created, etc.). This check fails CI if the set of *.sql migration files and the
// set of _journal.json entries ever disagree, so the drift can't recur silently.
//
// Rule: never hand-delete or reorder _journal.json entries. Every migration
// (generated via `db:generate` OR hand-written raw SQL) must have exactly one
// journal entry whose `tag` matches the file's basename (without .sql).

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations')
const journalPath = join(migrationsDir, 'meta', '_journal.json')

const sqlTags = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => f.replace(/\.sql$/, ''))
  .sort()

const journal = JSON.parse(readFileSync(journalPath, 'utf8'))
const journalTags = journal.entries.map((e) => e.tag).sort()

const missingFromJournal = sqlTags.filter((t) => !journalTags.includes(t))
const missingFromDisk = journalTags.filter((t) => !sqlTags.includes(t))

// idx values must be a contiguous 0..n-1 sequence, in order.
const idxs = journal.entries.map((e) => e.idx)
const badIdx = idxs.some((idx, i) => idx !== i)

const problems = []
if (missingFromJournal.length)
  problems.push(`SQL files with no journal entry: ${missingFromJournal.join(', ')}`)
if (missingFromDisk.length)
  problems.push(`Journal entries with no SQL file: ${missingFromDisk.join(', ')}`)
if (badIdx) problems.push(`Journal idx values are not a contiguous 0..N sequence: [${idxs.join(', ')}]`)

if (problems.length) {
  console.error('✖ Migration journal drift detected:')
  for (const p of problems) console.error('  - ' + p)
  console.error('\nFix: add the missing entry to db/migrations/meta/_journal.json')
  console.error('(or via `npm run db:generate`), then `npm run db:migrate`.')
  process.exit(1)
}

console.log(`✓ Migration journal is consistent (${sqlTags.length} migrations).`)
