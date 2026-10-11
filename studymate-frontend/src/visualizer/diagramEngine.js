/**
 * diagramEngine.js
 *
 * Converts a topic string → { nodes, edges, meta } for React Flow.
 *
 * Priority:
 *   1. Built-in preset  (instant, no network call)
 *   2. AI-generated JSON via /api/ai/raw  (Gemini / mock fallback)
 *
 * Each node shape:
 *   { id, type, position:{x,y}, data:{ label, description, nodeType, color } }
 *
 * Each edge shape:
 *   { id, source, target, label?, animated?, markerEnd, style }
 *
 * meta:
 *   { title, description, category, components[], steps[], operations[] }
 */

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

// ─── colour palette (matches neo-brutalist design tokens) ────────────
export const NODE_COLORS = {
  root:      '#F5A868', // orange
  internal:  '#C9B8F5', // lavender
  leaf:      '#8FD6B0', // mint
  highlight: '#F5D876', // butter/yellow
  active:    '#F5A868', // orange
  visited:   '#8FD6B0', // mint
  default:   '#FFFFFF', // white
  process:   '#C9B8F5',
  data:      '#8FD6B0',
  control:   '#F5A868',
  io:        '#F5D876',
  storage:   '#E0E0E0',
  network:   '#C9B8F5',
  layer:     '#F5D876',
  component: '#8FD6B0',
};

// ─── edge style factory ──────────────────────────────────────────────
const edgeStyle = (color = '#1A1A1A', animated = false) => ({
  animated,
  style: { stroke: color, strokeWidth: 2.5 },
  markerEnd: { type: 'arrowclosed', color },
});

// ════════════════════════════════════════════════════════════════════
//  BUILT-IN PRESETS
// ════════════════════════════════════════════════════════════════════

const PRESETS = {};

// helper
const n = (id, label, x, y, nodeType = 'default', description = '') => ({
  id,
  type: 'custom',
  position: { x, y },
  data: { label, nodeType, color: NODE_COLORS[nodeType] || NODE_COLORS.default, description },
});
const e = (id, src, tgt, label = '', animated = false, color = '#1A1A1A') => ({
  id, source: src, target: tgt, label,
  ...edgeStyle(color, animated),
  labelStyle: { fontWeight: 700, fontSize: 11 },
  labelBgStyle: { fill: '#FFF8E7', fillOpacity: 0.9 },
});

// ── Binary Tree ──────────────────────────────────────────────────────
PRESETS['binary tree'] = PRESETS['binarytree'] = {
  nodes: [
    n('1', '1 (Root)', 300, 40,  'root',     'Root node — entry point of the tree. Has at most two children.'),
    n('2', '2',        160, 160, 'internal', 'Internal node — has children. Left child of root.'),
    n('3', '3',        440, 160, 'internal', 'Internal node — right child of root.'),
    n('4', '4',         80, 280, 'leaf',     'Leaf node — no children. Leftmost node.'),
    n('5', '5',        240, 280, 'leaf',     'Leaf node — no children. Right child of node 2.'),
    n('6', '6',        360, 280, 'leaf',     'Leaf node — no children. Left child of node 3.'),
    n('7', '7',        520, 280, 'leaf',     'Leaf node — no children. Rightmost leaf.'),
  ],
  edges: [
    e('e12','1','2','L'), e('e13','1','3','R'),
    e('e24','2','4','L'), e('e25','2','5','R'),
    e('e36','3','6','L'), e('e37','3','7','R'),
  ],
  meta: {
    title: 'Binary Tree',
    description: 'A hierarchical data structure where each node has at most two children (left and right). The topmost node is called the root; nodes with no children are leaves.',
    category: 'Data Structures',
    components: [
      { id:'1', name:'Root (1)',     role:'Entry point of the tree. Parent of all nodes.' },
      { id:'2', name:'Node 2',      role:'Internal node — left child of root, parent of 4 and 5.' },
      { id:'3', name:'Node 3',      role:'Internal node — right child of root, parent of 6 and 7.' },
      { id:'4', name:'Leaf 4',      role:'Leaf — leftmost node, no children.' },
      { id:'5', name:'Leaf 5',      role:'Leaf — right child of node 2.' },
      { id:'6', name:'Leaf 6',      role:'Leaf — left child of node 3.' },
      { id:'7', name:'Leaf 7',      role:'Leaf — rightmost node, no children.' },
    ],
    steps: [
      { ids:['1'],           label:'Start at Root',          explain:'Every tree traversal begins at the root node (1). It is the only node with no parent.' },
      { ids:['1','2'],       label:'Visit Left Subtree',     explain:'In-order traversal moves LEFT first. We descend to node 2.' },
      { ids:['2','4'],       label:'Reach Leftmost Leaf',    explain:'Continue left to node 4 — a leaf. In-order visits: 4 first.' },
      { ids:['4','2'],       label:'Visit Node 2',           explain:'Back to node 2. In-order sequence so far: 4, 2.' },
      { ids:['2','5'],       label:'Visit Right of Node 2',  explain:'Move to right child of node 2 (node 5). Sequence: 4, 2, 5.' },
      { ids:['5','1'],       label:'Visit Root',             explain:'Back to root (1). Sequence: 4, 2, 5, 1.' },
      { ids:['1','3'],       label:'Enter Right Subtree',    explain:'Move to right subtree rooted at node 3.' },
      { ids:['3','6'],       label:'Visit Node 6',           explain:'Left child of 3 is 6. Sequence: 4, 2, 5, 1, 6.' },
      { ids:['6','3'],       label:'Visit Node 3',           explain:'Back to node 3. Sequence: 4, 2, 5, 1, 6, 3.' },
      { ids:['3','7'],       label:'Visit Node 7',           explain:'Right child of 3 is 7. In-order complete: 4, 2, 5, 1, 6, 3, 7 ✅' },
    ],
    operations: ['inorder','preorder','postorder','levelorder','insert','search'],
  },
};

// ── BST ──────────────────────────────────────────────────────────────
PRESETS['bst'] = PRESETS['binary search tree'] = {
  nodes: [
    n('50',  '50 (Root)',  300,  40, 'root',     'BST Root. All left descendants < 50 < all right descendants.'),
    n('30',  '30',         160, 160, 'internal', 'Left subtree root — all nodes here < 50.'),
    n('70',  '70',         440, 160, 'internal', 'Right subtree root — all nodes here > 50.'),
    n('20',  '20',          80, 280, 'leaf',     'Left child of 30. 20 < 30 < 50.'),
    n('40',  '40',         240, 280, 'leaf',     'Right child of 30. 30 < 40 < 50.'),
    n('60',  '60',         360, 280, 'leaf',     'Left child of 70. 50 < 60 < 70.'),
    n('80',  '80',         520, 280, 'leaf',     'Right child of 70. Largest value.'),
  ],
  edges: [
    e('e1','50','30','<'), e('e2','50','70','>'),
    e('e3','30','20','<'), e('e4','30','40','>'),
    e('e5','70','60','<'), e('e6','70','80','>'),
  ],
  meta: {
    title: 'Binary Search Tree (BST)',
    description: 'A BST is a binary tree with the ordering property: for every node, all values in its left subtree are smaller, and all values in its right subtree are larger. This allows O(log n) average search, insert, and delete.',
    category: 'Data Structures',
    components: [
      { id:'50', name:'Root (50)',   role:'Entry point. Divides tree: left < 50, right > 50.' },
      { id:'30', name:'Node 30',    role:'Left child of root. Subtree root for values 20–40.' },
      { id:'70', name:'Node 70',    role:'Right child of root. Subtree root for values 60–80.' },
      { id:'20', name:'Leaf 20',    role:'Smallest value. Left child of 30.' },
      { id:'40', name:'Leaf 40',    role:'Between 30 and 50. Right child of 30.' },
      { id:'60', name:'Leaf 60',    role:'Between 50 and 70. Left child of 70.' },
      { id:'80', name:'Leaf 80',    role:'Largest value. Right child of 70.' },
    ],
    steps: [
      { ids:['50'],       label:'Start Search at Root',  explain:'Search for 60. Start at root 50. Is 60 == 50? No.' },
      { ids:['50','70'],  label:'Go Right (60 > 50)',    explain:'60 > 50 → go RIGHT to node 70.' },
      { ids:['70','60'],  label:'Go Left (60 < 70)',     explain:'60 < 70 → go LEFT to node 60. Found! ✅ Only 2 comparisons.' },
    ],
    operations: ['search','insert','inorder','preorder','postorder'],
  },
};

