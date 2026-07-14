import type { EcosystemCategory, EcosystemProject } from "./types";

/**
 * Static seed data for the ecosystem directory — not the runtime source of truth.
 * Seeded into `EcosystemDirectoryEntry` via `prisma/seed-ecosystem-directory.ts`.
 * Runtime reads use `loadEcosystemExplorerProjects()` from `@/lib/ecosystem-catalog`.
 */

export const ECOSYSTEM_CATEGORIES: EcosystemCategory[] = [
  {
    id: "defi",
    label: "DeFi",
    blurb: "Trading, lending, and on-chain finance built with private computation.",
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    blurb: "Core network services, nodes, and developer infrastructure.",
  },
  {
    id: "tooling",
    label: "Tooling",
    blurb: "SDKs, dev tools, and frameworks for building on Arcium.",
  },
  {
    id: "gaming",
    label: "Gaming",
    blurb: "Games and interactive experiences using confidential logic.",
  },
  {
    id: "ai",
    label: "AI",
    blurb: "Private inference, model orchestration, and AI-native apps.",
  },
  {
    id: "privacy",
    label: "Privacy",
    blurb: "Privacy-preserving protocols and confidential data products.",
  },
  {
    id: "wallets",
    label: "Wallets",
    blurb: "Wallet integrations and secure key management.",
  },
  {
    id: "analytics",
    label: "Analytics",
    blurb: "Insights, monitoring, and ecosystem intelligence.",
  },
];

