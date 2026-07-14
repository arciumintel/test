export type GlossaryCategory = {
  id: string;
  title: string;
  description: string;
};

export type GlossaryTerm = {
  slug: string;
  term: string;
  definition: string;
  categoryId: string;
  aliases?: string[];
  imageUrl?: string;
  imageAlt?: string;
  docsHref?: string;
  detailPage?: GlossaryDetailPage;
};

export type GlossaryLetterGroup = {
  letter: string;
  terms: GlossaryTerm[];
};

export type GlossaryVisualId =
  | "multi-party-computation"
  | "secret-sharing"
  | "cluster"
  | "mxe"
  | "protocol-comparison"
  | "cluster-forking";

export type GlossaryDetailSection = {
  title: string;
  body: string;
};

type GlossaryDetailPageBase = {
  eyebrow?: string;
  intro: string;
  sections: GlossaryDetailSection[];
  keyTakeaways?: string[];
  relatedSlugs?: string[];
};

export type GlossaryDetailPage =
  | (GlossaryDetailPageBase & {
      kind: "editorial";
    })
  | (GlossaryDetailPageBase & {
      kind: "visual";
      visualId: GlossaryVisualId;
    });

const architectureImage =
  "https://mintcdn.com/arcium/Xmb4zKT2rprigEoF/images/arcium_docs/ARCIUM-Architecture-Horizontal.jpg?fit=max&auto=format&n=Xmb4zKT2rprigEoF&q=85&s=fee48fcf1c2e712150870b2060968e9f";
const clustersImage =
  "https://mintcdn.com/arcium/9466H0KeSU-eNM9-/images/arcium_docs/image-2.png?fit=max&auto=format&n=9466H0KeSU-eNM9-&q=85&s=c7ca06be0135ef73d0645ecc8627dab7";
const mpcImage =
  "https://mintcdn.com/arcium/9466H0KeSU-eNM9-/images/arcium_docs/image.png?fit=max&auto=format&n=9466H0KeSU-eNM9-&q=85&s=2bff7acc0f3623af6103b4812145e12f";
const mxeImage =
  "https://mintcdn.com/arcium/9466H0KeSU-eNM9-/images/arcium_docs/ARCIUM-DOCS-MXE-1920x1080-v2.jpg?fit=max&auto=format&n=9466H0KeSU-eNM9-&q=85&s=515abfb2231be1419203b5dc82e54449";
const keyFeaturesImage =
  "https://mintcdn.com/arcium/9466H0KeSU-eNM9-/images/arcium_docs/ARCIUM-DOCS-KEY-FEATURES-1920x1080.jpg?fit=max&auto=format&n=9466H0KeSU-eNM9-&q=85&s=75452e092eed102def9d3d136655d74c";
const nodeImage =
  "https://mintcdn.com/arcium/9466H0KeSU-eNM9-/images/arcium_docs/ARCIUM-DOCS-NODE-OPERATOR-CLUSTERS-1920x1920-v2.jpg?fit=max&auto=format&n=9466H0KeSU-eNM9-&q=85&s=0aa72a9bdfba7a9478d8a54ab888f9ec";
const clusterForkingImage =
  "https://mintcdn.com/arcium/9466H0KeSU-eNM9-/images/arcium_docs/ARCIUM-DOCS-CLUSTER-FORKING-MIGRATION-1920x1080.jpg?fit=max&auto=format&n=9466H0KeSU-eNM9-&q=85&s=ab58df6f71ee3d10c4d5e17f8a9248a6";