// ── Stack ─────────────────────────────────────────────────────────────
PRESETS['stack'] = {
  nodes: [
    n('top',   'TOP ↑',    300,  20, 'control',  'Stack pointer — always points to the most recently added element.'),
    n('e1',    '40 (top)', 300,  90, 'active',   'Top element — most recently pushed. This is returned by peek() and removed by pop().'),
    n('e2',    '30',       300, 165, 'internal', 'Second element from top.'),
    n('e3',    '20',       300, 240, 'internal', 'Third element from top.'),
    n('e4',    '10',       300, 315, 'leaf',     'Bottom element — first item pushed onto the stack.'),
    n('base',  '▬ BASE ▬', 300, 390, 'storage',  'Base of the stack — fixed bottom boundary.'),
  ],
  edges: [
    e('et1','top','e1','points to','',NODE_COLORS.control),
    e('e12','e1','e2'), e('e23','e2','e3'), e('e34','e3','e4'), e('e4b','e4','base'),
  ],
  meta: {
    title: 'Stack (LIFO)',
    description: 'A Stack is a Last-In, First-Out (LIFO) linear data structure. Elements are always added (pushed) and removed (popped) from the same end — the TOP. Think of a stack of plates.',
    category: 'Data Structures',
    components: [
      { id:'top',  name:'Stack Pointer (TOP)', role:'Tracks the index of the most recently pushed element.' },
      { id:'e1',   name:'40 — Top Element',    role:'Last pushed. Returned by peek(); removed by pop().' },
      { id:'e2',   name:'30',                  role:'Second item; accessible only after popping 40.' },
      { id:'e3',   name:'20',                  role:'Third item.' },
      { id:'e4',   name:'10 — Bottom',         role:'First item pushed. Last to be popped.' },
      { id:'base', name:'Base',                role:'Fixed floor of the stack. Stack overflow occurs when this is exceeded.' },
    ],
    steps: [
      { ids:['base'],          label:'Empty Stack',   explain:'Initially the stack is empty. TOP = -1.' },
      { ids:['base','e4'],     label:'PUSH 10',       explain:'Push 10. TOP now points to index 0.' },
      { ids:['e4','e3'],       label:'PUSH 20',       explain:'Push 20 on top. TOP = index 1.' },
      { ids:['e3','e2'],       label:'PUSH 30',       explain:'Push 30 on top. TOP = index 2.' },
      { ids:['e2','e1'],       label:'PUSH 40',       explain:'Push 40. TOP = index 3. Stack: [10,20,30,40].' },
      { ids:['e1','top'],      label:'PEEK',          explain:'peek() returns 40 without removing it. TOP unchanged.' },
      { ids:['e1'],            label:'POP → 40',      explain:'pop() removes 40. TOP decrements to index 2. Returns 40.' },
      { ids:['e2'],            label:'POP → 30',      explain:'pop() removes 30. Stack: [10, 20].' },
    ],
    operations: ['push','pop','peek'],
  },
};

// ── Queue ─────────────────────────────────────────────────────────────
PRESETS['queue'] = {
  nodes: [
    n('front', 'FRONT →', 20,  160, 'control',  'Front pointer — points to the element that will be dequeued next.'),
    n('e1',    '10',       140, 160, 'active',   'Front element — dequeued first (FIFO order).'),
    n('e2',    '20',       260, 160, 'internal', 'Second element in the queue.'),
    n('e3',    '30',       380, 160, 'internal', 'Third element in the queue.'),
    n('e4',    '40',       500, 160, 'leaf',     'Rear element — most recently enqueued.'),
    n('rear',  '← REAR',  620, 160, 'control',  'Rear pointer — new elements are enqueued here.'),
  ],
  edges: [
    e('ef1','front','e1','→'), e('e12','e1','e2'), e('e23','e2','e3'), e('e34','e3','e4'), e('e4r','e4','rear','→'),
  ],
  meta: {
    title: 'Queue (FIFO)',
    description: 'A Queue is a First-In, First-Out (FIFO) linear data structure. Elements are added at the REAR (enqueue) and removed from the FRONT (dequeue). Think of a checkout line at a store.',
    category: 'Data Structures',
    components: [
      { id:'front', name:'FRONT pointer', role:'Points to the next element to be removed (dequeued).' },
      { id:'e1',    name:'10 — Front',    role:'First to be dequeued. Has waited the longest.' },
      { id:'e2',    name:'20',            role:'Dequeued second after 10.' },
      { id:'e3',    name:'30',            role:'Dequeued third.' },
      { id:'e4',    name:'40 — Rear',     role:'Most recently enqueued. Last to be dequeued.' },
      { id:'rear',  name:'REAR pointer',  role:'Points to where the next enqueue will be placed.' },
    ],
    steps: [
      { ids:['front','e1'],   label:'ENQUEUE 10', explain:'10 is first to arrive. FRONT and REAR both point to it.' },
      { ids:['e1','e2'],      label:'ENQUEUE 20', explain:'20 added at rear. Queue: [10, 20].' },
      { ids:['e2','e3'],      label:'ENQUEUE 30', explain:'30 added at rear. Queue: [10, 20, 30].' },
      { ids:['e3','e4'],      label:'ENQUEUE 40', explain:'40 added at rear. Queue: [10, 20, 30, 40].' },
      { ids:['e1'],           label:'DEQUEUE → 10', explain:'Remove from FRONT. Returns 10. FRONT advances to 20.' },
      { ids:['e2'],           label:'DEQUEUE → 20', explain:'Remove from FRONT. Returns 20. Queue: [30, 40].' },
    ],
    operations: ['enqueue','dequeue','peek'],
  },
};

