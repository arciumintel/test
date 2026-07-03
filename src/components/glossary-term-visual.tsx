"use client";

import { cn } from "@/lib/utils";

type GlossaryTermVisualProps = {
  visualId:
    | "multi-party-computation"
    | "secret-sharing"
    | "cluster"
    | "mxe"
    | "protocol-comparison"
    | "cluster-forking";
  activeSlug?: string;
  className?: string;
};

function VisualFrame({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2rem] border bg-card shadow-sm",
        className
      )}
    >
      <div className="border-b bg-muted/20 px-5 py-4 sm:px-6">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function NetworkNode({
  x,
  y,
  label,
  accent = false,
}: {
  x: number;
  y: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="28"
        fill={accent ? "currentColor" : "transparent"}
        opacity={accent ? 0.14 : 1}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fill="currentColor"
      >
        {label}
      </text>
    </g>
  );
}

function MultiPartyComputationVisual() {
  return (
    <VisualFrame
      title="How MPC works"
      subtitle="Each party keeps its own input private. The network collaborates on the math and reveals only the final result."
    >
      <svg viewBox="0 0 620 280" className="w-full text-primary">
        <rect
          x="220"
          y="86"
          width="180"
          height="108"
          rx="24"
          fill="currentColor"
          opacity="0.08"
          stroke="currentColor"
        />
        <text x="310" y="128" textAnchor="middle" fontSize="18" fill="currentColor">
          Shared computation
        </text>
        <text x="310" y="152" textAnchor="middle" fontSize="12" fill="currentColor">
          Hidden pieces go in
        </text>
        <text x="310" y="170" textAnchor="middle" fontSize="12" fill="currentColor">
          One result comes out
        </text>

        <NetworkNode x={110} y={76} label="Input A" />
        <NetworkNode x={110} y={204} label="Input B" />
        <NetworkNode x={510} y={140} label="Result" accent />

        <path
          d="M138 76 C176 76 188 106 220 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d="M138 204 C176 204 188 176 220 160"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d="M400 140 C438 140 458 140 482 140"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </VisualFrame>
  );
}

function SecretSharingVisual() {
  return (
    <VisualFrame
      title="How secret sharing works"
      subtitle="One secret is split into incomplete shares. No single holder can reconstruct the original value alone."
    >
      <svg viewBox="0 0 620 300" className="w-full text-primary">
        <rect
          x="42"
          y="118"
          width="140"
          height="64"
          rx="20"
          fill="currentColor"
          opacity="0.08"
          stroke="currentColor"
        />
        <text x="112" y="156" textAnchor="middle" fontSize="18" fill="currentColor">
          Secret
        </text>

        <NetworkNode x={310} y={70} label="Share 1" />
        <NetworkNode x={310} y={150} label="Share 2" />
        <NetworkNode x={310} y={230} label="Share 3" />
        <rect
          x="446"
          y="118"
          width="132"
          height="64"
          rx="20"
          fill="currentColor"
          opacity="0.08"
          stroke="currentColor"
        />
        <text x="512" y="145" textAnchor="middle" fontSize="16" fill="currentColor">
          Recombine
        </text>
        <text x="512" y="166" textAnchor="middle" fontSize="12" fill="currentColor">
          when enough shares cooperate
        </text>

        <path d="M182 150 H248" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M182 150 C232 150 246 96 282 80" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M182 150 C232 150 246 204 282 220" fill="none" stroke="currentColor" strokeWidth="2" />

        <path d="M338 70 H446" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        <path d="M338 150 H446" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        <path d="M338 230 H446" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
      </svg>
    </VisualFrame>
  );
}

function ClusterVisual() {
  return (
    <VisualFrame
      title="How a cluster fits the network"
      subtitle="The network contains many nodes. A cluster is the smaller working group selected to handle a given private workload."
    >
      <svg viewBox="0 0 620 300" className="w-full text-primary">
        <rect
          x="50"
          y="40"
          width="520"
          height="220"
          rx="28"
          fill="currentColor"
          opacity="0.04"
          stroke="currentColor"
        />
        <circle cx="212" cy="150" r="92" fill="currentColor" opacity="0.08" />
        <circle cx="212" cy="150" r="92" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="212" y="46" textAnchor="middle" fontSize="14" fill="currentColor">
          Active cluster
        </text>
        <NetworkNode x={150} y={112} label="Node" />
        <NetworkNode x={212} y={86} label="Node" accent />
        <NetworkNode x={272} y={116} label="Node" />
        <NetworkNode x={160} y={192} label="Node" />
        <NetworkNode x={252} y={202} label="Node" />

        <NetworkNode x={416} y={88} label="Node" />
        <NetworkNode x={482} y={126} label="Node" />
        <NetworkNode x={450} y={202} label="Node" />
        <text x="450" y="244" textAnchor="middle" fontSize="13" fill="currentColor">
          Same network, not this workload
        </text>
      </svg>
    </VisualFrame>
  );
}

