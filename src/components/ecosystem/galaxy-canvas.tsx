"use client";

import * as React from "react";
import {
  computeCategoryFocusTransform,
  computeGalaxyLayout,
  computeSearchFocusTransform,
  ECOSYSTEM_CATEGORIES,
  getBidirectionalRelationships,
} from "@/lib/ecosystem";
import type { GalaxyLayout, GalaxyNode } from "@/lib/ecosystem/types";
import {
  useEcosystemExplorerStore,
  useEcosystemExplorerStoreApi,
} from "@/stores/ecosystem-explorer";

type ThemeColors = {
  primary: string;
  primaryRgb: [number, number, number];
  foreground: string;
  muted: string;
  background: string;
  inverse: string;
  featured: string;
  info: string;
  success: string;
  warning: string;
  destructive: string;
};

function parseCssColor(value: string): [number, number, number] {
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;
    const int = Number.parseInt(normalized, 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  }
  return [0, 0, 0];
}

function readThemeColors(): ThemeColors {
  if (typeof window === "undefined") {
    return {
      primary: "currentColor",
      primaryRgb: [0, 0, 0],
      foreground: "CanvasText",
      muted: "GrayText",
      background: "Canvas",
      inverse: "Canvas",
      featured: "currentColor",
      info: "currentColor",
      success: "currentColor",
      warning: "currentColor",
      destructive: "currentColor",
    };
  }

  const styles = getComputedStyle(document.documentElement);
  const primary =
    styles.getPropertyValue("--accent-primary").trim() ||
    styles.getPropertyValue("--primary").trim();
  const foreground =
    styles.getPropertyValue("--text-primary").trim() ||
    styles.getPropertyValue("--foreground").trim();
  const muted =
    styles.getPropertyValue("--text-muted").trim() ||
    styles.getPropertyValue("--muted-foreground").trim();
  const background =
    styles.getPropertyValue("--bg-primary").trim() ||
    styles.getPropertyValue("--background").trim();
  const inverse =
    styles.getPropertyValue("--text-inverse").trim() ||
    styles.getPropertyValue("--primary-foreground").trim() ||
    foreground;

  return {
    primary,
    primaryRgb: parseCssColor(primary),
    foreground,
    muted,
    background,
    inverse,
    featured:
      styles.getPropertyValue("--featured").trim() ||
      styles.getPropertyValue("--accent-premium").trim() ||
      primary,
    info:
      styles.getPropertyValue("--status-info").trim() ||
      styles.getPropertyValue("--info").trim() ||
      primary,
    success:
      styles.getPropertyValue("--status-success").trim() ||
      styles.getPropertyValue("--success").trim() ||
      primary,
    warning:
      styles.getPropertyValue("--status-warning").trim() ||
      styles.getPropertyValue("--warning").trim() ||
      primary,
    destructive:
      styles.getPropertyValue("--status-danger").trim() ||
      styles.getPropertyValue("--destructive").trim() ||
      primary,
  };
}

function statusColor(status: string, colors: ThemeColors): string {
  if (status === "mainnet") return colors.success;
  if (status === "testnet") return colors.info;
  if (status === "experimental") return colors.featured;
  if (status === "deprecated") return colors.destructive;
  return colors.warning;
}

function projectInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AnimatedNode = GalaxyNode & {
  renderX: number;
  renderY: number;
};

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

type GalaxyCanvasProps = {
  className?: string;
};