// ── Linked List ───────────────────────────────────────────────────────
PRESETS['linked list'] = PRESETS['linkedlist'] = {
  nodes: [
    n('head',  'HEAD',    20,  160, 'control',  'Head pointer — entry point of the linked list. Always points to the first node.'),
    n('n1',    '10 | →',  140, 160, 'active',   'First node. Data=10, next pointer → node 2.'),
    n('n2',    '20 | →',  280, 160, 'internal', 'Second node. Data=20, next pointer → node 3.'),
    n('n3',    '30 | →',  420, 160, 'internal', 'Third node. Data=30, next pointer → node 4.'),
    n('n4',    '40 | ∅',  560, 160, 'leaf',     'Last node (tail). Data=40, next pointer = null (∅).'),
    n('null',  'NULL',    700, 160, 'storage',  'Null — marks the end of the list. The tail node\'s next pointer points here.'),
  ],
  edges: [
    e('eh','head','n1','→'), e('e12','n1','n2','→'), e('e23','n2','n3','→'), e('e34','n3','n4','→'), e('e4n','n4','null','∅'),
  ],
  meta: {
    title: 'Singly Linked List',
    description: 'A Linked List is a linear data structure where elements (nodes) are stored in non-contiguous memory. Each node contains data and a pointer (next) to the following node. Unlike arrays, insertion/deletion at arbitrary positions is O(1) if you have the pointer.',
    category: 'Data Structures',
    components: [
      { id:'head', name:'HEAD pointer',   role:'Entry point. Always points to the first node. If null, list is empty.' },
      { id:'n1',   name:'Node 1 (10)',    role:'First node. Data = 10. next → Node 2.' },
      { id:'n2',   name:'Node 2 (20)',    role:'Second node. Data = 20. next → Node 3.' },
      { id:'n3',   name:'Node 3 (30)',    role:'Third node. Data = 30. next → Node 4.' },
      { id:'n4',   name:'Node 4 (40)',    role:'Tail node. Data = 40. next = NULL — end of list.' },
      { id:'null', name:'NULL',           role:'Sentinel value marking the end of the list.' },
    ],
    steps: [
      { ids:['head','n1'],     label:'Start at HEAD',      explain:'Traversal begins at HEAD pointer → Node 1 (10).' },
      { ids:['n1','n2'],       label:'Follow next → 20',   explain:'Read data (10), then follow next pointer to Node 2.' },
      { ids:['n2','n3'],       label:'Follow next → 30',   explain:'Read data (20), then follow next pointer to Node 3.' },
      { ids:['n3','n4'],       label:'Follow next → 40',   explain:'Read data (30), then follow next pointer to Node 4.' },
      { ids:['n4','null'],     label:'Reach NULL',         explain:'Node 4 next = NULL — end of list. Traversal complete. Visited: 10→20→30→40.' },
    ],
    operations: ['traverse','insert','delete','search'],
  },
};

// ── Binary Search ─────────────────────────────────────────────────────
PRESETS['binary search'] = {
  nodes: [
    n('arr',     'Sorted Array [3,7,11,15,19,23,27,31,35]', 300, 30,  'control',  'Input: sorted array. Binary search requires a sorted array — it exploits order to halve the search space.'),
    n('lo',      'lo = 0',          80,  140, 'process',  'Left boundary pointer. Initially 0 (first index). Advances right when target > arr[mid].'),
    n('mid',     'mid = (lo+hi)/2', 300, 140, 'active',   'Middle index computed each iteration. arr[mid] is compared to the target. Each comparison halves the problem.'),
    n('hi',      'hi = 8 (n-1)',    520, 140, 'process',  'Right boundary pointer. Initially n-1 (last index). Retreats left when target < arr[mid].'),
    n('cmp',     'arr[mid] == 23?', 300, 260, 'root',     'Decision node. Three outcomes: equal (found!), less (go right), or greater (go left).'),
    n('right',   'lo = mid + 1',    520, 370, 'internal', 'Target > arr[mid]: discard left half. Move lo pointer right past mid.'),
    n('left',    'hi = mid - 1',    80,  370, 'internal', 'Target < arr[mid]: discard right half. Move hi pointer left of mid.'),
    n('found',   '✅ Return index 5',300, 460, 'leaf',     'Found! arr[5] = 23. Binary search located target in only 3 comparisons vs 6 for linear search.'),
    n('notfound','❌ Return -1',    300, 540, 'storage',  'lo > hi: search space empty. Target not in array. Return sentinel -1.'),
  ],
  edges: [
    e('e1','arr','lo',      'init lo=0'),
    e('e2','arr','hi',      'init hi=8'),
    e('e3','lo','mid',      'compute'),
    e('e4','hi','mid',      'compute'),
    e('e5','mid','cmp',     'compare',true,'#F5A868'),
    e('e6','cmp','found',   '== target','',  '#8FD6B0'),
    e('e7','cmp','left',    '< target','',   '#C9B8F5'),
    e('e8','cmp','right',   '> target','',   '#C9B8F5'),
    e('e9','cmp','notfound','lo > hi','',    '#999'),
  ],
  meta: {
    title: 'Binary Search',
    description: 'Binary Search finds a target value in a sorted array in O(log n) time. It works by repeatedly comparing the target to the middle element and discarding the half where the target cannot be — cutting the search space in half each step.',
    category: 'Algorithms',
    components: [
      { id:'arr',      name:'Sorted Array',      role:'Input array: [3,7,11,15,19,23,27,31,35]. Must be sorted. n=9 elements.' },
      { id:'lo',       name:'lo pointer',         role:'Left boundary. Starts at 0. Advances with lo = mid + 1 when target > arr[mid].' },
      { id:'hi',       name:'hi pointer',         role:'Right boundary. Starts at n-1=8. Retreats with hi = mid - 1 when target < arr[mid].' },
      { id:'mid',      name:'mid index',          role:'Computed as lo + (hi-lo)/2 to avoid overflow. The element we compare against each round.' },
      { id:'cmp',      name:'Comparison',         role:'Three-way branch: equal → found; target > arr[mid] → go right; target < arr[mid] → go left.' },
      { id:'right',    name:'Go Right (lo=mid+1)','role':'Eliminate entire left half — every element ≤ arr[mid] < target.' },
      { id:'left',     name:'Go Left (hi=mid-1)', role:'Eliminate entire right half — every element ≥ arr[mid] > target.' },
      { id:'found',    name:'Found (index 5)',     role:'arr[5]=23 equals target. Return 5. Only 3 comparisons needed for 9 elements.' },
      { id:'notfound', name:'Not Found (-1)',      role:'lo > hi — all possible positions exhausted. Target not present.' },
    ],
    steps: [
      { ids:['arr','lo','hi'],     label:'Step 0: Initialise',    explain:'Array: [3,7,11,15,19,23,27,31,35]. Set lo=0, hi=8. Target = 23.' },
      { ids:['mid','cmp'],         label:'Step 1: First comparison', explain:'mid = (0+8)/2 = 4. arr[4]=19. Is 19 == 23? No. 23 > 19 → lo = 5. Left half [3..19] eliminated.' },
      { ids:['right','mid','cmp'], label:'Step 2: Second comparison', explain:'lo=5, hi=8. mid = (5+8)/2 = 6. arr[6]=27. Is 27 == 23? No. 23 < 27 → hi = 5. Right half [27..35] eliminated.' },
      { ids:['left','mid','cmp'],  label:'Step 3: Third comparison',  explain:'lo=5, hi=5. mid = 5. arr[5]=23. Is 23 == 23? YES! Return index 5. ✅' },
      { ids:['found'],             label:'Found at index 5!',    explain:'Target 23 found in only 3 comparisons. Linear search would need 6. Binary search is O(log n) — doubling the array only adds 1 comparison.' },
    ],
    operations: ['search'],
  },
};

