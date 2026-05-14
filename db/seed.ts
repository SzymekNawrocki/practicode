import { config } from 'dotenv'
// Load env vars — try .env.local first, fall back to .env
config({ path: '.env.local' })
config({ path: '.env' })

async function main() {
  const { db }         = await import('./client')
  const { categories } = await import('./schema/categories')
  const { isNull }     = await import('drizzle-orm')

  const PARENTS = [
    { name: 'TypeScript',          slug: 'typescript',          description: 'Typed superset of JavaScript for building scalable applications.' },
    { name: 'Python',              slug: 'python',              description: 'High-level language for scripting, data science, and backend services.' },
    { name: 'Next.js',             slug: 'nextjs',              description: 'React framework with App Router, Server Components, and full-stack capabilities.' },
    { name: 'FastAPI',             slug: 'fastapi',             description: 'Modern, fast Python web framework for building APIs with automatic docs.' },
    { name: 'System Architecture', slug: 'system-architecture', description: 'Patterns and principles for designing scalable, maintainable software systems.' },
    { name: 'DevOps',              slug: 'devops',              description: 'Practices for CI/CD, containerization, infrastructure, and deployment.' },
    { name: 'Git',                 slug: 'git',                 description: 'Version control workflows, branching strategies, and collaboration practices.' },
  ]

  const CHILD_SUFFIXES = [
    { suffix: 'best-practices', name: 'Best Practices' },
    { suffix: 'anti-patterns',  name: 'Anti-Patterns' },
    { suffix: 'design-patterns', name: 'Design Patterns' },
    { suffix: 'security',       name: 'Security & Exploits' },
    { suffix: 'performance',    name: 'Performance' },
    { suffix: 'testing',        name: 'Testing' },
    { suffix: 'core-concepts',  name: 'Core Concepts' },
  ]

  await db.insert(categories).values(PARENTS).onConflictDoNothing()

  const parents = await db.query.categories.findMany({
    where: isNull(categories.parentId),
  })

  const children = parents.flatMap(parent =>
    CHILD_SUFFIXES.map(({ suffix, name }) => ({
      name,
      slug:     `${parent.slug}-${suffix}`,
      parentId: parent.id,
    }))
  )

  await db.insert(categories).values(children).onConflictDoNothing()

  console.log(`Seeded ${parents.length} parent categories and ${children.length} subcategories.`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
