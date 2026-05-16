import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

const SYSTEM_TAGS = [
  { name: 'TypeScript',  slug: 'typescript',  color: '#3178C6', description: 'Microsoft\'s typed superset of JavaScript.' },
  { name: 'JavaScript',  slug: 'javascript',  color: '#CA8A04', description: 'The language of the web.' },
  { name: 'Python',      slug: 'python',      color: '#3776AB', description: 'General-purpose language popular for data science and backend.' },
  { name: 'React',       slug: 'react',       color: '#0EA5E9', description: 'UI library for building component-based interfaces.' },
  { name: 'Next.js',     slug: 'nextjs',      color: '#6B7280', description: 'React framework with App Router and full-stack capabilities.' },
  { name: 'Node.js',     slug: 'nodejs',      color: '#339933', description: 'JavaScript runtime for server-side development.' },
  { name: 'FastAPI',     slug: 'fastapi',     color: '#009688', description: 'Modern Python web framework for building APIs.' },
  { name: 'Docker',      slug: 'docker',      color: '#2496ED', description: 'Container platform for packaging and deploying applications.' },
  { name: 'PostgreSQL',  slug: 'postgresql',  color: '#336791', description: 'Open-source relational database.' },
  { name: 'SQL',          slug: 'sql',          color: '#F97316', description: 'Standard language for relational databases.' },
  { name: 'Redis',        slug: 'redis',        color: '#DC382D', description: 'In-memory data store for caching, queues, and pub/sub.' },
  { name: 'Kubernetes',   slug: 'kubernetes',   color: '#326CE5', description: 'Container orchestration platform for automated deployment and scaling.' },
  { name: 'Kafka',        slug: 'kafka',        color: '#231F20', description: 'Distributed event streaming platform for high-throughput pipelines.' },
  { name: 'LangChain',    slug: 'langchain',    color: '#1C3C3C', description: 'Framework for building LLM-powered applications and agents.' },
  { name: 'OpenAI SDK',   slug: 'openai-sdk',   color: '#10A37F', description: 'Client library for OpenAI API — completions, embeddings, and tools.' },
  { name: 'Anthropic API', slug: 'anthropic-api', color: '#D97757', description: 'Client library for Claude models via the Anthropic API.' },
  { name: 'AWS',          slug: 'aws',          color: '#FF9900', description: 'Amazon Web Services — the dominant cloud platform.' },
  { name: 'Go',           slug: 'go',           color: '#00ADD8', description: 'Google\'s compiled language for performant backend and CLI tools.' },
]

async function main() {
  const { db }   = await import('./client')
  const { tags } = await import('./schema/tags')
  const { eq }   = await import('drizzle-orm')

  for (const tag of SYSTEM_TAGS) {
    await db
      .insert(tags)
      .values({ ...tag, isSystem: true })
      .onConflictDoUpdate({
        target: tags.slug,
        set:    { name: tag.name, color: tag.color, description: tag.description, isSystem: true },
      })
  }

  console.log(`Seeded ${SYSTEM_TAGS.length} system tags.`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