// ── Bubble Sort ───────────────────────────────────────────────────────
PRESETS['bubble sort'] = PRESETS['bubblesort'] = {  nodes: [
    n('a0','64', 60,  160, 'active',   'Index 0: value 64'),
    n('a1','34', 160, 160, 'active',   'Index 1: value 34'),
    n('a2','25', 260, 160, 'active',   'Index 2: value 25'),
    n('a3','12', 360, 160, 'active',   'Index 3: value 12'),
    n('a4','22', 460, 160, 'active',   'Index 4: value 22'),
    n('a5','11', 560, 160, 'leaf',     'Index 5: value 11'),
    n('lbl','Array: [64, 34, 25, 12, 22, 11]', 300, 40, 'control', 'Input array — will be sorted in ascending order.'),
  ],
  edges: [
    e('e01','a0','a1','cmp?',true,'#F5A868'),
    e('e12','a1','a2'), e('e23','a2','a3'), e('e34','a3','a4'), e('e45','a4','a5'),
  ],
  meta: {
    title: 'Bubble Sort',
    description: 'Bubble Sort repeatedly steps through the array, compares adjacent elements, and swaps them if they are in the wrong order. The largest unsorted element "bubbles up" to its correct position each pass. Time: O(n²), Space: O(1).',
    category: 'Algorithms',
    components: [
      { id:'lbl', name:'Input Array',    role:'The unsorted array [64, 34, 25, 12, 22, 11].' },
      { id:'a0',  name:'Index 0 — 64',  role:'Compared with 34 in pass 1 → swap.' },
      { id:'a1',  name:'Index 1 — 34',  role:'After swap with 64, now holds 64.' },
      { id:'a2',  name:'Index 2 — 25',  role:'Compared pair by pair through each pass.' },
      { id:'a3',  name:'Index 3 — 12',  role:'Small value, takes many passes to bubble left.' },
      { id:'a4',  name:'Index 4 — 22',  role:'Near-sorted position.' },
      { id:'a5',  name:'Index 5 — 11',  role:'Smallest value — will reach index 0 last.' },
    ],
    steps: [
      { ids:['a0','a1'],       label:'Pass 1: Compare 64,34', explain:'64 > 34 → SWAP. Array: [34, 64, 25, 12, 22, 11].' },
      { ids:['a1','a2'],       label:'Pass 1: Compare 64,25', explain:'64 > 25 → SWAP. Array: [34, 25, 64, 12, 22, 11].' },
      { ids:['a2','a3'],       label:'Pass 1: Compare 64,12', explain:'64 > 12 → SWAP. Array: [34, 25, 12, 64, 22, 11].' },
      { ids:['a3','a4'],       label:'Pass 1: Compare 64,22', explain:'64 > 22 → SWAP. Array: [34, 25, 12, 22, 64, 11].' },
      { ids:['a4','a5'],       label:'Pass 1: Compare 64,11', explain:'64 > 11 → SWAP. 64 is now at end ✅. Array: [34, 25, 12, 22, 11, 64].' },
      { ids:['a0','a1'],       label:'Pass 2: Begin',         explain:'Pass 2 ignores last element (sorted). Compare 34, 25 → SWAP.' },
      { ids:['a5'],            label:'Sorted: 64',            explain:'After pass 1, index 5 is permanently in its correct position.' },
    ],
    operations: ['animate','stepthrough'],
  },
};

// ── Graph / BFS ───────────────────────────────────────────────────────
PRESETS['graph'] = PRESETS['bfs'] = PRESETS['breadth first search'] = {
  nodes: [
    n('A','A',  300,  40, 'root',     'Source node — BFS starts here.'),
    n('B','B',  140, 160, 'internal', 'Level 1 neighbor of A.'),
    n('C','C',  460, 160, 'internal', 'Level 1 neighbor of A.'),
    n('D','D',   60, 280, 'leaf',     'Level 2 neighbor of B.'),
    n('E','E',  220, 280, 'leaf',     'Level 2 neighbor of B.'),
    n('F','F',  380, 280, 'leaf',     'Level 2 neighbor of C.'),
    n('G','G',  540, 280, 'leaf',     'Level 2 neighbor of C.'),
  ],
  edges: [
    e('eAB','A','B'), e('eAC','A','C'),
    e('eBD','B','D'), e('eBE','B','E'),
    e('eCF','C','F'), e('eCG','C','G'),
    e('eDE','D','E','',false,'#C9B8F5'),
    e('eFG','F','G','',false,'#C9B8F5'),
  ],
  meta: {
    title: 'Graph — Breadth-First Search (BFS)',
    description: 'BFS explores a graph level by level. Starting from a source node, it visits all neighbors before moving deeper. Uses a QUEUE internally. Guarantees shortest path in unweighted graphs. Time: O(V+E).',
    category: 'Algorithms',
    components: [
      { id:'A', name:'A — Source',    role:'BFS origin. Enqueued first.' },
      { id:'B', name:'B (Level 1)',   role:'Adjacent to A. Visited in first BFS expansion.' },
      { id:'C', name:'C (Level 1)',   role:'Adjacent to A. Visited in first BFS expansion.' },
      { id:'D', name:'D (Level 2)',   role:'Adjacent to B. Visited in second BFS expansion.' },
      { id:'E', name:'E (Level 2)',   role:'Adjacent to B and D.' },
      { id:'F', name:'F (Level 2)',   role:'Adjacent to C.' },
      { id:'G', name:'G (Level 2)',   role:'Adjacent to C and F.' },
    ],
    steps: [
      { ids:['A'],                label:'Enqueue A',           explain:'Start BFS. Push A into queue. Visited: {A}. Queue: [A].' },
      { ids:['A','B','C'],        label:'Expand A → B, C',     explain:'Dequeue A. Enqueue unvisited neighbors B and C. Visited: {A,B,C}. Queue: [B,C].' },
      { ids:['B','D','E'],        label:'Expand B → D, E',     explain:'Dequeue B. Enqueue D and E. Visited: {A,B,C,D,E}. Queue: [C,D,E].' },
      { ids:['C','F','G'],        label:'Expand C → F, G',     explain:'Dequeue C. Enqueue F and G. Queue: [D,E,F,G].' },
      { ids:['D'],                label:'Expand D',            explain:'Dequeue D. Neighbor E already visited — skip. Queue: [E,F,G].' },
      { ids:['E','F','G'],        label:'Expand E, F, G',      explain:'All remaining dequeued. No new unvisited neighbors. BFS complete! ✅ Order: A→B→C→D→E→F→G.' },
    ],
    operations: ['bfs','dfs'],
  },
};

// ── DFS ───────────────────────────────────────────────────────────────
PRESETS['dfs'] = PRESETS['depth first search'] = {
  ...PRESETS['graph'],
  meta: {
    ...PRESETS['graph'].meta,
    title: 'Graph — Depth-First Search (DFS)',
    description: 'DFS explores as deep as possible along each branch before backtracking. Uses a STACK (or recursion). Useful for cycle detection, topological sort, and maze solving. Time: O(V+E).',
    steps: [
      { ids:['A'],           label:'Visit A',       explain:'Start DFS at A. Push A to stack. Mark visited. Stack: [A].' },
      { ids:['A','B'],       label:'Go deep → B',   explain:'Visit unvisited neighbor B. Push B. Mark visited. Stack: [A,B].' },
      { ids:['B','D'],       label:'Go deep → D',   explain:'Visit unvisited neighbor D. Push D. Mark visited.' },
      { ids:['D','E'],       label:'Go deep → E',   explain:'Visit E from D. Mark visited.' },
      { ids:['E'],           label:'Backtrack',     explain:'E has no unvisited neighbors. Pop E. Back to D.' },
      { ids:['D'],           label:'Backtrack',     explain:'D exhausted. Pop D. Back to B.' },
      { ids:['B'],           label:'Backtrack',     explain:'B exhausted. Pop B. Back to A.' },
      { ids:['A','C'],       label:'Go deep → C',   explain:'Visit C from A. Push C.' },
      { ids:['C','F'],       label:'Go deep → F',   explain:'Visit F from C.' },
      { ids:['F','G'],       label:'Go deep → G',   explain:'Visit G from F. DFS Order: A→B→D→E→C→F→G ✅' },
    ],
  },
};

