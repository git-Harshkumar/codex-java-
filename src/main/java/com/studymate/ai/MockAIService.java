package com.studymate.ai;

import com.studymate.model.Diagram;
import com.studymate.model.Quiz;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MockAIService implements AIService {

    @Override
    public void setApiKey(String key) {
        // Mock does not use API key
    }

    @Override
    public String ask(String question) {
        String q = question == null ? "" : question.toLowerCase().trim();

        if ((q.equals("hi") || q.equals("hello") || q.equals("hey")) || 
            (!q.contains("follow-up:") && (q.contains("hi") || q.contains("hello") || q.contains("hey")) && q.length() < 30)) {
            return "Hello there! I am StudyMate AI, your dedicated computer science and software engineering learning companion. What concept or problem would you like to explore today?";
        }

        if (q.contains("graph")) {
            return "A Graph is a non-linear data structure consisting of vertices (nodes) and edges that connect pairs of vertices.\n\n" +
                   "- Representation: Usually implemented via an Adjacency List (memory-efficient for sparse graphs) or Adjacency Matrix (fast edge lookups).\n" +
                   "- Traversal: Explored using Breadth-First Search (BFS) for shortest paths in unweighted graphs or Depth-First Search (DFS) for backtracking and cycle detection.\n" +
                   "- Real-world applications: Social networks (followers), Google Maps (road networks), and recommendation algorithms.\n\n" +
                   "Tip: Always clarify whether the graph is directed vs. undirected, and weighted vs. unweighted!";
        }

        if (q.contains("jvm")) {
            return "The Java Virtual Machine (JVM) is the runtime engine that executes compiled Java bytecode (.class files).\n\n" +
                   "- Key Components: Class Loader, Bytecode Verifier, Execution Engine (Interpreter + JIT Compiler), and Garbage Collector.\n" +
                   "- Memory Areas: Heap (objects), Stack (method frames), Method Area/Metaspace (class metadata), and PC Registers.\n" +
                   "- Why it matters: JVM enables 'Write Once, Run Anywhere' (WORA) by abstracting away the underlying operating system.";
        }

        if (q.contains("bfs") || q.contains("breadth-first") || q.contains("breadth first")) {
            return "Breadth-First Search (BFS)\n\n" +
                   "BFS is an algorithm for searching a tree or graph data structure. It starts at the tree root (or an arbitrary node of a graph) and explores all nodes at the present depth prior to moving on to the nodes at the next depth level.\n\n" +
                   "INTUITION / ANALOGY\n" +
                   "Think of a stone dropped in a pond. The ripples spread outward in concentric circles. BFS does the same thing, exploring all immediate neighbors first before going deeper.\n\n" +
                   "KEY POINTS\n" +
                   "- Uses a Queue (FIFO) data structure to keep track of nodes to visit.\n" +
                   "- Guaranteed to find the shortest path in an unweighted graph.\n" +
                   "- Time Complexity: O(V + E) where V is vertices and E is edges.\n\n" +
                   "EXAMPLE CODE (Java)\n" +
                   "```java\n" +
                   "Queue<Integer> queue = new LinkedList<>();\n" +
                   "queue.add(startNode);\n" +
                   "visited.add(startNode);\n" +
                   "while(!queue.isEmpty()) {\n" +
                   "    int current = queue.poll();\n" +
                   "    for(int neighbor : graph.get(current)) {\n" +
                   "        if(!visited.contains(neighbor)) {\n" +
                   "            queue.add(neighbor);\n" +
                   "            visited.add(neighbor);\n" +
                   "        }\n" +
                   "    }\n" +
                   "}\n" +
                   "```";
        }

        // Extract the main concept from the question (naive approach for the mock)
        String topic = question.replace("explain", "").replace("what is", "").replace("how does", "").replace("work", "").replace("me", "").replace("with proper example", "").trim();
        if (topic.isEmpty()) topic = question.trim();
        String capitalizedTopic = topic.substring(0, 1).toUpperCase() + (topic.length() > 1 ? topic.substring(1) : "");

        return "DEFINITION: " + capitalizedTopic + "\n\n" +
               "You asked about: \"" + question + "\"\n\n" +
               capitalizedTopic + " is a fundamental concept in software engineering and computer science, essential for writing clean, efficient, and maintainable software.\n\n" +
               "INTUITION\nThink of it as a proven design pattern or structural blueprint - it sets clear rules for how data moves and transforms throughout an application.\n\n" +
               "KEY TAKEAWAYS\n- Master the core invariants and rules before optimizing.\n- Consider edge cases such as empty inputs, boundaries, and scalability.\n- Practice tracing through examples step by step.\n\n" +
               "NOTE: I am currently running in Mock AI Mode because no valid Gemini API Key was found or the backend needs to be restarted after adding .env. For fully dynamic responses, ensure your API key is configured and restart the server!\n\n" +
               "TIP: You can test this topic in Topic Explainer or verify code snippets in Code Explainer!";
    }

    @Override
    public String rawPrompt(String prompt) {
        String p = prompt == null ? "" : prompt;
        
        // Extract code snippet if present
        String code = "";
        Pattern codePattern = Pattern.compile("```(?:[a-zA-Z]*\\n)?([\\s\\S]*?)```");
        Matcher codeMatcher = codePattern.matcher(p);
        if (codeMatcher.find()) {
            code = codeMatcher.group(1).trim();
        } else {
            int codeIndex = p.indexOf("Code:\n");
            if (codeIndex != -1) {
                code = p.substring(codeIndex + 6).trim();
            } else {
                code = p;
            }
        }

        // Detect requested mode
        String mode = "explain";
        String lowerPrompt = p.toLowerCase();
        if (lowerPrompt.contains("find bugs") || lowerPrompt.contains("logic errors") || lowerPrompt.contains("potential runtime issues")) {
            mode = "bugs";
        } else if (lowerPrompt.contains("optimize") || lowerPrompt.contains("performance, quality") || lowerPrompt.contains("idiomatic style")) {
            mode = "optimize";
        } else if (lowerPrompt.contains("time and space") || lowerPrompt.contains("time & space") || lowerPrompt.contains("big-o")) {
            mode = "complexity";
        }

        return analyzeCodeDetailed(code, mode);
    }

    @Override
    public String explainCode(String code, String language) {
        return analyzeCodeDetailed(code, "explain");
    }

    private String analyzeCodeDetailed(String code, String mode) {
        String c = code == null ? "" : code.trim();
        String lowerCode = c.toLowerCase();

        // Detect characteristics of the code
        boolean hasLoop = lowerCode.contains("for ") || lowerCode.contains("for(") || lowerCode.contains("while ") || lowerCode.contains("while(");
        boolean hasNestedLoop = lowerCode.matches("(?s).*for.*for.*") || lowerCode.matches("(?s).*while.*while.*") || lowerCode.matches("(?s).*for.*while.*");
        boolean hasRecursion = lowerCode.contains("return ") && (lowerCode.contains("dfs") || lowerCode.contains("solve") || lowerCode.contains("helper") || lowerCode.matches("(?s).*(\\b[a-zA-Z_0-9]+\\b)\\s*\\(.*\\1\\s*\\(.*"));
        boolean isBinarySearch = lowerCode.contains("binarysearch") || (lowerCode.contains("lo") && lowerCode.contains("hi") && lowerCode.contains("mid"));
        boolean isSort = lowerCode.contains("sort") || lowerCode.contains("bubble") || lowerCode.contains("swap");
        boolean isGraphOrTree = lowerCode.contains("node") || lowerCode.contains("adj") || lowerCode.contains("edge") || lowerCode.contains("vertex") || lowerCode.contains("root");

        if ("bugs".equals(mode)) {
            StringBuilder sb = new StringBuilder();
            sb.append("### CODE QUALITY & BUG ANALYSIS\n\n");
            sb.append("A thorough review was conducted across logic flow, boundary conditions, and edge cases:\n\n");
            
            sb.append("#### 1. Potential Issues & Edge Cases Found\n");
            if (isBinarySearch) {
                sb.append("- **Integer Overflow in Midpoint Calculation**: Using `(lo + hi) / 2` can overflow in languages like Java or C++ if `lo + hi > Integer.MAX_VALUE`. Use `lo + (hi - lo) / 2` instead.\n");
                sb.append("- **Off-by-One in Search Boundary**: Verify loop termination condition (`lo <= hi` vs `lo < hi`) and boundary adjustments (`mid + 1`, `mid - 1`) to avoid infinite loops.\n");
            } else if (hasNestedLoop) {
                sb.append("- **Loop Bounds & Off-By-One Errors**: Ensure loop index limits (e.g. `i < length` vs `i <= length - 1`) do not throw `IndexOutOfBoundsException` or `ArrayIndexOutOfBoundsException`.\n");
                sb.append("- **Unchecked Null or Empty Collections**: Iterating without checking `arr != null` or `arr.length == 0` can trigger null pointer exceptions.\n");
            } else {
                sb.append("- **Input Validation**: No guard clause exists for `null`, empty, or unexpected input values. Always validate inputs at the method boundary.\n");
                sb.append("- **Variable Scope & Mutability**: Check whether shared state or mutable references could lead to unintended side effects.\n");
            }
            sb.append("- **Resource / Exception Handling**: Ensure all exceptions or error states are explicitly handled or propagated rather than silently swallowed.\n\n");

            sb.append("#### 2. Recommended Fixes\n");
            sb.append("- Add guard clauses at the beginning of the function: `if (input == null || input.isEmpty()) return default;`\n");
            sb.append("- Replace raw index calculations with safe library utilities or checked arithmetic.\n");
            sb.append("- Write unit tests specifically targeting: empty input, single element, boundary values, and negative inputs.");
            return sb.toString();
        }

        if ("optimize".equals(mode)) {
            StringBuilder sb = new StringBuilder();
            sb.append("### PERFORMANCE & REFACTORING RECOMMENDATIONS\n\n");
            
            sb.append("#### 1. Algorithmic Optimizations\n");
            if (hasNestedLoop) {
                sb.append("• **Reduce O(n²) Complexity**: The nested loop results in quadratic runtime. Consider using a `HashSet` or `HashMap` to achieve O(n) linear lookups instead of nested linear scans.\n");
            } else if (isBinarySearch) {
                sb.append("• **Cache-Friendly Access**: Ensure elements are accessed in contiguous memory order. For repeated queries, build a direct index or sorted table.\n");
            } else {
                sb.append("• **Pre-allocate Memory**: When building collections or lists, initialize capacities in advance to avoid frequent dynamic resizing.\n");
            }
            sb.append("• **Early Exit**: Terminate loops or recursion as soon as the desired condition or target is found.\n\n");

            sb.append("#### 2. Code Quality & Idiomatic Improvements\n");
            sb.append("• Use expressive, intent-revealing variable names rather than single-letter identifiers.\n");
            sb.append("• Leverage modern language features (such as Streams, list comprehensions, or pattern matching) for concise readability.\n");
            sb.append("• Mark variables as immutable (`final` or `const`) where re-assignment is not required.");
            return sb.toString();
        }

        if ("complexity".equals(mode)) {
            StringBuilder sb = new StringBuilder();
            sb.append("### TIME & SPACE COMPLEXITY BREAKDOWN\n\n");

            if (isBinarySearch) {
                sb.append("#### Time Complexity: O(log n)\n");
                sb.append("• **Best Case**: O(1) when the target element is located at the initial midpoint.\n");
                sb.append("• **Average & Worst Case**: O(log n). Each iteration divides the search space in half. For an array of size n, the loop runs at most ⌈log₂ n⌉ + 1 times.\n\n");
                sb.append("#### Space Complexity: O(1)\n");
                sb.append("• Only a constant number of pointer variables (`lo`, `hi`, `mid`) are used. Auxiliary space is O(1) for the iterative implementation.");
            } else if (hasNestedLoop) {
                sb.append("#### Time Complexity: O(n²)\n");
                sb.append("• **Worst Case**: The outer loop runs n times, and for each iteration, the inner loop runs up to n times, producing n × n = O(n²) operations.\n");
                sb.append("• **Best Case**: O(n) if an early break occurs on the first pass, otherwise O(n²).\n\n");
                sb.append("#### Space Complexity: O(1)\n");
                sb.append("• Uses constant auxiliary storage assuming in-place operations, or O(n) if auxiliary arrays are allocated.");
            } else if (hasLoop) {
                sb.append("#### Time Complexity: O(n)\n");
                sb.append("• Performs a single linear traversal over the input elements. Each element is visited a constant number of times.\n\n");
                sb.append("#### Space Complexity: O(1)\n");
                sb.append("• Operates with constant auxiliary space without creating duplicate structures.");
            } else {
                sb.append("#### Time Complexity: O(1)\n");
                sb.append("• Executes a bounded sequence of instructions with no unbounded loops or recursive depth.\n\n");
                sb.append("#### Space Complexity: O(1)\n");
                sb.append("• Constant auxiliary memory usage.");
            }
            return sb.toString();
        }

        // Default: "explain" mode - Break down code into sequential chunks with code blocks and explanations
        StringBuilder sb = new StringBuilder();
        sb.append("### 1. HIGH-LEVEL OVERVIEW\n");
        if (isBinarySearch) {
            sb.append("This code implements the **Binary Search** algorithm. It locates a target value in a pre-sorted dataset in logarithmic time by repeatedly dividing the search interval in half.\n\n");
        } else if (isSort) {
            sb.append("This code implements an **array sorting algorithm**. It systematically iterates through elements and reorders them into ascending sequence.\n\n");
        } else if (isGraphOrTree) {
            sb.append("This code traverses and processes a **hierarchical or graph data structure**, navigating through connected nodes and managing visited state.\n\n");
            sb.append("This code implements a deterministic routine that takes input data, executes structured operations and conditional checks, and returns the computed result.\n\n");
        }

        sb.append("### 2. CHUNK-BY-CHUNK CODE BREAKDOWN\n\n");

        if (isBinarySearch) {
            sb.append("#### Chunk 1: Search Window Initialization\n");
            sb.append("```java\nint lo = 0, hi = arr.length - 1;\n```\n");
            sb.append("**What is happening in this chunk:**\n");
            sb.append("- **Boundary Pointers**: Initializes `lo` to index `0` (the first element) and `hi` to `arr.length - 1` (the last element).\n");
            sb.append("- **Active Search Interval**: Together, the interval `[lo, hi]` establishes the active window in which the target element may reside.\n\n");

            sb.append("#### Chunk 2: Loop Condition & Midpoint Calculation\n");
            sb.append("```java\nwhile (lo <= hi) {\n    int mid = lo + (hi - lo) / 2;\n```\n");
            sb.append("**What is happening in this chunk:**\n");
            sb.append("- **Loop Invariant**: The `while (lo <= hi)` condition guarantees that execution continues as long as there is at least one candidate element left to inspect.\n");
            sb.append("- **Overflow-Safe Midpoint**: Computes the middle index `mid`. Using `lo + (hi - lo) / 2` instead of `(lo + hi) / 2` prevents integer arithmetic overflow for large arrays.\n\n");

            sb.append("#### Chunk 3: Comparison & Space Halving\n");
            sb.append("```java\n    if (arr[mid] == target) return mid;\n    else if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n}\n```\n");
            sb.append("**What is happening in this chunk:**\n");
            sb.append("- **Target Found**: If `arr[mid] == target`, it immediately returns `mid` with no further iterations required.\n");
            sb.append("- **Discard Left**: If `arr[mid] < target`, the target is greater than the middle element. Because the array is sorted, everything to the left is also smaller, so `lo` advances to `mid + 1`.\n");
            sb.append("- **Discard Right**: If `arr[mid] > target`, everything to the right is larger, so `hi` decreases to `mid - 1`.\n\n");

            sb.append("#### Chunk 4: Sentinel Fallback Return\n");
            sb.append("```java\nreturn -1;\n```\n");
            sb.append("**What is happening in this chunk:**\n");
            sb.append("- **Exhaustion**: If the loop exits because `lo > hi`, the entire search interval was checked and no matching element was found.\n");
            sb.append("- **Not Found Indicator**: Returns `-1` to explicitly indicate to the caller that the target does not exist in the collection.\n\n");

            sb.append("### 3. STEP-BY-STEP EXECUTION TRACE\n");
            sb.append("Given `arr = [2, 5, 8, 12, 16, 23, 38, 56]` and `target = 23`:\n");
            sb.append("1. **Pass 1**: `lo = 0, hi = 7` -> `mid = 3` (`arr[3] = 12`). Since `12 < 23`, set `lo = 4`.\n");
            sb.append("2. **Pass 2**: `lo = 4, hi = 7` -> `mid = 5` (`arr[5] = 23`). Match found! Returns index `5`.\n\n");
        } else {
            // General chunking algorithm for any arbitrary user code
            String[] rawLines = c.split("\r?\n");
            java.util.List<String> lines = new java.util.ArrayList<>();
            for (String l : rawLines) {
                if (!l.trim().isEmpty()) lines.add(l);
            }

            if (lines.size() <= 3) {
                for (int i = 0; i < lines.size(); i++) {
                    sb.append("#### Chunk ").append(i + 1).append(": Line ").append(i + 1).append(" Execution\n");
                    sb.append("```\n").append(lines.get(i)).append("\n```\n");
                    sb.append("**What is happening in this chunk:**\n");
                    sb.append("- Executes `").append(lines.get(i).trim()).append("` to evaluate expressions and adjust state.\n\n");
                }
            } else {
                int total = lines.size();
                int c1End = Math.max(1, total / 3);
                int c2End = Math.max(c1End + 1, (2 * total) / 3);

                // Chunk 1: Setup & Initialization
                sb.append("#### Chunk 1: Setup & Variable Initialization\n```\n");
                for (int i = 0; i < c1End; i++) sb.append(lines.get(i)).append("\n");
                sb.append("```\n**What is happening in this chunk:**\n");
                sb.append("- Declares and prepares primary variables, references, or method signatures.\n");
                sb.append("- Establishes baseline state before main processing begins.\n\n");

                // Chunk 2: Core Processing & Logic
                sb.append("#### Chunk 2: Core Processing & Logic Flow\n```\n");
                for (int i = c1End; i < c2End; i++) sb.append(lines.get(i)).append("\n");
                sb.append("```\n**What is happening in this chunk:**\n");
                sb.append("- Drives the central algorithm or control structure (loops, conditionals, or transformations).\n");
                sb.append("- Continuously processes input data and updates accumulator or pointer state.\n\n");

                // Chunk 3: Finalization & Result Handling
                sb.append("#### Chunk 3: Finalization & Result Handling\n```\n");
                for (int i = c2End; i < total; i++) sb.append(lines.get(i)).append("\n");
                sb.append("```\n**What is happening in this chunk:**\n");
                sb.append("- Resolves final state, checks exit boundary conditions, or returns the computed outcome.\n");
                sb.append("- Handles termination cleanly and yields the result back to caller.\n\n");
            }

            sb.append("### 3. STEP-BY-STEP EXECUTION TRACE\n");
            sb.append("- **Entry**: Input parameters are passed and initial state is established in Chunk 1.\n");
            sb.append("- **Execution**: Operations iteratively transform and evaluate conditions across Chunk 2.\n");
            sb.append("- **Completion**: Chunk 3 finalizes data and returns the expected result or modified structure.\n\n");
        }

        sb.append("### 4. TIME & SPACE COMPLEXITY\n");
        if (isBinarySearch) {
            sb.append("- **Time Complexity**: O(log n) -- halving the interval each iteration.\n");
            sb.append("- **Space Complexity**: O(1) -- operates in-place using constant auxiliary variables.\n\n");
        } else if (hasNestedLoop) {
            sb.append("- **Time Complexity**: O(n^2) -- quadratic time from nested iteration.\n");
            sb.append("- **Space Complexity**: O(1) in-place or O(n) if auxiliary structures are created.\n\n");
        } else if (hasLoop) {
            sb.append("- **Time Complexity**: O(n) -- linear scan across elements.\n");
            sb.append("- **Space Complexity**: O(1) auxiliary space.\n\n");
        } else {
            sb.append("- **Time Complexity**: O(1) -- constant time execution.\n");
            sb.append("- **Space Complexity**: O(1) -- constant auxiliary memory.\n\n");
        }

        sb.append("### 5. BEST PRACTICES & SUMMARY\n");
        sb.append("- Ensure strict validation against empty, null, or out-of-range inputs before running core logic.\n");
        sb.append("- Keep variable scopes as localized as possible to avoid side effects across chunks.");
        return sb.toString();
    }

    @Override
    public String explainTopic(String topic, String level) {
        String t = topic == null ? "" : topic.toLowerCase().trim();
        String lvlTag = level == null ? "Beginner" : level;

        // --- GRAPH ---
        if (t.contains("graph")) {
            return "📌 DEFINITION\n" +
                "A Graph is a versatile non-linear data structure consisting of a finite set of vertices (or nodes) and a collection of edges that connect pairs of vertices. Graphs represent arbitrary networks and relationships where elements can have many-to-many connections.\n\n" +
                "💡 INTUITION / ANALOGY\n" +
                "Think of an airline flight map. Every airport is a vertex (node), and every direct flight between two cities is an edge. If a flight goes only one way (e.g. due to wind routes), it's a directed edge; if it goes both ways, it's undirected. If flights have flight hours attached, it's a weighted graph.\n\n" +
                "🔑 KEY POINTS\n" +
                "• Vertices (Nodes) & Edges: V is the set of items; E is the set of connections between them.\n" +
                "• Directed vs. Undirected: Directed edges have arrows (A → B); undirected edges are bidirectional (A — B).\n" +
                "• Weighted vs. Unweighted: Edges can have associated costs, distances, or capacities.\n" +
                "• Adjacency List: Stores neighbors for each vertex using lists. Highly space-efficient: O(V + E) memory, best for sparse graphs.\n" +
                "• Adjacency Matrix: 2D array where matrix[u][v] indicates edge existence. Fast O(1) edge checks, but O(V²) memory.\n" +
                "• Breadth-First Search (BFS): Traverses level-by-level using a Queue. Ideal for shortest paths in unweighted graphs.\n" +
                "• Depth-First Search (DFS): Explores as deep as possible along each branch before backtracking using a Stack or recursion. Ideal for cycle detection and topological sorting.\n\n" +
                "📦 REAL WORLD EXAMPLES\n" +
                "• Google Maps / GPS: Roads are edges with travel time weights; Dijkstra's algorithm finds the fastest route.\n" +
                "• Social Networks: Friends on Facebook are an undirected graph; followers on X/Instagram are a directed graph.\n" +
                "• Web Crawlers: Web pages are nodes, hyperlinks are directed edges, traversed via BFS/DFS.\n" +
                "• Recommendation Engines: 'People who bought X also bought Y' is built on bipartite graph traversal.\n\n" +
                "⚡ ADVANCED DETAILS [" + lvlTag + "]\n" +
                "• Cycle Detection: In directed graphs, DFS tracks nodes currently in the recursion stack (back-edges).\n" +
                "• Shortest Path Algorithms: Dijkstra (O((V + E) log V) with PriorityQueue, non-negative weights), Bellman-Ford (O(VE), handles negative weights), Floyd-Warshall (O(V³), all-pairs).\n" +
                "• Minimum Spanning Tree (MST): Kruskal's algorithm (Disjoint Set / Union-Find) and Prim's algorithm find the minimum weight tree connecting all vertices.\n\n" +
                "💻 CODE EXAMPLE (Java - Adjacency List BFS)\n" +
                "```java\n" +
                "import java.util.*;\n\n" +
                "public class GraphBFS {\n" +
                "    private int vertices;\n" +
                "    private List<List<Integer>> adj;\n\n" +
                "    public GraphBFS(int v) {\n" +
                "        this.vertices = v;\n" +
                "        adj = new ArrayList<>();\n" +
                "        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());\n" +
                "    }\n\n" +
                "    public void addEdge(int u, int v) {\n" +
                "        adj.get(u).add(v);\n" +
                "        adj.get(v).add(u); // undirected\n" +
                "    }\n\n" +
                "    public void bfs(int start) {\n" +
                "        boolean[] visited = new boolean[vertices];\n" +
                "        Queue<Integer> queue = new LinkedList<>();\n\n" +
                "        visited[start] = true;\n" +
                "        queue.add(start);\n\n" +
                "        while (!queue.isEmpty()) {\n" +
                "            int node = queue.poll();\n" +
                "            System.out.print(node + \" \");\n\n" +
                "            for (int neighbor : adj.get(node)) {\n" +
                "                if (!visited[neighbor]) {\n" +
                "                    visited[neighbor] = true;\n" +
                "                    queue.add(neighbor);\n" +
                "                }\n" +
                "            }\n" +
                "        }\n" +
                "    }\n" +
                "}\n" +
                "```";
        }

        // --- TREE / BST ---
        if (t.contains("tree") || t.contains("bst")) {
            return "DEFINITION\n" +
                "A Tree is a hierarchical, acyclic data structure consisting of nodes connected by edges, starting from a single Root node. A Binary Search Tree (BST) is a binary tree where for every node, values in its left subtree are strictly smaller, and values in its right subtree are strictly greater.\n\n" +
                "INTUITION / ANALOGY\n" +
                "Think of a corporate organization chart. The CEO is at the root. Beneath the CEO are VP directors, and under them are managers and individual contributors. Each person reports to exactly one direct manager (single parent), and there are no circular loops.\n\n" +
                "KEY POINTS\n" +
                "- Root, Leaves & Height: The top node is the root; nodes with no children are leaves. The height is the longest path from root to leaf.\n" +
                "- BST Property: Left < Root < Right. An Inorder Traversal (Left, Root, Right) of a BST visits elements in sorted ascending order!\n" +
                "- Traversals: Preorder (Root-L-R), Inorder (L-Root-R), Postorder (L-R-Root), and Level-order (BFS).\n" +
                "- Balanced vs. Unbalanced: Balanced trees (AVL, Red-Black) guarantee O(log n) search, insert, and delete. A skewed tree degenerates into an O(n) linked list.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- File Systems: Folders and files form a hierarchical tree (e.g. `/usr/local/bin`).\n" +
                "- DOM (Document Object Model): Web browsers parse HTML into a DOM tree of elements.\n" +
                "- Databases & Compilers: Relational DBs use B-Trees for indexing; compilers build Abstract Syntax Trees (ASTs) to parse code.\n\n" +
                "ADVANCED DETAILS [" + lvlTag + "]\n" +
                "- Self-balancing Trees: AVL trees enforce strict balance via single/double rotations. Red-Black trees enforce coloring rules with fewer rotations during inserts.\n" +
                "- Trie (Prefix Tree): Specialized tree for fast string search and auto-complete in O(k) time where k is word length.\n\n" +
                "CODE EXAMPLE (Java)\n" +
                "```java\n" +
                "class TreeNode {\n" +
                "    int val;\n" +
                "    TreeNode left, right;\n" +
                "    TreeNode(int v) { this.val = v; }\n" +
                "}\n\n" +
                "boolean searchBST(TreeNode root, int target) {\n" +
                "    if (root == null) return false;\n" +
                "    if (root.val == target) return true;\n" +
                "    return target < root.val ? searchBST(root.left, target) : searchBST(root.right, target);\n" +
                "}\n" +
                "```";
        }

        // --- STACK / QUEUE ---
        if (t.contains("stack") || t.contains("queue")) {
            return "DEFINITION\n" +
                "A Stack is a linear data structure following the LIFO (Last-In, First-Out) principle, where insertions and removals occur at the same end (the top). A Queue follows the FIFO (First-In, First-Out) principle, where elements enter at the rear and exit from the front.\n\n" +
                "INTUITION / ANALOGY\n" +
                "- Stack: A stack of cafeteria plates. You place clean plates on the top, and take plates off the top.\n" +
                "- Queue: A line of customers at a movie ticket counter. The first person to arrive is the first person served.\n\n" +
                "KEY POINTS\n" +
                "- Stack Operations: `push(x)` to add, `pop()` to remove, `peek()` to inspect top element -- all O(1) time.\n" +
                "- Queue Operations: `enqueue(x)` / `offer(x)` to add at rear, `dequeue()` / `poll()` to remove from front -- all O(1) time.\n" +
                "- Stacks manage execution context: Method call stack, recursion tracking, undo/redo mechanisms, and parentheses matching.\n" +
                "- Queues manage scheduling: Task dispatchers, message brokers, CPU scheduling, and breadth-first search.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- Browser Back Button: Uses a stack to remember recently visited URLs.\n" +
                "- Printer Spooler: Documents sent to print wait in a queue in the order submitted.\n" +
                "- Messaging Systems: RabbitMQ and Kafka implement queue-based consumer architectures.";
        }

        // --- HASHMAP / HASH TABLE ---
        if (t.contains("hash") || t.contains("map") || t.contains("dictionary")) {
            return "DEFINITION\n" +
                "A Hash Table (or HashMap) is an associative data structure that stores key-value pairs. It uses a Hash Function to compute an integer index from a key, mapping it directly to an underlying bucket array for near-instant retrieval.\n\n" +
                "INTUITION / ANALOGY\n" +
                "Imagine a coat check room with numbered hooks. When you hand your coat over, a ticket number is assigned using a deterministic rule. To retrieve your coat later, you present your ticket and the clerk walks straight to that hook without inspecting every coat in the room.\n\n" +
                "KEY POINTS\n" +
                "- Time Complexity: O(1) average time for `get()`, `put()`, and `remove()`. Worst case O(n) during catastrophic hash collisions.\n" +
                "- Hash Function: Transforms arbitrary keys into uniform integer indices.\n" +
                "- Collision Resolution: Chaining (linked lists or balanced trees in buckets) vs. Open Addressing (linear probing, quadratic probing).\n" +
                "- Load Factor: Threshold (typically 0.75 in Java) determining when the bucket array doubles in size and rehashes.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- Database Indexing: Fast primary key lookups.\n" +
                "- Caching (Redis/Memcached): Key-value storage for blazing fast web cache lookups.\n" +
                "- Counting Frequencies: Finding unique visitors, word frequencies, or solving Two-Sum in O(n) time.";
        }

        // --- LINKED LIST ---
        if (t.contains("linked list") || t.contains("linkedlist")) {
            return "DEFINITION\n" +
                "A Linked List is a linear collection of data elements called Nodes, where each node stores a data value and a pointer (reference) pointing to the next node in the sequence. Unlike arrays, nodes are not stored in contiguous memory locations.\n\n" +
                "INTUITION / ANALOGY\n" +
                "Think of a scavenger hunt. Clue #1 doesn't tell you where every prize is -- it only tells you where Clue #2 is hidden. Clue #2 points to Clue #3, and so on. You must visit each clue in order to reach the final treasure.\n\n" +
                "KEY POINTS\n" +
                "- Singly vs. Doubly Linked: Singly has `next` pointer; Doubly has both `next` and `prev` pointers.\n" +
                "- Dynamic Size: Can grow or shrink on demand without expensive array resizing or memory copying.\n" +
                "- Insertion/Deletion: O(1) if pointer to the target node is known, compared to O(n) element shifting in arrays.\n" +
                "- Access Time: O(n) sequential traversal; does NOT support O(1) random indexing like `arr[i]`.\n" +
                "- Extra Memory: Requires additional memory for node reference pointers.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- Music Player Playlist: Next/Previous track navigation using Doubly Linked Lists.\n" +
                "- LRU Cache: Combines a HashMap with a Doubly Linked List for O(1) evictions.\n" +
                "- Memory Allocators: Operating system free-lists track available memory blocks via linked lists.";
        }

        // --- JVM ---
        if (t.contains("jvm") || t.contains("java virtual machine")) {
            return "DEFINITION\n" +
                "The Java Virtual Machine (JVM) is an abstract computing machine that enables a computer to run Java programs. It is the heart of the \"Write Once, Run Anywhere\" philosophy - you compile your Java code once into bytecode, and the JVM on any platform executes it.\n\n" +
                "INTUITION / ANALOGY\n" +
                "Think of the JVM like a universal translator at the United Nations. A speaker gives a speech in English (Java source code). The translator converts it into a neutral form (bytecode). Then, local interpreters in each country re-deliver the message in their own language (the native OS). The original speaker only needed to say it once.\n\n" +
                "KEY POINTS\n" +
                "- Platform Independence - JVM abstracts away OS differences. The same .class bytecode runs on Windows, Linux, and macOS.\n" +
                "- Class Loader - Loads .class files into memory dynamically at runtime.\n" +
                "- Bytecode Verifier - Checks bytecode for security and safety before execution.\n" +
                "- Execution Engine - Contains the Interpreter (executes bytecode line by line) and the JIT Compiler (compiles hot paths to native machine code for speed).\n" +
                "- Garbage Collector - Automatically manages memory; frees unused objects so developers avoid manual pointer deallocations.\n" +
                "- Runtime Data Areas - Includes Heap (object storage), Stack (method call frames), Method Area (class metadata), and PC Register.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- Android's ART VM is heavily inspired by JVM architecture.\n" +
                "- Apache Kafka and Elasticsearch are JVM-based distributed engines handling petabytes in production.\n" +
                "- JIT compilation enables long-running Java services to reach near-C++ execution speeds once warmed up.\n\n" +
                "ADVANCED DETAILS [" + lvlTag + "]\n" +
                "- HotSpot JVM uses tiered compilation: Tier 1 (C1 - fast compile, less optimized) -> Tier 4 (C2 - slow compile, highly optimized).\n" +
                "- G1GC (Garbage First GC) is default in Java 9+; it partitions heap into regions for low-pause collection.\n" +
                "- Modern ZGC and Shenandoah deliver sub-millisecond GC pause times even on multi-terabyte heaps.";
        }

        // --- OOP ---
        if (t.contains("oop") || t.contains("object oriented") || t.contains("object-oriented")) {
            return "DEFINITION\n" +
                "Object-Oriented Programming (OOP) is a programming paradigm that organizes software design around 'objects' -- encapsulated entities that bundle data (attributes) and behavior (methods) together.\n\n" +
                "INTUITION / ANALOGY\n" +
                "Think of a Car factory. The blueprint is the `Car` class. When the factory manufactures a vehicle, it produces an actual `Car` object with specific attributes (red color, 4 doors) and methods (accelerate, brake). You drive the car through simple pedals (interfaces) without managing the internal engine combustion directly (abstraction).\n\n" +
                "KEY POINTS\n" +
                "- Encapsulation: Keeping fields private and exposing controlled public getters/setters to guard internal state.\n" +
                "- Inheritance: Mechanism where child classes derive state and behavior from a parent class (`class Dog extends Animal`).\n" +
                "- Polymorphism: Ability of different classes to respond to the same method call in their own way (method overriding & overloading).\n" +
                "- Abstraction: Hiding implementation details behind simple interfaces and abstract classes.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- Java Collections: `List<String> list = new ArrayList<>()` is polymorphism in action.\n" +
                "- UI Toolkits: Every button, slider, and text field extends a base `Component` or `View` class.\n" +
                "- Game Development: Entities like `Player`, `Enemy`, and `NPC` inherit from a base `GameObject`.";
        }

        // --- BINARY SEARCH ---
        if (t.contains("binary search") && !t.contains("tree")) {
            return "DEFINITION\n" +
                "Binary Search is an optimal divide-and-conquer algorithm that finds the position of a target value within a sorted array by repeatedly halving the search space.\n\n" +
                "INTUITION / ANALOGY\n" +
                "Imagine guessing a secret number between 1 and 100. If you guess 50 and the host says 'Higher', you eliminate 1 through 50 immediately! Your next guess is 75. Instead of guessing 100 times, you find any number in at most 7 guesses.\n\n" +
                "KEY POINTS\n" +
                "- Pre-condition: The collection MUST be sorted in advance.\n" +
                "- Time Complexity: O(log n) time. Searching through 1,000,000,000 items takes only ~30 comparisons!\n" +
                "- Space Complexity: O(1) auxiliary space for iterative implementations.\n" +
                "- Integer Overflow Protection: Calculate midpoint as `mid = lo + (hi - lo) / 2` to avoid 32-bit integer overflow.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- Git Bisect: Automatically uses binary search across commit history to locate the exact commit that introduced a regression.\n" +
                "- Database B-Tree Index Lookups: Binary search navigates keys inside disk pages.\n" +
                "- Computational Geometry & Graphics: Finding ray-surface intersections.";
        }

        // --- SORTING ALGORITHMS ---
        if (t.contains("sort")) {
            return "DEFINITION\n" +
                "Sorting Algorithms rearrange elements of a list or array into a specific order (numerical or lexicographical). Common paradigms include comparison-based sorting (QuickSort, MergeSort, HeapSort) and non-comparison sorting (Counting Sort, Radix Sort).\n\n" +
                "INTUITION / ANALOGY\n" +
                "Think of sorting a hand of playing cards. With Insertion Sort, you pick one card at a time and slide it into its correct position among the cards you already hold. With Merge Sort, you split the deck in half, sort each half, and zip them together.\n\n" +
                "KEY POINTS\n" +
                "- Comparison Lower Bound: Any comparison-based sort has a theoretical lower bound of Omega(n log n).\n" +
                "- MergeSort: Guaranteed O(n log n) time, stable, requires O(n) auxiliary memory. Preferred for linked lists and external sorting.\n" +
                "- QuickSort: O(n log n) average, O(n^2) worst-case (mitigated with random pivot). Highly cache-efficient in-place sort.\n" +
                "- Stability: A sorting algorithm is stable if it preserves the relative order of duplicate elements.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- TimSort: Hybrid of MergeSort and InsertionSort used in Python (`sorted()`) and Java (`Arrays.sort()` for objects).\n" +
                "- E-commerce Filters: Sorting products by price, rating, or release date.\n" +
                "- Database Query Execution: Executing `ORDER BY` and merge-join query plans.";
        }

        // --- DYNAMIC PROGRAMMING / RECURSION ---
        if (t.contains("dynamic programming") || t.contains("dp") || t.contains("recursion")) {
            return "DEFINITION\n" +
                "Dynamic Programming (DP) is an algorithmic optimization technique that solves complex problems by breaking them down into simpler overlapping subproblems, solving each subproblem only once, and storing the results for future reference (memoization or tabulation).\n\n" +
                "INTUITION / ANALOGY\n" +
                "Write '1 + 1 + 1 + 1 + 1' on a piece of paper. What is that? '5'. Now add another '+ 1' to the end. What is it now? '6'. How did you know it was 6 so quickly? Because you remembered that the first part was 5 -- you didn't recount from 1. That is Dynamic Programming.\n\n" +
                "KEY POINTS\n" +
                "- Two Essential Properties: Optimal Substructure (optimal solution contains optimal sub-solutions) and Overlapping Subproblems.\n" +
                "- Top-Down (Memoization): Uses recursion with a lookup cache (hash map or array) to avoid recomputation.\n" +
                "- Bottom-Up (Tabulation): Iteratively builds solutions starting from base cases in a table.\n" +
                "- Classic Problems: Fibonacci numbers, 0/1 Knapsack, Longest Common Subsequence (LCS), Coin Change.\n\n" +
                "REAL WORLD EXAMPLES\n" +
                "- Diff Tools: Git `diff` uses the Longest Common Subsequence DP algorithm to highlight code changes.\n" +
                "- DNA Sequence Alignment: Bioinformatic tools use the Needleman-Wunsch DP algorithm to compare genetic sequences.\n" +
                "- Speech Recognition & NLP: Hidden Markov Models use the Viterbi DP algorithm to decode speech signals.";
        }

        // --- DYNAMIC GENERATOR FOR ANY OTHER TOPIC ---
        String cleanTopic = topic.trim();
        String capitalizedTopic = cleanTopic.substring(0, 1).toUpperCase() + (cleanTopic.length() > 1 ? cleanTopic.substring(1) : "");

        return "DEFINITION\n" +
            capitalizedTopic + " is an important concept in Computer Science and Software Engineering. It provides structured principles, algorithms, or abstractions designed to solve complex computational and architectural problems efficiently.\n\n" +
            "INTUITION / ANALOGY\n" +
            "Think of " + cleanTopic + " like a specialized tool in an engineer's toolkit. Rather than building solutions from scratch with ad-hoc workarounds, " + cleanTopic + " provides an established, battle-tested standard that yields predictable results, modularity, and high performance.\n\n" +
            "KEY POINTS [" + lvlTag + " Level]\n" +
            "- Core Principle: Involves clear inputs, defined transformation rules, and deterministic outputs.\n" +
            "- Architectural Role: Minimizes coupling, optimizes resource consumption, and improves system maintainability.\n" +
            "- Performance Tradeoffs: Balances time complexity versus space overhead based on real-world constraints.\n" +
            "- Best Practice: Thoroughly test boundary conditions, validate edge inputs, and follow idiomatic coding standards.\n\n" +
            "REAL WORLD USE CASES\n" +
            "- Widely adopted in enterprise backend services, scalable cloud systems, and data pipelines.\n" +
            "- Frequently featured in technical system design reviews and coding interviews.\n" +
            "- Serves as a building block for advanced high-throughput architectures.\n\n" +
            "ADVANCED DETAILS [" + lvlTag + "]\n" +
            "- Focus on invariants and scalability bottlenecks when scaling " + cleanTopic + " to millions of requests.\n" +
            "- Analyze failure recovery and fault-tolerance guarantees in distributed settings.";
    }

    @Override
    public Quiz generateQuiz(String topic, String difficulty, int count) {
        String t = topic == null ? "" : topic.toLowerCase();
        Quiz quiz = new Quiz();
        quiz.setTopic(topic);
        quiz.setDifficulty(difficulty);

        if (t.contains("graph")) {
            Quiz.Question q1 = new Quiz.Question();
            q1.setText("Which algorithm is best suited for finding the shortest path in an unweighted graph?");
            q1.setOptions(Arrays.asList("Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Kruskal's Algorithm", "Binary Search"));
            q1.setCorrectAnswer("Breadth-First Search (BFS)");
            q1.setExplanation("BFS visits nodes level by level, guaranteeing the shortest path in unweighted graphs.");

            Quiz.Question q2 = new Quiz.Question();
            q2.setText("What is the space complexity of an Adjacency Matrix for a graph with V vertices?");
            q2.setOptions(Arrays.asList("O(V)", "O(V + E)", "O(V^2)", "O(E^2)"));
            q2.setCorrectAnswer("O(V^2)");
            q2.setExplanation("An adjacency matrix allocates a 2D array of size V x V.");

            Quiz.Question q3 = new Quiz.Question();
            q3.setText("Which data structure is typically used to implement Depth-First Search iteratively?");
            q3.setOptions(Arrays.asList("Queue", "Stack", "Priority Queue", "Binary Heap"));
            q3.setCorrectAnswer("Stack");
            q3.setExplanation("DFS relies on LIFO traversal, which maps directly to a Stack (or the call stack).");

            quiz.setQuestions(adjustQuestionCount(List.of(q1, q2, q3), count, topic));
            return quiz;
        }

        if (t.contains("tree") || t.contains("bst")) {
            Quiz.Question q1 = new Quiz.Question();
            q1.setText("In a Binary Search Tree (BST), where are the smaller values located relative to a node?");
            q1.setOptions(Arrays.asList("Left child", "Right child", "Parent node", "Anywhere"));
            q1.setCorrectAnswer("Left child");
            q1.setExplanation("By definition, a BST maintains smaller values in the left subtree.");
            
            Quiz.Question q2 = new Quiz.Question();
            q2.setText("Which tree traversal visits nodes in sorted ascending order for a BST?");
            q2.setOptions(Arrays.asList("Preorder", "Postorder", "Inorder", "Level-order"));
            q2.setCorrectAnswer("Inorder");
            q2.setExplanation("Inorder traversal visits Left-Root-Right, which processes elements in ascending order in a BST.");
            
            Quiz.Question q3 = new Quiz.Question();
            q3.setText("What is the time complexity of searching in a perfectly balanced Binary Search Tree?");
            q3.setOptions(Arrays.asList("O(1)", "O(n)", "O(log n)", "O(n^2)"));
            q3.setCorrectAnswer("O(log n)");
            q3.setExplanation("A balanced tree halves the search space at each level, resulting in O(log n) complexity.");
            
            quiz.setQuestions(adjustQuestionCount(List.of(q1, q2, q3), count, topic));
            return quiz;
        }

        if (t.contains("bfs") || t.contains("breadth")) {
            Quiz.Question q1 = new Quiz.Question();
            q1.setText("Which data structure is fundamentally used to implement Breadth-First Search (BFS)?");
            q1.setOptions(Arrays.asList("Stack", "Queue", "Priority Queue", "HashMap"));
            q1.setCorrectAnswer("Queue");
            q1.setExplanation("BFS explores nodes level by level, making a FIFO Queue the perfect structure to track the next nodes to visit.");

            Quiz.Question q2 = new Quiz.Question();
            q2.setText("Is BFS guaranteed to find the shortest path in an unweighted graph?");
            q2.setOptions(Arrays.asList("Yes", "No", "Only if it is directed", "Only if there are no cycles"));
            q2.setCorrectAnswer("Yes");
            q2.setExplanation("Since BFS explores all nodes at distance 'k' before moving to distance 'k+1', the first time it reaches a target, it is guaranteed to be the shortest path.");

            Quiz.Question q3 = new Quiz.Question();
            q3.setText("What is the time complexity of BFS on a graph represented as an adjacency list?");
            q3.setOptions(Arrays.asList("O(V)", "O(E)", "O(V + E)", "O(V^2)"));
            q3.setCorrectAnswer("O(V + E)");
            q3.setExplanation("BFS visits every vertex once and checks every edge, taking O(V + E) time.");

            quiz.setQuestions(adjustQuestionCount(List.of(q1, q2, q3), count, topic));
            return quiz;
        }

        // Dynamic Default Quiz for arbitrary topics
        String cleanTopic = topic == null || topic.isEmpty() ? "this topic" : topic.trim();
        String capitalizedTopic = cleanTopic.substring(0, 1).toUpperCase() + (cleanTopic.length() > 1 ? cleanTopic.substring(1) : "");

        Quiz.Question q1 = new Quiz.Question();
        q1.setText("What is the primary purpose of " + capitalizedTopic + " in software engineering?");
        q1.setOptions(Arrays.asList("To improve system performance and organization", "To slow down execution", "To increase memory leaks", "To bypass security constraints"));
        q1.setCorrectAnswer("To improve system performance and organization");
        q1.setExplanation(capitalizedTopic + " is a core concept designed to solve specific computational or structural problems efficiently.");

        Quiz.Question q2 = new Quiz.Question();
        q2.setText("When implementing " + cleanTopic + ", what is a crucial edge case to consider?");
        q2.setOptions(Arrays.asList("Empty or null inputs", "The color of the IDE", "The name of the developer", "Using tabs vs spaces"));
        q2.setCorrectAnswer("Empty or null inputs");
        q2.setExplanation("Always validate boundary conditions, unexpected nulls, and out-of-range inputs when working with " + cleanTopic + ".");

        Quiz.Question q3 = new Quiz.Question();
        q3.setText("Which of the following is considered a best practice for " + cleanTopic + "?");
        q3.setOptions(Arrays.asList("Ignoring failure recovery", "Thoroughly testing boundary conditions", "Removing all code comments", "Writing everything in one massive function"));
        q3.setCorrectAnswer("Thoroughly testing boundary conditions");
        q3.setExplanation("Robust implementations of " + cleanTopic + " require extensive testing against unexpected states.");

        quiz.setQuestions(adjustQuestionCount(List.of(q1, q2, q3), count, topic));
        return quiz;
    }

    private List<Quiz.Question> adjustQuestionCount(List<Quiz.Question> original, int count, String topic) {
        if (count <= 0) count = 5;
        List<Quiz.Question> result = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            Quiz.Question q = original.get(i % original.size());
            Quiz.Question clone = new Quiz.Question();
            clone.setText(q.getText() + (i >= original.size() ? " (Review)" : ""));
            clone.setOptions(new java.util.ArrayList<>(q.getOptions()));
            clone.setCorrectAnswer(q.getCorrectAnswer());
            clone.setExplanation(q.getExplanation());
            result.add(clone);
        }
        return result;
    }

    @Override
    public Diagram generateDiagram(String topic) {
        String t = topic == null ? "" : topic.toLowerCase();
        String diagramText;

        if (t.contains("graph")) {
            diagramText = "       (A)\n      /   \\\n    (B)---(C)\n     |     |\n    (D)---(E)\n\n[Graph - Vertices & Edges]";
        } else if (t.contains("tree") || t.contains("bst")) {
            diagramText = "          50\n        /    \\\n      30      70\n     /  \\    /  \\\n   20   40  60   80\n\n[Binary Search Tree]";
        } else if (t.contains("stack")) {
            diagramText = "┌─────────┐\n│  TOP    │\n├─────────┤\n│   30    │\n├─────────┤\n│   20    │\n├─────────┤\n│   10    │\n└─────────┘\n\n[Stack - LIFO]";
        } else if (t.contains("queue")) {
            diagramText = "FRONT -> [ 10 | 20 | 30 | 40 ] -> REAR\n\n[Queue - FIFO]";
        } else if (t.contains("list") || t.contains("linked")) {
            diagramText = "[10] -> [20] -> [30] -> [40] -> [NULL]\n\n[Singly Linked List]";
        } else {
            diagramText = "[" + topic + "]\n\nVisualization available for: Graph, Binary Tree, Stack, Queue, Linked List";
        }

        return new Diagram("TEXT", diagramText);
    }
}
