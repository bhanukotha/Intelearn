// controllers/weeklyContestController.js
const Performance = require("../models/Performance");
const Contest     = require("../models/Contest");
const Problem     = require("../models/Problem");
const moment      = require("moment-timezone");

// ─────────────────────────────────────────────────────────────────────────────
// RANDOM FOREST — difficulty predictor (pure JS, no ML lib)
// Features: acc (accuracy%), wrong (wrong attempts avg), avgTime, lastDiff, streak
// ─────────────────────────────────────────────────────────────────────────────
const DIFF_MAP   = { easy: 0, medium: 1, hard: 2 };
const DIFF_LABEL = ["easy", "medium", "hard"];

const predict_tree = (f, tree) => {
  let node = tree;
  while (node.left) node = f[node.feat] <= node.thresh ? node.left : node.right;
  return node.val;
};

const FOREST = [
  { feat:"acc",      thresh:55, left:{ val:0 }, right:{ feat:"wrong",    thresh:2,   left:{ val:2 }, right:{ val:1 } } },
  { feat:"acc",      thresh:70, left:{ feat:"streak", thresh:3, left:{ val:0 }, right:{ val:1 } }, right:{ val:2 } },
  { feat:"lastDiff", thresh:0.5,left:{ feat:"acc",    thresh:50,left:{ val:0 }, right:{ val:1 } }, right:{ feat:"acc", thresh:68, left:{ val:1 }, right:{ val:2 } } },
  { feat:"wrong",    thresh:4,  left:{ feat:"avgTime",thresh:35, left:{ val:2 }, right:{ val:1 } }, right:{ val:0 } },
  { feat:"acc",      thresh:60, left:{ val:0 }, right:{ feat:"lastDiff", thresh:1.5, left:{ val:1 }, right:{ val:2 } } },
];

const rfPredict = (features) => {
  const votes = [0,0,0];
  FOREST.forEach(t => votes[predict_tree(features, t)]++);
  return DIFF_LABEL[votes.indexOf(Math.max(...votes))];
};

const getUserDifficulty = async (userId) => {
  const history = await Performance.find({ userId }).sort({ createdAt: -1 }).limit(10);
  if (!history.length) return "easy"; // cold start
  const n       = history.length;
  const acc     = history.reduce((s,h) => s+(h.accuracy||0), 0) / n;
  const wrong   = history.reduce((s,h) => s+(h.wrongAttempts||0), 0) / n;
  const avgTime = history.reduce((s,h) => s+(h.avgTime||0), 0) / n;
  const lastDiff= DIFF_MAP[history[0].difficultyAttempted] ?? 0;
  const streak  = Math.min(await Contest.countDocuments({ userId, status:"completed" }), 10);
  return rfPredict({ acc, wrong, avgTime, lastDiff, streak });
};