// ── OS — Process States ───────────────────────────────────────────────
PRESETS['operating system'] = PRESETS['os'] = PRESETS['process states'] = {
  nodes: [
    n('new',      'NEW',       80,  160, 'io',       'Process is being created. Resources allocated by OS.'),
    n('ready',    'READY',     260, 80,  'process',  'Process is waiting in the ready queue for CPU time.'),
    n('running',  'RUNNING',   440, 160, 'active',   'Process currently executing on the CPU.'),
    n('waiting',  'WAITING',   440, 300, 'internal', 'Process waiting for I/O or an event to complete.'),
    n('term',     'TERMINATED',620, 160, 'storage',  'Process has finished execution. Resources are released.'),
  ],
  edges: [
    e('e1','new','ready',    'admitted'),
    e('e2','ready','running','dispatcher'),
    e('e3','running','ready','interrupt / preempt'),
    e('e4','running','waiting','I/O request'),
    e('e5','waiting','ready','I/O complete'),
    e('e6','running','term',  'exit'),
  ],
  meta: {
    title: 'OS — Process State Diagram',
    description: 'A process moves through five states during its lifecycle in an operating system. The OS scheduler and dispatcher control transitions between READY and RUNNING. I/O events drive transitions to and from the WAITING state.',
    category: 'Operating Systems',
    components: [
      { id:'new',     name:'NEW',        role:'Process being created. PCB allocated. Not yet in ready queue.' },
      { id:'ready',   name:'READY',      role:'Process waiting for CPU. May wait here many times (time-sharing).' },
      { id:'running', name:'RUNNING',    role:'Actively executing instructions on the CPU. Only one per core.' },
      { id:'waiting', name:'WAITING',    role:'Blocked on I/O, semaphore, or event. CPU is given to another process.' },
      { id:'term',    name:'TERMINATED', role:'Process completed. OS reclaims memory, file handles, and other resources.' },
    ],
    steps: [
      { ids:['new'],             label:'Process Created',    explain:'OS creates a new process. Allocates a Process Control Block (PCB) with PID, state, registers.' },
      { ids:['new','ready'],     label:'Admitted to Queue', explain:'Process moves to READY queue. Waits for CPU scheduler to select it.' },
      { ids:['ready','running'], label:'Dispatched to CPU', explain:'Dispatcher loads process context onto CPU. Process starts RUNNING.' },
      { ids:['running','waiting'],'label':'I/O Request',    explain:'Process requests disk I/O. Cannot continue — moves to WAITING state. CPU freed.' },
      { ids:['waiting','ready'], label:'I/O Completes',    explain:'I/O interrupt fires. Process moves back to READY queue.' },
      { ids:['running','ready'], label:'Preempted',        explain:'Timer interrupt. Scheduler preempts process — back to READY. Context saved.' },
      { ids:['running','term'],  label:'Process Exits',    explain:'Process calls exit(). OS marks it TERMINATED and reclaims resources.' },
    ],
    operations: [],
  },
};

// ── Computer Networks — OSI Model ─────────────────────────────────────
PRESETS['osi model'] = PRESETS['osi'] = PRESETS['computer networks'] = PRESETS['networks'] = {
  nodes: [
    n('L7','Layer 7: Application',  300, 20,  'io',       'HTTP, FTP, SMTP, DNS. Direct interaction with user applications.'),
    n('L6','Layer 6: Presentation', 300, 90,  'process',  'Encryption, compression, data format translation (SSL/TLS, JPEG).'),
    n('L5','Layer 5: Session',      300, 160, 'internal', 'Manages sessions between applications. Setup, maintenance, teardown.'),
    n('L4','Layer 4: Transport',    300, 230, 'active',   'TCP/UDP. End-to-end communication, segmentation, flow/error control.'),
    n('L3','Layer 3: Network',      300, 300, 'component','IP addressing and routing. Routers operate here.'),
    n('L2','Layer 2: Data Link',    300, 370, 'data',     'MAC addressing, frame creation, error detection. Switches/bridges.'),
    n('L1','Layer 1: Physical',     300, 440, 'storage',  'Bits on wire/air. Cables, hubs, Wi-Fi signals, fiber.'),
  ],
  edges: [
    e('e76','L7','L6','encapsulate',true),
    e('e65','L6','L5','encapsulate',true),
    e('e54','L5','L4','encapsulate',true),
    e('e43','L4','L3','encapsulate',true),
    e('e32','L3','L2','encapsulate',true),
    e('e21','L2','L1','encapsulate',true),
  ],
  meta: {
    title: 'OSI Network Model (7 Layers)',
    description: 'The OSI (Open Systems Interconnection) model is a conceptual framework dividing network communication into 7 layers. Each layer adds a header (encapsulation) when sending data, and strips it when receiving. Mnemonic: "All People Seem To Need Data Processing."',
    category: 'Computer Networks',
    components: [
      { id:'L7', name:'Application (7)',   role:'End-user protocols: HTTP, HTTPS, FTP, SMTP, DNS, DHCP.' },
      { id:'L6', name:'Presentation (6)',  role:'Data translation, encryption (TLS/SSL), compression.' },
      { id:'L5', name:'Session (5)',       role:'Session management: establish, maintain, terminate connections.' },
      { id:'L4', name:'Transport (4)',     role:'TCP (reliable) and UDP (fast). Ports, segmentation, flow control.' },
      { id:'L3', name:'Network (3)',       role:'IP addressing, routing, fragmentation. Routers work here.' },
      { id:'L2', name:'Data Link (2)',     role:'MAC addresses, frames, error detection (CRC). Switches work here.' },
      { id:'L1', name:'Physical (1)',      role:'Raw bits over medium: copper, fiber, wireless signals.' },
    ],
    steps: [
      { ids:['L7'],       label:'App generates data', explain:'Your browser creates an HTTP request. Layer 7 adds HTTP headers.' },
      { ids:['L6'],       label:'Presentation',       explain:'Data encrypted with TLS. Format standardized for transmission.' },
      { ids:['L5'],       label:'Session',            explain:'Session established with server. Keeps track of request/response pairs.' },
      { ids:['L4'],       label:'Transport',          explain:'TCP breaks data into segments. Adds port numbers (e.g., 443).' },
      { ids:['L3'],       label:'Network',            explain:'IP adds source and destination IP addresses. Routing decides path.' },
      { ids:['L2'],       label:'Data Link',          explain:'MAC addresses added. Data split into frames. Sent to next hop.' },
      { ids:['L1'],       label:'Physical',           explain:'Frames converted to electrical/optical signals and transmitted.' },
    ],
    operations: [],
  },
};

// ── DBMS — ER Diagram ─────────────────────────────────────────────────
PRESETS['dbms'] = PRESETS['database'] = PRESETS['er diagram'] = {
  nodes: [
    n('student',  'STUDENT',    100, 160, 'active',   'Entity: represents a student. Attributes: StudentID (PK), Name, Email, Age.'),
    n('enroll',   'ENROLLS',    300, 160, 'control',  'Relationship: connects Student and Course. Has attribute: EnrollDate.'),
    n('course',   'COURSE',     500, 160, 'process',  'Entity: represents a course. Attributes: CourseID (PK), Title, Credits.'),
    n('sid',      'StudentID',  60,  60,  'data',     'Primary Key of STUDENT entity. Uniquely identifies each student.'),
    n('sname',    'Name',       140, 60,  'data',     'Attribute of STUDENT.'),
    n('cid',      'CourseID',   460, 60,  'data',     'Primary Key of COURSE entity.'),
    n('ctitle',   'Title',      540, 60,  'data',     'Attribute of COURSE.'),
    n('prof',     'PROFESSOR',  300, 340, 'internal', 'Entity: teaches a course. Has attributes: ProfID (PK), Name, Department.'),
    n('teaches',  'TEACHES',    300, 260, 'control',  'Relationship: Professor teaches Course. Cardinality: one professor → many courses.'),
  ],
  edges: [
    e('es1','student','sid'),  e('es2','student','sname'),
    e('ec1','course','cid'),   e('ec2','course','ctitle'),
    e('ee1','student','enroll','N'), e('ee2','enroll','course','M'),
    e('et1','prof','teaches','1'), e('et2','teaches','course','N'),
  ],
  meta: {
    title: 'DBMS — Entity Relationship (ER) Diagram',
    description: 'An ER diagram models a database schema. Rectangles = Entities (tables), Ovals = Attributes (columns), Diamonds = Relationships. Cardinality labels (1, N, M) describe how many instances of one entity relate to another.',
    category: 'DBMS',
    components: [
      { id:'student', name:'STUDENT entity', role:'Table storing student data. PK = StudentID.' },
      { id:'course',  name:'COURSE entity',  role:'Table storing course data. PK = CourseID.' },
      { id:'enroll',  name:'ENROLLS (M:N)',  role:'A student can enroll in many courses; a course can have many students.' },
      { id:'prof',    name:'PROFESSOR',      role:'Teacher entity. Linked to courses via TEACHES relationship.' },
      { id:'teaches', name:'TEACHES (1:N)',  role:'One professor teaches many courses.' },
      { id:'sid',     name:'StudentID (PK)', role:'Primary key — uniquely identifies each student record.' },
      { id:'cid',     name:'CourseID (PK)',  role:'Primary key — uniquely identifies each course.' },
    ],
    steps: [
      { ids:['student','sid','sname'], label:'STUDENT entity', explain:'STUDENT has a primary key (StudentID) and attribute Name. Each row in the Students table has a unique StudentID.' },
      { ids:['course','cid','ctitle'], label:'COURSE entity',  explain:'COURSE has PK CourseID and attribute Title.' },
      { ids:['student','enroll','course'], label:'M:N Enroll', explain:'A student can enroll in many courses AND a course can have many students — Many-to-Many relationship.' },
      { ids:['prof','teaches','course'],   label:'1:N Teaches', explain:'One professor teaches many courses — One-to-Many.' },
    ],
    operations: [],
  },
};