const DETAIL_PAGES = {
  arcium: {
    kind: "editorial",
    eyebrow: "Network & architecture",
    intro:
      "Arcium is the top-level idea behind the rest of this glossary: a network that lets applications work with private data without exposing the raw inputs.",
    sections: [
      {
        title: "What problem it solves",
        body:
          "Most blockchains are transparent by default, which makes it hard to build apps that need privacy. Arcium is designed to close that gap by keeping data protected while still letting useful computation happen.",
      },
      {
        title: "How to picture it",
        body:
          "A helpful mental model is a shared encrypted computer. Many machines contribute to the result, but no single machine needs to see the whole secret on its own.",
      },
    ],
    keyTakeaways: [
      "Arcium is a confidential computing network.",
      "It is built to process sensitive inputs without revealing them.",
      "Many other glossary terms describe pieces of that system.",
    ],
    relatedSlugs: ["multi-party-computation", "arcium-program", "cluster"],
  },
  arcis: {
    kind: "editorial",
    eyebrow: "Execution & infrastructure",
    intro:
      "Arcis is the builder-facing layer of Arcium. It gives developers a structured way to describe logic that should run privately.",
    sections: [
      {
        title: "Who it is for",
        body:
          "Arcis is mainly for teams building applications on top of Arcium. Instead of thinking directly about every networking or cryptography detail, they work through the framework that packages those concepts into a clearer developer workflow.",
      },
      {
        title: "Why it matters on Arcademy",
        body:
          "Learners do not need to write Arcis code to understand the ecosystem. Still, knowing that Arcis is the authoring layer helps make sense of terms like encrypted instructions and computation definitions.",
      },
    ],
    relatedSlugs: ["encrypted-instruction", "computation-definition", "mxe"],
  },
  "arcium-program": {
    kind: "editorial",
    eyebrow: "Execution & infrastructure",
    intro:
      "The Arcium program is the onchain coordinator that helps connect Solana activity with confidential offchain execution.",
    sections: [
      {
        title: "Its job in the system",
        body:
          "It helps route work, track the state of computations, and coordinate callbacks and results. That makes it the shared handoff point between application logic and the wider Arcium network.",
      },
      {
        title: "Why it is onchain",
        body:
          "Putting coordination on Solana gives the network a common source of truth. Participants can agree on what work was requested and how it should be finalized.",
      },
    ],
    relatedSlugs: ["onchain-orchestration", "computation", "cluster"],
  },
  "arx-node": {
    kind: "editorial",
    eyebrow: "Execution & infrastructure",
    intro:
      "Arx nodes are the machines that participate in confidential computations. They are the workers that make the network real.",
    sections: [
      {
        title: "Why multiple nodes are used",
        body:
          "Arcium spreads work across multiple nodes so trust does not sit with a single machine or operator. Each node contributes only part of the overall process, which helps protect sensitive data.",
      },
      {
        title: "What learners should remember",
        body:
          "When you see a cluster or MPC visual, imagine it as a group of Arx nodes collaborating. The system's privacy guarantees come from how those nodes work together rather than from one trusted box.",
      },
    ],
    relatedSlugs: ["cluster", "multi-party-computation", "arxos"],
  },
  arxos: {
    kind: "editorial",
    eyebrow: "Execution & infrastructure",
    intro:
      "arxOS is the distributed operating layer that helps organize work across Arcium nodes and clusters.",
    sections: [
      {
        title: "What it coordinates",
        body:
          "It helps manage how nodes participate, how workloads are handled, and how execution stays organized across the network. You can think of it as infrastructure glue rather than a user-facing feature.",
      },
      {
        title: "Why the term matters",
        body:
          "arxOS explains that Arcium is more than a single cryptographic trick. It also depends on operational software that keeps the network running predictably.",
      },
    ],
    relatedSlugs: ["arx-node", "cluster", "arcium"],
  },
  "byzantine-fault-tolerance": {
    kind: "editorial",
    eyebrow: "Network operations",
    intro:
      "Byzantine fault tolerance is the idea that a distributed system can keep working even when some participants fail or act dishonestly.",
    sections: [
      {
        title: "Why distributed systems need it",
        body:
          "In open networks, you cannot assume every participant behaves correctly all the time. Byzantine fault tolerance describes the design goal of staying reliable even under those messy conditions.",
      },
      {
        title: "How to read it in Arcium docs",
        body:
          "When Arcium mentions Byzantine fault tolerance, it is pointing to resilience. The network is designed so a small number of bad actors should not be enough to break correctness for everyone else.",
      },
    ],
    relatedSlugs: ["trustless-execution", "slashing", "cerberus"],
  },
  computation: {
    kind: "editorial",
    eyebrow: "Execution & infrastructure",
    intro:
      "A computation is one actual run of private logic. It is the event that happens when the system takes an instruction and executes it on protected data.",
    sections: [
      {
        title: "Definition versus runtime",
        body:
          "Arcium distinguishes between the reusable definition of logic and the live execution of that logic. A computation is the live run, with its own inputs, lifecycle, and result.",
      },
      {
        title: "Why the distinction helps",
        body:
          "This makes it easier to reason about scale. One instruction can exist once, while many computations can be triggered from it over time.",
      },
    ],
    relatedSlugs: ["computation-definition", "encrypted-instruction", "mxe"],
  },
  "computation-definition": {
    kind: "editorial",
    eyebrow: "Execution & infrastructure",
    intro:
      "A computation definition is the reusable record of how a private instruction should run. It describes the logic before any single execution starts.",
    sections: [
      {
        title: "Why it exists",
        body:
          "Separating the definition from the runtime execution means Arcium can register logic once and invoke it many times. That reduces confusion between 'what this program is' and 'what happened in this specific run.'",
      },
      {
        title: "How it relates to the stack",
        body:
          "Builders typically author logic with Arcis, register the compiled result as a computation definition, and then trigger computations against that definition later.",
      },
    ],
    relatedSlugs: ["arcis", "encrypted-instruction", "computation"],
  },
  "confidential-computing": {
    kind: "editorial",
    eyebrow: "Network & architecture",
    intro:
      "Confidential computing is the umbrella idea of using systems that can process sensitive information without exposing the raw data.",
    sections: [
      {
        title: "Why this matters",
        body:
          "Traditional applications often force a bad tradeoff: either keep data private and limit what you can do with it, or process it fully and trust whoever runs the infrastructure. Confidential computing tries to give you both utility and protection.",
      },
      {
        title: "Where Arcium fits",
        body:
          "Arcium is one approach inside that larger category. Its defining choice is to emphasize MPC-based private execution rather than relying only on a single trusted machine.",
      },
    ],
    relatedSlugs: ["arcium", "multi-party-computation", "trusted-execution-environment"],
  },
  "encrypted-instruction": {
    kind: "editorial",
    eyebrow: "Execution & infrastructure",
    intro:
      "An encrypted instruction is the piece of logic a builder wants Arcium to run privately. It describes the useful work without exposing the sensitive inputs.",
    sections: [
      {
        title: "Why the name matters",
        body:
          "The important idea is not just that data is encrypted. The instruction itself is designed for execution in a private computing environment, so the system can produce a result without falling back to plain-text handling.",
      },
      {
        title: "How it connects to other terms",
        body:
          "Encrypted instructions are authored through Arcis, represented through computation definitions, and ultimately executed through Arcium's MPC infrastructure.",
      },
    ],
    relatedSlugs: ["arcis", "computation-definition", "computation"],
  },
  "encrypted-supercomputer": {
    kind: "editorial",
    eyebrow: "Network & architecture",
    intro:
      "Arcium uses 'encrypted supercomputer' as a shorthand metaphor for a network that behaves like one private compute system assembled from many participants.",
    sections: [
      {
        title: "What the phrase is trying to teach",
        body:
          "The phrase helps non-specialists picture many nodes coordinating as one environment. It emphasizes pooled capability while also keeping privacy at the center.",
      },
      {
        title: "What not to over-read",
        body:
          "It is a mental model, not a literal hardware description. The core idea is coordinated confidential execution, not one giant machine in a single location.",
      },
    ],
    relatedSlugs: ["arcium", "arx-node", "cluster"],
  },
  "onchain-orchestration": {
    kind: "editorial",
    eyebrow: "Network & architecture",
    intro:
      "Onchain orchestration means Solana is used to coordinate how confidential work is scheduled, tracked, and finalized.",
    sections: [
      {
        title: "Why orchestration happens onchain",
        body:
          "Using an onchain coordination layer gives the network a durable public record of requests and outcomes. That shared record helps participants agree on state without relying on a private operator's dashboard.",
      },
      {
        title: "Why it matters to learners",
        body:
          "This is one of the terms that explains how Arcium connects back to the broader Solana ecosystem. Private execution is not isolated from the chain; it is coordinated through it.",
      },
    ],
    relatedSlugs: ["arcium-program", "computation", "mxe"],
  },
  "threshold-encryption": {
    kind: "editorial",
    eyebrow: "Privacy & cryptography",
    intro:
      "Threshold encryption protects data by requiring enough authorized parties to cooperate before decryption can happen.",
    sections: [
      {
        title: "Why 'threshold' matters",
        body:
          "The threshold is the minimum number of participants needed to unlock the protected result. That design avoids placing too much trust in any single actor.",
      },
      {
        title: "How it fits the bigger picture",
        body:
          "Threshold encryption is part of the broader family of distributed trust techniques. In Arcium, it complements other privacy mechanisms used around collaborative execution.",
      },
    ],
    relatedSlugs: ["secret-sharing", "multi-party-computation", "trusted-execution-environment"],
  },
  "trusted-execution-environment": {
    kind: "editorial",
    eyebrow: "Privacy & cryptography",
    intro:
      "A Trusted Execution Environment, or TEE, is a hardware-based way to protect computation inside a more isolated part of a machine.",
    sections: [
      {
        title: "Why it comes up in Arcium",
        body:
          "Arcium often mentions TEEs as a comparison point. TEEs can be useful, but they rely on trusting specific hardware assumptions, while Arcium's MPC approach spreads trust across multiple participants.",
      },
      {
        title: "How to compare it",
        body:
          "A simple way to frame the difference is single protected machine versus coordinated protected network. Both aim to reduce exposure, but they make different trust tradeoffs.",
      },
    ],
    relatedSlugs: ["multi-party-computation", "confidential-computing", "trustless-execution"],
  },
  "trustless-execution": {
    kind: "editorial",
    eyebrow: "Network operations",
    intro:
      "Trustless execution means users do not need to rely on one central operator's word that a private computation was handled correctly.",
    sections: [
      {
        title: "What provides the guarantee",
        body:
          "Instead of personal trust, the system leans on protocol rules, incentives, and cryptographic design. The goal is to make correct behavior the expected outcome even when participants do not know each other.",
      },
      {
        title: "Why the term matters",
        body:
          "For new learners, this term helps explain why decentralization is still relevant even in a privacy-focused system. The promise is not only secrecy, but also confidence in the process.",
      },
    ],
    relatedSlugs: ["byzantine-fault-tolerance", "slashing", "arcium"],
  },
  cerberus: {
    kind: "visual",
    visualId: "protocol-comparison",
    eyebrow: "Privacy & cryptography",
    intro:
      "Cerberus is the stronger-security MPC backend in the Arcium stack. It is designed for settings where detecting malicious behavior matters more than chasing the fastest possible execution.",
    sections: [
      {
        title: "What tradeoff it makes",
        body:
          "Cerberus emphasizes stronger security guarantees, especially in less trusted environments. That usually means accepting more overhead in exchange for better protection against bad actors.",
      },
      {
        title: "How to compare it",
        body:
          "Cerberus makes the most sense when the environment is adversarial or when correctness under malicious behavior is the highest priority. It is best understood next to Manticore, which chooses a different point on the speed-versus-trust spectrum.",
      },
    ],
    relatedSlugs: ["manticore", "multi-party-computation", "byzantine-fault-tolerance"],
  },
  cluster: {
    kind: "visual",
    visualId: "cluster",
    eyebrow: "Execution & infrastructure",
    intro:
      "A cluster is the working group that carries out private computations together. It is a concrete set of Arx nodes, not just an abstract network label.",
    sections: [
      {
        title: "Why clusters exist",
        body:
          "Arcium does not send every job to every node on the network. Clusters let the system assemble groups with specific trust, performance, and admission properties for different workloads.",
      },
      {
        title: "How to picture it",
        body:
          "Think of a cluster as a team table inside the larger organization. The full network provides the ecosystem, while the cluster is the subset actually collaborating on a given private task.",
      },
    ],
    keyTakeaways: [
      "Clusters are groups of cooperating nodes.",
      "Different clusters can be tuned for different needs.",
      "They are the practical execution layer for computations.",
    ],
    relatedSlugs: ["arx-node", "mxe", "cluster-forking"],
  },
  "cluster-forking": {
    kind: "visual",
    visualId: "cluster-forking",
    eyebrow: "Network operations",
    intro:
      "Cluster forking describes what happens when support inside a cluster splits and a new branch of participation forms around an MXE.",
    sections: [
      {
        title: "Why a fork can happen",
        body:
          "Over time, node operators may make different choices about which workloads or configurations they want to support. Cluster forking is one way the network adapts to that divergence instead of forcing one permanent structure.",
      },
      {
        title: "What to remember",
        body:
          "A fork here is not just drama or failure. It is a structured change in who is participating together, which can affect trust, availability, and the shape of execution going forward.",
      },
    ],
    relatedSlugs: ["cluster", "mxe", "arx-node"],
  },
  manticore: {
    kind: "visual",
    visualId: "protocol-comparison",
    eyebrow: "Privacy & cryptography",
    intro:
      "Manticore is the performance-oriented MPC backend in Arcium. It is meant for cases where faster execution in more trusted settings can be the better tradeoff.",
    sections: [
      {
        title: "What tradeoff it makes",
        body:
          "Manticore gives up some of Cerberus's stronger assumptions in order to move faster. That does not make it 'worse'; it means it is optimized for a different operating environment.",
      },
      {
        title: "How to compare it",
        body:
          "If Cerberus is the stricter, more defensive option, Manticore is the faster, more trust-sensitive option. Reading them together helps clarify that Arcium can support different privacy-performance balances.",
      },
    ],
    relatedSlugs: ["cerberus", "multi-party-computation", "cluster"],
  },
  "multi-party-computation": {
    kind: "visual",
    visualId: "multi-party-computation",
    eyebrow: "Privacy & cryptography",
    intro:
      "Multi-party computation, or MPC, is the core technique behind Arcium's privacy model. It allows multiple participants to compute a result together without revealing their private inputs to one another.",
    sections: [
      {
        title: "Why people care about it",
        body:
          "MPC makes it possible to use sensitive data without putting all of it in one place. That is powerful for applications that need both privacy and useful outcomes.",
      },
      {
        title: "How to explain it simply",
        body:
          "A good beginner framing is 'shared math on hidden pieces.' Each participant contributes part of the process, and the network combines those pieces into a result without exposing the full secret to any one party.",
      },
    ],
    keyTakeaways: [
      "Participants collaborate without sharing raw inputs.",
      "The network reveals a result, not each private secret.",
      "This is the foundation behind many other Arcium concepts.",
    ],
    relatedSlugs: ["secret-sharing", "cerberus", "mxe"],
  },
  mxe: {
    kind: "visual",
    visualId: "mxe",
    eyebrow: "Execution & infrastructure",
    intro:
      "An MXE is the configured environment where Arcium computations are defined and executed. It bundles more than code alone.",
    sections: [
      {
        title: "What it brings together",
        body:
          "An MXE combines the application logic with configuration, onchain metadata, and the cluster context needed to run private workloads. It is the packaging layer that turns logic into a runnable execution environment.",
      },
      {
        title: "Why it matters",
        body:
          "MXEs are one of the key terms that show how Arcium turns abstract privacy ideas into deployable infrastructure. They sit between builder intent and network execution.",
      },
    ],
    relatedSlugs: ["computation-definition", "cluster", "onchain-orchestration"],
  },
  "secret-sharing": {
    kind: "visual",
    visualId: "secret-sharing",
    eyebrow: "Privacy & cryptography",
    intro:
      "Secret sharing is the technique of splitting information into separate pieces so no one holder can reconstruct the original secret alone.",
    sections: [
      {
        title: "Why it is useful",
        body:
          "Splitting a secret across participants removes the need to trust one machine or person with the full value. It is one of the building blocks that makes collaborative private computation possible.",
      },
      {
        title: "How to picture it",
        body:
          "Instead of one locked box, imagine several incomplete key fragments spread across different holders. Useful work can happen when the right pieces cooperate, while no single fragment reveals the full secret on its own.",
      },
    ],
    keyTakeaways: [
      "The original secret is split into separate shares.",
      "One share alone is not enough to reveal the full value.",
      "This is a core mental model for understanding MPC.",
    ],
    relatedSlugs: ["multi-party-computation", "threshold-encryption", "arx-node"],
  },
} satisfies Record<string, GlossaryDetailPage>;

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  {
    id: "network",
    title: "Network & architecture",
    description:
      "High-level Arcium ideas from the docs, explained in plain language.",
  },
  {
    id: "privacy",
    title: "Privacy & cryptography",
    description:
      "How Arcium protects data while still allowing useful computation.",
  },
  {
    id: "execution",
    title: "Execution & infrastructure",
    description:
      "The building blocks Arcium uses to run confidential workloads.",
  },
  {
    id: "operations",
    title: "Network operations",
    description:
      "Terms about reliability, incentives, and how the network stays honest.",
  },
  {
    id: "arcademy",
    title: "Learning on Arcademy",
    description:
      "Platform terms for courses, quizzes, progress, and completion badges.",
  },
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "arcademy",
    term: "Arcademy",
    categoryId: "arcademy",
    definition:
      "A curated learning platform for the Arcium ecosystem. It brings together guided courses, quizzes, progress tracking, and completion badges in one place.",
  },
  {
    slug: "arcis",
    term: "Arcis",
    categoryId: "execution",
    detailPage: DETAIL_PAGES.arcis,
    aliases: ["Arcium developer framework"],
    docsHref: "https://docs.arcium.com/getting-started/architecture-overview",
    imageUrl: architectureImage,
    imageAlt: "Arcium architecture diagram showing Arcis in the stack.",
    definition:
      "Arcis is Arcium's Rust-based developer framework. It gives builders a way to write encrypted application logic that runs through Arcium's MPC system.",
  },
  {
    slug: "arcium",
    term: "Arcium",
    categoryId: "network",
    detailPage: DETAIL_PAGES.arcium,
    docsHref: "https://docs.arcium.com/introduction/basic-concepts",
    imageUrl: architectureImage,
    imageAlt: "Arcium network architecture overview.",
    definition:
      "Arcium is a confidential computing network built around secure multi-party computation. Its goal is to let applications process sensitive data without exposing the raw inputs.",
  },
  {
    slug: "arcium-program",
    term: "Arcium program",
    categoryId: "execution",
    detailPage: DETAIL_PAGES["arcium-program"],
    docsHref: "https://docs.arcium.com/developers/core-concepts",
    imageUrl: architectureImage,
    imageAlt: "Diagram of Arcium program routing computations to clusters.",
    definition:
      "The Arcium program is the onchain coordinator on Solana. It routes work to clusters, manages callbacks, and helps finalize computation results.",
  },
  {
    slug: "arx-node",
    term: "Arx node",
    categoryId: "execution",
    detailPage: DETAIL_PAGES["arx-node"],
    aliases: ["Arx nodes"],
    docsHref: "https://docs.arcium.com/arx-nodes/overview",
    imageUrl: nodeImage,
    imageAlt: "Arx node and node operator relationship diagram.",
    definition:
      "An Arx node is a machine in the Arcium network that takes part in private computations. Each node holds only a piece of the protected data and works with other nodes to produce the final result.",
  },
  {
    slug: "arxos",
    term: "arxOS",
    categoryId: "execution",
    detailPage: DETAIL_PAGES.arxos,
    docsHref: "https://docs.arcium.com/getting-started/architecture-overview",
    imageUrl: architectureImage,
    imageAlt: "Arcium architecture diagram showing arxOS in the stack.",
    definition:
      "arxOS is Arcium's distributed operating system for nodes and clusters. It coordinates the secure execution work happening across the network.",
  },
  {
    slug: "badge",
    term: "Badge",
    categoryId: "arcademy",
    definition:
      "A badge is the recognition you earn for completing a course on Arcademy. It appears in your profile with its own name, description, and artwork.",
  },
  {
    slug: "byzantine-fault-tolerance",
    term: "Byzantine fault tolerance",
    categoryId: "operations",
    detailPage: DETAIL_PAGES["byzantine-fault-tolerance"],
    aliases: ["BFT"],
    docsHref: "https://docs.arcium.com/introduction/basic-concepts#byzantine-fault-tolerance",
    definition:
      "Byzantine fault tolerance means the network can keep working correctly even if some nodes fail or behave maliciously. In practice, it is part of how Arcium stays reliable in a decentralized setting.",
  },
  {
    slug: "cerberus",
    term: "Cerberus",
    categoryId: "privacy",
    detailPage: DETAIL_PAGES.cerberus,
    docsHref: "https://docs.arcium.com/multi-party-execution-environments-mxes/mpc-protocols",
    imageUrl: mpcImage,
    imageAlt: "MPC secret sharing illustration relevant to Cerberus.",
    definition:
      "Cerberus is Arcium's main MPC backend for strong security. It is designed so honest nodes can detect malicious behavior and stop a bad computation.",
  },
  {
    slug: "cluster",
    term: "Cluster",
    categoryId: "execution",
    detailPage: DETAIL_PAGES.cluster,
    docsHref: "https://docs.arcium.com/clusters/overview",
    imageUrl: clustersImage,
    imageAlt: "Diagram of clusters of Arx nodes.",
    definition:
      "A cluster is a group of Arx nodes chosen to execute computations together. Different clusters can have different trust, performance, and admission rules.",
  },
  {
    slug: "cluster-forking",
    term: "Cluster forking",
    categoryId: "operations",
    detailPage: DETAIL_PAGES["cluster-forking"],
    docsHref:
      "https://docs.arcium.com/clusters/cluster-forking-and-migration",
    imageUrl: clusterForkingImage,
    imageAlt: "Diagram comparing cluster forking and migration.",
    definition:
      "Cluster forking happens when nodes in a cluster split support for an MXE and form a new cluster around it. It is one of the ways Arcium adapts when node participation changes.",
  },
  {
    slug: "computation",
    term: "Computation",
    categoryId: "execution",
    detailPage: DETAIL_PAGES.computation,
    docsHref: "https://docs.arcium.com/developers/core-concepts",
    imageUrl: architectureImage,
    imageAlt: "Diagram showing computations routed through the Arcium program.",
    definition:
      "A computation is one specific run of an encrypted instruction. It has its own identifier, lifecycle, and result, even if the same instruction is run many times.",
  },
  {
    slug: "computation-customer",
    term: "Computation Customer",
    categoryId: "network",
    docsHref:
      "https://docs.arcium.com/getting-started/network-stakeholders#computation-customers",
    definition:
      "A Computation Customer is the party that buys confidential computing services from Arcium. They create MXEs and pay for secure computations to run.",
  },
  {
    slug: "computation-definition",
    term: "Computation definition",
    categoryId: "execution",
    detailPage: DETAIL_PAGES["computation-definition"],
    docsHref: "https://docs.arcium.com/developers/core-concepts",
    definition:
      "A computation definition is the onchain record of compiled MPC bytecode for one encrypted instruction. It is created once and reused when that instruction is invoked.",
  },
  {
    slug: "confidential-computing",
    term: "Confidential computing",
    categoryId: "network",
    detailPage: DETAIL_PAGES["confidential-computing"],
    docsHref:
      "https://docs.arcium.com/getting-started/architecture-overview",
    imageUrl: keyFeaturesImage,
    imageAlt: "Arcium key features illustration for confidential computing.",
    definition:
      "Confidential computing means processing sensitive information without exposing the data itself. Arcium uses it as the core promise behind private onchain applications.",
  },
  {
    slug: "course",
    term: "Course",
    categoryId: "arcademy",
    definition:
      "A course is a structured learning path made up of lessons and usually a final quiz. Each course focuses on one ecosystem product or topic.",
  },
  {
    slug: "encrypted-instruction",
    term: "Encrypted instruction",
    categoryId: "execution",
    detailPage: DETAIL_PAGES["encrypted-instruction"],
    docsHref: "https://docs.arcium.com/developers/core-concepts",
    definition:
      "An encrypted instruction is the business logic a developer writes in Arcis for private execution. It runs through MPC on encrypted data instead of on plain text inputs.",
  },
  {
    slug: "encrypted-supercomputer",
    term: "Encrypted supercomputer",
    categoryId: "network",
    detailPage: DETAIL_PAGES["encrypted-supercomputer"],
    docsHref: "https://docs.arcium.com/introduction/basic-concepts",
    imageUrl: architectureImage,
    imageAlt: "Arcium architecture described as an encrypted supercomputer.",
    definition:
      "Arcium describes its network as an encrypted supercomputer. The idea is that many nodes act together like one secure system for running confidential workloads.",
  },
  {
    slug: "epoch",
    term: "Epoch",
    categoryId: "operations",
    docsHref: "https://docs.arcium.com/staking/overview",
    definition:
      "An epoch is a fixed time window used by the network for scheduling work, activating stake, and distributing rewards. Many operational changes take effect at epoch boundaries.",
  },
  {
    slug: "learning-path",
    term: "Learning path",
    categoryId: "arcademy",
    definition:
      "A learning path is a recommended sequence of courses. It helps new learners move through topics in a practical order instead of choosing courses one by one.",
  },
  {
    slug: "lesson",
    term: "Lesson",
    categoryId: "arcademy",
    definition:
      "A lesson is one unit inside a course. Lessons are usually completed in order when you are working through a guided program.",
  },
  {
    slug: "manticore",
    term: "Manticore",
    categoryId: "privacy",
    detailPage: DETAIL_PAGES.manticore,
    docsHref: "https://docs.arcium.com/multi-party-execution-environments-mxes/mpc-protocols",
    imageUrl: mpcImage,
    imageAlt: "MPC illustration relevant to Manticore protocol tradeoffs.",
    definition:
      "Manticore is an Arcium MPC backend optimized for faster execution in trusted operator settings. It trades some of Cerberus's stronger guarantees for higher performance on demanding workloads.",
  },
  {
    slug: "multi-party-computation",
    term: "Multi-party computation",
    categoryId: "privacy",
    detailPage: DETAIL_PAGES["multi-party-computation"],
    aliases: ["MPC"],
    docsHref: "https://docs.arcium.com/introduction/basic-concepts#multi-party-computation-mpc",
    imageUrl: mpcImage,
    imageAlt: "Illustration of MPC secret sharing.",
    definition:
      "Multi-party computation is the cryptographic method that lets multiple parties compute on data together without revealing their private inputs to one another.",
  },
  {
    slug: "mxe",
    term: "MXE",
    categoryId: "execution",
    detailPage: DETAIL_PAGES.mxe,
    aliases: ["MPC eXecution Environment", "MPC Execution Environment"],
    docsHref:
      "https://docs.arcium.com/multi-party-execution-environments-mxes/overview",
    imageUrl: mxeImage,
    imageAlt: "Arcium MXE architecture diagram.",
    definition:
      "An MXE is the configurable environment where Arcium computations are defined and run. It combines application logic, onchain metadata, and cluster selection for secure execution.",
  },
  {
    slug: "onchain-orchestration",
    term: "Onchain orchestration",
    categoryId: "network",
    detailPage: DETAIL_PAGES["onchain-orchestration"],
    aliases: ["Solana integration"],
    docsHref:
      "https://docs.arcium.com/getting-started/architecture-overview",
    imageUrl: architectureImage,
    imageAlt: "Arcium architecture diagram with Solana as the coordination layer.",
    definition:
      "Onchain orchestration means Solana coordinates how computations are scheduled, finalized, and rewarded. It gives the network a shared source of truth for execution.",
  },
  {
    slug: "progress",
    term: "Progress",
    categoryId: "arcademy",
    definition:
      "Progress is the record of which lessons you have completed. On Arcademy it is saved to your account after you connect a wallet.",
  },
  {
    slug: "quiz",
    term: "Quiz",
    categoryId: "arcademy",
    definition:
      "A quiz is a short assessment used to check what you learned. Passing it, along with finishing the required lessons, is part of completing a course.",
  },
  {
    slug: "secret-sharing",
    term: "Secret sharing",
    categoryId: "privacy",
    detailPage: DETAIL_PAGES["secret-sharing"],
    docsHref:
      "https://docs.arcium.com/developers/arcis/mental-model#how-secret-sharing-works",
    imageUrl: mpcImage,
    imageAlt: "Diagram showing a secret split into shares.",
    definition:
      "Secret sharing is the technique of splitting data into separate pieces that are distributed across nodes. No single node can reconstruct the original secret on its own.",
  },
  {
    slug: "slashing",
    term: "Slashing",
    categoryId: "operations",
    docsHref: "https://docs.arcium.com/introduction/basic-concepts",
    definition:
      "Slashing is the penalty applied when a node breaks network rules or behaves dishonestly. It is part of the incentive system that pushes participants to operate correctly.",
  },
  {
    slug: "staking",
    term: "Staking",
    categoryId: "operations",
    docsHref: "https://docs.arcium.com/staking/overview",
    definition:
      "Staking is the collateral nodes and delegators commit to participate in the network and earn rewards. It also gives the protocol a way to enforce consequences for bad behavior.",
  },
  {
    slug: "threshold-encryption",
    term: "Threshold encryption",
    categoryId: "privacy",
    detailPage: DETAIL_PAGES["threshold-encryption"],
    docsHref: "https://docs.arcium.com/introduction/basic-concepts#multi-party-computation-mpc",
    definition:
      "Threshold encryption is a way to protect data so that decryption only works when enough authorized participants cooperate. In Arcium, it helps keep sensitive inputs protected during collaborative computation.",
  },
  {
    slug: "trusted-execution-environment",
    term: "Trusted Execution Environment",
    categoryId: "privacy",
    detailPage: DETAIL_PAGES["trusted-execution-environment"],
    aliases: ["TEE", "Trusted Execution Environments"],
    docsHref:
      "https://docs.arcium.com/multi-party-execution-environments-mxes/mxe-encryption#side-channel-attack-resistance",
    definition:
      "A Trusted Execution Environment is a hardware-based approach to protecting computation. Arcium references TEEs mainly as a comparison point when explaining why its MPC model avoids some hardware trust assumptions.",
  },
  {
    slug: "trustless-execution",
    term: "Trustless execution",
    categoryId: "operations",
    detailPage: DETAIL_PAGES["trustless-execution"],
    docsHref: "https://docs.arcium.com/introduction/basic-concepts",
    definition:
      "Trustless execution means users do not need to rely on one central operator to believe a computation was handled correctly. Instead, cryptography and network rules provide the guarantees.",
  },
  {
    slug: "wallet",
    term: "Wallet",
    categoryId: "arcademy",
    definition:
      "A wallet is your Solana wallet address. On Arcademy you connect it to save progress, take quizzes, and receive badges, while public browsing stays open to everyone.",
  },
];