function MxeVisual() {
  return (
    <VisualFrame
      title="What an MXE packages together"
      subtitle="An MXE combines logic, configuration, cluster selection, and execution rules into one runnable private environment."
    >
      <svg viewBox="0 0 620 300" className="w-full text-primary">
        <rect x="210" y="70" width="200" height="160" rx="28" fill="currentColor" opacity="0.08" stroke="currentColor" />
        <text x="310" y="108" textAnchor="middle" fontSize="20" fill="currentColor">
          MXE
        </text>
        <text x="310" y="132" textAnchor="middle" fontSize="12" fill="currentColor">
          runnable private environment
        </text>

        <rect x="52" y="88" width="108" height="48" rx="16" fill="none" stroke="currentColor" />
        <text x="106" y="117" textAnchor="middle" fontSize="14" fill="currentColor">
          Logic
        </text>
        <rect x="52" y="168" width="108" height="48" rx="16" fill="none" stroke="currentColor" />
        <text x="106" y="197" textAnchor="middle" fontSize="14" fill="currentColor">
          Rules
        </text>
        <rect x="460" y="88" width="108" height="48" rx="16" fill="none" stroke="currentColor" />
        <text x="514" y="117" textAnchor="middle" fontSize="14" fill="currentColor">
          Cluster
        </text>
        <rect x="460" y="168" width="108" height="48" rx="16" fill="none" stroke="currentColor" />
        <text x="514" y="197" textAnchor="middle" fontSize="14" fill="currentColor">
          Metadata
        </text>

        <path d="M160 112 H210" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M160 192 H210" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M410 112 H460" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M410 192 H460" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </VisualFrame>
  );
}

function ProtocolComparisonVisual({ activeSlug }: { activeSlug?: string }) {
  const cerberusActive = activeSlug === "cerberus";
  const manticoreActive = activeSlug === "manticore";

  return (
    <VisualFrame
      title="Two protocol tradeoffs"
      subtitle="Cerberus leans harder toward adversarial safety. Manticore leans harder toward performance in more trusted settings."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className={cn(
            "rounded-[1.5rem] border p-5",
            cerberusActive && "border-primary bg-primary/[0.05]"
          )}
        >
          <p className="text-lg font-semibold tracking-tight text-foreground">Cerberus</p>
          <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start justify-between gap-4">
              <dt>Security emphasis</dt>
              <dd className="font-medium text-foreground">Higher</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>Trust assumptions</dt>
              <dd className="font-medium text-foreground">Stricter</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>Typical tradeoff</dt>
              <dd className="font-medium text-foreground">More overhead</dd>
            </div>
          </dl>
        </div>

        <div
          className={cn(
            "rounded-[1.5rem] border p-5",
            manticoreActive && "border-primary bg-primary/[0.05]"
          )}
        >
          <p className="text-lg font-semibold tracking-tight text-foreground">Manticore</p>
          <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start justify-between gap-4">
              <dt>Performance emphasis</dt>
              <dd className="font-medium text-foreground">Higher</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>Trust assumptions</dt>
              <dd className="font-medium text-foreground">More relaxed</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>Typical tradeoff</dt>
              <dd className="font-medium text-foreground">Less protection</dd>
            </div>
          </dl>
        </div>
      </div>
    </VisualFrame>
  );
}

function ClusterForkingVisual() {
  return (
    <VisualFrame
      title="What cluster forking looks like"
      subtitle="One group of nodes can split into two supported paths when operator choices diverge around an execution environment."
    >
      <svg viewBox="0 0 620 280" className="w-full text-primary">
        <circle cx="170" cy="140" r="78" fill="currentColor" opacity="0.08" />
        <circle cx="170" cy="140" r="78" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="170" y="138" textAnchor="middle" fontSize="18" fill="currentColor">
          One cluster
        </text>
        <text x="170" y="160" textAnchor="middle" fontSize="12" fill="currentColor">
          shared support
        </text>

        <path d="M248 140 H326" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 6" />

        <circle cx="430" cy="96" r="58" fill="currentColor" opacity="0.08" />
        <circle cx="430" cy="96" r="58" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="430" cy="188" r="58" fill="currentColor" opacity="0.04" />
        <circle cx="430" cy="188" r="58" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="430" y="92" textAnchor="middle" fontSize="16" fill="currentColor">
          Branch A
        </text>
        <text x="430" y="111" textAnchor="middle" fontSize="11" fill="currentColor">
          supports one path
        </text>
        <text x="430" y="184" textAnchor="middle" fontSize="16" fill="currentColor">
          Branch B
        </text>
        <text x="430" y="203" textAnchor="middle" fontSize="11" fill="currentColor">
          supports another
        </text>
      </svg>
    </VisualFrame>
  );
}

export function GlossaryTermVisual({
  visualId,
  activeSlug,
  className,
}: GlossaryTermVisualProps) {
  const visual = (() => {
    switch (visualId) {
      case "multi-party-computation":
        return <MultiPartyComputationVisual />;
      case "secret-sharing":
        return <SecretSharingVisual />;
      case "cluster":
        return <ClusterVisual />;
      case "mxe":
        return <MxeVisual />;
      case "protocol-comparison":
        return <ProtocolComparisonVisual activeSlug={activeSlug} />;
      case "cluster-forking":
        return <ClusterForkingVisual />;
      default:
        return null;
    }
  })();

  if (!visual) return null;
  return <div className={className}>{visual}</div>;
}