// ── HashMap ───────────────────────────────────────────────────────────
PRESETS['hashmap'] = PRESETS['hash table'] = PRESETS['hash map'] = {
  nodes: [
    n('input','key "apple"',  60,  160, 'io',       'Input key to be stored or looked up.'),
    n('hash', 'hash(key)',    220, 160, 'control',  'Hash function: converts key to integer index. O(1) time.'),
    n('b0',   'Bucket [0]',   400, 60,  'data',     'Bucket 0: stores keys that hash to index 0.'),
    n('b1',   'Bucket [1]',   400, 130, 'data',     'Bucket 1: stores keys that hash to index 1.'),
    n('b2',   'Bucket [2]',   400, 200, 'active',   'Bucket 2: "apple" hashes to index 2 in this example.'),
    n('b3',   'Bucket [3]',   400, 270, 'data',     'Bucket 3: empty in this example.'),
    n('b4',   'Bucket [4]',   400, 340, 'data',     'Bucket 4: could hold colliding keys via chaining.'),
    n('chain','→ "apricot"',  570, 200, 'internal', 'Collision: "apricot" also hashes to bucket 2. Stored as a linked list (chaining).'),
  ],
  edges: [
    e('e1','input','hash','O(1)'),
    e('e2','hash','b2','index=2',true,'#F5A868'),
    e('e3','b2','chain','chain',false,'#C9B8F5'),
  ],
  meta: {
    title: 'HashMap (Hash Table)',
    description: 'A HashMap stores key-value pairs using a hash function to compute an array index (bucket). Average O(1) insert, lookup, and delete. Collisions (two keys mapping to the same bucket) are handled via chaining (linked list) or open addressing.',
    category: 'Data Structures',
    components: [
      { id:'input', name:'Key "apple"',   role:'The key to insert/lookup. Can be any hashable type.' },
      { id:'hash',  name:'Hash Function', role:'Deterministic function: same key → same index every time. E.g., index = hashCode(key) % capacity.' },
      { id:'b2',    name:'Bucket [2]',    role:'"apple" maps to index 2. The value is stored here.' },
      { id:'chain', name:'"apricot"',     role:'Collision — also maps to bucket 2. Added as next node in chain.' },
    ],
    steps: [
      { ids:['input'],         label:'Key provided',      explain:'User calls put("apple", value). Key = "apple".' },
      { ids:['input','hash'],  label:'Hash computed',     explain:'hash("apple") → integer → mod table size → index 2.' },
      { ids:['hash','b2'],     label:'Store in bucket',   explain:'"apple" and its value stored in Bucket[2]. Lookup is also O(1).' },
      { ids:['b2','chain'],    label:'Collision: chain',  explain:'"apricot" also maps to index 2. Appended to linked list in bucket 2.' },
    ],
    operations: ['put','get','remove'],
  },
};

// ── Cloud Computing ───────────────────────────────────────────────────
PRESETS['cloud computing'] = PRESETS['cloud'] = {
  nodes: [
    n('user',   'Users / Devices',  80,  220, 'io',      'End users accessing cloud services via browser, mobile, or API.'),
    n('cdn',    'CDN',              240, 130, 'network', 'Content Delivery Network — serves static assets from edge servers.'),
    n('lb',     'Load Balancer',    240, 310, 'control', 'Distributes incoming requests across multiple server instances.'),
    n('web1',   'Web Server 1',     420, 220, 'process', 'Handles HTTP requests. Stateless — can be horizontally scaled.'),
    n('web2',   'Web Server 2',     420, 320, 'process', 'Redundant web server for high availability.'),
    n('cache',  'Cache (Redis)',     580, 160, 'active',  'In-memory cache — returns frequently requested data without DB hit.'),
    n('db',     'Database',         580, 300, 'storage', 'Persistent data store (SQL or NoSQL). Accessed only on cache miss.'),
    n('obj',    'Object Storage',   420, 420, 'data',    'Stores files, images, backups (e.g., AWS S3, GCS).'),
    n('mon',    'Monitoring',       240, 420, 'leaf',    'Tracks metrics, logs, and alerts (e.g., CloudWatch, Datadog).'),
  ],
  edges: [
    e('e1','user','cdn',   'static'),
    e('e2','user','lb',    'dynamic'),
    e('e3','lb','web1',    'route'),
    e('e4','lb','web2',    'route'),
    e('e5','web1','cache', 'read'),
    e('e6','web1','db',    'write',false,'#C9B8F5'),
    e('e7','cache','db',   'miss',false,'#F5A868'),
    e('e8','web2','obj',   'upload'),
    e('e9','web1','mon',   'metrics'),
  ],
  meta: {
    title: 'Cloud Computing Architecture',
    description: 'A modern cloud architecture separates concerns across multiple components: CDN for static content, load balancers for traffic distribution, stateless web servers for processing, caching for performance, and a database for persistence.',
    category: 'Cloud Computing',
    components: [
      { id:'user',  name:'Users',         role:'Make HTTP requests. Can be millions of concurrent users.' },
      { id:'cdn',   name:'CDN',           role:'Serves JS, CSS, images from edge locations near the user. Reduces latency.' },
      { id:'lb',    name:'Load Balancer', role:'Round-robin or least-connections routing to web servers. Enables scaling.' },
      { id:'web1',  name:'Web Server',    role:'Runs application logic. Stateless — shares no in-memory state between requests.' },
      { id:'cache', name:'Redis Cache',   role:'Key-value store. Returns data in microseconds. Reduces DB load by 90%+.' },
      { id:'db',    name:'Database',      role:'Source of truth. Slower than cache but durable and consistent.' },
    ],
    steps: [
      { ids:['user','cdn'],         label:'Static Request',  explain:'User\'s browser requests images/CSS. CDN responds from nearest edge server. Fast!' },
      { ids:['user','lb'],          label:'API Request',     explain:'Browser sends API request. Hits the Load Balancer.' },
      { ids:['lb','web1'],          label:'Routed to Server',explain:'LB routes to Web Server 1 (least busy). Server processes request.' },
      { ids:['web1','cache'],       label:'Cache Lookup',    explain:'Server checks Redis cache first. Cache HIT → return immediately.' },
      { ids:['cache','db'],         label:'Cache Miss',      explain:'Data not in cache → query database. Store result in cache for next time.' },
    ],
    operations: [],
  },
};

