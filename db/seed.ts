import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

async function main() {
  const { db }         = await import('./client')
  const { categories } = await import('./schema/categories')
  const { isNull, isNotNull } = await import('drizzle-orm')

  // Clear existing categories (children first due to self-ref, then parents)
  await db.delete(categories).where(isNotNull(categories.parentId))
  await db.delete(categories).where(isNull(categories.parentId))

  const TAXONOMY = [
    {
      parent: {
        name:        'Programming Fundamentals',
        slug:        'programming-fundamentals',
        description: 'Core programming concepts every developer must master before everything else.',
      },
      children: [
        { name: 'Types, Variables & Data Structures', slug: 'programming-fundamentals-types'      },
        { name: 'Object-Oriented Programming',        slug: 'programming-fundamentals-oop'        },
        { name: 'Functional Programming',             slug: 'programming-fundamentals-functional' },
        { name: 'Async Programming & Concurrency',    slug: 'programming-fundamentals-async'      },
        { name: 'Testing & Debugging',                slug: 'programming-fundamentals-testing'    },
      ],
    },
    {
      parent: {
        name:        'System Design & Architecture',
        slug:        'system-design',
        description: 'Designing scalable, resilient systems — the skill AI cannot replace.',
      },
      children: [
        { name: 'Application Architecture Patterns', slug: 'system-design-architecture'  },
        { name: 'Scalability & Load Management',     slug: 'system-design-scalability'   },
        { name: 'Event-Driven Architecture',         slug: 'system-design-events'        },
        { name: 'API Design',                        slug: 'system-design-api'           },
        { name: 'Observability & Fault Tolerance',   slug: 'system-design-observability' },
      ],
    },
    {
      parent: {
        name:        'AI Engineering & Integration',
        slug:        'ai-engineering',
        description: 'Understanding and building with LLMs — the fastest-growing engineering discipline.',
      },
      children: [
        { name: 'LLMs & Prompting',              slug: 'ai-engineering-llms'       },
        { name: 'Context Engineering & RAG',     slug: 'ai-engineering-rag'        },
        { name: 'Embeddings & Vector Search',    slug: 'ai-engineering-embeddings' },
        { name: 'AI Agents & Multi-Agent Systems', slug: 'ai-engineering-agents'   },
        { name: 'Evaluation & Guardrails',       slug: 'ai-engineering-evaluation' },
      ],
    },
    {
      parent: {
        name:        'AI Workflow & Automation',
        slug:        'ai-automation',
        description: 'Automating business processes and integrating AI into existing systems.',
      },
      children: [
        { name: 'Workflow Orchestration',    slug: 'ai-automation-orchestration' },
        { name: 'AI Pipelines',              slug: 'ai-automation-pipelines'     },
        { name: 'No-Code & Low-Code Tools',  slug: 'ai-automation-no-code'       },
        { name: 'LangChain & LangGraph',     slug: 'ai-automation-langchain'     },
        { name: 'System Integration',        slug: 'ai-automation-integration'   },
      ],
    },
    {
      parent: {
        name:        'AI-Assisted Development',
        slug:        'ai-assisted-dev',
        description: 'Using AI tools in your daily workflow and critically auditing the code they produce.',
      },
      children: [
        { name: 'AI Tools & IDE Integration',      slug: 'ai-assisted-dev-tools'           },
        { name: 'Prompt Engineering for Developers', slug: 'ai-assisted-dev-prompting'     },
        { name: 'Spec-Driven Development',         slug: 'ai-assisted-dev-spec'            },
        { name: 'Reviewing & Auditing AI Code',    slug: 'ai-assisted-dev-review'          },
        { name: 'Detecting Hallucinations',        slug: 'ai-assisted-dev-hallucinations'  },
      ],
    },
    {
      parent: {
        name:        'Backend Development',
        slug:        'backend',
        description: 'Building the server-side — APIs, databases, queues, caching, and storage.',
      },
      children: [
        { name: 'APIs & Authentication',         slug: 'backend-apis'      },
        { name: 'Databases & Storage',           slug: 'backend-databases' },
        { name: 'Queues & Background Jobs',      slug: 'backend-queues'    },
        { name: 'Caching & Performance',         slug: 'backend-caching'   },
        { name: 'File Storage & Asset Management', slug: 'backend-storage' },
      ],
    },
    {
      parent: {
        name:        'Cloud & DevOps',
        slug:        'cloud-devops',
        description: 'Deploying, scaling, and operating software in the cloud.',
      },
      children: [
        { name: 'Docker & Containers',    slug: 'cloud-devops-docker' },
        { name: 'CI/CD & Automation',     slug: 'cloud-devops-cicd'   },
        { name: 'Cloud Platforms',        slug: 'cloud-devops-cloud'  },
        { name: 'Linux & Shell',          slug: 'cloud-devops-linux'  },
        { name: 'Infrastructure as Code', slug: 'cloud-devops-iac'    },
      ],
    },
    {
      parent: {
        name:        'Security',
        slug:        'security',
        description: 'Securing software in an era where AI generates vast amounts of vulnerable code.',
      },
      children: [
        { name: 'Auth: OAuth & JWT',             slug: 'security-auth'    },
        { name: 'OWASP Top 10',                  slug: 'security-owasp'   },
        { name: 'API Security',                  slug: 'security-api'     },
        { name: 'Secrets & Permissions Management', slug: 'security-secrets' },
        { name: 'AI Security & Prompt Injection', slug: 'security-ai'     },
      ],
    },
    {
      parent: {
        name:        'Product Thinking',
        slug:        'product-thinking',
        description: 'Understanding business context — what separates engineers from prompt monkeys.',
      },
      children: [
        { name: 'Problem Framing & ROI',       slug: 'product-thinking-framing'      },
        { name: 'UX & User Research',          slug: 'product-thinking-ux'           },
        { name: 'Business Process Automation', slug: 'product-thinking-automation'   },
        { name: 'Requirements Gathering',      slug: 'product-thinking-requirements' },
        { name: 'Stakeholder Communication',   slug: 'product-thinking-stakeholders' },
      ],
    },
    {
      parent: {
        name:        'Soft Skills',
        slug:        'soft-skills',
        description: 'Communication and collaboration skills that become more valuable as code gets cheaper.',
      },
      children: [
        { name: 'Technical Communication', slug: 'soft-skills-communication' },
        { name: 'Problem Analysis',        slug: 'soft-skills-analysis'      },
        { name: 'Documentation',           slug: 'soft-skills-documentation' },
        { name: 'Team Collaboration',      slug: 'soft-skills-collaboration' },
        { name: 'Presenting Solutions',    slug: 'soft-skills-presenting'    },
      ],
    },
    {
      parent: {
        name:        'Frontend & Design',
        slug:        'frontend-design',
        description: 'Building UIs well — component architecture, design systems, and performance.',
      },
      children: [
        { name: 'React & Component Architecture', slug: 'frontend-design-react'       },
        { name: 'State Management',               slug: 'frontend-design-state'       },
        { name: 'CSS & Layout Systems',           slug: 'frontend-design-css'         },
        { name: 'Design Systems & Accessibility', slug: 'frontend-design-systems'     },
        { name: 'Frontend Performance',           slug: 'frontend-design-performance' },
      ],
    },
  ]

  // Insert parents
  const parentRows = TAXONOMY.map(t => t.parent)
  await db.insert(categories).values(parentRows)

  // Fetch inserted parents to get their IDs
  const inserted = await db.query.categories.findMany({
    where: isNull(categories.parentId),
  })

  const idBySlug = Object.fromEntries(inserted.map(p => [p.slug, p.id]))

  // Insert children with parentId
  const childRows = TAXONOMY.flatMap(t =>
    t.children.map(c => ({ ...c, parentId: idBySlug[t.parent.slug] }))
  )
  await db.insert(categories).values(childRows)

  console.log(`Seeded ${parentRows.length} parent categories and ${childRows.length} subcategories.`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
