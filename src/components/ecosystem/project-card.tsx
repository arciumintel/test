"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  ExternalLink,
  FileText,
  Globe,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCategoryLabel,
  getRelationshipsFor,
} from "@/lib/ecosystem";
import type { EcosystemProject } from "@/lib/ecosystem/types";
import {
  RELATIONSHIP_LABELS,
  STATUS_LABELS,
} from "@/lib/ecosystem/types";
import { productPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: EcosystemProject;
  compact?: boolean;
  className?: string;
  onSelectRelated?: (projectId: string) => void;
  allProjects?: EcosystemProject[];
};

function ProjectLogo({
  project,
  size = "md",
}: {
  project: EcosystemProject;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "size-14 text-lg" : size === "sm" ? "size-8 text-xs" : "size-11 text-sm";

  if (project.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={project.logoUrl}
        alt=""
        className={cn("rounded-xl object-cover", sizeClass)}
      />
    );
  }

  const initials = project.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary",
        sizeClass
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: EcosystemProject["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium",
        status === "mainnet" && "border-success/40 text-success",
        status === "testnet" && "border-info/40 text-info",
        status === "coming_soon" && "border-warning/40 text-warning"
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function LinkButton({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Icon className="size-4" aria-hidden />
        {label}
        <ExternalLink className="size-3.5 opacity-60" aria-hidden />
      </a>
    </Button>
  );
}

export function ProjectCard({
  project,
  compact = false,
  className,
  onSelectRelated,
  allProjects,
}: ProjectCardProps) {
  const relationships = getRelationshipsFor(project, allProjects ?? []);

  return (
    <article
      className={cn(
        "eco-glass rounded-xl border p-5 shadow-sm",
        compact ? "space-y-3" : "space-y-4",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <ProjectLogo project={project} size={compact ? "sm" : "md"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
            {project.featured ? (
              <Badge className="rounded-full bg-primary/15 text-primary">
                <Sparkles className="mr-1 size-3" aria-hidden />
                Featured
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{project.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full">
              {getCategoryLabel(project.categoryId)}
            </Badge>
            <StatusBadge status={project.status} />
          </div>
        </div>
      </div>

      {!compact ? (
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      ) : null}

      {project.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {project.links.website ? (
          <LinkButton href={project.links.website} label="Website" icon={Globe} />
        ) : null}
        {project.links.docs ? (
          <LinkButton href={project.links.docs} label="Docs" icon={FileText} />
        ) : null}
        {project.links.github ? (
          <LinkButton href={project.links.github} label="GitHub" icon={Code2} />
        ) : null}
        {project.links.twitter ? (
          <LinkButton href={project.links.twitter} label="X" icon={ExternalLink} />
        ) : null}
        {project.learningSurface?.available ? (
          <Button variant="default" size="sm" asChild>
            <Link href={productPath(project.learningSurface.slug)}>
              <BookOpen className="size-4" aria-hidden />
              View courses on Arcademy
            </Link>
          </Button>
        ) : null}
      </div>

      {relationships.length > 0 && !compact ? (
        <div className="border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Connected projects
          </p>
          <ul className="mt-2 space-y-2">
            {relationships.map((relationship) => (
              <li key={`${relationship.targetId}-${relationship.type}`}>
                <button
                  type="button"
                  onClick={() => onSelectRelated?.(relationship.target.id)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  <span className="font-medium">{relationship.target.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {RELATIONSHIP_LABELS[relationship.type]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export { ProjectLogo, StatusBadge };
