"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface WikiNodeGraphProps {
  nodes: Array<{ id: string; title: string; category: string }>;
  links: Array<{ source: string; target: string }>;
  onSelectNode: (id: string) => void;
  selectedId?: string;
  width?: number;
  height?: number;
}

interface Position {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface DragState {
  index: number;
  offsetX: number;
  offsetY: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  theorem: "#3b82f6",
  definition: "#22c55e",
  formula: "#a855f7",
  note: "#eab308",
  concept: "#6b7280",
};

const DEFAULT_COLOR = "#6b7280";
const NODE_MIN_RADIUS = 6;
const NODE_MAX_RADIUS = 14;
const LINK_COLOR = "#374151";
const SELECTED_RING_COLOR = "#60a5fa";
const LABEL_COLOR = "#d1d5db";
const BG_COLOR = "#111827";

const REPULSION_STRENGTH = 800;
const ATTRACTION_STRENGTH = 0.005;
const IDEAL_EDGE_LENGTH = 120;
const CENTER_GRAVITY = 0.02;
const DAMPING = 0.85;
const MIN_DISTANCE = 20;
const PADDING = 30;
const ITERATIONS = 50;
const LABEL_FONT_SIZE = 10;
const LABEL_MAX_LENGTH = 15;

function getNodeRadius(id: string, linkCounts: Map<string, number>): number {
  const count = linkCounts.get(id) ?? 0;
  return Math.min(NODE_MAX_RADIUS, NODE_MIN_RADIUS + count * 2);
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

function truncateLabel(label: string, max: number): string {
  if (label.length <= max) return label;
  return label.slice(0, max - 1) + "…";
}

function runSimulation(
  nodes: WikiNodeGraphProps["nodes"],
  links: WikiNodeGraphProps["links"],
  width: number,
  height: number
): Position[] {
  const linkCounts = new Map<string, number>();
  for (const node of nodes) linkCounts.set(node.id, 0);
  for (const link of links) {
    linkCounts.set(link.source, (linkCounts.get(link.source) ?? 0) + 1);
    linkCounts.set(link.target, (linkCounts.get(link.target) ?? 0) + 1);
  }

  const cx = width / 2;
  const cy = height / 2;
  const positions: Position[] = nodes.map(() => ({
    x: cx + (Math.random() - 0.5) * width * 0.6,
    y: cy + (Math.random() - 0.5) * height * 0.6,
    vx: 0,
    vy: 0,
  }));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || MIN_DISTANCE;
        const force = REPULSION_STRENGTH / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        positions[i].vx -= fx;
        positions[i].vy -= fy;
        positions[j].vx += fx;
        positions[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const link of links) {
      const si = nodes.findIndex((n) => n.id === link.source);
      const ti = nodes.findIndex((n) => n.id === link.target);
      if (si === -1 || ti === -1) continue;
      const dx = positions[ti].x - positions[si].x;
      const dy = positions[ti].y - positions[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || MIN_DISTANCE;
      const force = (dist - IDEAL_EDGE_LENGTH) * ATTRACTION_STRENGTH;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      positions[si].vx += fx;
      positions[si].vy += fy;
      positions[ti].vx -= fx;
      positions[ti].vy -= fy;
    }

    // Center gravity
    for (const pos of positions) {
      pos.vx += (cx - pos.x) * CENTER_GRAVITY;
      pos.vy += (cy - pos.y) * CENTER_GRAVITY;
    }

    // Apply damping and update positions
    for (const pos of positions) {
      pos.vx *= DAMPING;
      pos.vy *= DAMPING;
      pos.x += pos.vx;
      pos.y += pos.vy;
      pos.x = Math.max(PADDING, Math.min(width - PADDING, pos.x));
      pos.y = Math.max(PADDING, Math.min(height - PADDING, pos.y));
    }
  }

  return positions;
}

export default function WikiNodeGraph({
  nodes,
  links,
  onSelectNode,
  selectedId,
  width: propWidth,
  height: propHeight,
}: WikiNodeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [size, setSize] = useState(() => ({
    width: propWidth ?? 600,
    height: propHeight ?? 400,
  }));
  const [positions, setPositions] = useState<Position[]>([]);

  // Sync size from props
  useEffect(() => {
    if (propWidth !== undefined && propHeight !== undefined) {
      setSize({ width: propWidth, height: propHeight });
    }
  }, [propWidth, propHeight]);

  // ResizeObserver for responsive sizing when no explicit width/height
  useEffect(() => {
    if (propWidth !== undefined && propHeight !== undefined) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  // Run force simulation when nodes/links/size change
  useEffect(() => {
    if (nodes.length === 0) {
      setPositions([]);
      return;
    }
    setPositions(runSimulation(nodes, links, size.width, size.height));
  }, [nodes, links, size.width, size.height]);

  // Pre-compute link counts for node sizing
  const linkCounts = useRef(new Map<string, number>());
  linkCounts.current.clear();
  for (const node of nodes) linkCounts.current.set(node.id, 0);
  for (const link of links) {
    linkCounts.current.set(link.source, (linkCounts.current.get(link.source) ?? 0) + 1);
    linkCounts.current.set(link.target, (linkCounts.current.get(link.target) ?? 0) + 1);
  }

  // Build a set of selected node ID for fast lookup
  const selectedSet = useRef(new Set<string>());
  selectedSet.current.clear();
  if (selectedId) selectedSet.current.add(selectedId);

  // Node index map for drag lookup
  const nodeIdToIndex = useRef(new Map<string, number>());
  nodeIdToIndex.current.clear();
  nodes.forEach((n, i) => nodeIdToIndex.current.set(n.id, i));

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, nodeId: string) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;

      const index = nodeIdToIndex.current.get(nodeId);
      if (index === undefined) return;

      const rect = svg.getBoundingClientRect();
      dragRef.current = {
        index,
        offsetX: e.clientX - rect.left - positions[index].x,
        offsetY: e.clientY - rect.top - positions[index].y,
      };

      onSelectNode(nodeId);
    },
    [positions, onSelectNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag) return;

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left - drag.offsetX;
      const y = e.clientY - rect.top - drag.offsetY;

      setPositions((prev) => {
        const next = [...prev];
        next[drag.index] = {
          ...next[drag.index],
          x: Math.max(PADDING, Math.min(size.width - PADDING, x)),
          y: Math.max(PADDING, Math.min(size.height - PADDING, y)),
        };
        return next;
      });
    },
    [size.width, size.height]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Build edge lines from positions
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (const link of links) {
    const si = nodes.findIndex((n) => n.id === link.source);
    const ti = nodes.findIndex((n) => n.id === link.target);
    if (si === -1 || ti === -1) continue;
    if (si >= positions.length || ti >= positions.length) continue;
    edges.push({
      x1: positions[si].x,
      y1: positions[si].y,
      x2: positions[ti].x,
      y2: positions[ti].y,
    });
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: propWidth === undefined ? "300px" : undefined,
      }}
    >
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        style={{
          backgroundColor: BG_COLOR,
          borderRadius: "0.5rem",
          cursor: dragRef.current ? "grabbing" : "grab",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={`edge-${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={LINK_COLOR}
            strokeWidth={1}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = positions[i];
          if (!pos) return null;

          const radius = getNodeRadius(node.id, linkCounts.current);
          const color = getCategoryColor(node.category);
          const isSelected = selectedSet.current.has(node.id);

          return (
            <g key={node.id}>
              {/* Selected ring */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 3}
                  fill="none"
                  stroke={SELECTED_RING_COLOR}
                  strokeWidth={2}
                />
              )}

              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={color}
                stroke={isSelected ? SELECTED_RING_COLOR : "none"}
                strokeWidth={isSelected ? 2 : 0}
                style={{ cursor: "pointer" }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
              />

              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + radius + LABEL_FONT_SIZE + 2}
                textAnchor="middle"
                fill={LABEL_COLOR}
                fontSize={LABEL_FONT_SIZE}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {truncateLabel(node.title, LABEL_MAX_LENGTH)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}