// ─────────────────────────────────────────────────────────────────────────────
// MCQ BANK — 40 easy + 40 medium + 40 hard questions
// Topics: Programming Languages, DSA, Databases, Computer Fundamentals
// Each question has a reference URL
// ─────────────────────────────────────────────────────────────────────────────
const MCQ_BANK = {
  easy: [
    // Programming Languages
    { q:"Which keyword defines a function in Python?",                       opts:["function","def","func","define"],                        ans:1, topic:"Python",        ref:"https://www.w3schools.com/python/python_functions.asp" },
    { q:"Which data type stores True/False in Java?",                        opts:["int","char","boolean","String"],                         ans:2, topic:"Java",           ref:"https://www.w3schools.com/java/java_data_types.asp" },
    { q:"Which header file is needed for printf() in C?",                    opts:["stdlib.h","string.h","stdio.h","math.h"],                ans:2, topic:"C",             ref:"https://www.geeksforgeeks.org/printf-in-c/" },
    { q:"What does HTML stand for?",                                         opts:["Hyper Text Markup Language","High Text Machine Language","Hyper Transfer Markup Language","None"], ans:0, topic:"Web", ref:"https://www.w3schools.com/html/html_intro.asp" },
    { q:"Which symbol starts a comment in Python?",                          opts:["//","/*","#","--"],                                      ans:2, topic:"Python",        ref:"https://www.w3schools.com/python/python_comments.asp" },
    { q:"What is the output of print(2**3) in Python?",                     opts:["6","8","9","Error"],                                     ans:1, topic:"Python",        ref:"https://www.geeksforgeeks.org/python-operators/" },
    { q:"What is a variable in programming?",                                opts:["A fixed constant","A named storage location","A function","A loop"], ans:1, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/variables-in-programming/" },
    { q:"Which loop runs at least once regardless of condition?",            opts:["for","while","do-while","foreach"],                      ans:2, topic:"Fundamentals",  ref:"https://www.geeksforgeeks.org/do-while-loop/" },
    { q:"What does CPU stand for?",                                          opts:["Central Process Unit","Central Processing Unit","Computer Processing Unit","None"], ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/central-processing-unit-cpu/" },
    { q:"Which is a valid JavaScript variable declaration?",                 opts:["variable x","var x","v x","declare x"],                 ans:1, topic:"JavaScript",    ref:"https://www.w3schools.com/js/js_variables.asp" },
    // DSA
    { q:"Which data structure uses LIFO order?",                             opts:["Queue","Stack","Linked List","Tree"],                    ans:1, topic:"DSA",           ref:"https://www.geeksforgeeks.org/stack-data-structure/" },
    { q:"What is the time complexity of accessing an array element?",        opts:["O(n)","O(log n)","O(1)","O(n²)"],                       ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/array-data-structure/" },
    { q:"What does FIFO stand for?",                                         opts:["First In First Out","Fast In Fast Out","First In Fast Out","None"], ans:0, topic:"DSA", ref:"https://www.geeksforgeeks.org/queue-data-structure/" },
    { q:"Which sorting algorithm is the simplest?",                          opts:["Merge Sort","Quick Sort","Bubble Sort","Heap Sort"],     ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/bubble-sort/" },
    { q:"What is a linked list?",                                            opts:["Array of nodes","Nodes connected by pointers","Sorted array","Hash table"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/linked-list-data-structure/" },
    // Databases
    { q:"Which SQL command retrieves data from a table?",                    opts:["INSERT","UPDATE","SELECT","DELETE"],                    ans:2, topic:"Database",      ref:"https://www.w3schools.com/sql/sql_select.asp" },
    { q:"What does SQL stand for?",                                          opts:["Simple Query Language","Structured Query Language","Sequential Query Language","None"], ans:1, topic:"Database", ref:"https://www.w3schools.com/sql/sql_intro.asp" },
    { q:"Which keyword removes duplicate rows in SQL?",                      opts:["UNIQUE","DISTINCT","DIFFERENT","NODUPE"],                ans:1, topic:"Database",     ref:"https://www.w3schools.com/sql/sql_distinct.asp" },
    { q:"What is a primary key?",                                            opts:["Any column","Unique identifier for each row","Foreign reference","Index"], ans:1, topic:"Database", ref:"https://www.w3schools.com/sql/sql_primarykey.asp" },
    { q:"Which command adds a new row to a table?",                          opts:["ADD","INSERT INTO","UPDATE","CREATE"],                   ans:1, topic:"Database",     ref:"https://www.w3schools.com/sql/sql_insert.asp" },
    // CS Fundamentals
    { q:"What is an operating system?",                                      opts:["Application software","System software managing hardware","Database","Compiler"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/what-is-an-operating-system/" },
    { q:"What does RAM stand for?",                                          opts:["Random Access Memory","Read Access Memory","Rapid Access Memory","None"], ans:0, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/random-access-memory-ram/" },
    { q:"How many bits are in one byte?",                                    opts:["4","6","8","16"],                                        ans:2, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/bits-and-bytes/" },
    { q:"What is binary number system based on?",                            opts:["Base 8","Base 10","Base 2","Base 16"],                   ans:2, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/binary-number-system/" },
    { q:"Which network device connects multiple computers in a LAN?",        opts:["Router","Modem","Switch","Gateway"],                     ans:2, topic:"Networks",      ref:"https://www.geeksforgeeks.org/network-devices-hub-repeater-bridge-switch-router-gateways/" },
    // More Programming
    { q:"What is the purpose of the 'return' statement?",                    opts:["End program","Return value from function","Start loop","Declare variable"], ans:1, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/return-statement-in-programming/" },
    { q:"Which of these is NOT a programming language?",                     opts:["Python","HTML","Java","C++"],                            ans:1, topic:"Fundamentals",  ref:"https://www.geeksforgeeks.org/difference-between-programming-language-and-markup-language/" },
    { q:"What is a compiler?",                                               opts:["Runs code line by line","Translates entire program to machine code","Debugs code","None"], ans:1, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/compiler-design-introduction/" },
    { q:"What does OOP stand for?",                                          opts:["Object Oriented Programming","Open Object Protocol","Ordered Output Process","None"], ans:0, topic:"OOP", ref:"https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/" },
    { q:"What is an array?",                                                 opts:["Single variable","Collection of similar data items","Function","Class"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/introduction-to-arrays-data-structure-and-algorithm-tutorials/" },
    { q:"What is recursion?",                                                opts:["Loop","Function calling itself","Nested loop","Switch case"], ans:1, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/recursion/" },
    { q:"Which operator checks equality in most languages?",                 opts:["=","==","!=","=>"],                                      ans:1, topic:"Fundamentals",  ref:"https://www.geeksforgeeks.org/operators-in-programming/" },
    { q:"What is the decimal value of binary 1010?",                         opts:["8","10","12","14"],                                      ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/binary-to-decimal-conversion/" },
    { q:"Which is used to store key-value pairs in Python?",                 opts:["List","Tuple","Dictionary","Set"],                       ans:2, topic:"Python",        ref:"https://www.w3schools.com/python/python_dictionaries.asp" },
    { q:"What is an algorithm?",                                             opts:["A program","Step-by-step instructions to solve a problem","A data structure","A database"], ans:1, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/introduction-to-algorithms/" },
    { q:"What does WWW stand for?",                                          opts:["World Wide Web","World Web Wide","Wide World Web","None"], ans:0, topic:"Networks",    ref:"https://www.geeksforgeeks.org/world-wide-web-www/" },
    { q:"Which tag creates a hyperlink in HTML?",                            opts:["<link>","<a>","<href>","<url>"],                         ans:1, topic:"Web",           ref:"https://www.w3schools.com/html/html_links.asp" },
    { q:"What is the purpose of a loop in programming?",                     opts:["Define function","Repeat code block","Declare variable","Import module"], ans:1, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/loops-in-programming/" },
    { q:"What does 'null' represent in programming?",                        opts:["Zero","Empty string","Absence of value","Boolean false"], ans:2, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/null-pointer-in-c/" },
    { q:"Which data structure is used for BFS?",                             opts:["Stack","Queue","Array","Tree"],                          ans:1, topic:"DSA",           ref:"https://www.geeksforgeeks.org/breadth-first-search-or-bfs-for-a-graph/" },
  ],
  medium: [
    // Python/Java/C++
    { q:"What is the time complexity of binary search?",                     opts:["O(n)","O(log n)","O(n log n)","O(1)"],                   ans:1, topic:"DSA",           ref:"https://www.geeksforgeeks.org/binary-search/" },
    { q:"Which Python method removes and returns the last list element?",    opts:["remove()","delete()","pop()","extract()"],               ans:2, topic:"Python",        ref:"https://www.w3schools.com/python/ref_list_pop.asp" },
    { q:"What is a closure in JavaScript?",                                  opts:["A loop","Function retaining outer scope","Class method","Arrow function"], ans:1, topic:"JavaScript", ref:"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures" },
    { q:"What does the 'virtual' keyword do in C++?",                        opts:["Makes const","Enables runtime polymorphism","Creates pointer","Allocates memory"], ans:1, topic:"C++", ref:"https://www.geeksforgeeks.org/virtual-function-cpp/" },
    { q:"What is the difference between == and === in JavaScript?",          opts:["No difference","== checks value, === checks value+type","=== checks value only","None"], ans:1, topic:"JavaScript", ref:"https://www.geeksforgeeks.org/difference-between-double-equal-vs-triple-equal-javascript/" },
    // DSA Medium
    { q:"What is the worst-case time complexity of Quick Sort?",             opts:["O(n log n)","O(n)","O(n²)","O(log n)"],                  ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/quick-sort/" },
    { q:"Which tree traversal gives sorted order for a BST?",               opts:["Preorder","Postorder","Inorder","Level order"],           ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/inorder-traversal-of-binary-tree/" },
    { q:"What is the purpose of a hash function?",                           opts:["Sort data","Map keys to array indices","Compress files","Encrypt data"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/what-is-hashing/" },
    { q:"Which data structure is used in function call stack?",              opts:["Queue","Heap","Stack","Tree"],                           ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/stack-data-structure/" },
    { q:"What is a graph in data structures?",                               opts:["Sorted array","Nodes connected by edges","Balanced tree","Hash table"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/" },
    // Databases
    { q:"What is normalization in databases?",                               opts:["Speeding queries","Reducing data redundancy","Creating indexes","Joining tables"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/normal-forms-in-dbms/" },
    { q:"What does the HAVING clause do in SQL?",                            opts:["Filters rows","Filters grouped results","Joins tables","Sorts results"], ans:1, topic:"Database", ref:"https://www.w3schools.com/sql/sql_having.asp" },
    { q:"Which SQL join returns all records from left table?",               opts:["INNER JOIN","RIGHT JOIN","LEFT JOIN","FULL JOIN"],       ans:2, topic:"Database",     ref:"https://www.w3schools.com/sql/sql_join_left.asp" },
    { q:"What is a foreign key?",                                            opts:["Unique key","References primary key of another table","Duplicate key","Index"], ans:1, topic:"Database", ref:"https://www.w3schools.com/sql/sql_foreignkey.asp" },
    { q:"What is an index in a database?",                                   opts:["A table column","Data structure for faster search","Primary key","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/indexing-in-databases-set-1/" },
    // OS/Networks
    { q:"What is a deadlock in OS?",                                         opts:["System crash","Processes waiting for each other's resources forever","Memory leak","Stack overflow"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/introduction-of-deadlock-in-operating-system/" },
    { q:"What is virtual memory?",                                           opts:["Physical RAM","Using disk as extension of RAM","Cache memory","Register"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/virtual-memory-in-operating-system/" },
    { q:"Which layer of OSI handles routing?",                               opts:["Data Link","Transport","Network","Session"],             ans:2, topic:"Networks",      ref:"https://www.geeksforgeeks.org/osi-model-full-form/" },
    { q:"What does DNS do?",                                                 opts:["Assigns IP addresses","Translates domain names to IPs","Routes packets","Encrypts data"], ans:1, topic:"Networks", ref:"https://www.geeksforgeeks.org/domain-name-system-dns-in-application-layer/" },
    { q:"What is context switching in OS?",                                  opts:["Switching users","Saving/restoring process state for CPU","Memory allocation","File access"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/context-switch-in-os/" },
    // OOP / Java
    { q:"What is polymorphism in OOP?",                                      opts:["Data hiding","Same interface, different behavior","Multiple inheritance","Recursion"], ans:1, topic:"OOP", ref:"https://www.geeksforgeeks.org/polymorphism-in-java/" },
    { q:"What is the difference between abstract class and interface in Java?", opts:["No difference","Abstract can have methods with body; interface cannot (pre-Java8)","Interface can extend classes","None"], ans:1, topic:"Java", ref:"https://www.geeksforgeeks.org/difference-between-abstract-class-and-interface-in-java/" },
    { q:"What is method overriding?",                                        opts:["Same class, same method name","Child class redefines parent method","Static method","None"], ans:1, topic:"OOP", ref:"https://www.geeksforgeeks.org/overriding-in-java/" },
    { q:"Which collection class is thread-safe in Java?",                    opts:["ArrayList","HashMap","Vector","LinkedList"],             ans:2, topic:"Java",           ref:"https://www.geeksforgeeks.org/vector-vs-arraylist-java/" },
    { q:"What is a stack overflow error?",                                   opts:["Memory full","Infinite recursion exhausting call stack","Null pointer","Array out of bounds"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/stack-overflow-in-programming/" },
    // More medium
    { q:"What is Big O notation?",                                           opts:["A sorting algorithm","Describes algorithm time/space complexity","A data structure","None"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/" },
    { q:"What is a semaphore in OS?",                                        opts:["Hardware device","Synchronization variable","Memory type","Process state"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/semaphores-in-process-synchronization/" },
    { q:"What is TCP/IP?",                                                   opts:["Database protocol","Network communication protocol suite","Encryption standard","File protocol"], ans:1, topic:"Networks", ref:"https://www.geeksforgeeks.org/tcp-ip-model/" },
    { q:"Which keyword is used for exception handling in Java?",             opts:["error","try-catch","handle","except"],                   ans:1, topic:"Java",           ref:"https://www.geeksforgeeks.org/exceptions-in-java/" },
    { q:"What is the purpose of Git?",                                       opts:["Database management","Version control system","IDE","Compiler"], ans:1, topic:"Tools",   ref:"https://www.geeksforgeeks.org/git-lets-get-into-it/" },
    { q:"What is dynamic programming?",                                      opts:["Changing code at runtime","Breaking into overlapping subproblems and memoizing","Random approach","None"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/dynamic-programming/" },
    { q:"What is encapsulation in OOP?",                                     opts:["Hiding implementation details","Multiple inheritance","Overloading","None"], ans:0, topic:"OOP", ref:"https://www.geeksforgeeks.org/encapsulation-in-java/" },
    { q:"Which HTTP method is used to send data to server?",                 opts:["GET","DELETE","POST","HEAD"],                            ans:2, topic:"Networks",      ref:"https://www.geeksforgeeks.org/http-request-methods/" },
    { q:"What is a callback function in JavaScript?",                        opts:["A recursive function","Function passed as argument to another","Static method","None"], ans:1, topic:"JavaScript", ref:"https://developer.mozilla.org/en-US/docs/Glossary/Callback_function" },
    { q:"What is 2NF in database normalization?",                            opts:["No duplicate rows","No partial dependency on primary key","No transitive dependency","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/second-normal-form-2nf/" },
    { q:"What is the difference between process and thread?",                opts:["No difference","Process is heavier, thread shares memory with parent","Thread is heavier","None"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/difference-between-process-and-thread/" },
    { q:"Which STL container gives O(1) average insert/lookup in C++?",     opts:["vector","list","unordered_map","deque"],                 ans:2, topic:"C++",           ref:"https://www.geeksforgeeks.org/unordered_map-in-cpp-stl/" },
    { q:"What is a Minimum Spanning Tree?",                                  opts:["Shortest path","Subset of edges connecting all nodes with minimum cost","Complete graph","None"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/introduction-to-minimum-spanning-tree-mst/" },
    { q:"What does REST stand for in web APIs?",                             opts:["Rapid Environment Standard Transfer","Representational State Transfer","Remote Execution Service Transfer","None"], ans:1, topic:"Web", ref:"https://www.geeksforgeeks.org/rest-api-introduction/" },
    { q:"What is a race condition?",                                         opts:["Fast algorithm","Output depends on non-deterministic execution order","Memory error","None"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/introduction-of-race-condition-in-os/" },
    { q:"Which algorithm finds shortest path with negative weights?",        opts:["Dijkstra","BFS","Bellman-Ford","DFS"],                   ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/bellman-ford-algorithm-dp-23/" },
  ],
  hard: [
    { q:"What is the amortized time complexity of dynamic array insertion?", opts:["O(n)","O(log n)","O(1)","O(n²)"],                       ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/analysis-algorithm-set-5-amortized-analysis-introduction/" },
    { q:"Which theorem states every NP problem reduces to NP-complete?",     opts:["P vs NP","Cook's theorem","Fermat's theorem","Church-Turing thesis"], ans:1, topic:"Theory", ref:"https://www.geeksforgeeks.org/np-completeness-set-1/" },
    { q:"What is the difference between optimistic and pessimistic locking?", opts:["No difference","Optimistic checks conflict on commit; pessimistic locks immediately","Pessimistic is faster","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/difference-between-optimistic-and-pessimistic-locking/" },
    { q:"What is a B+ tree used for?",                                       opts:["In-memory sorting","Disk-based database indexing","Graph traversal","Hash collision resolution"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/introduction-of-b-tree/" },
    { q:"What is the CAP theorem?",                                          opts:["CPU scheduling","Distributed system: cannot guarantee Consistency, Availability, and Partition tolerance simultaneously","Database normalization","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/the-cap-theorem-in-dbms/" },
    { q:"What is tail call optimization?",                                   opts:["Loop unrolling","Reusing stack frame for recursive tail calls","Memoization","None"], ans:1, topic:"Fundamentals", ref:"https://www.geeksforgeeks.org/tail-recursion/" },
    { q:"What is the time complexity of Dijkstra with a binary heap?",       opts:["O(V²)","O(E log V)","O(V log V)","O(E + V)"],           ans:1, topic:"DSA",           ref:"https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/" },
    { q:"What is MVCC in databases?",                                        opts:["Memory version control","Multi-Version Concurrency Control for non-blocking reads","Minimum viable cache","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/transaction-isolation-and-types-of-violations-in-transaction-processing/" },
    { q:"What is the purpose of the happens-before relation in Java memory model?", opts:["Order array access","Guarantee visibility of writes between threads","Optimize loops","None"], ans:1, topic:"Java", ref:"https://www.geeksforgeeks.org/java-memory-model/" },
    { q:"Which design pattern decouples sender and receiver?",               opts:["Singleton","Observer","Command","None"],                 ans:2, topic:"OOP",           ref:"https://www.geeksforgeeks.org/command-pattern/" },
    { q:"What is the space complexity of merge sort?",                       opts:["O(1)","O(log n)","O(n)","O(n log n)"],                   ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/merge-sort/" },
    { q:"What is a monoid in functional programming?",                       opts:["A type class","A set with associative binary op and identity element","A recursive function","None"], ans:1, topic:"Theory", ref:"https://www.geeksforgeeks.org/functional-programming-paradigm/" },
    { q:"What does Byzantine fault tolerance mean?",                         opts:["Handling slow nodes","System functioning despite arbitrary/malicious node failures","Deadlock prevention","None"], ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/byzantine-fault-tolerance-in-distributed-computing/" },
    { q:"What is the difference between mutex and semaphore?",               opts:["No difference","Mutex is binary/ownership-based; semaphore is counting/signaling","Semaphore is faster","None"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/difference-between-semaphore-and-mutex/" },
    { q:"What is a Bloom filter?",                                           opts:["Sorting algorithm","Probabilistic data structure for membership queries","Graph structure","None"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/" },
    { q:"What is the knapsack problem complexity?",                          opts:["O(n)","O(n log n)","O(nW) with DP","O(2^n) exact"],      ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/" },
    { q:"What is a red-black tree invariant?",                               opts:["Sorted array","BST with coloring rules ensuring O(log n) height","Complete binary tree","None"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/introduction-to-red-black-tree/" },
    { q:"What is eventual consistency?",                                     opts:["Strong consistency","System will converge to consistent state given no new updates","Immediate consistency","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/eventual-vs-strong-consistency-in-distributed-databases/" },
    { q:"What is the halting problem?",                                      opts:["Loop optimization","Undecidable problem: cannot determine if program halts","Scheduling problem","None"], ans:1, topic:"Theory", ref:"https://www.geeksforgeeks.org/halting-problem-in-theory-of-computation/" },
    { q:"What is the master theorem used for?",                              opts:["Sorting","Solving divide-and-conquer recurrences","Graph problems","None"],  ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/advanced-master-theorem-for-divide-and-conquer-recurrences/" },
    { q:"What is lock-free programming?",                                    opts:["No mutexes","At least one thread makes progress without locks","All threads run simultaneously","None"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/lock-free-data-structures-in-cpp/" },
    { q:"Which theorem guarantees a unique fixed point in monotone functions?", opts:["Fermat's","Tarski's fixed-point theorem","CAP theorem","Cook's theorem"], ans:1, topic:"Theory", ref:"https://en.wikipedia.org/wiki/Knaster%E2%80%93Tarski_theorem" },
    { q:"What is a skip list?",                                              opts:["Sorted array","Probabilistic layered linked list for O(log n) operations","Hash table","None"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/skip-list/" },
    { q:"What is ABA problem in concurrent programming?",                    opts:["Array bounds access","CAS reads A, changes to B, returns to A appearing unchanged","Deadlock variant","None"], ans:1, topic:"OS", ref:"https://www.geeksforgeeks.org/aba-problem-in-synchronization/" },
    { q:"What is the time complexity of Ford-Fulkerson algorithm?",          opts:["O(V²)","O(E * max_flow)","O(V log V)","O(E log E)"],     ans:1, topic:"DSA",           ref:"https://www.geeksforgeeks.org/ford-fulkerson-algorithm-for-maximum-flow-problem/" },
    { q:"What is a monad in functional programming?",                        opts:["A loop","Design pattern for sequencing computations with context","A class","None"], ans:1, topic:"Theory", ref:"https://www.geeksforgeeks.org/functional-programming-paradigm/" },
    { q:"What is ACID and which property prevents dirty reads?",             opts:["Atomicity","Isolation","Consistency","Durability"],       ans:1, topic:"Database",     ref:"https://www.geeksforgeeks.org/acid-properties-in-dbms/" },
    { q:"What is cache coherence in multiprocessor systems?",                opts:["Cache size","Ensuring all caches see same memory value","Memory encryption","None"], ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/cache-coherence/" },
    { q:"What is the time complexity of the Aho-Corasick algorithm?",        opts:["O(n²)","O(n + m + k) where k is number of matches","O(n log n)","O(nm)"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/aho-corasick-algorithm-pattern-searching/" },
    { q:"What is a continuation in programming languages?",                  opts:["A loop","An abstract representation of the control state","A class","None"], ans:1, topic:"Theory", ref:"https://en.wikipedia.org/wiki/Continuation" },
    { q:"What is consistent hashing used for?",                              opts:["Database joins","Distributing load in distributed systems with minimal remapping","Sorting","None"], ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/consistent-hashing/" },
    { q:"What is the difference between eager and lazy evaluation?",         opts:["No difference","Eager evaluates immediately; lazy defers until needed","Lazy is always faster","None"], ans:1, topic:"Theory", ref:"https://www.geeksforgeeks.org/lazy-evaluation-in-haskell/" },
    { q:"What is a segment tree used for?",                                  opts:["Graph traversal","Range queries and updates in O(log n)","Sorting","Hash table"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/segment-tree-data-structure/" },
    { q:"What is the P vs NP problem?",                                      opts:["CPU speed","Whether every verifiable problem is also efficiently solvable","Memory management","None"], ans:1, topic:"Theory", ref:"https://www.geeksforgeeks.org/p-np-np-complete-np-hard-problems/" },
    { q:"What is two-phase locking (2PL)?",                                  opts:["Two database joins","Protocol ensuring serializability: growing then shrinking phase","Two transactions","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/two-phase-locking-protocol/" },
    { q:"What is the time complexity of matrix chain multiplication with DP?", opts:["O(n)","O(n²)","O(n³)","O(n log n)"],                  ans:2, topic:"DSA",           ref:"https://www.geeksforgeeks.org/matrix-chain-multiplication-dp-8/" },
    { q:"What is a phantom read in database transactions?",                  opts:["Dirty read","New rows appearing in re-executed query within same transaction","Lost update","None"], ans:1, topic:"Database", ref:"https://www.geeksforgeeks.org/transaction-isolation-levels-dbms/" },
    { q:"What is NUMA architecture?",                                        opts:["Network architecture","Non-Uniform Memory Access: different latency for different RAM","Graphics processing","None"], ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/non-uniform-memory-access-numa/" },
    { q:"What is the difference between stack and heap memory?",             opts:["No difference","Stack: function-scoped, fast; Heap: dynamic, managed manually","Heap is faster","None"], ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/stack-vs-heap-memory-allocation/" },
    { q:"What is a Fenwick tree?",                                           opts:["Binary search tree","Binary indexed tree for prefix sums in O(log n)","AVL tree","None"], ans:1, topic:"DSA", ref:"https://www.geeksforgeeks.org/binary-indexed-tree-or-fenwick-tree-2/" },
    { q:"What is the significance of the Von Neumann bottleneck?",           opts:["CPU overheating","Bandwidth between CPU and memory limits performance","GPU limitation","None"], ans:1, topic:"CS Fundamentals", ref:"https://www.geeksforgeeks.org/von-neumann-architecture/" },
  ]
};

// Random Forest: Select 40 questions based on difficulty with shuffle
const selectQuestions = (difficulty, count = 40) => {
  let pool = [];
  if (difficulty === "easy") {
    pool = [...MCQ_BANK.easy];
  } else if (difficulty === "medium") {
    pool = [...MCQ_BANK.easy.slice(0,10), ...MCQ_BANK.medium.slice(0,30)];
  } else {
    pool = [...MCQ_BANK.medium.slice(0,15), ...MCQ_BANK.hard.slice(0,25)];
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

// ── FRIDAY CONTEST (40 MCQs) ──────────────────────────────────────────────────
exports.generateFridayContest = async (req, res) => {
  try {
    const userId    = req.user.id;
    const now       = moment().tz("Asia/Kolkata");
    const weekKey   = now.format("YYYY-[W]WW") + "-FRI";
    const difficulty= await getUserDifficulty(userId);
    const questions = selectQuestions(difficulty, 40);

    res.json({
      weekKey,
      difficulty,
      questions: questions.map(q => ({
        q: q.q, opts: q.opts, topic: q.topic, ref: q.ref
        // ans NOT sent to frontend — validated on submit
      })),
      answers: questions.map(q => q.ans), // sent separately for submission check
      duration: 45 * 60, // 45 minutes
      totalQuestions: 40,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── SUBMIT FRIDAY MCQ ─────────────────────────────────────────────────────────
exports.submitFridayContest = async (req, res) => {
  try {
    const { answers, correctAnswers, difficulty, timeTaken } = req.body;
    let score = 0, wrong = 0;
    correctAnswers.forEach((correct, i) => {
      if (answers[i] === correct) score++;
      else wrong++;
    });
    const accuracy = (score / correctAnswers.length) * 100;

    // Save performance for RF next time
    await require("../models/Performance").create({
      userId:              req.user.id,
      accuracy,
      avgTime:             timeTaken / correctAnswers.length,
      wrongAttempts:       wrong,
      difficultyAttempted: difficulty
    });

    res.json({ score, total: correctAnswers.length, accuracy: Math.round(accuracy), wrong });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── SUNDAY CONTEST (4 Coding Problems) ───────────────────────────────────────
exports.generateSundayContest = async (req, res) => {
  try {
    const userId     = req.user.id;
    const difficulty = await getUserDifficulty(userId);
    const problems   = await Problem.aggregate([
      { $match: { difficulty } },
      { $sample: { size: 4 } },
      { $project: { title:1, difficulty:1, description:1, inputFormat:1, outputFormat:1, sampleTestCases:1, constraints:1, tags:1, timeLimit:1, memoryLimit:1, totalSubmissions:1, acceptedSubmissions:1 } }
    ]);

    // Fallback if not enough problems
    if (problems.length < 4) {
      const extra = await Problem.aggregate([{ $sample: { size: 4 } }, { $project: { title:1, difficulty:1, description:1, inputFormat:1, outputFormat:1, sampleTestCases:1, constraints:1, tags:1, timeLimit:1, memoryLimit:1, totalSubmissions:1, acceptedSubmissions:1 } }]);
      const seen = new Set(problems.map(p => p._id.toString()));
      for (const p of extra) { if (!seen.has(p._id.toString())) { problems.push(p); seen.add(p._id.toString()); } if (problems.length === 4) break; }
    }

    res.json({ difficulty, problems: problems.slice(0,4), duration: 120 * 60 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── HISTORY ───────────────────────────────────────────────────────────────────
exports.getWeeklyHistory = async (req, res) => {
  try {
    const history = await require("../models/Performance").find({ userId: req.user.id })
      .sort({ createdAt: -1 }).limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};