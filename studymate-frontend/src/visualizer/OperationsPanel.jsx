/**
 * OperationsPanel.jsx
 * Topic-specific interactive operations:
 *   - Tree: inorder / preorder / postorder / levelorder traversals
 *   - BST:  search, insert
 *   - Stack: push / pop / peek
 *   - Queue: enqueue / dequeue / peek
 *   - Linked List: traverse / search
 *   - Sort: animate pass-by-pass
 *   - Graph: BFS / DFS run
 *
 * Each operation produces an animation sequence (list of step objects)
 * that drives the walkthrough panel and canvas highlighting.
 */
import React, { useState, useCallback } from 'react';

const SmBtn = ({ onClick, children, color = '#FFFFFF', disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '7px 14px',
      background: disabled ? '#E0E0E0' : color,
      color: '#1A1A1A',
      border: '2.5px solid #1A1A1A',
      borderRadius: '100px',
      fontWeight: 900, fontSize: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '2px 2px 0 #1A1A1A',
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);

const InputRow = ({ value, onChange, onSubmit, placeholder, btnLabel, btnColor = '#8FD6B0' }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={e => e.key === 'Enter' && onSubmit()}
      style={{
        padding: '7px 14px', border: '2.5px solid #1A1A1A', borderRadius: '100px',
        fontSize: 13, fontFamily: 'inherit', width: 130, fontWeight: 700, outline: 'none',
      }}
    />
    <SmBtn onClick={onSubmit} color={btnColor}>{btnLabel}</SmBtn>
  </div>
);

/* ── Traversal sequences for Binary Tree preset ─────────────────── */
const TREE_NODES = {
  inorder:    [['4'],['2'],['5'],['1'],['6'],['3'],['7']],
  preorder:   [['1'],['2'],['4'],['5'],['3'],['6'],['7']],
  postorder:  [['4'],['5'],['2'],['6'],['7'],['3'],['1']],
  levelorder: [['1'],['2','3'],['4','5','6','7']],
};
const TREE_LABELS = {
  inorder:    'In-Order Traversal',
  preorder:   'Pre-Order Traversal',
  postorder:  'Post-Order Traversal',
  levelorder: 'Level-Order (BFS)',
};

function buildTreeSteps(type) {
  const seqs = TREE_NODES[type];
  return seqs.map((ids, i) => ({
    ids,
    label: `${TREE_LABELS[type]}: step ${i + 1}`,
    explain: {
      inorder:    [`Leftmost first: visit ${ids.join(',')}`, `Back up: visit ${ids.join(',')}`, `Right child: visit ${ids.join(',')}`, `Root: visit ${ids.join(',')}`, `Right-left: visit ${ids.join(',')}`, `Right root: visit ${ids.join(',')}`, `Rightmost: visit ${ids.join(',')}. Sequence: 4→2→5→1→6→3→7 ✅`][i],
      preorder:   [`Root first: visit ${ids.join(',')}`, `Go left: visit ${ids.join(',')}`, `Left-left: visit ${ids.join(',')}`, `Left-right: visit ${ids.join(',')}`, `Go right: visit ${ids.join(',')}`, `Right-left: visit ${ids.join(',')}`, `Right-right: visit ${ids.join(',')}. Sequence: 1→2→4→5→3→6→7 ✅`][i],
      postorder:  [`Leftmost leaf: visit ${ids.join(',')}`, `Right of 2: visit ${ids.join(',')}`, `Parent 2: visit ${ids.join(',')}`, `Left of 3: visit ${ids.join(',')}`, `Right of 3: visit ${ids.join(',')}`, `Parent 3: visit ${ids.join(',')}`, `Root last: visit ${ids.join(',')}. Sequence: 4→5→2→6→7→3→1 ✅`][i],
      levelorder: ['Level 0 — root: visit 1', 'Level 1 — children of root: visit 2, 3', 'Level 2 — all leaves: visit 4, 5, 6, 7 ✅'][i],
    }[type],
  }));
}

/* ── BST search ────────────────────────────────────────────────────── */
function buildBSTSearchSteps(val) {
  const tree = { '50': {l:'30',r:'70'}, '30':{l:'20',r:'40'}, '70':{l:'60',r:'80'} };
  const steps = [];
  let cur = '50';
  steps.push({ ids:[cur], label:`Compare ${val} with root 50`, explain:`Start at root. Is ${val} == 50?` });
  while (cur) {
    const numVal = parseInt(val), numCur = parseInt(cur);
    if (numVal === numCur) {
      steps.push({ ids:[cur], label:`Found ${val}!`, explain:`✅ ${val} found at node ${cur} in ${steps.length} comparison(s).` });
      break;
    } else if (numVal < numCur) {
      const next = tree[cur]?.l;
      if (!next) { steps.push({ ids:[cur], label:`Not found`, explain:`${val} would be a left child of ${cur} but position is empty — ${val} not in tree.` }); break; }
      steps.push({ ids:[cur, next], label:`${val} < ${cur} → go LEFT`, explain:`${val} is less than ${cur}. Move to left child: ${next}.` });
      cur = next;
    } else {
      const next = tree[cur]?.r;
      if (!next) { steps.push({ ids:[cur], label:`Not found`, explain:`${val} would be a right child of ${cur} but position is empty.` }); break; }
      steps.push({ ids:[cur, next], label:`${val} > ${cur} → go RIGHT`, explain:`${val} is greater than ${cur}. Move to right child: ${next}.` });
      cur = next;
    }
  }
  return steps;
}

/* ── Stack operations ──────────────────────────────────────────────── */
const initStack = ['10','20','30','40'];
function buildStackSteps(op, val) {
  if (op === 'push') return [
    { ids: ['e1','e2','e3','e4'], label:`Current stack`, explain:`Stack before push: [10, 20, 30, 40]. TOP = 40.` },
    { ids: ['top'], label:`PUSH ${val}`, explain:`New element ${val} placed on top. TOP pointer updated.` },
  ];
  if (op === 'pop') return [
    { ids: ['top','e1'], label:`TOP is 40`, explain:`peek() → returns 40. About to pop.` },
    { ids: ['e1'], label:`POP → 40`, explain:`pop() removes 40 from top. TOP now points to 30. Returns 40.` },
    { ids: ['e2'], label:`New TOP is 30`, explain:`Stack: [10, 20, 30]. Size = 3.` },
  ];
  if (op === 'peek') return [
    { ids: ['top','e1'], label:`PEEK`, explain:`peek() looks at the TOP element without removing it. Returns 40.` },
  ];
  return [];
}

/* ── Queue operations ──────────────────────────────────────────────── */
function buildQueueSteps(op, val) {
  if (op === 'enqueue') return [
    { ids: ['rear'], label:`Enqueue ${val}`, explain:`${val} added at the REAR of the queue. Size increases.` },
  ];
  if (op === 'dequeue') return [
    { ids: ['front','e1'], label:`FRONT is 10`, explain:`dequeue() removes the FRONT element. Returns 10.` },
    { ids: ['e2'], label:`New FRONT is 20`, explain:`FRONT pointer advances. Queue: [20, 30, 40].` },
  ];
  if (op === 'peek') return [
    { ids: ['front','e1'], label:`PEEK FRONT`, explain:`peek() returns 10 (FRONT element) without removing it.` },
  ];
  return [];
}

/* ── Bubble sort animation steps ────────────────────────────────────── */
function buildSortSteps() {
  return [
    { ids:['a0','a1'], label:'Pass 1: Compare 64,34', explain:'64 > 34 → SWAP. Array: [34, 64, 25, 12, 22, 11].' },
    { ids:['a1','a2'], label:'Pass 1: Compare 64,25', explain:'64 > 25 → SWAP. Array: [34, 25, 64, 12, 22, 11].' },
    { ids:['a2','a3'], label:'Pass 1: Compare 64,12', explain:'64 > 12 → SWAP. Array: [34, 25, 12, 64, 22, 11].' },
    { ids:['a3','a4'], label:'Pass 1: Compare 64,22', explain:'64 > 22 → SWAP. Array: [34, 25, 12, 22, 64, 11].' },
    { ids:['a4','a5'], label:'Pass 1: Compare 64,11 → 64 sorted', explain:'SWAP. 64 in final position ✅. Array: [34, 25, 12, 22, 11, 64].' },
    { ids:['a0','a1'], label:'Pass 2: Compare 34,25', explain:'34 > 25 → SWAP. Array: [25, 34, 12, 22, 11, 64].' },
    { ids:['a1','a2'], label:'Pass 2: Compare 34,12', explain:'SWAP. Array: [25, 12, 34, 22, 11, 64].' },
    { ids:['a2','a3'], label:'Pass 2: Compare 34,22', explain:'SWAP. Array: [25, 12, 22, 34, 11, 64].' },
    { ids:['a3','a4'], label:'Pass 2: Compare 34,11 → 34 sorted', explain:'SWAP. 34 in position ✅. Array: [25, 12, 22, 11, 34, 64].' },
    { ids:['a0','a1','a2','a3','a4','a5'], label:'Sorting continues…', explain:'Passes continue. Final sorted: [11, 12, 22, 25, 34, 64] ✅' },
  ];
}

/* ── BFS / DFS ──────────────────────────────────────────────────────── */
function buildBFSSteps() {
  return [
    { ids:['A'],           label:'Enqueue A', explain:'Start BFS. Mark A visited. Queue: [A].' },
    { ids:['A','B','C'],   label:'Expand A → B, C', explain:'Dequeue A. Visit neighbors B, C. Queue: [B, C].' },
    { ids:['B','D','E'],   label:'Expand B → D, E', explain:'Dequeue B. Visit D, E. Queue: [C, D, E].' },
    { ids:['C','F','G'],   label:'Expand C → F, G', explain:'Dequeue C. Visit F, G. Queue: [D, E, F, G].' },
    { ids:['D','E','F','G'], label:'All level-2 nodes', explain:'Dequeue remaining. No new nodes. BFS complete: A→B→C→D→E→F→G ✅' },
  ];
}
function buildDFSSteps() {
  return [
    { ids:['A'],         label:'Visit A', explain:'Start DFS at A. Mark visited. Push to stack.' },
    { ids:['A','B'],     label:'Go deep → B', explain:'Visit unvisited neighbor B. Push B.' },
    { ids:['B','D'],     label:'Go deep → D', explain:'Visit D from B.' },
    { ids:['D','E'],     label:'Go deep → E', explain:'Visit E (adjacent to D).' },
    { ids:['E'],         label:'Backtrack', explain:'E exhausted. Backtrack through D, B.' },
    { ids:['A','C'],     label:'Go deep → C', explain:'Back to A. Visit unvisited neighbor C.' },
    { ids:['C','F'],     label:'Go deep → F', explain:'Visit F from C.' },
    { ids:['F','G'],     label:'Go deep → G', explain:'Visit G. DFS complete: A→B→D→E→C→F→G ✅' },
  ];
}

/* ── Main component ─────────────────────────────────────────────────── */
const OperationsPanel = ({ operations = [], topic, onStepsGenerated }) => {
  const [searchVal, setSearchVal] = useState('60');
  const [pushVal,   setPushVal]   = useState('50');
  const [enqVal,    setEnqVal]    = useState('50');

  const emit = useCallback((steps) => {
    onStepsGenerated && onStepsGenerated(steps);
  }, [onStepsGenerated]);

  if (!operations.length) return null;

  const hasTrav  = ['inorder','preorder','postorder','levelorder'].some(o => operations.includes(o));
  const hasSearch= operations.includes('search') || operations.includes('insert');
  const hasStack = operations.includes('push') || operations.includes('pop') || operations.includes('peek');
  const hasQueue = operations.includes('enqueue') || operations.includes('dequeue');
  const hasSort  = operations.includes('animate') || operations.includes('stepthrough');
  const hasGraph = operations.includes('bfs') || operations.includes('dfs');

  return (
    <div style={{
      background: '#FFFFFF',
      border: '3px solid #1A1A1A',
      borderRadius: '18px',
      padding: '20px',
      boxShadow: '4px 4px 0 #1A1A1A',
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>⚙️</span>
        <span style={{ fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>
          Topic Operations
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Traversals */}
        {hasTrav && (
          <>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#555' }}>TRAVERSAL:</span>
            {['inorder','preorder','postorder','levelorder'].filter(o => operations.includes(o)).map(op => (
              <SmBtn key={op} onClick={() => emit(buildTreeSteps(op))} color={op==='inorder'?'#C9B8F5':op==='preorder'?'#F5A868':op==='postorder'?'#8FD6B0':'#F5D876'}>
                {op.charAt(0).toUpperCase() + op.slice(1).replace('order',' Order')}
              </SmBtn>
            ))}
          </>
        )}

        {/* BST Search */}
        {hasSearch && (
          <>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#555' }}>SEARCH:</span>
            <InputRow
              value={searchVal}
              onChange={setSearchVal}
              onSubmit={() => emit(buildBSTSearchSteps(searchVal))}
              placeholder="value"
              btnLabel="Search"
              btnColor="#8FD6B0"
            />
          </>
        )}

        {/* Stack ops */}
        {hasStack && (
          <>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#555' }}>STACK:</span>
            <InputRow
              value={pushVal}
              onChange={setPushVal}
              onSubmit={() => emit(buildStackSteps('push', pushVal))}
              placeholder="value"
              btnLabel="Push"
              btnColor="#C9B8F5"
            />
            <SmBtn onClick={() => emit(buildStackSteps('pop',''))}  color="#F5A868">Pop</SmBtn>
            <SmBtn onClick={() => emit(buildStackSteps('peek',''))} color="#F5D876">Peek</SmBtn>
          </>
        )}

        {/* Queue ops */}
        {hasQueue && (
          <>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#555' }}>QUEUE:</span>
            <InputRow
              value={enqVal}
              onChange={setEnqVal}
              onSubmit={() => emit(buildQueueSteps('enqueue', enqVal))}
              placeholder="value"
              btnLabel="Enqueue"
              btnColor="#8FD6B0"
            />
            <SmBtn onClick={() => emit(buildQueueSteps('dequeue',''))} color="#F5A868">Dequeue</SmBtn>
            <SmBtn onClick={() => emit(buildQueueSteps('peek',''))}    color="#F5D876">Peek</SmBtn>
          </>
        )}

        {/* Sort animate */}
        {hasSort && (
          <>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#555' }}>SORT:</span>
            <SmBtn onClick={() => emit(buildSortSteps())} color="#C9B8F5">▶ Animate Passes</SmBtn>
          </>
        )}

        {/* Graph traversal */}
        {hasGraph && (
          <>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#555' }}>TRAVERSE:</span>
            <SmBtn onClick={() => emit(buildBFSSteps())} color="#C9B8F5">BFS</SmBtn>
            <SmBtn onClick={() => emit(buildDFSSteps())} color="#F5D876">DFS</SmBtn>
          </>
        )}
      </div>
    </div>
  );
};

export default OperationsPanel;
