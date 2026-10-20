/**
 * DiagramCanvas.jsx
 * Interactive React Flow canvas with:
 *   - Custom neo-brutalist nodes
 *   - Click-to-highlight with side-panel description
 *   - Fit-to-screen, zoom in/out, reset controls
 *   - Dot-grid background
 *   - Color legend
 *   - Step-highlighting from parent
 */
import React, { useCallback, useEffect, useRef, forwardRef } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_COLORS } from './diagramEngine';

/* ── Custom Node ──────────────────────────────────────────────────── */
const CustomNode = ({ data, selected }) => {
  const isHighlighted = data.highlighted;
  const bg = isHighlighted ? NODE_COLORS.highlight : (data.color || '#FFFFFF');
  const shadow = isHighlighted
    ? '5px 5px 0px #1A1A1A'
    : selected
    ? '4px 4px 0px #1A1A1A'
    : '3px 3px 0px #1A1A1A';

  return (
    <div
      style={{
        background: bg,
        border: `3px solid #1A1A1A`,
        borderRadius: '12px',
        padding: '10px 16px',
        minWidth: '80px',
        maxWidth: '160px',
        textAlign: 'center',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        fontWeight: 900,
        fontSize: '13px',
        color: '#1A1A1A',
        boxShadow: shadow,
        transform: isHighlighted ? 'translate(-2px,-2px)' : 'none',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={data.description || data.label}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

/* ── Control button ───────────────────────────────────────────────── */
const CtrlBtn = ({ onClick, children, title, active }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 36, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? '#1A1A1A' : '#FFFFFF',
      color: active ? '#FFFFFF' : '#1A1A1A',
      border: '2.5px solid #1A1A1A',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 900,
      boxShadow: '2px 2px 0 #1A1A1A',
      transition: 'all 0.15s',
      fontFamily: 'inherit',
    }}
  >
    {children}
  </button>
);

/* ── Legend entry ─────────────────────────────────────────────────── */
const LEGEND_ITEMS = [
  { color: NODE_COLORS.root,     label: 'Root/Source' },
  { color: NODE_COLORS.internal, label: 'Internal' },
  { color: NODE_COLORS.leaf,     label: 'Leaf/Output' },
  { color: NODE_COLORS.active,   label: 'Active/Key' },
  { color: NODE_COLORS.control,  label: 'Control' },
  { color: NODE_COLORS.highlight,label: 'Highlighted' },
];

/* ── Inner canvas (needs useReactFlow inside provider) ────────────── */
const InnerCanvas = ({ nodes, edges, onNodeClick, highlightIds }) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [, , onEdgesChange] = useEdgesState([]);
  useEffect(() => {
    const highlightSet = new Set(highlightIds || []);
    const merged = nodes.map(nd => ({
      ...nd,
      data: { ...nd.data, highlighted: highlightSet.has(nd.id) },
    }));
    setRfNodes(merged);
  }, [nodes, highlightIds, setRfNodes]);

  // Sync nodes from parent, merging highlight state
  useEffect(() => {
    if (nodes.length > 0) setTimeout(() => fitView({ padding: 0.18, duration: 400 }), 120);
  }, [nodes, fitView]);

  const handleNodeClick = useCallback((_, node) => {
    onNodeClick && onNodeClick(node);
  }, [onNodeClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={edges}                 // edges managed externally for highlight-colour sync
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.3}
        maxZoom={2.5}
        defaultEdgeOptions={{
          style: { strokeWidth: 2.5, stroke: '#1A1A1A' },
          labelStyle: { fontWeight: 700, fontSize: 11 },
          labelBgStyle: { fill: '#FFF8E7', fillOpacity: 0.9 },
        }}
        style={{ background: '#FAF6EC', borderRadius: '16px' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#D5CEC4" gap={20} size={1.5} />
      </ReactFlow>

      {/* Overlay controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        display: 'flex', flexDirection: 'column', gap: 6,
        zIndex: 10,
      }}>
        <CtrlBtn onClick={() => zoomIn({ duration: 200 })} title="Zoom in">+</CtrlBtn>
        <CtrlBtn onClick={() => zoomOut({ duration: 200 })} title="Zoom out">−</CtrlBtn>
        <CtrlBtn onClick={() => fitView({ padding: 0.18, duration: 400 })} title="Fit to screen">⊡</CtrlBtn>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        display: 'flex', gap: 8, flexWrap: 'wrap',
        zIndex: 10,
        background: 'rgba(250,246,236,0.92)',
        border: '2px solid #1A1A1A',
        borderRadius: '10px',
        padding: '6px 10px',
      }}>
        {LEGEND_ITEMS.map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, background: color, border: '2px solid #1A1A1A', borderRadius: 3 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#555' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Public export (forwardRef so parent can snapshot it) ─────────── */
const DiagramCanvas = forwardRef(({ nodes, edges, onNodeClick, highlightIds, height = 420 }, ref) => (
  <div
    ref={ref}
    style={{
      width: '100%', height,
      border: '3px solid #1A1A1A',
      borderRadius: '18px',
      overflow: 'hidden',
      boxShadow: '6px 6px 0 #1A1A1A',
      background: '#FAF6EC',
    }}
  >
    <ReactFlowProvider>
      <InnerCanvas
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        highlightIds={highlightIds}
      />
    </ReactFlowProvider>
  </div>
));

export default DiagramCanvas;
