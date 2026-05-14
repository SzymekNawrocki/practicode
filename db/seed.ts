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
    // ── Topic-first ───────────────────────────────────────────────────────
    {
      parent: {
        name:        'Programming Fundamentals',
        slug:        'programming-fundamentals',
        description: 'Core programming concepts every developer needs to master.',
      },
      children: [
        { name: 'Types & Variables',          slug: 'programming-fundamentals-types'      },
        { name: 'Functions & Scope',          slug: 'programming-fundamentals-functions'  },
        { name: 'Object-Oriented Programming',slug: 'programming-fundamentals-oop'        },
        { name: 'Functional Programming',     slug: 'programming-fundamentals-functional' },
        { name: 'Error Handling',             slug: 'programming-fundamentals-errors'     },
      ],
    },
    {
      parent: {
        name:        'Data Structures & Algorithms',
        slug:        'data-structures',
        description: 'Classic computer science concepts for problem-solving and technical interviews.',
      },
      children: [
        { name: 'Arrays & Strings',  slug: 'data-structures-arrays'     },
        { name: 'Trees & Graphs',    slug: 'data-structures-trees'      },
        { name: 'Hash Maps & Sets',  slug: 'data-structures-hashmaps'   },
        { name: 'Sorting & Searching', slug: 'data-structures-sorting'  },
        { name: 'Complexity & Big-O',  slug: 'data-structures-complexity'},
      ],
    },
    {
      parent: {
        name:        'Web Development',
        slug:        'web-development',
        description: 'Building for the web — HTTP, APIs, frontend patterns, and authentication.',
      },
      children: [
        { name: 'HTTP & REST',         slug: 'web-development-http'     },
        { name: 'Frontend Patterns',   slug: 'web-development-frontend' },
        { name: 'Authentication',      slug: 'web-development-auth'     },
        { name: 'APIs & Integration',  slug: 'web-development-apis'     },
        { name: 'State Management',    slug: 'web-development-state'    },
      ],
    },
    {
      parent: {
        name:        'Databases',
        slug:        'databases',
        description: 'Relational and NoSQL databases — design, querying, and performance.',
      },
      children: [
        { name: 'SQL & Queries',           slug: 'databases-sql'          },
        { name: 'Schema Design',           slug: 'databases-schema'       },
        { name: 'Indexing & Performance',  slug: 'databases-indexing'     },
        { name: 'Transactions & ACID',     slug: 'databases-transactions' },
        { name: 'NoSQL Patterns',          slug: 'databases-nosql'        },
      ],
    },
    {
      parent: {
        name:        'System Design',
        slug:        'system-design',
        description: 'Patterns and principles for designing scalable, distributed software systems.',
      },
      children: [
        { name: 'Scalability Patterns', slug: 'system-design-scalability'   },
        { name: 'Caching Strategies',   slug: 'system-design-caching'       },
        { name: 'Microservices',        slug: 'system-design-microservices' },
        { name: 'Message Queues',       slug: 'system-design-queues'        },
        { name: 'Distributed Systems',  slug: 'system-design-distributed'   },
      ],
    },
    {
      parent: {
        name:        'Software Craftsmanship',
        slug:        'software-craftsmanship',
        description: 'Writing clean, maintainable, and well-tested software.',
      },
      children: [
        { name: 'Clean Code',          slug: 'software-craftsmanship-clean-code' },
        { name: 'Testing Practices',   slug: 'software-craftsmanship-testing'    },
        { name: 'Design Patterns',     slug: 'software-craftsmanship-patterns'   },
        { name: 'Git & Collaboration', slug: 'software-craftsmanship-git'        },
        { name: 'Code Review',         slug: 'software-craftsmanship-review'     },
      ],
    },
    {
      parent: {
        name:        'Security',
        slug:        'security',
        description: 'Securing software — vulnerabilities, cryptography, and secure coding practices.',
      },
      children: [
        { name: 'Authentication & Authorization', slug: 'security-authn'            },
        { name: 'Common Vulnerabilities',         slug: 'security-vulnerabilities'  },
        { name: 'Cryptography Basics',            slug: 'security-cryptography'     },
        { name: 'API Security',                   slug: 'security-api'              },
        { name: 'Secure Coding',                  slug: 'security-coding'           },
      ],
    },
    // ── Technology-specific ───────────────────────────────────────────────
    {
      parent: {
        name:        'TypeScript',
        slug:        'typescript',
        description: 'Typed superset of JavaScript — types, generics, decorators, and tooling.',
      },
      children: [
        { name: 'Types & Interfaces',      slug: 'typescript-types'       },
        { name: 'Generics',                slug: 'typescript-generics'    },
        { name: 'Decorators',              slug: 'typescript-decorators'  },
        { name: 'Configuration & Tooling', slug: 'typescript-config'      },
        { name: 'Advanced Patterns',       slug: 'typescript-patterns'    },
      ],
    },
    {
      parent: {
        name:        'Next.js',
        slug:        'nextjs',
        description: 'React framework with App Router, Server Components, and full-stack capabilities.',
      },
      children: [
        { name: 'App Router',                slug: 'nextjs-app-router'          },
        { name: 'Data Fetching',             slug: 'nextjs-data-fetching'       },
        { name: 'Server Components',         slug: 'nextjs-server-components'   },
        { name: 'Routing & Layouts',         slug: 'nextjs-routing'             },
        { name: 'Performance & Deployment',  slug: 'nextjs-performance'         },
      ],
    },
    {
      parent: {
        name:        'FastAPI',
        slug:        'fastapi',
        description: 'Modern Python web framework for building APIs with automatic docs.',
      },
      children: [
        { name: 'Routes & Endpoints',    slug: 'fastapi-routes'      },
        { name: 'Pydantic & Validation', slug: 'fastapi-validation'  },
        { name: 'Dependency Injection',  slug: 'fastapi-dependencies'},
        { name: 'Authentication',        slug: 'fastapi-auth'        },
        { name: 'Background Tasks',      slug: 'fastapi-background'  },
      ],
    },
    {
      parent: {
        name:        'DevOps',
        slug:        'devops',
        description: 'CI/CD, containers, cloud infrastructure, and deployment practices.',
      },
      children: [
        { name: 'CI/CD Pipelines',          slug: 'devops-cicd'        },
        { name: 'Containers & Docker',      slug: 'devops-containers'  },
        { name: 'Cloud & Infrastructure',   slug: 'devops-cloud'       },
        { name: 'Monitoring & Logging',     slug: 'devops-monitoring'  },
        { name: 'Kubernetes',               slug: 'devops-kubernetes'  },
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