// ── AI/ML — Neural Network ────────────────────────────────────────────
PRESETS['neural network'] = PRESETS['ai'] = PRESETS['machine learning'] = PRESETS['ml'] = PRESETS['deep learning'] = {
  nodes: [
    n('i1','x₁',  60,  80,  'io',      'Input feature 1 (e.g., pixel value, age).'),
    n('i2','x₂',  60,  200, 'io',      'Input feature 2.'),
    n('i3','x₃',  60,  320, 'io',      'Input feature 3.'),
    n('h1','h₁',  260, 120, 'process', 'Hidden neuron 1. Applies ReLU(w·x + b).'),
    n('h2','h₂',  260, 240, 'process', 'Hidden neuron 2. Learns non-linear combinations of inputs.'),
    n('h3','h₃',  260, 360, 'process', 'Hidden neuron 3.'),
    n('o1','ŷ₁',  460, 160, 'active',  'Output neuron 1. E.g., probability of class A (sigmoid/softmax).'),
    n('o2','ŷ₂',  460, 280, 'active',  'Output neuron 2. Probability of class B.'),
    n('loss','Loss ℒ', 620, 220, 'control','Loss function (cross-entropy or MSE). Measures prediction error.'),
  ],
  edges: [
    e('i1h1','i1','h1'), e('i1h2','i1','h2'), e('i1h3','i1','h3'),
    e('i2h1','i2','h1'), e('i2h2','i2','h2'), e('i2h3','i2','h3'),
    e('i3h1','i3','h1'), e('i3h2','i3','h2'), e('i3h3','i3','h3'),
    e('h1o1','h1','o1'), e('h1o2','h1','o2'),
    e('h2o1','h2','o1'), e('h2o2','h2','o2'),
    e('h3o1','h3','o1'), e('h3o2','h3','o2'),
    e('o1l','o1','loss',false), e('o2l','o2','loss',true,'#F5A868'),
  ],
  meta: {
    title: 'Neural Network (Feedforward)',
    description: 'A feedforward neural network consists of an input layer, one or more hidden layers, and an output layer. Each neuron computes a weighted sum of its inputs, adds a bias, and passes it through an activation function (e.g., ReLU). Training uses backpropagation to minimize a loss function.',
    category: 'AI / Machine Learning',
    components: [
      { id:'i1',   name:'Input x₁',       role:'Raw feature fed into the network. No computation happens here.' },
      { id:'h1',   name:'Hidden neuron h₁', role:'Computes ReLU(w₁x₁ + w₂x₂ + w₃x₃ + b). Learns a feature detector.' },
      { id:'o1',   name:'Output ŷ₁',      role:'Final prediction. Sigmoid gives probability ∈ (0,1).' },
      { id:'loss', name:'Loss Function',   role:'Measures how wrong the prediction is. Gradient flows backward through this to update weights.' },
    ],
    steps: [
      { ids:['i1','i2','i3'],         label:'Input Layer',      explain:'Raw data (e.g., image pixels) fed into input neurons. No transformation here.' },
      { ids:['h1','h2','h3'],         label:'Hidden Layer',     explain:'Each hidden neuron computes: activation(Σ wᵢxᵢ + b). ReLU = max(0, x).' },
      { ids:['o1','o2'],              label:'Output Layer',     explain:'Softmax converts outputs to probabilities summing to 1. Argmax gives predicted class.' },
      { ids:['loss'],                 label:'Compute Loss',     explain:'Compare prediction ŷ with true label y. Cross-entropy: -Σ y·log(ŷ).' },
      { ids:['loss','h1','h2','h3'],  label:'Backpropagation', explain:'Chain rule propagates gradients backward. Each weight updated: w -= lr·∂L/∂w.' },
    ],
    operations: [],
  },
};

// ════════════════════════════════════════════════════════════════════
//  PRESET LOOKUP
// ════════════════════════════════════════════════════════════════════

const TOPIC_CHIPS = [
  { label:'Binary Tree',       key:'binary tree',       emoji:'🌳' },
  { label:'BST',               key:'bst',               emoji:'🔍' },
  { label:'Binary Search',     key:'binary search',     emoji:'🎯' },
  { label:'Stack',             key:'stack',             emoji:'📚' },
  { label:'Queue',             key:'queue',             emoji:'🚶' },
  { label:'Linked List',       key:'linked list',       emoji:'🔗' },
  { label:'Graph / BFS',       key:'bfs',               emoji:'🕸️' },
  { label:'DFS',               key:'dfs',               emoji:'🕳️' },
  { label:'Bubble Sort',       key:'bubble sort',       emoji:'🫧' },
  { label:'HashMap',           key:'hashmap',           emoji:'#️⃣' },
  { label:'OS Process States', key:'process states',    emoji:'💻' },
  { label:'OSI / Networks',    key:'osi model',         emoji:'🌐' },
  { label:'DBMS / ER',         key:'dbms',              emoji:'🗄️' },
  { label:'Cloud Arch',        key:'cloud computing',   emoji:'☁️' },
  { label:'Neural Network',    key:'neural network',    emoji:'🧠' },
];