export function GalaxyCanvas({ className }: GalaxyCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const layoutRef = React.useRef<GalaxyLayout | null>(null);
  const animatedNodesRef = React.useRef<AnimatedNode[]>([]);
  const frameRef = React.useRef<number | null>(null);
  const timeRef = React.useRef(0);
  const transformRef = React.useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const targetTransformRef = React.useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const colorsRef = React.useRef<ThemeColors>(readThemeColors());

  const filteredProjects = useEcosystemExplorerStore((state) => state.filteredProjects);
  const allProjects = useEcosystemExplorerStore((state) => state.allProjects);
  const getProjectById = useEcosystemExplorerStore((state) => state.getProjectById);
  const storeApi = useEcosystemExplorerStoreApi();
  const filteredIds = React.useMemo(
    () => new Set(filteredProjects.map((project) => project.id)),
    [filteredProjects]
  );
  const query = useEcosystemExplorerStore((state) => state.query);
  const viewLevel = useEcosystemExplorerStore((state) => state.viewLevel);
  const focusedCategoryId = useEcosystemExplorerStore(
    (state) => state.focusedCategoryId
  );
  const selectedProjectId = useEcosystemExplorerStore(
    (state) => state.selectedProjectId
  );
  const hoveredProjectId = useEcosystemExplorerStore(
    (state) => state.hoveredProjectId
  );
  const hoveredCategoryId = useEcosystemExplorerStore(
    (state) => state.hoveredCategoryId
  );
  const reducedMotion = useEcosystemExplorerStore((state) => state.reducedMotion);
  const selectProject = useEcosystemExplorerStore((state) => state.selectProject);
  const focusCategory = useEcosystemExplorerStore((state) => state.focusCategory);
  const hoverProject = useEcosystemExplorerStore((state) => state.hoverProject);
  const hoverCategory = useEcosystemExplorerStore((state) => state.hoverCategory);

  const [viewport, setViewport] = React.useState({ width: 800, height: 600 });

  React.useEffect(() => {
    colorsRef.current = readThemeColors();
  }, []);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewport({
        width: Math.max(320, Math.floor(width)),
        height: Math.max(320, Math.floor(height)),
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    layoutRef.current = computeGalaxyLayout(
      allProjects,
      ECOSYSTEM_CATEGORIES,
      viewport
    );
    animatedNodesRef.current = layoutRef.current.nodes.map((node) => ({
      ...node,
      renderX: node.baseX,
      renderY: node.baseY,
    }));
  }, [allProjects, viewport]);

  React.useEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return;

    if (selectedProjectId && query.trim()) {
      targetTransformRef.current = computeSearchFocusTransform(
        layout,
        selectedProjectId,
        viewport
      );
    } else if (query.trim() && filteredProjects[0]) {
      targetTransformRef.current = computeSearchFocusTransform(
        layout,
        filteredProjects[0].id,
        viewport
      );
    } else if (viewLevel === "category" && focusedCategoryId) {
      targetTransformRef.current = computeCategoryFocusTransform(
        layout,
        focusedCategoryId,
        viewport
      );
    } else if (selectedProjectId) {
      targetTransformRef.current = computeSearchFocusTransform(
        layout,
        selectedProjectId,
        viewport
      );
    } else {
      targetTransformRef.current = { scale: 1, offsetX: 0, offsetY: 0 };
    }
  }, [
    focusedCategoryId,
    filteredProjects,
    query,
    selectedProjectId,
    viewLevel,
    viewport,
  ]);

  const draw = React.useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      const layout = layoutRef.current;
      if (!canvas || !layout) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const { width, height } = viewport;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!reducedMotion) {
        timeRef.current = timestamp * 0.001;
      }

      const colors = colorsRef.current;
      const transform = transformRef.current;
      const target = targetTransformRef.current;
      const lerpAmount = reducedMotion ? 1 : 0.08;
      transform.scale = lerp(transform.scale, target.scale, lerpAmount);
      transform.offsetX = lerp(transform.offsetX, target.offsetX, lerpAmount);
      transform.offsetY = lerp(transform.offsetY, target.offsetY, lerpAmount);

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        layout.core.x,
        layout.core.y,
        20,
        layout.core.x,
        layout.core.y,
        layout.hubRingRadius + 120
      );
      gradient.addColorStop(0, `rgba(${colors.primaryRgb.join(",")}, 0.12)`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(transform.offsetX, transform.offsetY);
      ctx.scale(transform.scale, transform.scale);

      const pulse = reducedMotion
        ? 1
        : 1 + Math.sin(timeRef.current * 1.5) * 0.04;
      const coreRadius = layout.core.radius * pulse;

      const coreGlow = ctx.createRadialGradient(
        layout.core.x,
        layout.core.y,
        coreRadius * 0.2,
        layout.core.x,
        layout.core.y,
        coreRadius * 2.4
      );
      coreGlow.addColorStop(0, `rgba(${colors.primaryRgb.join(",")}, 0.55)`);
      coreGlow.addColorStop(0.45, `rgba(${colors.primaryRgb.join(",")}, 0.18)`);
      coreGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(layout.core.x, layout.core.y, coreRadius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.primary;
      ctx.beginPath();
      ctx.arc(layout.core.x, layout.core.y, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.inverse;
      ctx.font = "600 13px var(--font-geist-sans), system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Arcium", layout.core.x, layout.core.y);

      for (const hub of layout.hubs) {
        const hubPulse = reducedMotion
          ? 1
          : 1 + Math.sin(timeRef.current * 2 + hub.angle) * 0.05;
        const isHovered = hoveredCategoryId === hub.categoryId;
        const isFocused = focusedCategoryId === hub.categoryId;

        ctx.strokeStyle = `rgba(${colors.primaryRgb.join(",")}, ${
          isHovered || isFocused ? 0.45 : 0.2
        })`;
        ctx.lineWidth = isHovered || isFocused ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(layout.core.x, layout.core.y);
        ctx.lineTo(hub.x, hub.y);
        ctx.stroke();

        const hubGlow = ctx.createRadialGradient(
          hub.x,
          hub.y,
          4,
          hub.x,
          hub.y,
          hub.radius * hubPulse * 2
        );
        hubGlow.addColorStop(0, `rgba(${colors.primaryRgb.join(",")}, 0.35)`);
        hubGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = hubGlow;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.radius * hubPulse * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${colors.primaryRgb.join(",")}, 0.85)`;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.radius * hubPulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.inverse;
        ctx.font = "500 11px var(--font-geist-sans), system-ui, sans-serif";
        ctx.fillText(hub.label, hub.x, hub.y);
      }

      const connectionFocusId = hoveredProjectId ?? selectedProjectId;
      if (connectionFocusId) {
        const focusProject = getProjectById(connectionFocusId);
        const focusNode = layout.nodes.find(
          (node) => node.projectId === connectionFocusId
        );
        if (focusProject && focusNode) {
          const edges = getBidirectionalRelationships(
            connectionFocusId,
            allProjects
          );
          for (const edge of edges) {
            const otherId =
              edge.source.id === connectionFocusId
                ? edge.target.id
                : edge.source.id;
            if (!filteredIds.has(otherId)) continue;
            const otherNode = layout.nodes.find(
              (node) => node.projectId === otherId
            );
            if (!otherNode) continue;

            const animatedFocus = animatedNodesRef.current.find(
              (node) => node.projectId === connectionFocusId
            );
            const animatedOther = animatedNodesRef.current.find(
              (node) => node.projectId === otherId
            );
            if (!animatedFocus || !animatedOther) continue;

            ctx.strokeStyle = `rgba(${colors.primaryRgb.join(",")}, 0.55)`;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = `rgba(${colors.primaryRgb.join(",")}, 0.45)`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(animatedFocus.renderX, animatedFocus.renderY);
            ctx.lineTo(animatedOther.renderX, animatedOther.renderY);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }

      animatedNodesRef.current = layout.nodes.map((node) => {
        const driftRadius = reducedMotion ? 0 : 4;
        const driftSpeed = 0.6 + node.driftPhase;
        const offsetX =
          driftRadius * Math.cos(timeRef.current * driftSpeed + node.driftPhase * 6);
        const offsetY =
          driftRadius * Math.sin(timeRef.current * driftSpeed + node.driftPhase * 6);

        return {
          ...node,
          renderX: node.baseX + offsetX,
          renderY: node.baseY + offsetY,
        };
      });

      for (const node of animatedNodesRef.current) {
        const project = getProjectById(node.projectId);
        if (!project) continue;

        const visible = filteredIds.has(project.id);
        const inFocusedCategory =
          !focusedCategoryId || project.categoryId === focusedCategoryId;
        const dimmed = !visible || (focusedCategoryId ? !inFocusedCategory : false);
        const highlighted =
          hoveredProjectId === project.id ||
          selectedProjectId === project.id ||
          (query.trim() !== "" && visible);

        const alpha = dimmed ? 0.18 : highlighted ? 1 : 0.82;
        const radius = node.radius * (highlighted ? 1.15 : 1);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = statusColor(project.status, colors);
        ctx.beginPath();
        ctx.arc(node.renderX, node.renderY, radius, 0, Math.PI * 2);
        ctx.fill();

        if (highlighted) {
          ctx.strokeStyle = colors.primary;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = colors.inverse;
        ctx.font = "600 9px var(--font-geist-sans), system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(projectInitials(project.name), node.renderX, node.renderY);

        if (highlighted || viewLevel !== "ecosystem") {
          ctx.fillStyle = colors.foreground;
          ctx.font = "500 10px var(--font-geist-sans), system-ui, sans-serif";
          ctx.textBaseline = "top";
          ctx.fillText(project.name, node.renderX, node.renderY + radius + 6);
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    },
    [
      filteredIds,
      focusedCategoryId,
      hoveredCategoryId,
      hoveredProjectId,
      query,
      reducedMotion,
      selectedProjectId,
      viewLevel,
      viewport,
    ]
  );

  React.useEffect(() => {
    if (reducedMotion) {
      draw(0);
      return;
    }

    let running = true;
    const loop = (timestamp: number) => {
      if (!running) return;
      draw(timestamp);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [draw, reducedMotion]);

  function screenToWorld(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const transform = transformRef.current;

    return {
      x: (x - transform.offsetX) / transform.scale,
      y: (y - transform.offsetY) / transform.scale,
    };
  }

  function hitTest(clientX: number, clientY: number) {
    const point = screenToWorld(clientX, clientY);
    const layout = layoutRef.current;
    if (!point || !layout) return null;

    for (const node of animatedNodesRef.current) {
      if (!filteredIds.has(node.projectId)) continue;
      const dx = point.x - node.renderX;
      const dy = point.y - node.renderY;
      if (Math.hypot(dx, dy) <= node.radius + 6) {
        return { type: "project" as const, id: node.projectId };
      }
    }

    for (const hub of layout.hubs) {
      const dx = point.x - hub.x;
      const dy = point.y - hub.y;
      if (Math.hypot(dx, dy) <= hub.radius + 4) {
        return { type: "category" as const, id: hub.categoryId };
      }
    }

    const coreDx = point.x - layout.core.x;
    const coreDy = point.y - layout.core.y;
    if (Math.hypot(coreDx, coreDy) <= layout.core.radius + 8) {
      return { type: "core" as const, id: "core" };
    }

    return null;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const hit = hitTest(event.clientX, event.clientY);
    if (!hit) {
      hoverProject(null);
      hoverCategory(null);
      return;
    }
    if (hit.type === "project") {
      hoverProject(hit.id);
      hoverCategory(null);
    } else if (hit.type === "category") {
      hoverCategory(hit.id);
      hoverProject(null);
    } else {
      hoverProject(null);
      hoverCategory(null);
    }
  }

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const hit = hitTest(event.clientX, event.clientY);
    if (!hit) return;

    if (hit.type === "project") {
      selectProject(hit.id);
    } else if (hit.type === "category") {
      focusCategory(hit.id);
    } else {
      storeApi.getState().resetView();
    }
  }

  return (
    <div
      ref={containerRef}
      className={className}
      data-eco-visualization
    >
      <canvas
        ref={canvasRef}
        className="eco-canvas h-full w-full touch-none rounded-xl"
        role="img"
        aria-label={`Interactive ecosystem map showing ${filteredProjects.length} projects across ${ECOSYSTEM_CATEGORIES.length} categories. Use list view for keyboard navigation.`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          hoverProject(null);
          hoverCategory(null);
        }}
        onClick={handleClick}
      />
    </div>
  );
}