export function sortGlossaryTerms(terms: GlossaryTerm[]): GlossaryTerm[] {
  return [...terms].sort((a, b) =>
    a.term.localeCompare(b.term, "en", { sensitivity: "base" })
  );
}

export function getGlossaryLetter(term: GlossaryTerm | string): string {
  const value = typeof term === "string" ? term : term.term;
  const letter = value.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : "#";
}

export function getGlossaryLetters(terms: GlossaryTerm[]): string[] {
  return Array.from(new Set(sortGlossaryTerms(terms).map(getGlossaryLetter)));
}

export function groupGlossaryTermsByLetter(
  terms: GlossaryTerm[]
): GlossaryLetterGroup[] {
  const groups = new Map<string, GlossaryTerm[]>();

  for (const term of sortGlossaryTerms(terms)) {
    const letter = getGlossaryLetter(term);
    const group = groups.get(letter);
    if (group) {
      group.push(term);
    } else {
      groups.set(letter, [term]);
    }
  }

  return Array.from(groups.entries()).map(([letter, groupedTerms]) => ({
    letter,
    terms: groupedTerms,
  }));
}

export function getGlossaryTermsByCategory(
  terms: GlossaryTerm[] = GLOSSARY_TERMS
): Array<GlossaryCategory & { terms: GlossaryTerm[] }> {
  const sorted = sortGlossaryTerms(terms);
  return GLOSSARY_CATEGORIES.map((category) => ({
    ...category,
    terms: sorted.filter((term) => term.categoryId === category.id),
  })).filter((category) => category.terms.length > 0);
}

export function getGlossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((term) => term.slug === slug);
}

export function hasGlossaryDetailPage(term: GlossaryTerm): boolean {
  return Boolean(term.detailPage);
}

export function getGlossaryDetailTerms(): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter(hasGlossaryDetailPage);
}

export function getGlossaryRelatedTerms(term: GlossaryTerm): GlossaryTerm[] {
  const relatedSlugs = term.detailPage?.relatedSlugs ?? [];
  return relatedSlugs
    .map((slug) => getGlossaryTermBySlug(slug))
    .filter((related): related is GlossaryTerm => Boolean(related));
}