function getPreset(topic) {
  const raw = topic.toLowerCase();
  // Remove punctuation for matching but keep spaces
  const key = raw.replace(/[^a-z0-9 ]/g, '').trim();

  // 1. Exact key match
  if (PRESETS[key]) return PRESETS[key];

  // 2. Substring / keyword fuzzy match — handles long natural-language prompts
  //    like "Generate a flowchart showing how binary search finds 23..."
  const keywordsMap = [
    { match: ['binary search'],             preset: PRESETS['bst'] },          // BST has search steps
    { match: ['binary tree'],               preset: PRESETS['binary tree'] },
    { match: ['bst', 'binary search tree'], preset: PRESETS['bst'] },
    { match: ['stack', 'lifo'],             preset: PRESETS['stack'] },
    { match: ['queue', 'fifo'],             preset: PRESETS['queue'] },
    { match: ['linked list', 'linkedlist'], preset: PRESETS['linked list'] },
    { match: ['bubble sort', 'bubblesort'], preset: PRESETS['bubble sort'] },
    { match: ['bfs', 'breadth first', 'breadth-first'], preset: PRESETS['bfs'] },
    { match: ['dfs', 'depth first', 'depth-first'],     preset: PRESETS['dfs'] },
    { match: ['graph'],                     preset: PRESETS['graph'] },
    { match: ['hash map', 'hashmap', 'hash table'], preset: PRESETS['hashmap'] },
    { match: ['osi', 'network layer', 'computer network'], preset: PRESETS['osi model'] },
    { match: ['operating system', 'process state', 'os'],  preset: PRESETS['operating system'] },
    { match: ['dbms', 'database', 'er diagram', 'entity'], preset: PRESETS['dbms'] },
    { match: ['cloud', 'aws', 'microservice'],             preset: PRESETS['cloud computing'] },
    { match: ['neural network', 'deep learning', 'machine learning', 'ai/ml'], preset: PRESETS['neural network'] },
  ];

  for (const { match, preset } of keywordsMap) {
    if (match.some(kw => raw.includes(kw))) return preset;
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════
//  GENERALIZED AI DIAGRAM GENERATION
//  Any topic the user types → structured JSON → React Flow
// ════════════════════════════════════════════════════════════════════

/**
 * Detect what kind of diagram best suits the topic so we can hint the AI.
 * Returns one of: flowchart | tree | graph | sequence | layered |
 *                 architecture | concept | process | comparison
 */
function detectDiagramType(topic) {
  const t = topic.toLowerCase();
  if (/sort|search|find|binary search|linear search|hash/.test(t))            return 'flowchart';
  if (/tree|trie|heap|bst|avl|red.black|b.tree/.test(t))                     return 'tree';
  if (/graph|bfs|dfs|dijkstra|prim|kruskal|topological|mst/.test(t))         return 'graph';
  if (/tcp|http|request|response|handshake|dns|protocol|api call/.test(t))   return 'sequence';
  if (/osi|layer|network model|internet/.test(t))                             return 'layered';
  if (/cloud|microservice|architecture|system design|kubernetes|docker/.test(t)) return 'architecture';
  if (/cpu scheduling|deadlock|memory|os |operating system|process state/.test(t)) return 'process';
  if (/photosynthesis|water cycle|digestive|lifecycle|biology|chemistry/.test(t)) return 'process';
  if (/normalization|sql join|er diagram|database|relational/.test(t))        return 'concept';
  if (/recursion|dynamic program|greedy|backtrack/.test(t))                   return 'flowchart';
  if (/neural network|machine learning|deep learning|cnn|rnn|transformer/.test(t)) return 'layered';
  if (/vs |compare|difference between|trade.off/.test(t))                     return 'comparison';
  return 'concept'; // safe default for anything else
}

/**
 * Build a rich, context-aware prompt that strongly constrains the AI
 * to return ONLY a JSON object — nothing else.
 */
const AI_PROMPT = (topic) => {
  const dtype = detectDiagramType(topic);
  const hint = {
    flowchart:    'Use a top-to-bottom flowchart with START, decision diamonds, process boxes, and END.',
    tree:         'Use a hierarchical tree layout: root at top, children below, leaves at the bottom.',
    graph:        'Use a network graph: nodes are vertices, edges are connections with direction arrows.',
    sequence:     'Use a left-to-right sequence: actors/components across the top, messages as horizontal arrows flowing downward.',
    layered:      'Stack layers vertically, each layer as a wide node. Arrows show data flow between layers.',
    architecture: 'Use a block/component diagram: services/modules as boxes, data flows as labelled arrows.',
    process:      'Show state or phase transitions as a left-to-right or circular flow.',
    concept:      'Use a concept map: central idea in the middle, related concepts branching outward.',
    comparison:   'Show two parallel columns comparing the two concepts, with connecting arrows for shared traits.',
  }[dtype] || 'Choose the clearest layout for this topic.';

  return `You are a computer science and educational diagram generator. Your ONLY job is to output a single valid JSON object — no prose, no markdown, no explanation before or after.

Generate a detailed, accurate diagram for: "${topic}"

Diagram layout hint: ${hint}

Output this EXACT JSON structure (fill in all fields with real content about the topic):
{"title":"<descriptive title>","description":"<2-3 sentences explaining what this diagram shows and why it matters>","category":"<Data Structures|Algorithms|Operating Systems|Networks|DBMS|Cloud|AI/ML|Science|General>","diagramType":"${dtype}","nodes":[{"id":"<short_id>","label":"<concise node label>","x":<60-700>,"y":<40-480>,"nodeType":"<root|internal|leaf|process|data|control|io|storage|network|layer|component|active|default>","description":"<one sentence: what this node is and what it does>"}],"edges":[{"id":"<eid>","source":"<node_id>","target":"<node_id>","label":"<short verb or label>","animated":<true|false>}],"components":[{"id":"<node_id>","name":"<component name>","role":"<detailed explanation of this component's purpose and how it connects to others>"}],"steps":[{"ids":["<node_id>"],"label":"<step title>","explain":"<full sentence explaining what happens at this step, with a concrete example if possible>"}]}

Hard rules — violation means failure:
1. Return ONLY the JSON object. No text before {, no text after }.
2. Use 6-12 nodes. More nodes = more value.
3. Every node id in edges must exist in nodes.
4. steps must have 5-8 entries covering the full process start to finish.
5. components array must have one entry per node.
6. x values: 60-700. y values: 40-500. Space nodes out so they do not overlap.
7. Do not repeat the instructions back to me. Do not explain what you are doing.
8. nodeType must be one of: root internal leaf process data control io storage network layer component active default`;
};

/**
 * Safely extract the first valid JSON object from an arbitrary string.
 * Handles: raw JSON, markdown fences, prose wrapping, truncated responses.
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') throw new Error('Empty response from server.');

  const trimmed = text.trim();

  // 1. Markdown code fence: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) { /* fall through */ }
  }

  // 2. Raw JSON (ideal path)
  if (trimmed.startsWith('{')) {
    try { return JSON.parse(trimmed); } catch (_) { /* fall through */ }
  }

  // 3. JSON buried inside prose — find first { and walk to matching }
  const start = trimmed.indexOf('{');
  if (start !== -1) {
    let depth = 0, inStr = false, escape = false;
    for (let i = start; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inStr) { escape = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(trimmed.slice(start, i + 1)); } catch (_) { break; }
        }
      }
    }
  }

  // 4. Nothing worked
  const preview = trimmed.slice(0, 200).replace(/\n/g, ' ');
  console.error('[diagramEngine] Non-JSON from /api/ai/raw:', trimmed.slice(0, 600));
  throw new Error(
    `AI returned non-JSON output. Preview: "${preview}"  ` +
    `— If no API key is set, the mock always returns valid JSON; ` +
    `check that Spring Boot is running on port 8080.`
  );
}

/** Convert raw AI-parsed object → React Flow nodes + edges + meta */
function aiParsedToFlow(parsed, topic) {
  const nodes = (parsed.nodes || []).map(nd => ({
    id: String(nd.id),
    type: 'custom',
    position: { x: Number(nd.x) || 100, y: Number(nd.y) || 100 },
    data: {
      label: nd.label || String(nd.id),
      nodeType: nd.nodeType || 'default',
      color: NODE_COLORS[nd.nodeType] || NODE_COLORS.default,
      description: nd.description || '',
    },
  }));

  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = (parsed.edges || [])
    .filter(ed => nodeIds.has(String(ed.source)) && nodeIds.has(String(ed.target)))
    .map(ed => ({
      id: String(ed.id),
      source: String(ed.source),
      target: String(ed.target),
      label: ed.label || '',
      ...edgeStyle('#1A1A1A', !!ed.animated),
      labelStyle: { fontWeight: 700, fontSize: 11 },
      labelBgStyle: { fill: '#FFF8E7', fillOpacity: 0.9 },
    }));

  return {
    nodes, edges,
    meta: {
      title: parsed.title || topic,
      description: parsed.description || '',
      category: parsed.category || 'General',
      diagramType: parsed.diagramType || 'concept',
      components: (parsed.components || []).map(c => ({ ...c, id: String(c.id) })),
      steps: (parsed.steps || []).map(s => ({
        ...s,
        ids: (s.ids || []).map(String),
      })),
      operations: [],
    },
  };
}

async function fetchAIDiagram(topic) {
  let text = '';
  try {
    const response = await fetch(`${BASE_URL}/api/ai/raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: AI_PROMPT(topic) }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status} ${response.statusText}. Make sure Spring Boot is running on port 8080.`);
    }

    text = await response.text();
  } catch (networkErr) {
    console.error('[diagramEngine] Network error:', networkErr);
    throw new Error(
      `Cannot reach the backend (${BASE_URL}). Make sure Spring Boot is running on port 8080. (${networkErr.message})`
    );
  }

  const parsed = extractJSON(text);
  return aiParsedToFlow(parsed, topic);
}

// ════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════════

/**
 * buildDiagram(topic, { forceAI })
 *
 * forceAI = false (default): use preset for exact chip matches, AI for everything else
 * forceAI = true:            always call the AI (used by Regenerate button)
 *
 * This means ANY topic the user types goes to the AI.
 * Chips provide presets only when clicked directly.
 */
export async function buildDiagram(topic, { forceAI = false } = {}) {
  if (!forceAI) {
    const preset = getPreset(topic);
    if (preset) return preset;
  }
  return fetchAIDiagram(topic);
}

export { TOPIC_CHIPS, getPreset, detectDiagramType };