export const ECOSYSTEM_PROJECTS: EcosystemProject[] = [
  {
    id: "arcium-core",
    slug: "arcium-core",
    name: "Arcium",
    tagline: "Confidential computing network",
    description:
      "Arcium is the foundation layer for private, verifiable computation across the ecosystem. Projects integrate with Arcium for encrypted execution and trust-minimized coordination.",
    logoUrl: null,
    categoryId: "infrastructure",
    status: "mainnet",
    featured: true,
    trending: true,
    addedAt: "2024-01-15",
    tags: ["core", "mpc", "network"],
    links: {
      website: "https://arcium.com",
      docs: "https://docs.arcium.com",
      twitter: "https://x.com/arciumhq",
    },
    relationships: [],
  },
  {
    id: "arcium-sdk",
    slug: "arcium-sdk",
    name: "Arcium SDK",
    tagline: "Build confidential apps faster",
    description:
      "Official SDK for integrating Arcium confidential compute into Solana programs and off-chain services. Includes typed helpers, test harnesses, and deployment utilities.",
    logoUrl: null,
    categoryId: "tooling",
    status: "mainnet",
    featured: true,
    trending: true,
    addedAt: "2024-03-01",
    tags: ["sdk", "typescript", "rust"],
    links: {
      docs: "https://docs.arcium.com/sdk",
      github: "https://github.com/arcium-hq",
    },
    relationships: [
      { targetId: "arcium-core", type: "sdk" },
      { targetId: "arcium-cli", type: "tooling" },
    ],
  },
  {
    id: "arcium-cli",
    slug: "arcium-cli",
    name: "Arcium CLI",
    tagline: "Local dev and deployment",
    description:
      "Command-line tools for scaffolding projects, running local MPC clusters, and deploying confidential circuits to testnet and mainnet.",
    logoUrl: null,
    categoryId: "tooling",
    status: "mainnet",
    featured: false,
    addedAt: "2024-04-10",
    tags: ["cli", "developer-tools"],
    links: { docs: "https://docs.arcium.com/cli" },
    relationships: [
      { targetId: "arcium-sdk", type: "tooling" },
      { targetId: "arcium-core", type: "infrastructure" },
    ],
  },
  {
    id: "shieldswap",
    slug: "shieldswap",
    name: "ShieldSwap",
    tagline: "Private token swaps",
    description:
      "A DEX aggregator that routes trades through Arcium confidential pools, hiding order size and timing while preserving on-chain settlement guarantees.",
    logoUrl: null,
    categoryId: "defi",
    status: "mainnet",
    featured: true,
    trending: true,
    addedAt: "2024-06-20",
    tags: ["dex", "trading", "amm"],
    links: {
      website: "https://example.com/shieldswap",
      docs: "https://docs.example.com/shieldswap",
      twitter: "https://x.com/shieldswap",
    },
    relationships: [
      { targetId: "arcium-sdk", type: "sdk" },
      { targetId: "privy-vault", type: "partnership" },
    ],
  },
  {
    id: "cipherlend",
    slug: "cipherlend",
    name: "CipherLend",
    tagline: "Confidential lending markets",
    description:
      "Peer-to-peer lending with encrypted collateral ratios and private liquidation logic, reducing MEV and front-running on borrow/lend flows.",
    logoUrl: null,
    categoryId: "defi",
    status: "testnet",
    featured: false,
    trending: true,
    addedAt: "2024-08-05",
    tags: ["lending", "defi"],
    links: { website: "https://example.com/cipherlend" },
    relationships: [
      { targetId: "arcium-sdk", type: "sdk" },
      { targetId: "shieldswap", type: "partnership" },
    ],
  },
  {
    id: "darkpool-xyz",
    slug: "darkpool-xyz",
    name: "DarkPool",
    tagline: "Institutional dark liquidity",
    description:
      "Dark pool infrastructure for large block trades with encrypted order books and selective disclosure to matching engines.",
    logoUrl: null,
    categoryId: "defi",
    status: "testnet",
    featured: false,
    addedAt: "2024-09-12",
    tags: ["dark-pool", "institutional"],
    links: { docs: "https://docs.example.com/darkpool" },
    relationships: [
      { targetId: "arcium-core", type: "infrastructure" },
      { targetId: "shieldswap", type: "partnership" },
    ],
  },
  {
    id: "nodeforge",
    slug: "nodeforge",
    name: "NodeForge",
    tagline: "Managed Arcium nodes",
    description:
      "Hosted node operator service with monitoring, slashing protection, and one-click MPC cluster provisioning for validators and app teams.",
    logoUrl: null,
    categoryId: "infrastructure",
    status: "mainnet",
    featured: false,
    addedAt: "2024-05-18",
    tags: ["nodes", "hosting", "validators"],
    links: { website: "https://example.com/nodeforge" },
    relationships: [
      { targetId: "arcium-core", type: "infrastructure" },
      { targetId: "ecosystem-pulse", type: "partnership" },
    ],
  },
  {
    id: "relaymesh",
    slug: "relaymesh",
    name: "RelayMesh",
    tagline: "Cross-region MPC relay",
    description:
      "Low-latency relay network connecting MPC participants across regions with encrypted message routing and health-aware failover.",
    logoUrl: null,
    categoryId: "infrastructure",
    status: "testnet",
    featured: false,
    addedAt: "2024-10-01",
    tags: ["networking", "relay"],
    links: { github: "https://github.com/example/relaymesh" },
    relationships: [
      { targetId: "nodeforge", type: "infrastructure" },
      { targetId: "arcium-core", type: "infrastructure" },
    ],
  },
  {
    id: "circuit-studio",
    slug: "circuit-studio",
    name: "Circuit Studio",
    tagline: "Visual circuit designer",
    description:
      "Browser-based IDE for composing confidential circuits, simulating inputs, and exporting deploy-ready artifacts for Arcium clusters.",
    logoUrl: null,
    categoryId: "tooling",
    status: "mainnet",
    featured: true,
    addedAt: "2024-07-22",
    tags: ["ide", "circuits", "no-code"],
    links: {
      website: "https://example.com/circuit-studio",
      docs: "https://docs.example.com/circuit-studio",
    },
    relationships: [
      { targetId: "arcium-sdk", type: "sdk" },
      { targetId: "arcium-cli", type: "tooling" },
    ],
  },
  {
    id: "testnet-faucet",
    slug: "testnet-faucet",
    name: "Arcium Faucet",
    tagline: "Testnet tokens and credits",
    description:
      "Official faucet for testnet SOL and Arcium compute credits, with rate limiting and wallet attestation for abuse prevention.",
    logoUrl: null,
    categoryId: "tooling",
    status: "mainnet",
    featured: false,
    addedAt: "2024-02-28",
    tags: ["faucet", "testnet"],
    links: { website: "https://faucet.example.com" },
    relationships: [{ targetId: "arcium-core", type: "infrastructure" }],
  },
  {
    id: "shadowquest",
    slug: "shadowquest",
    name: "ShadowQuest",
    tagline: "Private in-game economies",
    description:
      "Multiplayer RPG with confidential loot rolls, hidden inventories, and anti-cheat logic running in Arcium MPC without exposing player strategies.",
    logoUrl: null,
    categoryId: "gaming",
    status: "testnet",
    featured: true,
    trending: true,
    addedAt: "2024-11-03",
    tags: ["gaming", "rpg", "anti-cheat"],
    links: {
      website: "https://example.com/shadowquest",
      twitter: "https://x.com/shadowquest",
    },
    relationships: [
      { targetId: "arcium-sdk", type: "sdk" },
      { targetId: "phantom-arcium", type: "partnership" },
    ],
  },
  {
    id: "arcade-vault",
    slug: "arcade-vault",
    name: "Arcade Vault",
    tagline: "Skill-based wagers, privately settled",
    description:
      "Competitive arcade platform where match outcomes and stakes are computed confidentially before public settlement on Solana.",
    logoUrl: null,
    categoryId: "gaming",
    status: "coming_soon",
    featured: false,
    addedAt: "2025-01-10",
    tags: ["gaming", "wagers"],
    links: {},
    relationships: [{ targetId: "shadowquest", type: "partnership" }],
  },
  {
    id: "neural-vault",
    slug: "neural-vault",
    name: "Neural Vault",
    tagline: "Private model inference",
    description:
      "Run ML inference on encrypted inputs so prompts and outputs stay private to users and model operators, with verifiable execution proofs.",
    logoUrl: null,
    categoryId: "ai",
    status: "testnet",
    featured: true,
    trending: true,
    addedAt: "2024-09-30",
    tags: ["ai", "inference", "ml"],
    links: {
      website: "https://example.com/neural-vault",
      docs: "https://docs.example.com/neural-vault",
    },
    relationships: [
      { targetId: "arcium-sdk", type: "sdk" },
      { targetId: "privy-vault", type: "partnership" },
    ],
  },
  {
    id: "agent-orbit",
    slug: "agent-orbit",
    name: "Agent Orbit",
    tagline: "Confidential AI agents",
    description:
      "Orchestration layer for autonomous agents that execute tool calls and memory updates inside MPC enclaves, limiting data leakage across workflows.",
    logoUrl: null,
    categoryId: "ai",
    status: "coming_soon",
    featured: false,
    addedAt: "2025-02-14",
    tags: ["agents", "orchestration"],
    links: { docs: "https://docs.example.com/agent-orbit" },
    relationships: [
      { targetId: "neural-vault", type: "tooling" },
      { targetId: "arcium-sdk", type: "sdk" },
    ],
  },
  {
    id: "zk-mail",
    slug: "zk-mail",
    name: "ZK Mail",
    tagline: "Encrypted messaging rails",
    description:
      "Messaging protocol with metadata privacy and selective disclosure for ecosystem apps that need confidential user-to-user communication.",
    logoUrl: null,
    categoryId: "privacy",
    status: "testnet",
    featured: false,
    addedAt: "2024-08-20",
    tags: ["messaging", "privacy"],
    links: { github: "https://github.com/example/zk-mail" },
    relationships: [
      { targetId: "arcium-core", type: "infrastructure" },
      { targetId: "privy-vault", type: "partnership" },
    ],
  },
  {
    id: "privy-vault",
    slug: "privy-vault",
    name: "Privy Vault",
    tagline: "Confidential key storage",
    description:
      "Wallet and secret vault with MPC-backed key shards, enabling apps to request signatures without ever holding full private keys.",
    logoUrl: null,
    categoryId: "privacy",
    status: "mainnet",
    featured: true,
    addedAt: "2024-06-01",
    tags: ["keys", "mpc", "secrets"],
    links: {
      website: "https://example.com/privy-vault",
      docs: "https://docs.example.com/privy-vault",
    },
    relationships: [
      { targetId: "arcium-core", type: "infrastructure" },
      { targetId: "phantom-arcium", type: "partnership" },
    ],
  },
  {
    id: "phantom-arcium",
    slug: "phantom-arcium",
    name: "Phantom × Arcium",
    tagline: "Wallet-native confidential signing",
    description:
      "Integration path for Phantom wallet users to approve confidential transactions with clear disclosure UX and hardware-backed session keys.",
    logoUrl: null,
    categoryId: "wallets",
    status: "mainnet",
    featured: true,
    trending: true,
    addedAt: "2024-10-15",
    tags: ["wallet", "phantom", "signing"],
    links: {
      website: "https://phantom.app",
      docs: "https://docs.example.com/phantom-arcium",
    },
    relationships: [
      { targetId: "privy-vault", type: "partnership" },
      { targetId: "arcium-sdk", type: "sdk" },
    ],
  },
  {
    id: "solflare-private",
    slug: "solflare-private",
    name: "Solflare Private",
    tagline: "Privacy mode for Solflare",
    description:
      "Experimental privacy mode in Solflare that routes sensitive operations through Arcium confidential compute with user-controlled disclosure.",
    logoUrl: null,
    categoryId: "wallets",
    status: "testnet",
    featured: false,
    addedAt: "2024-12-01",
    tags: ["wallet", "solflare"],
    links: { website: "https://solflare.com" },
    relationships: [
      { targetId: "phantom-arcium", type: "tooling" },
      { targetId: "arcium-sdk", type: "sdk" },
    ],
  },
  {
    id: "ecosystem-pulse",
    slug: "ecosystem-pulse",
    name: "Ecosystem Pulse",
    tagline: "Network health and usage",
    description:
      "Analytics dashboard for MPC cluster utilization, project adoption, and cross-app dependency graphs across the Arcium ecosystem.",
    logoUrl: null,
    categoryId: "analytics",
    status: "mainnet",
    featured: false,
    trending: true,
    addedAt: "2024-07-01",
    tags: ["analytics", "dashboard"],
    links: {
      website: "https://example.com/ecosystem-pulse",
      docs: "https://docs.example.com/pulse",
    },
    relationships: [
      { targetId: "arcium-core", type: "infrastructure" },
      { targetId: "nodeforge", type: "partnership" },
    ],
  },
  {
    id: "trace-lens",
    slug: "trace-lens",
    name: "Trace Lens",
    tagline: "Confidential observability",
    description:
      "Observability stack that aggregates encrypted telemetry from apps and nodes, revealing aggregate metrics without exposing raw user events.",
    logoUrl: null,
    categoryId: "analytics",
    status: "testnet",
    featured: false,
    addedAt: "2024-11-20",
    tags: ["observability", "metrics"],
    links: { github: "https://github.com/example/trace-lens" },
    relationships: [
      { targetId: "ecosystem-pulse", type: "tooling" },
      { targetId: "relaymesh", type: "infrastructure" },
    ],
  },
  {
    id: "compliance-shield",
    slug: "compliance-shield",
    name: "Compliance Shield",
    tagline: "Selective disclosure for institutions",
    description:
      "Compliance tooling that enables regulated entities to prove policy adherence via selective disclosure proofs without revealing underlying customer data.",
    logoUrl: null,
    categoryId: "privacy",
    status: "coming_soon",
    featured: false,
    addedAt: "2025-03-01",
    tags: ["compliance", "institutional"],
    links: { docs: "https://docs.example.com/compliance-shield" },
    relationships: [
      { targetId: "privy-vault", type: "partnership" },
      { targetId: "darkpool-xyz", type: "partnership" },
    ],
  },
  {
    id: "yield-haven",
    slug: "yield-haven",
    name: "Yield Haven",
    tagline: "Private yield strategies",
    description:
      "Automated yield aggregator that keeps strategy parameters and rebalance logic confidential while publishing verifiable performance summaries.",
    logoUrl: null,
    categoryId: "defi",
    status: "coming_soon",
    featured: false,
    addedAt: "2025-02-28",
    tags: ["yield", "vaults"],
    links: {},
    relationships: [
      { targetId: "cipherlend", type: "partnership" },
      { targetId: "shieldswap", type: "sdk" },
    ],
  },
  {
    id: "arcademy",
    slug: "arcademy",
    name: "Arcademy",
    tagline: "Curated ecosystem learning",
    description:
      "Curated courses and badges for learning Arcium ecosystem products. Browse publicly, connect a wallet to track progress and earn credentials.",
    logoUrl: null,
    categoryId: "tooling",
    status: "mainnet",
    featured: true,
    addedAt: "2024-04-01",
    tags: ["education", "badges", "learning"],
    links: {
      website: "https://arcademy.example.com",
      docs: "https://docs.example.com/arcademy",
    },
    relationships: [{ targetId: "arcium-core", type: "partnership" }],
  },
];

/** Seed lookup only — runtime explorer uses DB-backed projects from the store. */
export function getProjectById(id: string): EcosystemProject | undefined {
  return ECOSYSTEM_PROJECTS.find((project) => project.id === id);
}

/** Seed lookup only — runtime explorer uses DB-backed projects from the store. */
export function getProjectBySlug(slug: string): EcosystemProject | undefined {
  return ECOSYSTEM_PROJECTS.find((project) => project.slug === slug);
}

export function getCategoryById(id: string): EcosystemCategory | undefined {
  return ECOSYSTEM_CATEGORIES.find((category) => category.id === id);
}
