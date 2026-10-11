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
        String lp = p.toLowerCase();

        // ── Diagram JSON detection (broadened) ───────────────────────────
        // New frontend prompt contains: "Generate a detailed, accurate diagram for:"
        // Old frontend prompt contained: "generate a diagram for the topic"
        // Both patterns must be caught so any version of the frontend works.
        boolean isDiagramRequest =
            lp.contains("generate a detailed, accurate diagram for:") ||
            lp.contains("generate a diagram for the topic") ||
            lp.contains("generate a diagram for:") ||
            (lp.contains("diagram") && lp.contains("output this exact json")) ||
            (lp.contains("diagram") && lp.contains("return only a valid json")) ||
            (lp.contains("diagram") && lp.contains("return only the json"));

        if (isDiagramRequest) {
            // Extract topic — new prompt format: "diagram for: \"<topic>\""
            // Old format: "topic \"<topic>\""
            String topic = "";
            Pattern[] patterns = {
                Pattern.compile("diagram for:\\s*\"([^\"]+)\""),
                Pattern.compile("diagram for the topic\\s*\"([^\"]+)\""),
                Pattern.compile("topic\\s*\"([^\"]+)\""),
                Pattern.compile("Generate[^\"]*\"([^\"]{3,80})\""),
            };
            for (Pattern pat : patterns) {
                Matcher m = pat.matcher(p);
                if (m.find()) { topic = m.group(1).trim(); break; }
            }
            if (topic.isEmpty()) topic = "Algorithm";
            return buildMockDiagramJson(topic);
        }

        // ── Code analysis (original behaviour) ───────────────────────────
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

        String mode = "explain";
        if (lp.contains("find bugs") || lp.contains("logic errors") || lp.contains("potential runtime issues")) {
            mode = "bugs";
        } else if (lp.contains("optimize") || lp.contains("performance, quality") || lp.contains("idiomatic style")) {
            mode = "optimize";
        } else if (lp.contains("time and space") || lp.contains("time & space") || lp.contains("big-o")) {
            mode = "complexity";
        }

        return analyzeCodeDetailed(code, mode);
    }

    /**
     * Generates a valid JSON string for the diagram visualizer mock.
     * Covers 20+ topic families; falls back to a generic concept map.
     */
    private String buildMockDiagramJson(String topic) {
        String t = topic.toLowerCase();

        // ── Quick Sort ───────────────────────────────────────────────────
        if (t.contains("quick sort") || t.contains("quicksort")) {
            return "{\"title\":\"Quick Sort\",\"description\":\"Quick Sort is a divide-and-conquer sorting algorithm. It picks a pivot element, partitions the array so all elements smaller than the pivot are on the left and larger on the right, then recursively sorts each half. Average O(n log n), worst O(n²).\",\"category\":\"Algorithms\",\"diagramType\":\"flowchart\",\"nodes\":[{\"id\":\"start\",\"label\":\"START\\nArray: [10,7,8,9,1,5]\",\"x\":300,\"y\":30,\"nodeType\":\"root\",\"description\":\"Input unsorted array. Quick Sort will sort it in-place.\"},{\"id\":\"pivot\",\"label\":\"Choose Pivot\",\"x\":300,\"y\":120,\"nodeType\":\"control\",\"description\":\"Select pivot element (commonly last element). Here pivot = 5.\"},{\"id\":\"partition\",\"label\":\"Partition Array\",\"x\":300,\"y\":210,\"nodeType\":\"active\",\"description\":\"Rearrange: elements < pivot go left, elements > pivot go right. Pivot lands in final position.\"},{\"id\":\"left\",\"label\":\"Left Sub-array\\n[1] < pivot\",\"x\":150,\"y\":310,\"nodeType\":\"process\",\"description\":\"All elements smaller than pivot. Recursively apply Quick Sort.\"},{\"id\":\"pivotpos\",\"label\":\"Pivot in Place\\n5 at index 2\",\"x\":300,\"y\":310,\"nodeType\":\"leaf\",\"description\":\"Pivot is now in its correct sorted position. Never moved again.\"},{\"id\":\"right\",\"label\":\"Right Sub-array\\n[7,8,9,10] > pivot\",\"x\":480,\"y\":310,\"nodeType\":\"process\",\"description\":\"All elements larger than pivot. Recursively apply Quick Sort.\"},{\"id\":\"recurse\",\"label\":\"Recurse on Both\",\"x\":300,\"y\":400,\"nodeType\":\"internal\",\"description\":\"Each sub-array is sorted independently via the same pivot + partition logic.\"},{\"id\":\"done\",\"label\":\"Sorted Array\\n[1,5,7,8,9,10]\",\"x\":300,\"y\":480,\"nodeType\":\"storage\",\"description\":\"All sub-arrays of size 1 — merge back. Array is fully sorted.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"start\",\"target\":\"pivot\",\"label\":\"begin\"},{\"id\":\"e2\",\"source\":\"pivot\",\"target\":\"partition\",\"label\":\"partition around pivot\",\"animated\":true},{\"id\":\"e3\",\"source\":\"partition\",\"target\":\"left\",\"label\":\"< pivot\"},{\"id\":\"e4\",\"source\":\"partition\",\"target\":\"pivotpos\",\"label\":\"= pivot\"},{\"id\":\"e5\",\"source\":\"partition\",\"target\":\"right\",\"label\":\"> pivot\"},{\"id\":\"e6\",\"source\":\"left\",\"target\":\"recurse\"},{\"id\":\"e7\",\"source\":\"right\",\"target\":\"recurse\"},{\"id\":\"e8\",\"source\":\"recurse\",\"target\":\"done\",\"label\":\"all partitions size 1\"}],\"components\":[{\"id\":\"start\",\"name\":\"Input Array\",\"role\":\"Unsorted input passed to quickSort(). Sorted in-place, O(1) extra space.\"},{\"id\":\"pivot\",\"name\":\"Pivot Selection\",\"role\":\"Choosing last element as pivot. Other strategies: first, median-of-three, random.\"},{\"id\":\"partition\",\"name\":\"Partition Step\",\"role\":\"Core operation. Uses two-pointer technique. O(n) per level. Pivot placed in correct index.\"},{\"id\":\"left\",\"name\":\"Left Sub-array\",\"role\":\"Elements < pivot. Recursively sorted. Base case: size 0 or 1.\"},{\"id\":\"pivotpos\",\"name\":\"Pivot Position\",\"role\":\"Pivot is in its final sorted index. Contributes to sorted output without further moves.\"},{\"id\":\"right\",\"name\":\"Right Sub-array\",\"role\":\"Elements > pivot. Recursively sorted.\"},{\"id\":\"recurse\",\"name\":\"Recursive Calls\",\"role\":\"quickSort(arr, lo, pi-1) and quickSort(arr, pi+1, hi). Depth O(log n) average.\"},{\"id\":\"done\",\"name\":\"Sorted Output\",\"role\":\"After all recursive calls return: array fully sorted in ascending order.\"}],\"steps\":[{\"ids\":[\"start\"],\"label\":\"Input\",\"explain\":\"Array [10,7,8,9,1,5] passed to quickSort(0, 5).\"},{\"ids\":[\"pivot\"],\"label\":\"Pick Pivot\",\"explain\":\"Pivot = arr[hi] = 5. We will partition around 5.\"},{\"ids\":[\"partition\"],\"label\":\"Partition\",\"explain\":\"Walk from lo to hi. Elements <= 5 swapped to left side. Result: [1,5,10,9,8,7]. Pivot index = 1.\"},{\"ids\":[\"left\",\"pivotpos\",\"right\"],\"label\":\"Three regions\",\"explain\":\"Left [1]: already sorted. Pivot 5: in final place. Right [10,9,8,7]: needs sorting.\"},{\"ids\":[\"recurse\"],\"label\":\"Recurse\",\"explain\":\"quickSort(0,0) on [1] returns immediately. quickSort(2,5) on [10,9,8,7] repeats process.\"},{\"ids\":[\"done\"],\"label\":\"Complete\",\"explain\":\"All partitions reach size 1. Final sorted array: [1,5,7,8,9,10]. Time O(n log n) avg.\"}]}";
        }

        // ── Merge Sort ───────────────────────────────────────────────────
        if (t.contains("merge sort") || t.contains("mergesort")) {
            return "{\"title\":\"Merge Sort\",\"description\":\"Merge Sort is a stable divide-and-conquer algorithm. It recursively splits the array in half until each part has one element, then merges pairs of sorted halves. Always O(n log n) time, O(n) space.\",\"category\":\"Algorithms\",\"diagramType\":\"tree\",\"nodes\":[{\"id\":\"full\",\"label\":\"[38,27,43,3,9,82]\",\"x\":300,\"y\":30,\"nodeType\":\"root\",\"description\":\"Original unsorted array. mergeSort splits it recursively.\"},{\"id\":\"l1\",\"label\":\"[38,27,43]\",\"x\":160,\"y\":120,\"nodeType\":\"internal\",\"description\":\"Left half after first split.\"},{\"id\":\"r1\",\"label\":\"[3,9,82]\",\"x\":440,\"y\":120,\"nodeType\":\"internal\",\"description\":\"Right half after first split.\"},{\"id\":\"l2\",\"label\":\"[38] [27,43]\",\"x\":80,\"y\":210,\"nodeType\":\"process\",\"description\":\"Split further: [38] is a base case; [27,43] splits again.\"},{\"id\":\"r2\",\"label\":\"[3] [9,82]\",\"x\":520,\"y\":210,\"nodeType\":\"process\",\"description\":\"Split further: [3] is a base case; [9,82] splits again.\"},{\"id\":\"merge1\",\"label\":\"merge → [27,38,43]\",\"x\":160,\"y\":310,\"nodeType\":\"active\",\"description\":\"Merge sorted [38] and [27,43]: compare heads, pick smaller. Result: [27,38,43].\"},{\"id\":\"merge2\",\"label\":\"merge → [3,9,82]\",\"x\":440,\"y\":310,\"nodeType\":\"active\",\"description\":\"Merge sorted [3] and [9,82]: result [3,9,82].\"},{\"id\":\"final\",\"label\":\"merge → [3,9,27,38,43,82]\",\"x\":300,\"y\":410,\"nodeType\":\"leaf\",\"description\":\"Final merge of two sorted halves. Array fully sorted.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"full\",\"target\":\"l1\",\"label\":\"split\"},{\"id\":\"e2\",\"source\":\"full\",\"target\":\"r1\",\"label\":\"split\"},{\"id\":\"e3\",\"source\":\"l1\",\"target\":\"l2\",\"label\":\"split\"},{\"id\":\"e4\",\"source\":\"r1\",\"target\":\"r2\",\"label\":\"split\"},{\"id\":\"e5\",\"source\":\"l2\",\"target\":\"merge1\",\"label\":\"merge\",\"animated\":true},{\"id\":\"e6\",\"source\":\"r2\",\"target\":\"merge2\",\"label\":\"merge\",\"animated\":true},{\"id\":\"e7\",\"source\":\"merge1\",\"target\":\"final\",\"label\":\"merge\",\"animated\":true},{\"id\":\"e8\",\"source\":\"merge2\",\"target\":\"final\",\"label\":\"merge\",\"animated\":true}],\"components\":[{\"id\":\"full\",\"name\":\"Input Array\",\"role\":\"Full unsorted input. mergeSort(arr, 0, n-1) called on this.\"},{\"id\":\"l1\",\"name\":\"Left Half\",\"role\":\"First recursive split. mergeSort called recursively on this half.\"},{\"id\":\"r1\",\"name\":\"Right Half\",\"role\":\"Second recursive split.\"},{\"id\":\"l2\",\"name\":\"Sub-splits\",\"role\":\"Continue splitting until all sub-arrays are size 1 (base case).\"},{\"id\":\"r2\",\"name\":\"Sub-splits (right)\",\"role\":\"Continue splitting right half.\"},{\"id\":\"merge1\",\"name\":\"Merge Left\",\"role\":\"Two-pointer merge: compare arr[i] vs arr[j], append smaller. O(n) time per level.\"},{\"id\":\"merge2\",\"name\":\"Merge Right\",\"role\":\"Same two-pointer merge for right halves.\"},{\"id\":\"final\",\"name\":\"Sorted Output\",\"role\":\"Final merge produces fully sorted array. Stable: equal elements preserve original order.\"}],\"steps\":[{\"ids\":[\"full\"],\"label\":\"Start\",\"explain\":\"Array [38,27,43,3,9,82]. Call mergeSort(0, 5).\"},{\"ids\":[\"l1\",\"r1\"],\"label\":\"First Split\",\"explain\":\"mid = 2. Left: [38,27,43], Right: [3,9,82]. Recurse on both.\"},{\"ids\":[\"l2\",\"r2\"],\"label\":\"Sub-splits\",\"explain\":\"Keep halving until each piece has 1 element (base case, already sorted).\"},{\"ids\":[\"merge1\"],\"label\":\"Merge Left\",\"explain\":\"[38] merged with sorted [27,43]: compare 38 vs 27 → pick 27; compare 38 vs 43 → pick 38; append 43. Result: [27,38,43].\"},{\"ids\":[\"merge2\"],\"label\":\"Merge Right\",\"explain\":\"[3] merged with [9,82] → [3,9,82].\"},{\"ids\":[\"final\"],\"label\":\"Final Merge\",\"explain\":\"Merge [27,38,43] and [3,9,82]: final sorted array [3,9,27,38,43,82]. O(n log n), stable.\"}]}";
        }

        // ── Dijkstra ─────────────────────────────────────────────────────
        if (t.contains("dijkstra")) {
            return "{\"title\":\"Dijkstra's Shortest Path Algorithm\",\"description\":\"Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph with non-negative edge weights. It uses a min-priority queue and greedy expansion. Time: O((V+E) log V).\",\"category\":\"Algorithms\",\"diagramType\":\"graph\",\"nodes\":[{\"id\":\"A\",\"label\":\"A (source)\\ndist=0\",\"x\":300,\"y\":60,\"nodeType\":\"root\",\"description\":\"Source node. Distance to itself = 0. All others start at infinity.\"},{\"id\":\"B\",\"label\":\"B\\ndist=4\",\"x\":120,\"y\":200,\"nodeType\":\"active\",\"description\":\"Reached from A via direct edge weight 4.\"},{\"id\":\"C\",\"label\":\"C\\ndist=2\",\"x\":480,\"y\":200,\"nodeType\":\"active\",\"description\":\"Reached from A via edge weight 2 — shorter than going through B.\"},{\"id\":\"D\",\"label\":\"D\\ndist=7\",\"x\":60,\"y\":360,\"nodeType\":\"process\",\"description\":\"Best path: A→B→D (4+3=7). Direct A→D would be longer.\"},{\"id\":\"E\",\"label\":\"E\\ndist=5\",\"x\":300,\"y\":360,\"nodeType\":\"process\",\"description\":\"Best path: A→C→E (2+3=5).\"},{\"id\":\"F\",\"label\":\"F\\ndist=9\",\"x\":540,\"y\":360,\"nodeType\":\"leaf\",\"description\":\"Best path: A→C→E→F (2+3+4=9).\"},{\"id\":\"pq\",\"label\":\"Min-Priority Queue\",\"x\":300,\"y\":470,\"nodeType\":\"control\",\"description\":\"Always extracts the unvisited node with smallest known distance. Drives greedy expansion.\"}],\"edges\":[{\"id\":\"eAB\",\"source\":\"A\",\"target\":\"B\",\"label\":\"4\"},{\"id\":\"eAC\",\"source\":\"A\",\"target\":\"C\",\"label\":\"2\",\"animated\":true},{\"id\":\"eBD\",\"source\":\"B\",\"target\":\"D\",\"label\":\"3\"},{\"id\":\"eBE\",\"source\":\"B\",\"target\":\"E\",\"label\":\"5\"},{\"id\":\"eCE\",\"source\":\"C\",\"target\":\"E\",\"label\":\"3\",\"animated\":true},{\"id\":\"eCF\",\"source\":\"C\",\"target\":\"F\",\"label\":\"10\"},{\"id\":\"eEF\",\"source\":\"E\",\"target\":\"F\",\"label\":\"4\",\"animated\":true},{\"id\":\"epq\",\"source\":\"pq\",\"target\":\"A\",\"label\":\"extract min\"}],\"components\":[{\"id\":\"A\",\"name\":\"Source A\",\"role\":\"Starting node. dist[A]=0, all others dist=∞. Added to priority queue first.\"},{\"id\":\"B\",\"name\":\"Node B\",\"role\":\"Discovered from A (cost 4). Later relaxation checks if path via B improves neighbors.\"},{\"id\":\"C\",\"name\":\"Node C\",\"role\":\"Closest to A (cost 2). Extracted from PQ first after A. Relaxes E and F.\"},{\"id\":\"D\",\"name\":\"Node D\",\"role\":\"Reached via B→D. dist[D] = 4+3 = 7.\"},{\"id\":\"E\",\"name\":\"Node E\",\"role\":\"Best path A→C→E = 5. Path via B→E = 9, so C→E wins.\"},{\"id\":\"F\",\"name\":\"Node F\",\"role\":\"Best path A→C→E→F = 9. Direct C→F = 12, so E→F wins.\"},{\"id\":\"pq\",\"name\":\"Priority Queue\",\"role\":\"Min-heap. Extract-min gives next closest unfinished node. Key to O((V+E)logV) complexity.\"}],\"steps\":[{\"ids\":[\"A\",\"pq\"],\"label\":\"Init\",\"explain\":\"dist = {A:0, B:∞, C:∞, D:∞, E:∞, F:∞}. Push (0,A) to priority queue.\"},{\"ids\":[\"A\",\"B\",\"C\"],\"label\":\"Expand A\",\"explain\":\"Extract A (dist=0). Relax edges: dist[B]=4, dist[C]=2. Push (4,B) and (2,C).\"},{\"ids\":[\"C\",\"E\",\"F\"],\"label\":\"Expand C (closest)\",\"explain\":\"Extract C (dist=2). Relax: dist[E]=min(∞, 2+3)=5, dist[F]=min(∞,2+10)=12.\"},{\"ids\":[\"B\",\"D\",\"E\"],\"label\":\"Expand B\",\"explain\":\"Extract B (dist=4). Relax: dist[D]=min(∞,4+3)=7, dist[E]=min(5,4+5)=5 (no improvement).\"},{\"ids\":[\"E\",\"F\"],\"label\":\"Expand E\",\"explain\":\"Extract E (dist=5). Relax: dist[F]=min(12,5+4)=9.\"},{\"ids\":[\"D\",\"F\"],\"label\":\"Finish\",\"explain\":\"Extract D (7), F (9). Shortest paths: A=0,B=4,C=2,D=7,E=5,F=9. Algorithm complete.\"}]}";
        }

        // ── Recursion ────────────────────────────────────────────────────
        if (t.contains("recursion") || t.contains("recursive")) {
            return "{\"title\":\"Recursion\",\"description\":\"Recursion is a technique where a function calls itself to solve a smaller version of the same problem. Every recursive solution has a base case (stops the recursion) and a recursive case (reduces the problem). Illustrated here with factorial(4).\",\"category\":\"Algorithms\",\"diagramType\":\"flowchart\",\"nodes\":[{\"id\":\"call4\",\"label\":\"factorial(4)\",\"x\":300,\"y\":40,\"nodeType\":\"root\",\"description\":\"Initial call. 4 ≠ 0, so it calls factorial(3) and waits for the result.\"},{\"id\":\"call3\",\"label\":\"factorial(3)\",\"x\":300,\"y\":120,\"nodeType\":\"process\",\"description\":\"3 ≠ 0, calls factorial(2). Suspended until factorial(2) returns.\"},{\"id\":\"call2\",\"label\":\"factorial(2)\",\"x\":300,\"y\":200,\"nodeType\":\"process\",\"description\":\"2 ≠ 0, calls factorial(1).\"},{\"id\":\"call1\",\"label\":\"factorial(1)\",\"x\":300,\"y\":280,\"nodeType\":\"process\",\"description\":\"1 ≠ 0, calls factorial(0).\"},{\"id\":\"base\",\"label\":\"factorial(0) = 1\\n(BASE CASE)\",\"x\":300,\"y\":360,\"nodeType\":\"active\",\"description\":\"n == 0: return 1. This is the base case — it STOPS the recursion.\"},{\"id\":\"ret1\",\"label\":\"return 1×1 = 1\",\"x\":480,\"y\":280,\"nodeType\":\"internal\",\"description\":\"factorial(1) gets 1 from factorial(0), returns 1×1 = 1.\"},{\"id\":\"ret2\",\"label\":\"return 2×1 = 2\",\"x\":480,\"y\":200,\"nodeType\":\"internal\",\"description\":\"factorial(2) returns 2×1 = 2.\"},{\"id\":\"ret3\",\"label\":\"return 3×2 = 6\",\"x\":480,\"y\":120,\"nodeType\":\"internal\",\"description\":\"factorial(3) returns 3×2 = 6.\"},{\"id\":\"ret4\",\"label\":\"return 4×6 = 24\",\"x\":480,\"y\":40,\"nodeType\":\"leaf\",\"description\":\"factorial(4) returns 4×6 = 24. Final answer!\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"call4\",\"target\":\"call3\",\"label\":\"calls\",\"animated\":true},{\"id\":\"e2\",\"source\":\"call3\",\"target\":\"call2\",\"label\":\"calls\",\"animated\":true},{\"id\":\"e3\",\"source\":\"call2\",\"target\":\"call1\",\"label\":\"calls\",\"animated\":true},{\"id\":\"e4\",\"source\":\"call1\",\"target\":\"base\",\"label\":\"calls\",\"animated\":true},{\"id\":\"e5\",\"source\":\"base\",\"target\":\"ret1\",\"label\":\"returns 1\"},{\"id\":\"e6\",\"source\":\"ret1\",\"target\":\"ret2\",\"label\":\"returns 1\"},{\"id\":\"e7\",\"source\":\"ret2\",\"target\":\"ret3\",\"label\":\"returns 2\"},{\"id\":\"e8\",\"source\":\"ret3\",\"target\":\"ret4\",\"label\":\"returns 6\"}],\"components\":[{\"id\":\"call4\",\"name\":\"factorial(4)\",\"role\":\"Entry point. Pushes stack frame. Waits for sub-call before returning 4 × result.\"},{\"id\":\"call3\",\"name\":\"factorial(3)\",\"role\":\"Second frame on the call stack. Will return 3 × factorial(2).\"},{\"id\":\"call2\",\"name\":\"factorial(2)\",\"role\":\"Third frame. Returns 2 × factorial(1).\"},{\"id\":\"call1\",\"name\":\"factorial(1)\",\"role\":\"Fourth frame. Returns 1 × factorial(0).\"},{\"id\":\"base\",\"name\":\"Base Case factorial(0)\",\"role\":\"n==0: return 1. Without this, recursion would never stop (stack overflow).\"},{\"id\":\"ret1\",\"name\":\"Return 1\",\"role\":\"Unwinding begins. factorial(1) computes 1×1 = 1 and returns.\"},{\"id\":\"ret2\",\"name\":\"Return 2\",\"role\":\"factorial(2) computes 2×1 = 2 and returns.\"},{\"id\":\"ret3\",\"name\":\"Return 6\",\"role\":\"factorial(3) computes 3×2 = 6 and returns.\"},{\"id\":\"ret4\",\"name\":\"Return 24\",\"role\":\"factorial(4) = 4×6 = 24. Each recursive call added O(1) to the call stack; total depth = n.\"}],\"steps\":[{\"ids\":[\"call4\"],\"label\":\"First call\",\"explain\":\"factorial(4) called. n=4 ≠ 0, so we recurse: return 4 * factorial(3).\"},{\"ids\":[\"call3\",\"call2\",\"call1\"],\"label\":\"Winding down\",\"explain\":\"Each call adds a stack frame. Stack grows: factorial(4) → factorial(3) → factorial(2) → factorial(1).\"},{\"ids\":[\"base\"],\"label\":\"Base case hit\",\"explain\":\"factorial(0) returns 1. Stack depth = 5 (n+1). This is why recursion uses O(n) space.\"},{\"ids\":[\"ret1\",\"ret2\",\"ret3\",\"ret4\"],\"label\":\"Unwinding\",\"explain\":\"Stack unwinds in reverse: 1 → 1 → 2 → 6 → 24. Each frame multiplies its n by the returned value.\"},{\"ids\":[\"ret4\"],\"label\":\"Final result\",\"explain\":\"factorial(4) = 24. The key insight: recursion = base case + self-similar sub-problem.\"}]}";
        }

        // ── Dynamic Programming ──────────────────────────────────────────
        if (t.contains("dynamic programming") || t.equals("dp")) {
            return "{\"title\":\"Dynamic Programming (Fibonacci Example)\",\"description\":\"Dynamic Programming solves problems by breaking them into overlapping sub-problems, solving each only once, and storing results. Illustrated with Fibonacci: naive recursion is O(2^n), memoized DP is O(n).\",\"category\":\"Algorithms\",\"diagramType\":\"concept\",\"nodes\":[{\"id\":\"fib5\",\"label\":\"fib(5)=5\",\"x\":300,\"y\":40,\"nodeType\":\"root\",\"description\":\"Top-level call. Needs fib(4) + fib(3).\"},{\"id\":\"fib4\",\"label\":\"fib(4)=3\",\"x\":160,\"y\":130,\"nodeType\":\"process\",\"description\":\"Needs fib(3)+fib(2). Computed once, memoized.\"},{\"id\":\"fib3a\",\"label\":\"fib(3)=2\",\"x\":440,\"y\":130,\"nodeType\":\"process\",\"description\":\"Also needed by fib(5). Retrieved from memo — not recomputed.\"},{\"id\":\"fib3b\",\"label\":\"fib(3)=2\",\"x\":80,\"y\":230,\"nodeType\":\"active\",\"description\":\"Same sub-problem as fib(3a). Without memoization this would recompute. DP avoids it.\"},{\"id\":\"fib2a\",\"label\":\"fib(2)=1\",\"x\":240,\"y\":230,\"nodeType\":\"internal\",\"description\":\"fib(2) = fib(1)+fib(0) = 1.\"},{\"id\":\"memo\",\"label\":\"Memo Cache\\n{0:0,1:1,2:1,3:2,4:3}\",\"x\":300,\"y\":340,\"nodeType\":\"control\",\"description\":\"HashMap storing computed results. O(1) lookup replaces recomputation.\"},{\"id\":\"base\",\"label\":\"Base Cases\\nfib(0)=0, fib(1)=1\",\"x\":300,\"y\":440,\"nodeType\":\"leaf\",\"description\":\"Base cases defined directly. Every DP solution needs base cases.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"fib5\",\"target\":\"fib4\",\"label\":\"needs\"},{\"id\":\"e2\",\"source\":\"fib5\",\"target\":\"fib3a\",\"label\":\"needs\"},{\"id\":\"e3\",\"source\":\"fib4\",\"target\":\"fib3b\",\"label\":\"needs\"},{\"id\":\"e4\",\"source\":\"fib4\",\"target\":\"fib2a\",\"label\":\"needs\"},{\"id\":\"e5\",\"source\":\"fib3b\",\"target\":\"memo\",\"label\":\"cache hit\",\"animated\":true},{\"id\":\"e6\",\"source\":\"fib3a\",\"target\":\"memo\",\"label\":\"cache hit\",\"animated\":true},{\"id\":\"e7\",\"source\":\"memo\",\"target\":\"base\",\"label\":\"populated from\"}],\"components\":[{\"id\":\"fib5\",\"name\":\"fib(5)\",\"role\":\"Top-level problem. DP decomposes it into fib(4)+fib(3).\"},{\"id\":\"fib4\",\"name\":\"fib(4)\",\"role\":\"Sub-problem. Computed once, stored in memo, reused.\"},{\"id\":\"fib3a\",\"name\":\"fib(3) — first reference\",\"role\":\"Needed by fib(5). Computed and cached.\"},{\"id\":\"fib3b\",\"name\":\"fib(3) — second reference\",\"role\":\"Also needed by fib(4). Retrieved from cache in O(1) — key DP benefit.\"},{\"id\":\"fib2a\",\"name\":\"fib(2)\",\"role\":\"Smallest non-base sub-problem. fib(1)+fib(0).\"},{\"id\":\"memo\",\"name\":\"Memoization Cache\",\"role\":\"Stores {n: fib(n)}. Transforms O(2^n) naive recursion into O(n) DP.\"},{\"id\":\"base\",\"name\":\"Base Cases\",\"role\":\"fib(0)=0, fib(1)=1. All DP solutions need defined base cases to stop recursion.\"}],\"steps\":[{\"ids\":[\"fib5\"],\"label\":\"Problem\",\"explain\":\"Compute fib(5). Naive recursion calls fib(3) twice — 15 total calls for fib(5). DP reduces to 5.\"},{\"ids\":[\"fib4\",\"fib3a\"],\"label\":\"Decompose\",\"explain\":\"fib(5) = fib(4) + fib(3). Recurse on each.\"},{\"ids\":[\"memo\"],\"label\":\"Cache\",\"explain\":\"First time fib(3) computed → store result in memo[3]=2.\"},{\"ids\":[\"fib3b\"],\"label\":\"Cache Hit\",\"explain\":\"fib(4) needs fib(3). Lookup memo[3] → 2. No recomputation. O(1) retrieval.\"},{\"ids\":[\"base\"],\"label\":\"Base Cases\",\"explain\":\"Recursion bottoms out at fib(0)=0 and fib(1)=1.\"},{\"ids\":[\"fib5\"],\"label\":\"Result\",\"explain\":\"fib(5) = 5. With memoization: O(n) time, O(n) space. Tabulation (bottom-up) also O(n) but iterative.\"}]}";
        }

        // ── TCP/IP & DNS ─────────────────────────────────────────────────
        if (t.contains("tcp") || t.contains("dns resolution") || t.contains("dns lookup")) {
            return "{\"title\":\"TCP/IP Three-Way Handshake + DNS Resolution\",\"description\":\"Before a browser loads a webpage, DNS resolves the domain to an IP address, then TCP establishes a reliable connection via a three-way handshake. Only then does the HTTP request travel over the connection.\",\"category\":\"Networks\",\"diagramType\":\"sequence\",\"nodes\":[{\"id\":\"browser\",\"label\":\"Browser\",\"x\":80,\"y\":60,\"nodeType\":\"io\",\"description\":\"Client initiating the connection. Needs IP address before TCP can start.\"},{\"id\":\"dns\",\"label\":\"DNS Resolver\",\"x\":300,\"y\":60,\"nodeType\":\"control\",\"description\":\"Translates domain names (google.com) to IP addresses (142.250.80.46).\"},{\"id\":\"server\",\"label\":\"Web Server\",\"x\":560,\"y\":60,\"nodeType\":\"process\",\"description\":\"Destination server. Listens on port 80/443 for incoming TCP connections.\"},{\"id\":\"step1\",\"label\":\"DNS Query:\\ngoogle.com → ?\",\"x\":180,\"y\":170,\"nodeType\":\"data\",\"description\":\"Browser checks local cache, then queries DNS resolver.\"},{\"id\":\"step2\",\"label\":\"DNS Response:\\n142.250.80.46\",\"x\":180,\"y\":250,\"nodeType\":\"data\",\"description\":\"DNS resolver returns IP. Browser now knows the destination.\"},{\"id\":\"syn\",\"label\":\"SYN (seq=100)\",\"x\":320,\"y\":340,\"nodeType\":\"active\",\"description\":\"Client sends SYN packet. Proposes initial sequence number. Starts handshake.\"},{\"id\":\"synack\",\"label\":\"SYN-ACK (seq=200, ack=101)\",\"x\":420,\"y\":410,\"nodeType\":\"active\",\"description\":\"Server acknowledges SYN and sends its own SYN. Both sides sync sequence numbers.\"},{\"id\":\"ack\",\"label\":\"ACK (ack=201)\",\"x\":320,\"y\":470,\"nodeType\":\"leaf\",\"description\":\"Client acknowledges server's SYN. Connection established. HTTP can now flow.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"browser\",\"target\":\"step1\",\"label\":\"1. DNS query\"},{\"id\":\"e2\",\"source\":\"step1\",\"target\":\"dns\",\"label\":\"resolve\"},{\"id\":\"e3\",\"source\":\"dns\",\"target\":\"step2\",\"label\":\"IP returned\"},{\"id\":\"e4\",\"source\":\"step2\",\"target\":\"browser\",\"label\":\"IP known\"},{\"id\":\"e5\",\"source\":\"browser\",\"target\":\"syn\",\"label\":\"2. TCP SYN\",\"animated\":true},{\"id\":\"e6\",\"source\":\"syn\",\"target\":\"server\",\"label\":\"→ server\"},{\"id\":\"e7\",\"source\":\"server\",\"target\":\"synack\",\"label\":\"3. SYN-ACK\",\"animated\":true},{\"id\":\"e8\",\"source\":\"synack\",\"target\":\"browser\",\"label\":\"← browser\"},{\"id\":\"e9\",\"source\":\"browser\",\"target\":\"ack\",\"label\":\"4. ACK\",\"animated\":true},{\"id\":\"e10\",\"source\":\"ack\",\"target\":\"server\",\"label\":\"connection open\"}],\"components\":[{\"id\":\"browser\",\"name\":\"Browser (Client)\",\"role\":\"Initiates DNS lookup and TCP connection. Sends HTTP request only after handshake.\"},{\"id\":\"dns\",\"name\":\"DNS Resolver\",\"role\":\"Hierarchical name lookup: local cache → recursive resolver → root nameservers → authoritative NS.\"},{\"id\":\"server\",\"name\":\"Web Server\",\"role\":\"Listens on TCP port 443 (HTTPS). Completes handshake, then serves HTTP responses.\"},{\"id\":\"syn\",\"name\":\"SYN packet\",\"role\":\"First handshake message. Client proposes initial sequence number and says 'I want to connect'.\"},{\"id\":\"synack\",\"name\":\"SYN-ACK packet\",\"role\":\"Server accepts. Acknowledges client's SYN and proposes its own sequence number.\"},{\"id\":\"ack\",\"name\":\"ACK packet\",\"role\":\"Client confirms server's SYN. Three-way handshake complete. Connection is ESTABLISHED state.\"}],\"steps\":[{\"ids\":[\"browser\",\"step1\",\"dns\"],\"label\":\"DNS Lookup\",\"explain\":\"Browser needs IP for google.com. Queries DNS resolver (8.8.8.8). Resolver checks cache or recurses through root/TLD/authoritative servers.\"},{\"ids\":[\"step2\",\"browser\"],\"label\":\"IP Resolved\",\"explain\":\"DNS returns 142.250.80.46. Browser now has the destination IP and opens a socket.\"},{\"ids\":[\"syn\",\"server\"],\"label\":\"SYN\",\"explain\":\"Browser sends TCP SYN to 142.250.80.46:443. Includes initial sequence number ISN=100.\"},{\"ids\":[\"synack\",\"browser\"],\"label\":\"SYN-ACK\",\"explain\":\"Server receives SYN. Sends SYN-ACK: ack=ISN+1=101, own SYN with seq=200.\"},{\"ids\":[\"ack\",\"server\"],\"label\":\"ACK + Connected\",\"explain\":\"Browser sends ACK: ack=200+1=201. TCP connection ESTABLISHED. HTTP/TLS begins.\"}]}";
        }

        // ── Deadlock ─────────────────────────────────────────────────────
        if (t.contains("deadlock")) {
            return "{\"title\":\"Deadlock in Operating Systems\",\"description\":\"Deadlock occurs when two or more processes are permanently blocked, each waiting for a resource held by another. Four necessary conditions must ALL hold: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.\",\"category\":\"Operating Systems\",\"diagramType\":\"graph\",\"nodes\":[{\"id\":\"p1\",\"label\":\"Process P1\",\"x\":160,\"y\":200,\"nodeType\":\"process\",\"description\":\"P1 holds Resource R1 and is waiting for Resource R2 held by P2.\"},{\"id\":\"p2\",\"label\":\"Process P2\",\"x\":440,\"y\":200,\"nodeType\":\"process\",\"description\":\"P2 holds Resource R2 and is waiting for Resource R1 held by P1.\"},{\"id\":\"r1\",\"label\":\"Resource R1\",\"x\":160,\"y\":380,\"nodeType\":\"active\",\"description\":\"Held by P1. P2 is waiting for it. Only one instance — cannot be shared.\"},{\"id\":\"r2\",\"label\":\"Resource R2\",\"x\":440,\"y\":380,\"nodeType\":\"active\",\"description\":\"Held by P2. P1 is waiting for it.\"},{\"id\":\"me\",\"label\":\"Mutual Exclusion\",\"x\":80,\"y\":60,\"nodeType\":\"control\",\"description\":\"Resources can only be used by one process at a time.\"},{\"id\":\"hw\",\"label\":\"Hold & Wait\",\"x\":240,\"y\":60,\"nodeType\":\"control\",\"description\":\"Process holds a resource while waiting for another.\"},{\"id\":\"np\",\"label\":\"No Preemption\",\"x\":400,\"y\":60,\"nodeType\":\"control\",\"description\":\"Resources cannot be forcibly taken from a process.\"},{\"id\":\"cw\",\"label\":\"Circular Wait\",\"x\":560,\"y\":60,\"nodeType\":\"control\",\"description\":\"P1 waits for P2, P2 waits for P1 — a cycle in the resource-allocation graph.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"p1\",\"target\":\"r1\",\"label\":\"holds\"},{\"id\":\"e2\",\"source\":\"p1\",\"target\":\"r2\",\"label\":\"waits for\",\"animated\":true},{\"id\":\"e3\",\"source\":\"p2\",\"target\":\"r2\",\"label\":\"holds\"},{\"id\":\"e4\",\"source\":\"p2\",\"target\":\"r1\",\"label\":\"waits for\",\"animated\":true},{\"id\":\"e5\",\"source\":\"me\",\"target\":\"r1\",\"label\":\"condition\"},{\"id\":\"e6\",\"source\":\"hw\",\"target\":\"p1\",\"label\":\"condition\"},{\"id\":\"e7\",\"source\":\"np\",\"target\":\"r2\",\"label\":\"condition\"},{\"id\":\"e8\",\"source\":\"cw\",\"target\":\"p2\",\"label\":\"condition\"}],\"components\":[{\"id\":\"p1\",\"name\":\"Process P1\",\"role\":\"Holds R1, waits for R2. Will never get R2 because P2 won't release it.\"},{\"id\":\"p2\",\"name\":\"Process P2\",\"role\":\"Holds R2, waits for R1. Circular dependency forms.\"},{\"id\":\"r1\",\"name\":\"Resource R1\",\"role\":\"Non-shareable resource. One at a time. Allocated to P1.\"},{\"id\":\"r2\",\"name\":\"Resource R2\",\"role\":\"Non-shareable. Allocated to P2.\"},{\"id\":\"me\",\"name\":\"Mutual Exclusion\",\"role\":\"Condition 1: resources can only be held by one process.\"},{\"id\":\"hw\",\"name\":\"Hold and Wait\",\"role\":\"Condition 2: P1 holds R1 and waits for R2 simultaneously.\"},{\"id\":\"np\",\"name\":\"No Preemption\",\"role\":\"Condition 3: OS cannot forcibly revoke R1 from P1.\"},{\"id\":\"cw\",\"name\":\"Circular Wait\",\"role\":\"Condition 4: P1→R2→P2→R1→P1 forms a cycle. Break ANY condition to prevent deadlock.\"}],\"steps\":[{\"ids\":[\"me\",\"hw\",\"np\",\"cw\"],\"label\":\"Four Conditions\",\"explain\":\"Deadlock requires ALL four conditions simultaneously. Remove any one and deadlock cannot occur.\"},{\"ids\":[\"p1\",\"r1\"],\"label\":\"P1 acquires R1\",\"explain\":\"P1 requests R1, gets it immediately. Now holds R1.\"},{\"ids\":[\"p2\",\"r2\"],\"label\":\"P2 acquires R2\",\"explain\":\"P2 requests R2, gets it. Now holds R2.\"},{\"ids\":[\"p1\",\"r2\"],\"label\":\"P1 requests R2\",\"explain\":\"P1 now requests R2 (held by P2). P1 is blocked — it waits.\"},{\"ids\":[\"p2\",\"r1\"],\"label\":\"P2 requests R1\",\"explain\":\"P2 now requests R1 (held by P1). P2 is blocked. DEADLOCK: circular wait formed.\"},{\"ids\":[\"cw\"],\"label\":\"Prevention\",\"explain\":\"Break circular wait by imposing resource ordering (always acquire lower-numbered resource first). Or use banker's algorithm to avoid unsafe states.\"}]}";
        }

        // ── CPU Scheduling ───────────────────────────────────────────────
        if (t.contains("cpu scheduling") || t.contains("round robin") || t.contains("fcfs") || t.contains("sjf")) {
            return "{\"title\":\"CPU Scheduling Algorithms\",\"description\":\"CPU scheduling determines which ready process gets the CPU next. Key algorithms: FCFS (First Come First Served), SJF (Shortest Job First), Round Robin (RR), and Priority Scheduling. Each trades off fairness, throughput, and response time.\",\"category\":\"Operating Systems\",\"diagramType\":\"process\",\"nodes\":[{\"id\":\"new\",\"label\":\"NEW Process\",\"x\":80,\"y\":250,\"nodeType\":\"io\",\"description\":\"Process created. Moves to ready queue.\"},{\"id\":\"ready\",\"label\":\"READY Queue\",\"x\":240,\"y\":250,\"nodeType\":\"control\",\"description\":\"Processes waiting for CPU time. Scheduler picks one based on algorithm.\"},{\"id\":\"cpu\",\"label\":\"CPU (RUNNING)\",\"x\":420,\"y\":250,\"nodeType\":\"active\",\"description\":\"Only one process runs at a time (on a single core). Runs until completion, I/O, or preemption.\"},{\"id\":\"waiting\",\"label\":\"WAITING\\n(I/O Queue)\",\"x\":420,\"y\":400,\"nodeType\":\"process\",\"description\":\"Process blocked on I/O. Returns to ready queue when I/O completes.\"},{\"id\":\"done\",\"label\":\"TERMINATED\",\"x\":580,\"y\":250,\"nodeType\":\"leaf\",\"description\":\"Process finishes execution. Resources reclaimed.\"},{\"id\":\"fcfs\",\"label\":\"FCFS\\nO(1) scheduling\",\"x\":150,\"y\":100,\"nodeType\":\"data\",\"description\":\"First Come First Served: no preemption. Simple but can cause convoy effect.\"},{\"id\":\"rr\",\"label\":\"Round Robin\\ntime quantum q\",\"x\":350,\"y\":100,\"nodeType\":\"data\",\"description\":\"Each process gets CPU for at most quantum q ms, then preempted back to ready queue. Fair.\"},{\"id\":\"sjf\",\"label\":\"SJF / SRTF\\nOptimal avg wait\",\"x\":550,\"y\":100,\"nodeType\":\"data\",\"description\":\"Shortest Job First: minimizes average waiting time. Requires knowing burst time in advance.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"new\",\"target\":\"ready\",\"label\":\"admitted\"},{\"id\":\"e2\",\"source\":\"ready\",\"target\":\"cpu\",\"label\":\"dispatch\",\"animated\":true},{\"id\":\"e3\",\"source\":\"cpu\",\"target\":\"done\",\"label\":\"exit\"},{\"id\":\"e4\",\"source\":\"cpu\",\"target\":\"waiting\",\"label\":\"I/O wait\"},{\"id\":\"e5\",\"source\":\"waiting\",\"target\":\"ready\",\"label\":\"I/O done\"},{\"id\":\"e6\",\"source\":\"cpu\",\"target\":\"ready\",\"label\":\"preempt (RR)\",\"animated\":true},{\"id\":\"e7\",\"source\":\"fcfs\",\"target\":\"ready\",\"label\":\"policy\"},{\"id\":\"e8\",\"source\":\"rr\",\"target\":\"cpu\",\"label\":\"policy\"},{\"id\":\"e9\",\"source\":\"sjf\",\"target\":\"ready\",\"label\":\"policy\"}],\"components\":[{\"id\":\"new\",\"name\":\"New\",\"role\":\"Process just created via fork()/exec(). PCB allocated.\"},{\"id\":\"ready\",\"name\":\"Ready Queue\",\"role\":\"All loaded, waiting-for-CPU processes. Scheduler selects from here.\"},{\"id\":\"cpu\",\"name\":\"Running\",\"role\":\"Active execution. Single process per core.\"},{\"id\":\"waiting\",\"name\":\"Waiting/Blocked\",\"role\":\"Waiting for I/O, semaphore, or event. CPU given to others.\"},{\"id\":\"done\",\"name\":\"Terminated\",\"role\":\"Process exited. Memory and resources freed.\"},{\"id\":\"fcfs\",\"name\":\"FCFS\",\"role\":\"No preemption. Suffers convoy effect when long job runs first.\"},{\"id\":\"rr\",\"name\":\"Round Robin\",\"role\":\"Preemptive. Fair. Performance depends heavily on quantum size.\"},{\"id\":\"sjf\",\"name\":\"SJF / SRTF\",\"role\":\"Theoretically optimal average wait time. Requires future burst time knowledge.\"}],\"steps\":[{\"ids\":[\"new\",\"ready\"],\"label\":\"Process arrives\",\"explain\":\"New process added to ready queue with priority/arrival time recorded.\"},{\"ids\":[\"ready\",\"cpu\"],\"label\":\"Dispatched\",\"explain\":\"Scheduler picks process (per algorithm) and dispatcher gives it CPU. Context switch overhead: ~1-10μs.\"},{\"ids\":[\"cpu\",\"waiting\"],\"label\":\"I/O Block\",\"explain\":\"Process makes I/O system call. Voluntarily yields CPU. Moves to blocked queue.\"},{\"ids\":[\"waiting\",\"ready\"],\"label\":\"I/O Done\",\"explain\":\"I/O interrupt fires. Process becomes ready again, rejoins ready queue.\"},{\"ids\":[\"cpu\",\"ready\"],\"label\":\"RR Preemption\",\"explain\":\"Quantum expires (e.g., 10ms). Timer interrupt fires. Process preempted back to ready queue.\"},{\"ids\":[\"done\"],\"label\":\"Exit\",\"explain\":\"Process completes all CPU bursts, calls exit(). Turnaround time = finish - arrival.\"}]}";
        }

        // ── Database Normalization ───────────────────────────────────────
        if (t.contains("normalization") || t.contains("normal form") || t.contains("1nf") || t.contains("2nf") || t.contains("3nf")) {
            return "{\"title\":\"Database Normalization (1NF → 3NF)\",\"description\":\"Normalization eliminates data redundancy and update anomalies by organizing tables into normal forms. Each higher normal form adds constraints. 3NF is the standard for most relational database designs.\",\"category\":\"DBMS\",\"diagramType\":\"layered\",\"nodes\":[{\"id\":\"unnorm\",\"label\":\"Unnormalized Table\",\"x\":300,\"y\":40,\"nodeType\":\"root\",\"description\":\"Table with repeating groups, multi-valued attributes, and mixed dependencies.\"},{\"id\":\"nf1\",\"label\":\"1NF\\nAtomic values, no repeating groups\",\"x\":300,\"y\":130,\"nodeType\":\"process\",\"description\":\"First Normal Form: each column contains atomic (indivisible) values; no repeating groups. Each row uniquely identified.\"},{\"id\":\"nf2\",\"label\":\"2NF\\nRemove partial dependencies\",\"x\":300,\"y\":230,\"nodeType\":\"active\",\"description\":\"Second Normal Form: must be in 1NF AND every non-key attribute fully depends on the entire primary key (eliminate partial dependencies).\"},{\"id\":\"nf3\",\"label\":\"3NF\\nRemove transitive dependencies\",\"x\":300,\"y\":330,\"nodeType\":\"leaf\",\"description\":\"Third Normal Form: must be in 2NF AND no non-key attribute depends on another non-key attribute (eliminate transitive dependencies).\"},{\"id\":\"anomaly\",\"label\":\"Anomalies\\nInsert/Update/Delete\",\"x\":100,\"y\":230,\"nodeType\":\"control\",\"description\":\"Without normalization: updating one fact requires changes in many rows; deleting a row can destroy other facts.\"},{\"id\":\"bcnf\",\"label\":\"BCNF\\n(Boyce-Codd NF)\",\"x\":300,\"y\":430,\"nodeType\":\"internal\",\"description\":\"Stricter than 3NF: every determinant must be a candidate key. Handles some edge cases 3NF misses.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"unnorm\",\"target\":\"nf1\",\"label\":\"decompose multi-values\",\"animated\":true},{\"id\":\"e2\",\"source\":\"nf1\",\"target\":\"nf2\",\"label\":\"move partial deps to new table\",\"animated\":true},{\"id\":\"e3\",\"source\":\"nf2\",\"target\":\"nf3\",\"label\":\"remove transitive deps\",\"animated\":true},{\"id\":\"e4\",\"source\":\"nf3\",\"target\":\"bcnf\",\"label\":\"further restrict\"},{\"id\":\"e5\",\"source\":\"anomaly\",\"target\":\"nf1\",\"label\":\"resolved by\"},{\"id\":\"e6\",\"source\":\"anomaly\",\"target\":\"nf2\",\"label\":\"resolved by\"}],\"components\":[{\"id\":\"unnorm\",\"name\":\"Unnormalized\",\"role\":\"Has repeating groups (e.g. multiple phone numbers in one column). Violates atomicity.\"},{\"id\":\"nf1\",\"name\":\"1NF\",\"role\":\"Split multi-valued cells into separate rows. Add primary key. No repeating column groups.\"},{\"id\":\"nf2\",\"name\":\"2NF\",\"role\":\"Applies only to composite primary keys. Move attributes that depend on just PART of the key to a new table.\"},{\"id\":\"nf3\",\"name\":\"3NF\",\"role\":\"Remove transitive dependency: if A→B→C and A is PK, B→C means C should be in a separate table.\"},{\"id\":\"anomaly\",\"name\":\"Data Anomalies\",\"role\":\"Problems caused by redundancy: insert anomaly (can't add without extra data), update anomaly (must update many rows), delete anomaly (losing a fact deletes other facts).\"},{\"id\":\"bcnf\",\"name\":\"BCNF\",\"role\":\"For every FD X→Y, X must be a superkey. Stricter than 3NF. May not always preserve all functional dependencies.\"}],\"steps\":[{\"ids\":[\"unnorm\"],\"label\":\"Start: Raw table\",\"explain\":\"Example: Orders(OrderID, CustomerName, CustomerCity, ProductID, ProductName, Qty). Has repeating data.\"},{\"ids\":[\"nf1\"],\"label\":\"Apply 1NF\",\"explain\":\"Ensure atomic values. If a customer can have multiple phones, split into separate rows rather than comma-separated strings.\"},{\"ids\":[\"nf2\"],\"label\":\"Apply 2NF\",\"explain\":\"OrderID+ProductID is composite PK. ProductName depends only on ProductID (partial dep). → Move to Product(ProductID, ProductName).\"},{\"ids\":[\"nf3\"],\"label\":\"Apply 3NF\",\"explain\":\"CustomerCity depends on CustomerName, not OrderID (transitive). → Create Customer(CustomerName, CustomerCity).\"},{\"ids\":[\"bcnf\"],\"label\":\"BCNF\",\"explain\":\"Check all determinants are candidate keys. Rare edge cases in 3NF tables with overlapping candidate keys.\"},{\"ids\":[\"anomaly\"],\"label\":\"Result\",\"explain\":\"Normalized schema eliminates anomalies. Joins reconstruct the data. Trade-off: more joins = slightly slower reads.\"}]}";
        }

        // ── Photosynthesis ───────────────────────────────────────────────
        if (t.contains("photosynthesis")) {
            return "{\"title\":\"Photosynthesis\",\"description\":\"Photosynthesis converts light energy, CO₂, and water into glucose and oxygen. It occurs in two stages: the Light Reactions (in the thylakoid membranes) produce ATP and NADPH, and the Calvin Cycle (in the stroma) uses them to fix CO₂ into glucose.\",\"category\":\"Science\",\"diagramType\":\"process\",\"nodes\":[{\"id\":\"sun\",\"label\":\"Sunlight\",\"x\":80,\"y\":60,\"nodeType\":\"io\",\"description\":\"Energy source. Photons absorbed by chlorophyll in photosystem I and II.\"},{\"id\":\"water\",\"label\":\"H₂O (Water)\",\"x\":80,\"y\":200,\"nodeType\":\"io\",\"description\":\"Absorbed by roots. Splits in photolysis: 2H₂O → 4H⁺ + 4e⁻ + O₂.\"},{\"id\":\"thylakoid\",\"label\":\"Thylakoid Membrane\\n(Light Reactions)\",\"x\":300,\"y\":130,\"nodeType\":\"active\",\"description\":\"Site of light-dependent reactions. Chlorophyll absorbs photons; electron transport chain creates ATP and NADPH.\"},{\"id\":\"atp\",\"label\":\"ATP + NADPH\",\"x\":300,\"y\":260,\"nodeType\":\"control\",\"description\":\"Energy carriers produced by light reactions. Fuel the Calvin Cycle.\"},{\"id\":\"o2\",\"label\":\"O₂ Released\",\"x\":480,\"y\":130,\"nodeType\":\"leaf\",\"description\":\"Oxygen byproduct of water splitting. Released through stomata into atmosphere.\"},{\"id\":\"co2\",\"label\":\"CO₂\",\"x\":80,\"y\":360,\"nodeType\":\"io\",\"description\":\"Carbon dioxide absorbed through stomata from the air.\"},{\"id\":\"calvin\",\"label\":\"Calvin Cycle\\n(Stroma)\",\"x\":300,\"y\":380,\"nodeType\":\"process\",\"description\":\"Carbon fixation cycle. RuBisCO enzyme catalyzes CO₂ + RuBP → 3-PGA → G3P → glucose.\"},{\"id\":\"glucose\",\"label\":\"Glucose (C₆H₁₂O₆)\",\"x\":480,\"y\":380,\"nodeType\":\"storage\",\"description\":\"End product. Used for plant energy (respiration) or stored as starch. Provides food for animals.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"sun\",\"target\":\"thylakoid\",\"label\":\"photons absorbed\",\"animated\":true},{\"id\":\"e2\",\"source\":\"water\",\"target\":\"thylakoid\",\"label\":\"photolysis\"},{\"id\":\"e3\",\"source\":\"thylakoid\",\"target\":\"o2\",\"label\":\"released\"},{\"id\":\"e4\",\"source\":\"thylakoid\",\"target\":\"atp\",\"label\":\"produced\",\"animated\":true},{\"id\":\"e5\",\"source\":\"atp\",\"target\":\"calvin\",\"label\":\"powers\",\"animated\":true},{\"id\":\"e6\",\"source\":\"co2\",\"target\":\"calvin\",\"label\":\"fixed by RuBisCO\"},{\"id\":\"e7\",\"source\":\"calvin\",\"target\":\"glucose\",\"label\":\"synthesized\"}],\"components\":[{\"id\":\"sun\",\"name\":\"Sunlight\",\"role\":\"Provides photon energy. Chlorophyll a/b absorb red (~680nm) and blue (~450nm) wavelengths.\"},{\"id\":\"water\",\"name\":\"Water (H₂O)\",\"role\":\"Electron donor. Photolysis splits water; electrons replace those lost from chlorophyll.\"},{\"id\":\"thylakoid\",\"name\":\"Thylakoid / Light Reactions\",\"role\":\"Photosystem II captures light, splits water, passes electrons down ETC. Photosystem I re-energizes electrons. ATP synthase makes ATP.\"},{\"id\":\"atp\",\"name\":\"ATP + NADPH\",\"role\":\"Chemical energy and reducing power transferred from light reactions to the Calvin Cycle.\"},{\"id\":\"o2\",\"name\":\"Oxygen\",\"role\":\"Byproduct. Released into atmosphere. Basis of Earth's oxygen-rich air.\"},{\"id\":\"co2\",\"name\":\"Carbon Dioxide\",\"role\":\"Carbon source. 3 CO₂ fixed per turn of Calvin Cycle. Absorbed via stomata.\"},{\"id\":\"calvin\",\"name\":\"Calvin Cycle\",\"role\":\"3 phases: carbon fixation (CO₂+RuBP→3PGA), reduction (3PGA→G3P using ATP+NADPH), regeneration (G3P→RuBP).\"},{\"id\":\"glucose\",\"name\":\"Glucose\",\"role\":\"6-carbon sugar. Primary energy storage. 6CO₂+6H₂O+light→C₆H₁₂O₆+6O₂ is the net equation.\"}],\"steps\":[{\"ids\":[\"sun\",\"thylakoid\"],\"label\":\"Light Absorption\",\"explain\":\"Chlorophyll absorbs photons. Energizes electrons in Photosystem II to higher energy level.\"},{\"ids\":[\"water\",\"thylakoid\",\"o2\"],\"label\":\"Water Splitting\",\"explain\":\"Photolysis: 2H₂O → 4H⁺ + 4e⁻ + O₂. Electrons replace those lost by chlorophyll. O₂ is released.\"},{\"ids\":[\"thylakoid\",\"atp\"],\"label\":\"ATP + NADPH Made\",\"explain\":\"Electron transport chain in thylakoid pumps H⁺ across membrane. ATP synthase makes ATP. NADP⁺ reduced to NADPH.\"},{\"ids\":[\"co2\",\"calvin\"],\"label\":\"Carbon Fixation\",\"explain\":\"In stroma: RuBisCO fixes 3 CO₂ + 3 RuBP → 6 molecules of 3-PGA.\"},{\"ids\":[\"atp\",\"calvin\",\"glucose\"],\"label\":\"Glucose Synthesis\",\"explain\":\"ATP and NADPH from light reactions reduce 3-PGA → G3P. Two G3P combine → glucose. Remaining G3P regenerates RuBP.\"}]}";
        }

        // ── Water Cycle ──────────────────────────────────────────────────
        if (t.contains("water cycle") || t.contains("hydrological cycle")) {
            return "{\"title\":\"The Water Cycle (Hydrological Cycle)\",\"description\":\"The water cycle describes the continuous movement of water on, above, and below Earth's surface. Key processes: evaporation, condensation, precipitation, transpiration, infiltration, and runoff.\",\"category\":\"Science\",\"diagramType\":\"process\",\"nodes\":[{\"id\":\"ocean\",\"label\":\"Ocean / Lakes\",\"x\":100,\"y\":380,\"nodeType\":\"storage\",\"description\":\"97% of Earth's water. Main source of evaporation.\"},{\"id\":\"evap\",\"label\":\"Evaporation\",\"x\":200,\"y\":240,\"nodeType\":\"active\",\"description\":\"Sun heats surface water. Liquid water → water vapour. ~425,000 km³ per year from oceans.\"},{\"id\":\"transp\",\"label\":\"Transpiration\",\"x\":100,\"y\":240,\"nodeType\":\"process\",\"description\":\"Plants release water vapour through stomata. Together with evaporation: evapotranspiration.\"},{\"id\":\"cloud\",\"label\":\"Cloud Formation\\n(Condensation)\",\"x\":350,\"y\":80,\"nodeType\":\"control\",\"description\":\"Water vapour rises, cools, condenses on dust particles. Forms clouds (water droplets or ice crystals).\"},{\"id\":\"precip\",\"label\":\"Precipitation\\n(Rain / Snow)\",\"x\":500,\"y\":200,\"nodeType\":\"io\",\"description\":\"Water falls from clouds as rain, snow, sleet, or hail when droplets coalesce enough to fall.\"},{\"id\":\"runoff\",\"label\":\"Surface Runoff\",\"x\":500,\"y\":360,\"nodeType\":\"data\",\"description\":\"Water flows over land surface into streams and rivers, eventually back to the ocean.\"},{\"id\":\"infiltration\",\"label\":\"Infiltration\\n(Groundwater)\",\"x\":350,\"y\":440,\"nodeType\":\"leaf\",\"description\":\"Water seeps into soil and replenishes groundwater aquifers. Slow process — can take centuries.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"ocean\",\"target\":\"evap\",\"label\":\"heat from sun\",\"animated\":true},{\"id\":\"e2\",\"source\":\"evap\",\"target\":\"cloud\",\"label\":\"vapour rises\"},{\"id\":\"e3\",\"source\":\"transp\",\"target\":\"cloud\",\"label\":\"vapour\"},{\"id\":\"e4\",\"source\":\"cloud\",\"target\":\"precip\",\"label\":\"droplets coalesce\"},{\"id\":\"e5\",\"source\":\"precip\",\"target\":\"runoff\",\"label\":\"surface flow\"},{\"id\":\"e6\",\"source\":\"precip\",\"target\":\"infiltration\",\"label\":\"seeps into soil\"},{\"id\":\"e7\",\"source\":\"runoff\",\"target\":\"ocean\",\"label\":\"returns to ocean\",\"animated\":true},{\"id\":\"e8\",\"source\":\"infiltration\",\"target\":\"ocean\",\"label\":\"groundwater discharge\"}],\"components\":[{\"id\":\"ocean\",\"name\":\"Ocean/Lakes\",\"role\":\"Primary water reservoir. Solar energy drives evaporation from this massive surface area.\"},{\"id\":\"evap\",\"name\":\"Evaporation\",\"role\":\"Phase change: liquid → gas. Driven by solar radiation and wind. Cools the surface (latent heat).\"},{\"id\":\"transp\",\"name\":\"Transpiration\",\"role\":\"Plants absorb groundwater via roots, release vapour via stomata. Forests are significant contributors.\"},{\"id\":\"cloud\",\"name\":\"Cloud/Condensation\",\"role\":\"Vapour cools and condenses on aerosol particles. Stores water temporarily in atmosphere.\"},{\"id\":\"precip\",\"name\":\"Precipitation\",\"role\":\"Gravity returns water to Earth. Type depends on temperature: rain (>0°C), snow (<0°C).\"},{\"id\":\"runoff\",\"name\":\"Surface Runoff\",\"role\":\"Rivers and streams carry water to the sea. Erosion shapes landscapes. Speed depends on slope and soil.\"},{\"id\":\"infiltration\",\"name\":\"Infiltration\",\"role\":\"Refills aquifers. Crucial for wells and springs. Urbanization reduces infiltration (impermeable surfaces).\"}],\"steps\":[{\"ids\":[\"ocean\",\"evap\"],\"label\":\"Evaporation\",\"explain\":\"Sun heats ocean surface. Liquid water molecules gain energy, escape as vapour. About 86% of evaporation comes from oceans.\"},{\"ids\":[\"evap\",\"transp\",\"cloud\"],\"label\":\"Condensation\",\"explain\":\"Warm, moist air rises, cools with altitude (lapse rate ~6.5°C/km). At dew point, vapour condenses into cloud droplets.\"},{\"ids\":[\"cloud\",\"precip\"],\"label\":\"Precipitation\",\"explain\":\"Cloud droplets collide and coalesce until too heavy to remain suspended. Fall as precipitation.\"},{\"ids\":[\"precip\",\"runoff\",\"ocean\"],\"label\":\"Runoff\",\"explain\":\"Rain flows over saturated or impermeable surfaces into rivers and ultimately the ocean.\"},{\"ids\":[\"precip\",\"infiltration\"],\"label\":\"Groundwater\",\"explain\":\"Portion seeps into soil, recharging aquifers. Can store water for thousands of years before returning to surface via springs.\"}]}";
        }

        // ── Binary Search ────────────────────────────────────────────────
        if (t.contains("binary search") || (t.contains("binary") && t.contains("search"))) {
            return "{\"title\":\"Binary Search Algorithm\",\"description\":\"Binary search finds a target in a sorted array in O(log n) time by repeatedly halving the search space. It compares the target to the middle element and discards the half where it cannot be.\",\"category\":\"Algorithms\",\"diagramType\":\"flowchart\",\"nodes\":[{\"id\":\"arr\",\"label\":\"Sorted Array\",\"x\":300,\"y\":40,\"nodeType\":\"control\",\"description\":\"The sorted input array, e.g. [3,7,11,15,19,23,27,31,35].\"},{\"id\":\"lo\",\"label\":\"lo = 0\",\"x\":80,\"y\":140,\"nodeType\":\"process\",\"description\":\"Left boundary pointer. Starts at index 0.\"},{\"id\":\"hi\",\"label\":\"hi = n-1\",\"x\":520,\"y\":140,\"nodeType\":\"process\",\"description\":\"Right boundary pointer. Starts at last index.\"},{\"id\":\"mid\",\"label\":\"mid = (lo+hi)/2\",\"x\":300,\"y\":140,\"nodeType\":\"active\",\"description\":\"Middle index. arr[mid] compared to target each iteration.\"},{\"id\":\"cmp\",\"label\":\"arr[mid] == target?\",\"x\":300,\"y\":260,\"nodeType\":\"root\",\"description\":\"Three-way decision: found, left, or right.\"},{\"id\":\"found\",\"label\":\"Return mid (Found)\",\"x\":300,\"y\":380,\"nodeType\":\"leaf\",\"description\":\"Target at index mid. O(log n) comparisons.\"},{\"id\":\"left\",\"label\":\"hi = mid - 1\",\"x\":100,\"y\":380,\"nodeType\":\"internal\",\"description\":\"Discard right half.\"},{\"id\":\"right\",\"label\":\"lo = mid + 1\",\"x\":500,\"y\":380,\"nodeType\":\"internal\",\"description\":\"Discard left half.\"},{\"id\":\"notfound\",\"label\":\"Return -1\",\"x\":300,\"y\":460,\"nodeType\":\"storage\",\"description\":\"lo > hi: not found.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"arr\",\"target\":\"lo\",\"label\":\"init\"},{\"id\":\"e2\",\"source\":\"arr\",\"target\":\"hi\",\"label\":\"init\"},{\"id\":\"e3\",\"source\":\"arr\",\"target\":\"mid\",\"label\":\"mid\"},{\"id\":\"e4\",\"source\":\"mid\",\"target\":\"cmp\",\"label\":\"compare\",\"animated\":true},{\"id\":\"e5\",\"source\":\"cmp\",\"target\":\"found\",\"label\":\"== target\"},{\"id\":\"e6\",\"source\":\"cmp\",\"target\":\"left\",\"label\":\"< target\"},{\"id\":\"e7\",\"source\":\"cmp\",\"target\":\"right\",\"label\":\"> target\"},{\"id\":\"e8\",\"source\":\"cmp\",\"target\":\"notfound\",\"label\":\"lo > hi\"}],\"components\":[{\"id\":\"arr\",\"name\":\"Sorted Array\",\"role\":\"Input. Must be sorted.\"},{\"id\":\"lo\",\"name\":\"lo pointer\",\"role\":\"Left boundary.\"},{\"id\":\"hi\",\"name\":\"hi pointer\",\"role\":\"Right boundary.\"},{\"id\":\"mid\",\"name\":\"mid index\",\"role\":\"Halves search space each round.\"},{\"id\":\"cmp\",\"name\":\"Comparison\",\"role\":\"Three-way branch.\"},{\"id\":\"found\",\"name\":\"Found\",\"role\":\"Target located.\"},{\"id\":\"left\",\"name\":\"Go Left\",\"role\":\"hi = mid-1.\"},{\"id\":\"right\",\"name\":\"Go Right\",\"role\":\"lo = mid+1.\"},{\"id\":\"notfound\",\"name\":\"Not Found\",\"role\":\"Return -1.\"}],\"steps\":[{\"ids\":[\"arr\",\"lo\",\"hi\"],\"label\":\"Init\",\"explain\":\"lo=0, hi=8, target=23.\"},{\"ids\":[\"mid\",\"cmp\"],\"label\":\"Step 1\",\"explain\":\"mid=4, arr[4]=19. 23>19 → lo=5.\"},{\"ids\":[\"right\",\"mid\",\"cmp\"],\"label\":\"Step 2\",\"explain\":\"mid=6, arr[6]=27. 23<27 → hi=5.\"},{\"ids\":[\"left\",\"mid\",\"cmp\"],\"label\":\"Step 3\",\"explain\":\"mid=5, arr[5]=23. Found! Return 5.\"},{\"ids\":[\"found\"],\"label\":\"Done\",\"explain\":\"Found 23 at index 5 in 3 comparisons.\"}]}";
        }

        // ── Flowchart / generic algorithm ────────────────────────────────
        if (t.contains("flowchart") || t.contains("flow chart") || t.contains("algorithm")) {
            return buildGenericFlowchart(topic);
        }

        // ── Sorting (generic) ────────────────────────────────────────────
        if (t.contains("sort")) {
            return "{\"title\":\"" + escapeJson(topic) + "\",\"description\":\"A sorting algorithm reorders array elements into ascending or descending order.\",\"category\":\"Algorithms\",\"diagramType\":\"flowchart\",\"nodes\":[{\"id\":\"input\",\"label\":\"Input Array\",\"x\":300,\"y\":60,\"nodeType\":\"control\",\"description\":\"Unsorted input array.\"},{\"id\":\"pass1\",\"label\":\"Pass 1\",\"x\":150,\"y\":180,\"nodeType\":\"process\",\"description\":\"First pass over elements.\"},{\"id\":\"swap\",\"label\":\"Swap?\",\"x\":300,\"y\":300,\"nodeType\":\"active\",\"description\":\"Compare and swap if out of order.\"},{\"id\":\"out\",\"label\":\"Sorted Array\",\"x\":300,\"y\":420,\"nodeType\":\"leaf\",\"description\":\"Final sorted output.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"input\",\"target\":\"pass1\"},{\"id\":\"e2\",\"source\":\"pass1\",\"target\":\"swap\",\"animated\":true},{\"id\":\"e3\",\"source\":\"swap\",\"target\":\"out\"}],\"components\":[{\"id\":\"input\",\"name\":\"Input\",\"role\":\"Unsorted array.\"},{\"id\":\"pass1\",\"name\":\"Pass\",\"role\":\"One iteration of comparisons.\"},{\"id\":\"swap\",\"name\":\"Swap\",\"role\":\"Rearrange elements.\"},{\"id\":\"out\",\"name\":\"Sorted\",\"role\":\"Final result.\"}],\"steps\":[{\"ids\":[\"input\"],\"label\":\"Input\",\"explain\":\"Start with unsorted array.\"},{\"ids\":[\"pass1\",\"swap\"],\"label\":\"Passes\",\"explain\":\"Multiple passes rearrange elements.\"},{\"ids\":[\"out\"],\"label\":\"Done\",\"explain\":\"Array fully sorted.\"}]}";
        }

        // ── Generic fallback ─────────────────────────────────────────────
        return buildGenericConceptMap(topic);
    }

    private String buildGenericFlowchart(String topic) {
        String safeTitle = escapeJson(topic);
        return "{\"title\":\"" + safeTitle + " — Flowchart\",\"description\":\"A step-by-step flowchart showing the logic and flow of " + safeTitle + ". Each shape represents a step, decision, or result.\",\"category\":\"Algorithms\",\"diagramType\":\"flowchart\",\"nodes\":[{\"id\":\"start\",\"label\":\"START\",\"x\":300,\"y\":40,\"nodeType\":\"root\",\"description\":\"Entry point of the process.\"},{\"id\":\"input\",\"label\":\"Read Input\",\"x\":300,\"y\":130,\"nodeType\":\"io\",\"description\":\"Accept input data.\"},{\"id\":\"proc1\",\"label\":\"Process / Compute\",\"x\":300,\"y\":220,\"nodeType\":\"process\",\"description\":\"Core computation or transformation.\"},{\"id\":\"dec1\",\"label\":\"Condition?\",\"x\":300,\"y\":320,\"nodeType\":\"active\",\"description\":\"Decision point — evaluates a boolean condition.\"},{\"id\":\"yes\",\"label\":\"True Branch\",\"x\":150,\"y\":420,\"nodeType\":\"internal\",\"description\":\"Executed when condition is true.\"},{\"id\":\"no\",\"label\":\"False Branch\",\"x\":450,\"y\":420,\"nodeType\":\"internal\",\"description\":\"Executed when condition is false.\"},{\"id\":\"out\",\"label\":\"Output Result\",\"x\":300,\"y\":500,\"nodeType\":\"leaf\",\"description\":\"Final result produced.\"},{\"id\":\"end\",\"label\":\"END\",\"x\":300,\"y\":560,\"nodeType\":\"storage\",\"description\":\"Process terminates.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"start\",\"target\":\"input\"},{\"id\":\"e2\",\"source\":\"input\",\"target\":\"proc1\"},{\"id\":\"e3\",\"source\":\"proc1\",\"target\":\"dec1\",\"animated\":true},{\"id\":\"e4\",\"source\":\"dec1\",\"target\":\"yes\",\"label\":\"true\"},{\"id\":\"e5\",\"source\":\"dec1\",\"target\":\"no\",\"label\":\"false\"},{\"id\":\"e6\",\"source\":\"yes\",\"target\":\"out\"},{\"id\":\"e7\",\"source\":\"no\",\"target\":\"out\"},{\"id\":\"e8\",\"source\":\"out\",\"target\":\"end\"}],\"components\":[{\"id\":\"start\",\"name\":\"START\",\"role\":\"Entry point.\"},{\"id\":\"input\",\"name\":\"Input\",\"role\":\"Read required inputs.\"},{\"id\":\"proc1\",\"name\":\"Process\",\"role\":\"Main computation.\"},{\"id\":\"dec1\",\"name\":\"Decision\",\"role\":\"Boolean branch.\"},{\"id\":\"yes\",\"name\":\"True\",\"role\":\"True-branch action.\"},{\"id\":\"no\",\"name\":\"False\",\"role\":\"False-branch action.\"},{\"id\":\"out\",\"name\":\"Output\",\"role\":\"Result.\"},{\"id\":\"end\",\"name\":\"END\",\"role\":\"Terminates.\"}],\"steps\":[{\"ids\":[\"start\"],\"label\":\"Begin\",\"explain\":\"Process starts.\"},{\"ids\":[\"input\"],\"label\":\"Input\",\"explain\":\"Read input data.\"},{\"ids\":[\"proc1\"],\"label\":\"Process\",\"explain\":\"Apply core logic.\"},{\"ids\":[\"dec1\"],\"label\":\"Decide\",\"explain\":\"Evaluate condition.\"},{\"ids\":[\"yes\",\"no\"],\"label\":\"Branch\",\"explain\":\"Execute the appropriate path.\"},{\"ids\":[\"out\",\"end\"],\"label\":\"Output\",\"explain\":\"Produce result and exit.\"}]}";
    }

    private String buildGenericConceptMap(String topic) {
        String safeTitle = escapeJson(topic);
        return "{\"title\":\"" + safeTitle + "\",\"description\":\"An interactive concept map of " + safeTitle + " showing its key components, relationships, and how the overall system works.\",\"category\":\"General\",\"diagramType\":\"concept\",\"nodes\":[{\"id\":\"n1\",\"label\":\"" + safeTitle + "\",\"x\":300,\"y\":60,\"nodeType\":\"root\",\"description\":\"The central concept: " + safeTitle + ".\"},{\"id\":\"n2\",\"label\":\"Input / Trigger\",\"x\":100,\"y\":200,\"nodeType\":\"io\",\"description\":\"What initiates or feeds into " + safeTitle + ".\"},{\"id\":\"n3\",\"label\":\"Core Process\",\"x\":300,\"y\":200,\"nodeType\":\"active\",\"description\":\"The primary mechanism or logic.\"},{\"id\":\"n4\",\"label\":\"Output / Result\",\"x\":500,\"y\":200,\"nodeType\":\"leaf\",\"description\":\"What " + safeTitle + " produces.\"},{\"id\":\"n5\",\"label\":\"Component A\",\"x\":150,\"y\":340,\"nodeType\":\"internal\",\"description\":\"A key supporting element.\"},{\"id\":\"n6\",\"label\":\"Component B\",\"x\":300,\"y\":360,\"nodeType\":\"process\",\"description\":\"Another supporting element.\"},{\"id\":\"n7\",\"label\":\"Component C\",\"x\":450,\"y\":340,\"nodeType\":\"data\",\"description\":\"Third supporting element.\"}],\"edges\":[{\"id\":\"e1\",\"source\":\"n2\",\"target\":\"n3\",\"label\":\"feeds\"},{\"id\":\"e2\",\"source\":\"n3\",\"target\":\"n4\",\"label\":\"produces\",\"animated\":true},{\"id\":\"e3\",\"source\":\"n1\",\"target\":\"n3\",\"label\":\"defines\"},{\"id\":\"e4\",\"source\":\"n3\",\"target\":\"n5\"},{\"id\":\"e5\",\"source\":\"n3\",\"target\":\"n6\"},{\"id\":\"e6\",\"source\":\"n3\",\"target\":\"n7\"}],\"components\":[{\"id\":\"n1\",\"name\":\"" + safeTitle + "\",\"role\":\"Central concept.\"},{\"id\":\"n2\",\"name\":\"Input\",\"role\":\"Triggers the process.\"},{\"id\":\"n3\",\"name\":\"Core Process\",\"role\":\"Main transformation.\"},{\"id\":\"n4\",\"name\":\"Output\",\"role\":\"Final result.\"},{\"id\":\"n5\",\"name\":\"Component A\",\"role\":\"Supporting element.\"},{\"id\":\"n6\",\"name\":\"Component B\",\"role\":\"Supporting element.\"},{\"id\":\"n7\",\"name\":\"Component C\",\"role\":\"Supporting element.\"}],\"steps\":[{\"ids\":[\"n1\"],\"label\":\"Overview\",\"explain\":\"" + safeTitle + " is the central topic. This diagram shows its key parts and relationships.\"},{\"ids\":[\"n2\",\"n3\"],\"label\":\"Input → Process\",\"explain\":\"Input feeds into the Core Process.\"},{\"ids\":[\"n5\",\"n6\",\"n7\"],\"label\":\"Components\",\"explain\":\"Supporting components interact with the core.\"},{\"ids\":[\"n4\"],\"label\":\"Output\",\"explain\":\"The final result or effect of " + safeTitle + ".\"}]}";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ").replace("\r", "");
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
