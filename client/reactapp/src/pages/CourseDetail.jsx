// pages/CourseDetail.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Chatbot from "../components/Chatbot";
import "./CourseDetail.css";

// ── MCQ Bank ───────────────────────────────────────────────────────────────────
const MCQ_BANK = {
  java: [
    { q: "Which keyword is used to inherit a class in Java?", opts: ["implements","extends","inherits","super"], ans: 1 },
    { q: "What is the size of int in Java?", opts: ["2 bytes","4 bytes","8 bytes","Depends on OS"], ans: 1 },
    { q: "Which method is the entry point of a Java program?", opts: ["start()","run()","main()","init()"], ans: 2 },
    { q: "What does JVM stand for?", opts: ["Java Virtual Machine","Java Variable Method","Java Verified Module","Java Visual Manager"], ans: 0 },
    { q: "Which of these is not a Java primitive type?", opts: ["int","String","boolean","char"], ans: 1 },
    { q: "What is the default value of a boolean in Java?", opts: ["true","false","0","null"], ans: 1 },
    { q: "Which interface does ArrayList implement?", opts: ["Map","Set","List","Queue"], ans: 2 },
    { q: "What is method overloading?", opts: ["Same name, same params","Same name, different params","Different name, same params","None"], ans: 1 },
    { q: "Which keyword prevents a class from being subclassed?", opts: ["static","abstract","final","private"], ans: 2 },
    { q: "What is the output of: System.out.println(10/3)?", opts: ["3.33","3","4","Error"], ans: 1 },
    { q: "Which collection allows duplicate keys?", opts: ["HashMap","HashSet","TreeMap","None of these"], ans: 3 },
    { q: "What does 'static' mean in Java?", opts: ["Object-level","Class-level","Private","Final"], ans: 1 },
    { q: "Which exception is thrown for array out of bounds?", opts: ["NullPointerException","IndexOutOfBoundsException","ArrayIndexOutOfBoundsException","ClassCastException"], ans: 2 },
    { q: "What is the parent class of all Java classes?", opts: ["Base","Super","Object","Class"], ans: 2 },
    { q: "Which keyword is used to create an object?", opts: ["create","new","make","object"], ans: 1 },
    { q: "Java is ___", opts: ["Compiled only","Interpreted only","Both compiled and interpreted","Neither"], ans: 2 },
    { q: "What is a constructor?", opts: ["A method that returns a value","A method called when object is created","A static method","An abstract method"], ans: 1 },
    { q: "Which access modifier is most restrictive?", opts: ["public","protected","default","private"], ans: 3 },
    { q: "What does 'this' keyword refer to?", opts: ["Parent class","Current class object","Static method","Interface"], ans: 1 },
    { q: "Which loop guarantees at least one execution?", opts: ["for","while","do-while","enhanced for"], ans: 2 },
  ],
  python: [
    { q: "Which keyword defines a function in Python?", opts: ["function","def","func","define"], ans: 1 },
    { q: "What is the output of type(3.14)?", opts: ["int","float","double","number"], ans: 1 },
    { q: "Which data structure uses key-value pairs?", opts: ["list","tuple","set","dict"], ans: 3 },
    { q: "How do you start a comment in Python?", opts: ["//","/*","#","--"], ans: 2 },
    { q: "What does len([1,2,3]) return?", opts: ["2","3","4","Error"], ans: 1 },
    { q: "Which is immutable in Python?", opts: ["list","dict","tuple","set"], ans: 2 },
    { q: "What is the output of 2**3?", opts: ["6","8","5","Error"], ans: 1 },
    { q: "Which method adds an element to a list?", opts: ["add()","push()","append()","insert_last()"], ans: 2 },
    { q: "What does 'pass' do in Python?", opts: ["Exits loop","Does nothing","Skips iteration","Returns None"], ans: 1 },
    { q: "Which operator is 'floor division'?", opts: ["/","//","%","**"], ans: 1 },
    { q: "What is a lambda function?", opts: ["Named function","Anonymous function","Recursive function","Class method"], ans: 1 },
    { q: "How do you open a file in Python?", opts: ["File.open()","open()","fopen()","read()"], ans: 1 },
    { q: "What does range(5) produce?", opts: ["1-5","0-5","0-4","1-4"], ans: 2 },
    { q: "Which is used for exception handling?", opts: ["try-catch","try-except","try-finally only","handle-error"], ans: 1 },
    { q: "What is PEP 8?", opts: ["Python package","Style guide","Library","Compiler"], ans: 1 },
    { q: "Which module is used for regular expressions?", opts: ["regex","re","regexp","pattern"], ans: 1 },
    { q: "What does 'self' refer to in a class?", opts: ["Parent class","Module","Current object instance","Static reference"], ans: 2 },
    { q: "How do you reverse a list 'lst'?", opts: ["lst.reverse()","reverse(lst)","lst[::-1]","Both A and C"], ans: 3 },
    { q: "What is a decorator in Python?", opts: ["A loop","A function that modifies another function","A class","A module"], ans: 1 },
    { q: "What is the output of bool('')?", opts: ["True","False","None","Error"], ans: 1 },
  ],
  cpp: [
    { q: "Which operator is used for pointer dereferencing?", opts: ["&","*","->","::"], ans: 1 },
    { q: "What is the correct way to declare a constant?", opts: ["constant int x","int const x","const int x","Both B and C"], ans: 3 },
    { q: "Which header is required for cout?", opts: ["stdio.h","stdlib.h","iostream","string"], ans: 2 },
    { q: "What does STL stand for?", opts: ["Standard Template Library","Static Type Library","System Template Layer","None"], ans: 0 },
    { q: "Which is the scope resolution operator?", opts: ["->",".","::","**"], ans: 2 },
    { q: "What is a destructor?", opts: ["Called on object creation","Called on object destruction","A static method","A virtual method"], ans: 1 },
    { q: "Which container provides O(1) lookup?", opts: ["vector","list","unordered_map","deque"], ans: 2 },
    { q: "What is a virtual function?", opts: ["Compile-time polymorphism","Runtime polymorphism","Static function","Inline function"], ans: 1 },
    { q: "What does 'new' keyword do?", opts: ["Declares variable","Allocates heap memory","Allocates stack memory","Deletes memory"], ans: 1 },
    { q: "Which is correct for function overloading?", opts: ["Same name, same signature","Same name, different signature","Different name","None"], ans: 1 },
    { q: "What is nullptr in C++11?", opts: ["Empty string","NULL pointer constant","Zero","Undefined"], ans: 1 },
    { q: "What is a reference variable?", opts: ["Pointer","Alias for another variable","Const variable","Array"], ans: 1 },
    { q: "What does 'auto' keyword do in C++11?", opts: ["Makes const","Type inference","Dynamic type","Pointer creation"], ans: 1 },
    { q: "Which is not a C++ OOP pillar?", opts: ["Encapsulation","Polymorphism","Compilation","Inheritance"], ans: 2 },
    { q: "What is the size of char in C++?", opts: ["1 byte","2 bytes","4 bytes","Depends"], ans: 0 },
    { q: "Which keyword prevents function from modifying object?", opts: ["static","final","const","mutable"], ans: 2 },
    { q: "What is RAII?", opts: ["Random Access Interface","Resource Acquisition Is Initialization","Runtime Allocation","None"], ans: 1 },
    { q: "Which smart pointer has shared ownership?", opts: ["unique_ptr","shared_ptr","weak_ptr","auto_ptr"], ans: 1 },
    { q: "What is the output of sizeof(int) typically?", opts: ["2","4","8","Depends on compiler"], ans: 3 },
    { q: "What is a copy constructor?", opts: ["Default constructor","Constructor that copies another object","Static constructor","None"], ans: 1 },
  ],
  c: [
    { q: "Which function reads a string in C?", opts: ["getc()","scanf()","gets()/fgets()","readstr()"], ans: 2 },
    { q: "What is a pointer?", opts: ["A variable storing value","A variable storing address","An array","A function"], ans: 1 },
    { q: "What does malloc() return?", opts: ["int","void*","char*","NULL always"], ans: 1 },
    { q: "Which operator gets address of variable?", opts: ["*","&","->","%"], ans: 1 },
    { q: "What is the use of free()?", opts: ["Allocate memory","Free heap memory","Free stack memory","Close file"], ans: 1 },
    { q: "Which header is needed for printf?", opts: ["stdlib.h","string.h","stdio.h","conio.h"], ans: 2 },
    { q: "What is a segmentation fault?", opts: ["Syntax error","Illegal memory access","Stack overflow","Division by zero"], ans: 1 },
    { q: "What does 'static' mean for a local variable?", opts: ["Destroyed after function","Persists between calls","Allocated on heap","Read-only"], ans: 1 },
    { q: "What is the size of a pointer on 64-bit system?", opts: ["4 bytes","8 bytes","2 bytes","Depends"], ans: 1 },
    { q: "Which function copies a string?", opts: ["strcat","strcmp","strcpy","strlen"], ans: 2 },
    { q: "What is a null terminator in strings?", opts: ["\\n","\\0","\\t","NULL"], ans: 1 },
    { q: "Which loop checks condition after execution?", opts: ["for","while","do-while","None"], ans: 2 },
    { q: "What is a function prototype?", opts: ["Function definition","Function declaration","Function call","None"], ans: 1 },
    { q: "Which is used for bitwise AND?", opts: ["&&","&","|","^"], ans: 1 },
    { q: "What does typedef do?", opts: ["Creates new type","Renames existing type","Both","Deletes type"], ans: 1 },
    { q: "What is a dangling pointer?", opts: ["NULL pointer","Pointer to freed memory","Wild pointer","Void pointer"], ans: 1 },
    { q: "Which storage class has default lifetime?", opts: ["static","extern","auto","register"], ans: 2 },
    { q: "What does fclose() do?", opts: ["Opens file","Closes file","Reads file","Deletes file"], ans: 1 },
    { q: "What is the correct syntax for a structure?", opts: ["struct{}","struct name{}","structure name{}","class name{}"], ans: 1 },
    { q: "Which is correct array declaration?", opts: ["int arr[]","int arr[5]","Both","int[5] arr"], ans: 2 },
  ],
  dsa: [
    { q: "What is the time complexity of binary search?", opts: ["O(n)","O(log n)","O(n²)","O(1)"], ans: 1 },
    { q: "Which data structure uses LIFO?", opts: ["Queue","Stack","Linked List","Tree"], ans: 1 },
    { q: "What is the worst case of quicksort?", opts: ["O(n log n)","O(n)","O(n²)","O(log n)"], ans: 2 },
    { q: "Which traversal visits root first?", opts: ["Inorder","Postorder","Preorder","Level order"], ans: 2 },
    { q: "Dijkstra's algorithm finds?", opts: ["Minimum spanning tree","Shortest path","Longest path","DFS order"], ans: 1 },
    { q: "Which is NOT O(n log n) sort?", opts: ["Merge sort","Heap sort","Quick sort avg","Bubble sort"], ans: 3 },
    { q: "What is a hash collision?", opts: ["Two keys map to same bucket","Key not found","Table overflow","None"], ans: 0 },
    { q: "Which structure is used in BFS?", opts: ["Stack","Queue","Heap","Tree"], ans: 1 },
    { q: "What is dynamic programming?", opts: ["Recursion only","Breaking into subproblems with memoization","Greedy approach","Graph algorithm"], ans: 1 },
    { q: "Which heap gives minimum element at root?", opts: ["Max heap","Min heap","Both","Neither"], ans: 1 },
    { q: "What is a trie used for?", opts: ["Number storage","String prefix search","Graph traversal","Sorting"], ans: 1 },
    { q: "Floyd-Warshall finds?", opts: ["Single source shortest path","All pairs shortest path","MST","Topological sort"], ans: 1 },
    { q: "What is a circular linked list?", opts: ["No head node","Last node points to first","Doubly linked","None"], ans: 1 },
    { q: "Which sorting is stable?", opts: ["Quick sort","Heap sort","Merge sort","Selection sort"], ans: 2 },
    { q: "What is the space complexity of DFS?", opts: ["O(1)","O(V)","O(E)","O(V+E)"], ans: 1 },
    { q: "What is KMP algorithm used for?", opts: ["Sorting","Pattern matching in strings","Graph search","Tree traversal"], ans: 1 },
    { q: "What is the height of a complete binary tree with n nodes?", opts: ["n","log n","n/2","√n"], ans: 1 },
    { q: "What is amortized analysis?", opts: ["Worst case only","Average over sequence of operations","Best case","None"], ans: 1 },
    { q: "Which tree has no cycles?", opts: ["Graph","DAG","Tree (by definition)","Both B and C"], ans: 3 },
    { q: "What is a balanced BST?", opts: ["All leaves same level","Heights differ by at most 1","Complete binary tree","Full binary tree"], ans: 1 },
  ],
  mysql: [
    { q: "Which command retrieves data?", opts: ["INSERT","SELECT","UPDATE","DELETE"], ans: 1 },
    { q: "What does PRIMARY KEY ensure?", opts: ["Unique + Not Null","Only Unique","Only Not Null","Foreign reference"], ans: 0 },
    { q: "Which JOIN returns all rows from both tables?", opts: ["INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL OUTER JOIN"], ans: 3 },
    { q: "What does GROUP BY do?", opts: ["Sorts rows","Groups rows by column values","Filters groups","Joins tables"], ans: 1 },
    { q: "Which clause filters groups?", opts: ["WHERE","HAVING","GROUP BY","ORDER BY"], ans: 1 },
    { q: "What is a foreign key?", opts: ["Primary key of same table","References primary key of another table","Unique key","Index"], ans: 1 },
    { q: "Which aggregate counts non-null values?", opts: ["SUM","AVG","COUNT","MAX"], ans: 2 },
    { q: "What does DISTINCT do?", opts: ["Sorts results","Removes duplicates","Filters NULLs","Groups rows"], ans: 1 },
    { q: "Which is DDL command?", opts: ["SELECT","INSERT","CREATE","UPDATE"], ans: 2 },
    { q: "What does TRUNCATE do?", opts: ["Deletes table","Removes all rows, keeps structure","Drops database","None"], ans: 1 },
    { q: "What is normalization?", opts: ["Speeding up queries","Organizing data to reduce redundancy","Joining tables","Indexing"], ans: 1 },
    { q: "What is a VIEW?", opts: ["Physical table","Virtual table based on query","Stored procedure","Trigger"], ans: 1 },
    { q: "Which operator checks for NULL?", opts: ["= NULL","IS NULL","== NULL","NULL?"], ans: 1 },
    { q: "What is ACID in databases?", opts: ["A type of join","Transaction properties","Indexing method","None"], ans: 1 },
    { q: "Which command changes column value?", opts: ["ALTER","UPDATE","MODIFY","CHANGE"], ans: 1 },
    { q: "What does LIKE '%a%' match?", opts: ["Starts with a","Ends with a","Contains a","Exactly a"], ans: 2 },
    { q: "What is a stored procedure?", opts: ["Saved SQL query","Precompiled SQL code block","View","Trigger"], ans: 1 },
    { q: "Which join returns only matching rows?", opts: ["LEFT JOIN","RIGHT JOIN","INNER JOIN","FULL JOIN"], ans: 2 },
    { q: "What is the use of AUTO_INCREMENT?", opts: ["Auto-date","Generates unique ID","Encrypts column","None"], ans: 1 },
    { q: "Which index speeds up searches?", opts: ["PRIMARY KEY","UNIQUE","INDEX/KEY","All of these"], ans: 3 },
  ],
  javascript: [
    { q: "Which keyword declares a block-scoped variable?", opts: ["var","let","const","Both let and const"], ans: 3 },
    { q: "What does typeof null return?", opts: ["null","undefined","object","string"], ans: 2 },
    { q: "What is a closure?", opts: ["A loop","Function accessing outer scope variables","Anonymous function","Arrow function"], ans: 1 },
    { q: "What does === check?", opts: ["Value only","Type only","Value and type","Reference"], ans: 2 },
    { q: "Which method removes last array element?", opts: ["shift()","unshift()","pop()","splice()"], ans: 2 },
    { q: "What is the event loop?", opts: ["DOM event","Mechanism for async operations","CSS animation","None"], ans: 1 },
    { q: "What does Promise.all() do?", opts: ["Runs promises sequentially","Waits for all promises","Returns first resolved","Rejects all"], ans: 1 },
    { q: "What is hoisting?", opts: ["Moving code to bottom","Variables/functions moved to top of scope","Loop optimization","None"], ans: 1 },
    { q: "Which is falsy in JS?", opts: ["'false'","[]","0","{}"], ans: 2 },
    { q: "What does async/await do?", opts: ["Creates threads","Handles promises like sync code","Blocks execution","None"], ans: 1 },
    { q: "Which method transforms each array element?", opts: ["filter()","reduce()","map()","forEach()"], ans: 2 },
    { q: "What is destructuring?", opts: ["Deleting objects","Extracting values from arrays/objects","Merging objects","None"], ans: 1 },
    { q: "What does spread operator (...) do?", opts: ["Deletes elements","Expands iterable into individual elements","Reverses array","None"], ans: 1 },
    { q: "What is a WeakMap?", opts: ["Map with weak types","Map with weakly referenced keys","Deprecated Map","None"], ans: 1 },
    { q: "What does Object.freeze() do?", opts: ["Deep copies object","Prevents modifications","Deletes object","Seals prototype"], ans: 1 },
    { q: "What is the prototype chain?", opts: ["CSS inheritance","Object inheritance mechanism","Module system","None"], ans: 1 },
    { q: "What is a Symbol in JS?", opts: ["String type","Unique primitive value","Number type","Object"], ans: 1 },
    { q: "Which runs code after current call stack?", opts: ["setTimeout(fn,0)","setInterval","requestAnimationFrame","All"], ans: 0 },
    { q: "What is tree shaking?", opts: ["DOM manipulation","Removing unused code during bundling","CSS technique","None"], ans: 1 },
    { q: "What is the Temporal Dead Zone?", opts: ["Deleted variable zone","Period before let/const declaration","Null zone","Undefined zone"], ans: 1 },
  ],
  os: [
    { q: "What is a process?", opts: ["Program on disk","Program in execution","File","Thread"], ans: 1 },
    { q: "Which scheduling is non-preemptive?", opts: ["Round Robin","SRTF","FCFS","Priority (preemptive)"], ans: 2 },
    { q: "What is a deadlock?", opts: ["System crash","Circular wait for resources","Memory leak","Stack overflow"], ans: 1 },
    { q: "Which page replacement has least page faults?", opts: ["FIFO","LRU","OPT","Random"], ans: 2 },
    { q: "What is thrashing?", opts: ["Fast CPU","Excessive paging causing low CPU use","Cache hit","None"], ans: 1 },
    { q: "What is a semaphore?", opts: ["Hardware component","Synchronization variable","Memory type","Process state"], ans: 1 },
    { q: "Which is NOT a Coffman condition?", opts: ["Mutual Exclusion","Hold and Wait","Starvation","Circular Wait"], ans: 2 },
    { q: "What is virtual memory?", opts: ["Physical RAM","Extension of RAM using disk","Cache memory","Register"], ans: 1 },
    { q: "What is context switching?", opts: ["Changing user","Saving/restoring process state","Memory allocation","None"], ans: 1 },
    { q: "What is a zombie process?", opts: ["Infinite loop process","Completed but not reaped process","Malware","Orphan"], ans: 1 },
    { q: "What is banker's algorithm used for?", opts: ["Memory allocation","Deadlock avoidance","CPU scheduling","File management"], ans: 1 },
    { q: "What is internal fragmentation?", opts: ["Wasted space outside allocation","Wasted space inside allocation","Free memory","None"], ans: 1 },
    { q: "What is spooling?", opts: ["CPU scheduling","Buffering I/O for slow devices","Virtual memory","Paging"], ans: 1 },
    { q: "What is the purpose of TLB?", opts: ["Store programs","Speed up page table lookup","Schedule processes","None"], ans: 1 },
    { q: "Which is fastest memory?", opts: ["RAM","Cache","Register","SSD"], ans: 2 },
    { q: "What is demand paging?", opts: ["Load all pages at start","Load pages only when needed","Page replacement","None"], ans: 1 },
    { q: "What is a race condition?", opts: ["CPU speed issue","Output depends on execution order","Memory overflow","None"], ans: 1 },
    { q: "What is the role of PCB?", opts: ["Stores process information","Manages memory","Schedules CPU","None"], ans: 0 },
    { q: "Which is a real-time OS?", opts: ["Windows 10","Ubuntu","VxWorks","macOS"], ans: 2 },
    { q: "What is a user-level thread disadvantage?", opts: ["Slow context switch","Kernel unaware, blocking affects all","Hard to create","None"], ans: 1 },
  ],
  cn: [
    { q: "How many layers does OSI model have?", opts: ["4","5","7","6"], ans: 2 },
    { q: "Which layer handles routing?", opts: ["Data Link","Transport","Network","Session"], ans: 2 },
    { q: "What does TCP stand for?", opts: ["Transfer Control Protocol","Transmission Control Protocol","Transport Connection Protocol","None"], ans: 1 },
    { q: "Which is connectionless protocol?", opts: ["TCP","FTP","UDP","HTTP"], ans: 2 },
    { q: "What is the purpose of DNS?", opts: ["Assigns IP","Translates domain to IP","Routes packets","Encrypts data"], ans: 1 },
    { q: "What does DHCP do?", opts: ["Resolves DNS","Assigns IP addresses dynamically","Encrypts traffic","Routes data"], ans: 1 },
    { q: "Which topology has central hub?", opts: ["Bus","Ring","Star","Mesh"], ans: 2 },
    { q: "What is subnetting?", opts: ["Combining networks","Dividing network into smaller parts","Routing protocol","None"], ans: 1 },
    { q: "Which protocol sends email?", opts: ["IMAP","POP3","SMTP","FTP"], ans: 2 },
    { q: "What is a MAC address?", opts: ["IP address","Physical hardware address","Port number","DNS name"], ans: 1 },
    { q: "Which layer does HTTP operate at?", opts: ["Network","Transport","Application","Data Link"], ans: 2 },
    { q: "What is the default HTTP port?", opts: ["21","22","80","443"], ans: 2 },
    { q: "What is ARP?", opts: ["Resolves IP to MAC","Resolves MAC to IP","Routing protocol","None"], ans: 0 },
    { q: "Which is a private IP range?", opts: ["8.8.8.8","192.168.x.x","142.250.x.x","All"], ans: 1 },
    { q: "What is a firewall?", opts: ["Router","Filters network traffic","Switches packets","None"], ans: 1 },
    { q: "What does HTTPS add over HTTP?", opts: ["Speed","Encryption via SSL/TLS","Compression","None"], ans: 1 },
    { q: "What is bandwidth?", opts: ["Signal strength","Maximum data transfer rate","Latency","None"], ans: 1 },
    { q: "Which device connects different networks?", opts: ["Hub","Switch","Router","Repeater"], ans: 2 },
    { q: "What is a VPN?", opts: ["Virtual Private Network","Very Private Node","Virtual Protocol Network","None"], ans: 0 },
    { q: "What is a subnet mask?", opts: ["IP address","Identifies network/host portions","MAC address","Gateway"], ans: 1 },
  ],
  dbms: [
    { q: "What does DBMS stand for?", opts: ["Data Base Management System","Database Multi-Server","Dynamic Base Management","None"], ans: 0 },
    { q: "Which normal form removes partial dependency?", opts: ["1NF","2NF","3NF","BCNF"], ans: 1 },
    { q: "What is a candidate key?", opts: ["Any superkey","Minimal superkey","Primary key","Foreign key"], ans: 1 },
    { q: "Which is NOT an ACID property?", opts: ["Atomicity","Consistency","Isolation","Distribution"], ans: 3 },
    { q: "What is a transaction?", opts: ["Single SQL query","Unit of work with ACID properties","View","Stored procedure"], ans: 1 },
    { q: "What does ER stand for?", opts: ["Entity Relationship","External Reference","Entity Record","None"], ans: 0 },
    { q: "What is a weak entity?", opts: ["Entity with no attributes","Entity depending on another for identity","Empty table","None"], ans: 1 },
    { q: "What is serializability?", opts: ["Parallel execution","Equivalent to serial schedule","Random execution","None"], ans: 1 },
    { q: "What is a lossless join?", opts: ["Join that loses data","Decomposition with no information loss","Cross join","None"], ans: 1 },
    { q: "What is a B+ tree index?", opts: ["Binary tree","Balanced tree for fast data access","Hash index","None"], ans: 1 },
    { q: "What is a deadlock in DBMS?", opts: ["Slow query","Transactions waiting for each other","Disk failure","None"], ans: 1 },
    { q: "What is a checkpoint?", opts: ["Backup","Point where DB state is saved for recovery","Query optimization","None"], ans: 1 },
    { q: "What is functional dependency?", opts: ["A→B means A determines B","A=B","Foreign key","None"], ans: 0 },
    { q: "What is BCNF?", opts: ["Stricter than 3NF","Looser than 3NF","Same as 3NF","None"], ans: 0 },
    { q: "What is a clustered index?", opts: ["Data sorted by index key","Separate from data","Multiple columns","None"], ans: 0 },
    { q: "What is a dirty read?", opts: ["Reading committed data","Reading uncommitted data","Corrupted file","None"], ans: 1 },
    { q: "What does rollback do?", opts: ["Saves transaction","Undoes transaction changes","Commits changes","Deletes table"], ans: 1 },
    { q: "What is a schema?", opts: ["Data itself","Structure of database","Query language","None"], ans: 1 },
    { q: "What is a superkey?", opts: ["Minimal key","Set of attributes identifying a tuple","Foreign key","Primary key only"], ans: 1 },
    { q: "Which join is also called natural join?", opts: ["INNER JOIN on common columns","LEFT JOIN","CROSS JOIN","SELF JOIN"], ans: 0 },
  ],
};

const DEFAULT_MCQ = Array.from({length:20},(_,i)=>({ q:`Question ${i+1}: Which concept is fundamental?`, opts:["Concept A","Concept B","Concept C","Concept D"], ans: i%4 }));
const getMCQ = (id) => MCQ_BANK[id] || DEFAULT_MCQ;

// ── Course Data ────────────────────────────────────────────────────────────────
const COURSES = {
  java:       { id:"java",       title:"Java",              icon:"☕",  color:"#f89820", category:"language", level:"Beginner to Advanced",    duration:"12 weeks", problems:320, description:"Object-oriented, platform-independent, enterprise-grade programming. Java powers Android apps, enterprise systems, and backend services worldwide.", whatYouLearn:["Java Syntax & OOP Concepts","Collections & Generics","Multithreading & Concurrency","File I/O & Exception Handling","Java 8+ Features (Streams, Lambda)","Spring Boot Basics"], topics:[{level:1,name:"Java Basics",items:["Variables & Data Types","Operators & Expressions","Control Flow","Methods & Recursion"]},{level:2,name:"Object Oriented Programming",items:["Classes & Objects","Inheritance & Polymorphism","Abstraction & Interfaces","Encapsulation"]},{level:3,name:"Advanced Java",items:["Collections Framework","Multithreading","File Handling","JDBC & Databases"]}], youtubeLinks:[{label:"Java Full Course – Apna College",url:"https://www.youtube.com/watch?v=GNo7yWvBSkQ"},{label:"Java Complete Tutorial – Telusko",url:"https://www.youtube.com/watch?v=8cm1x4bC610"}], theoryLinks:[{label:"Java Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/java/"},{label:"Java Documentation – Oracle",url:"https://docs.oracle.com/en/java/"},{label:"Java W3Schools",url:"https://www.w3schools.com/java/"}] },
  python:     { id:"python",     title:"Python",            icon:"🐍",  color:"#3776ab", category:"language", level:"Beginner to Advanced",    duration:"10 weeks", problems:400, description:"AI, ML, automation and rapid prototyping made simple. Python is the #1 language for data science, machine learning, and scripting.", whatYouLearn:["Python Syntax & Data Types","Functions & Modules","OOP in Python","File Handling & Exceptions","Libraries: NumPy, Pandas","Web Scraping & Automation"], topics:[{level:1,name:"Python Basics",items:["Variables & I/O","Strings & Lists","Tuples & Dictionaries","Control Flow & Loops"]},{level:2,name:"Intermediate Python",items:["Functions & Lambda","OOP Concepts","File Handling","Exception Handling"]},{level:3,name:"Advanced Python",items:["Decorators & Generators","NumPy & Pandas","Regex","Async Programming"]}], youtubeLinks:[{label:"Python Full Course – Apna College",url:"https://www.youtube.com/watch?v=K5KVEU3aaeQ"},{label:"Python Bootcamp – freeCodeCamp",url:"https://www.youtube.com/watch?v=rfscVS0vtbw"}], theoryLinks:[{label:"Python Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/python-programming-language/"},{label:"Official Python Docs",url:"https://docs.python.org/3/"},{label:"Python W3Schools",url:"https://www.w3schools.com/python/"}] },
  c:          { id:"c",          title:"C Programming",     icon:"C",   color:"#5c6bc0", category:"language", level:"Beginner",               duration:"8 weeks",  problems:250, description:"Low-level systems programming, memory management and OS fundamentals. C is the foundation of modern computing.", whatYouLearn:["C Syntax & Structure","Pointers & Memory Management","Arrays & Strings","Structures & Unions","File I/O in C","Dynamic Memory Allocation"], topics:[{level:1,name:"C Basics",items:["Variables & Data Types","Input/Output","Operators","Control Statements"]},{level:2,name:"Functions & Arrays",items:["Functions & Recursion","Arrays & Strings","Pointers","Structures"]},{level:3,name:"Advanced C",items:["Dynamic Memory","File Handling","Preprocessor Directives","Linked Lists in C"]}], youtubeLinks:[{label:"C Programming Full Course – Apna College",url:"https://www.youtube.com/watch?v=xND0t1pr3KY"}], theoryLinks:[{label:"C Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/c-programming-language/"},{label:"C Reference – cppreference",url:"https://en.cppreference.com/w/c"},{label:"C W3Schools",url:"https://www.w3schools.com/c/"}] },
  cpp:        { id:"cpp",        title:"C++",               icon:"</>", color:"#00599c", category:"language", level:"Beginner to Advanced",    duration:"12 weeks", problems:380, description:"High-performance competitive programming and system development. C++ is the go-to for game engines, embedded systems and competitive programming.", whatYouLearn:["C++ Syntax & OOP","STL – Vectors, Maps, Sets","Templates & Generic Programming","Memory Management","Competitive Programming Tricks","Modern C++17/20 Features"], topics:[{level:1,name:"C++ Basics",items:["Syntax & Data Types","Control Flow","Functions","Arrays & Strings"]},{level:2,name:"OOP & STL",items:["Classes & Objects","Inheritance","STL Containers","Iterators & Algorithms"]},{level:3,name:"Advanced C++",items:["Templates","Smart Pointers","Move Semantics","Multithreading"]}], youtubeLinks:[{label:"C++ Full Course – Apna College",url:"https://www.youtube.com/watch?v=-TkoO8Z07hI"}], theoryLinks:[{label:"C++ Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/c-plus-plus/"},{label:"C++ Reference – cppreference",url:"https://en.cppreference.com/w/cpp"},{label:"C++ W3Schools",url:"https://www.w3schools.com/cpp/"}] },
  dsa:        { id:"dsa",        title:"DSA",               icon:"🌳",  color:"#22c55e", category:"cs",       level:"Intermediate to Advanced", duration:"16 weeks", problems:500, description:"Master problem solving with arrays, trees, graphs, DP and more. DSA is essential for cracking FAANG interviews.", whatYouLearn:["Arrays, Linked Lists, Stacks, Queues","Trees & Binary Search Trees","Graphs – BFS, DFS, Dijkstra","Sorting & Searching Algorithms","Dynamic Programming","Greedy & Backtracking"], topics:[{level:1,name:"Linear Data Structures",items:["Arrays & Strings","Linked Lists","Stacks & Queues","Hashing"]},{level:2,name:"Non-Linear Structures",items:["Trees & BST","Heaps & Priority Queue","Graphs","Tries"]},{level:3,name:"Algorithms",items:["Sorting Algorithms","Binary Search","Dynamic Programming","Greedy Algorithms"]}], youtubeLinks:[{label:"DSA Full Course – Apna College",url:"https://www.youtube.com/watch?v=CBYHwZcbD-s"}], theoryLinks:[{label:"DSA Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/data-structures/"},{label:"Algorithms – GeeksforGeeks",url:"https://www.geeksforgeeks.org/fundamentals-of-algorithms/"},{label:"DSA Visualizer",url:"https://visualgo.net/en"}] },
  mysql:      { id:"mysql",      title:"MySQL",             icon:"🗄️", color:"#f59e0b", category:"database",  level:"Beginner to Intermediate", duration:"6 weeks",  problems:150, description:"Relational database design, SQL queries and database management. MySQL powers millions of web applications worldwide.", whatYouLearn:["SQL Basics – SELECT, INSERT, UPDATE","Joins – INNER, LEFT, RIGHT, FULL","Subqueries & Views","Indexes & Query Optimization","Stored Procedures & Triggers","Database Design & Normalization"], topics:[{level:1,name:"SQL Basics",items:["DDL & DML Commands","SELECT Queries","WHERE & ORDER BY","GROUP BY & HAVING"]},{level:2,name:"Joins & Subqueries",items:["INNER & OUTER Joins","Subqueries","Views","Aggregation Functions"]},{level:3,name:"Advanced MySQL",items:["Indexes","Stored Procedures","Triggers","Transactions & ACID"]}], youtubeLinks:[{label:"MySQL Full Course – CodeWithHarry",url:"https://www.youtube.com/watch?v=yE6tIle64tU"}], theoryLinks:[{label:"MySQL Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/mysql-tutorial/"},{label:"MySQL W3Schools",url:"https://www.w3schools.com/mysql/"},{label:"Official MySQL Docs",url:"https://dev.mysql.com/doc/"}] },
  javascript: { id:"javascript", title:"JavaScript",        icon:"🟨",  color:"#f7df1e", category:"language", level:"Beginner to Advanced",    duration:"10 weeks", problems:280, description:"The language of the web — frontend, backend and everything in between. JS is the only language that runs natively in browsers.", whatYouLearn:["JS Syntax & ES6+ Features","DOM Manipulation","Async/Await & Promises","Fetch API & REST","React.js Basics","Node.js & Express"], topics:[{level:1,name:"JS Basics",items:["Variables & Types","Functions & Scope","Arrays & Objects","DOM Manipulation"]},{level:2,name:"Intermediate JS",items:["ES6+ Features","Promises & Async/Await","Fetch API","Error Handling"]},{level:3,name:"Advanced JS",items:["Closures & Prototypes","Event Loop","Design Patterns","Testing"]}], youtubeLinks:[{label:"JavaScript Full Course – Apna College",url:"https://www.youtube.com/watch?v=VlPiVmYuoqw"}], theoryLinks:[{label:"JavaScript – GeeksforGeeks",url:"https://www.geeksforgeeks.org/javascript/"},{label:"JavaScript – MDN Web Docs",url:"https://developer.mozilla.org/en-US/docs/Web/JavaScript"},{label:"JavaScript W3Schools",url:"https://www.w3schools.com/js/"}] },
  os:         { id:"os",         title:"Operating Systems", icon:"💻",  color:"#8b5cf6", category:"cs",       level:"Intermediate",             duration:"8 weeks",  problems:80,  description:"Process management, memory, file systems and OS internals. Essential for system programming and interviews.", whatYouLearn:["Process & Thread Management","CPU Scheduling Algorithms","Memory Management & Paging","Deadlocks & Synchronization","File Systems","Virtual Memory"], topics:[{level:1,name:"OS Basics",items:["Introduction to OS","Process vs Thread","Process States","Context Switching"]},{level:2,name:"CPU & Memory",items:["Scheduling Algorithms","Deadlock Detection","Paging & Segmentation","Virtual Memory"]},{level:3,name:"Advanced Topics",items:["File Systems","I/O Management","Inter-Process Communication","Linux Internals"]}], youtubeLinks:[{label:"OS Full Course – Neso Academy",url:"https://www.youtube.com/watch?v=zOjov-2OZ0E"},{label:"OS – Gate Smashers",url:"https://www.youtube.com/watch?v=LfaMVlDaQ24"}], theoryLinks:[{label:"OS Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/operating-systems/"},{label:"OS Concepts – Tutorialspoint",url:"https://www.tutorialspoint.com/operating_system/"}] },
  cn:         { id:"cn",         title:"Computer Networks", icon:"🌐",  color:"#06b6d4", category:"cs",       level:"Intermediate",             duration:"8 weeks",  problems:70,  description:"TCP/IP, protocols, routing and network security fundamentals. Networks connect everything in the modern world.", whatYouLearn:["OSI & TCP/IP Model","IP Addressing & Subnetting","TCP, UDP, HTTP, DNS","Routing & Switching","Network Security Basics","Socket Programming"], topics:[{level:1,name:"Network Basics",items:["OSI Model","TCP/IP Stack","IP Addressing","Subnetting"]},{level:2,name:"Protocols",items:["TCP & UDP","HTTP/HTTPS","DNS & DHCP","FTP & SMTP"]},{level:3,name:"Advanced Networking",items:["Routing Algorithms","Firewalls & VPN","Network Security","Socket Programming"]}], youtubeLinks:[{label:"Computer Networks – Gate Smashers",url:"https://www.youtube.com/watch?v=-uleG_Vecis"}], theoryLinks:[{label:"CN Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/computer-network-tutorials/"},{label:"Networking Basics – Cisco",url:"https://www.cisco.com/c/en/us/solutions/enterprise-networks/what-is-computer-networking.html"}] },
  dbms:       { id:"dbms",       title:"DBMS",              icon:"📊",  color:"#ef4444", category:"database",  level:"Intermediate",             duration:"6 weeks",  problems:90,  description:"Database management theory, ER models, normalization and transactions. DBMS is core to every software system.", whatYouLearn:["ER Diagrams & Schema Design","Normalization (1NF to BCNF)","SQL & Relational Algebra","Transaction Management & ACID","Concurrency Control","Indexing & Query Optimization"], topics:[{level:1,name:"DBMS Concepts",items:["Introduction to DBMS","ER Model","Relational Model","Keys & Constraints"]},{level:2,name:"SQL & Normalization",items:["SQL Queries","Relational Algebra","Normalization 1NF-BCNF","Functional Dependencies"]},{level:3,name:"Advanced DBMS",items:["Transactions & ACID","Concurrency Control","Recovery Techniques","Indexing B+ Trees"]}], youtubeLinks:[{label:"DBMS Full Course – Gate Smashers",url:"https://www.youtube.com/watch?v=kBdlM6hNDAE"}], theoryLinks:[{label:"DBMS Tutorial – GeeksforGeeks",url:"https://www.geeksforgeeks.org/dbms/"},{label:"DBMS – Tutorialspoint",url:"https://www.tutorialspoint.com/dbms/"}] },
};

// ── MCQ Contest ────────────────────────────────────────────────────────────────
const DURATION = 20 * 60;

const MCQContest = ({ course, onBack }) => {
  const questions = getMCQ(course.id);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft,  setTimeLeft]  = useState(DURATION);
  const [score,     setScore]     = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); doSubmit(answers); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const doSubmit = (ans) => {
    clearInterval(timerRef.current);
    let s = 0;
    questions.forEach((q, i) => { if (ans[i] === q.ans) s++; });
    setScore(s);
    setSubmitted(true);
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const urgent = timeLeft < 120;
  const pct = Math.round((score / questions.length) * 100);

  if (submitted) {
    return (
      <div className="cd-page">
        <div className="cd-topbar" style={{ borderBottom: `2px solid ${course.color}` }}>
          <button className="cd-back-btn" onClick={onBack}>← Back to Course</button>
          <div className="cd-topbar-info">
            <span className="cd-topbar-icon" style={{ color: course.color, background: course.color + "20" }}>{course.icon}</span>
            <span className="cd-topbar-title">{course.title} — Results</span>
          </div>
        </div>
        <div className="mcq-result-page">
          <div className="mcq-result-hero" style={{ background: `linear-gradient(135deg, ${course.color}15, transparent)`, borderColor: course.color + "30" }}>
            <div className="mcq-result-emoji">{pct >= 70 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>
            <h2>{pct >= 70 ? "Excellent Work!" : pct >= 50 ? "Good Job!" : "Keep Practicing!"}</h2>
            <div className="mcq-result-big-score" style={{ color: course.color }}>{score}<span>/{questions.length}</span></div>
            <p className="mcq-result-pct-text">{pct}% correct</p>
            <div className="mcq-result-bar-wrap">
              <div className="mcq-result-bar" style={{ width:`${pct}%`, background: course.color }}/>
            </div>
            <button className="mcq-retake-btn" style={{ background: course.color }} onClick={onBack}>← Back to Course</button>
          </div>
          <h3 className="mcq-review-heading">Answer Review</h3>
          <div className="mcq-review-list">
            {questions.map((q, i) => {
              const sel = answers[i]; const isRight = sel === q.ans;
              return (
                <div key={i} className={`mcq-review-card ${isRight?"right":"wrong"}`}>
                  <div className="mcq-review-badge">{isRight ? "✓" : "✗"}</div>
                  <div>
                    <p className="mcq-review-q"><strong>Q{i+1}.</strong> {q.q}</p>
                    {!isRight && <p className="mcq-review-wrong">Your answer: {sel !== undefined ? q.opts[sel] : "Not answered"}</p>}
                    <p className="mcq-review-correct">✓ {q.opts[q.ans]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <div className="cd-topbar" style={{ borderBottom: `2px solid ${course.color}` }}>
        <button className="cd-back-btn" onClick={onBack}>← Exit Contest</button>
        <div className="cd-topbar-info">
          <span className="cd-topbar-icon" style={{ color: course.color, background: course.color + "20" }}>{course.icon}</span>
          <span className="cd-topbar-title">{course.title} — Practice Contest</span>
        </div>
        <div className={`mcq-page-timer ${urgent?"urgent":""}`}>⏱ {fmt(timeLeft)}</div>
      </div>
      <div className="mcq-contest-layout">
        <div className="mcq-sidebar">
          <p className="mcq-sb-title">Progress</p>
          <div className="mcq-sb-stat" style={{ color: course.color }}>
            {Object.keys(answers).length}<span>/{questions.length}</span>
          </div>
          <p className="mcq-sb-label">Answered</p>
          <div className="mcq-sb-grid">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`mcq-sb-dot ${answers[i]!==undefined?"filled":""}`}
                style={answers[i]!==undefined?{background:course.color,borderColor:course.color}:{}}
              >{i+1}</div>
            ))}
          </div>
          <button
            className="mcq-submit-full"
            style={{ background: course.color }}
            onClick={() => doSubmit(answers)}
          >
            Submit ({Object.keys(answers).length}/{questions.length})
          </button>
        </div>
        <div className="mcq-main">
          {questions.map((q, qi) => (
            <div key={qi} id={`q-${qi}`} className={`mcq-qcard ${answers[qi]!==undefined?"answered":""}`}>
              <div className="mcq-qcard-num" style={{ background: course.color + "22", color: course.color }}>Q{qi+1}</div>
              <p className="mcq-qcard-text">{q.q}</p>
              <div className="mcq-qcard-opts">
                {q.opts.map((opt, oi) => (
                  <button
                    key={oi}
                    className={`mcq-qcard-opt ${answers[qi]===oi?"sel":""}`}
                    style={answers[qi]===oi?{borderColor:course.color,background:course.color+"18",color:course.color}:{}}
                    onClick={() => setAnswers(p => ({...p,[qi]:oi}))}
                  >
                    <span className="mcq-opt-lbl" style={answers[qi]===oi?{background:course.color,color:"#fff"}:{}}>
                      {String.fromCharCode(65+oi)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Vertical Nav Tabs ──────────────────────────────────────────────────────────
const TABS = [
  { key:"overview",   icon:"📋", label:"Overview"    },
  { key:"curriculum", icon:"📚", label:"Curriculum"  },
  { key:"practice",   icon:"🏆", label:"Practice"    },
  { key:"tutorials",  icon:"▶️", label:"Tutorials"   },
  { key:"theory",     icon:"🔗", label:"Theory"      },
];

// ── Course Detail Page ─────────────────────────────────────────────────────────
const CourseDetail = () => {
  const { courseId }    = useParams();
  const navigate        = useNavigate();
  const [tab, setTab]   = useState("overview");
  const [mcq, setMcq]   = useState(false);
  const course          = COURSES[courseId];

  useEffect(() => { window.scrollTo(0,0); }, []);

  if (!course) return (
    <div className="cd-not-found">
      <h2>Course not found</h2>
      <button onClick={() => navigate("/courses")}>← Back to Courses</button>
    </div>
  );

  if (mcq) return <MCQContest course={course} onBack={() => setMcq(false)} />;

  // Inject CSS variable for course color
  const pageStyle = {
    '--course-color': course.color,
    '--course-color-alpha': course.color + '20',
  };

  return (
    <div className="cd-page" style={pageStyle}>

      {/* ── Top Bar ── */}
      <div className="cd-topbar" style={{ borderBottom: `2px solid ${course.color}30` }}>
        <button className="cd-back-btn" onClick={() => navigate("/courses")}>← All Courses</button>
        <div className="cd-topbar-info">
          <span className="cd-topbar-icon" style={{ color: course.color, background: course.color + "20" }}>
            {course.icon}
          </span>
          <div>
            <div className="cd-topbar-title">{course.title}</div>
            <div className="cd-topbar-meta">
              <span>📅 {course.duration}</span>
              <span>🧩 {course.problems} Problems</span>
              <span>🎯 {course.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div className="cd-hero">
        <div className="cd-hero-inner">
          <div className="cd-hero-icon" style={{ background: course.color + "20", color: course.color }}>
            {course.icon}
          </div>
          <div>
            <h1 className="cd-hero-title">{course.title}</h1>
            <p className="cd-hero-desc">{course.description}</p>
            <div className="cd-hero-tags">
              <span className="cd-hero-tag" style={{ background: course.color + "20", color: course.color, borderColor: course.color + "40" }}>
                {course.level}
              </span>
              <span className="cd-hero-tag">📅 {course.duration}</span>
              <span className="cd-hero-tag">🧩 {course.problems} problems</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="cd-layout">

        {/* ── Vertical Sidebar Nav ── */}
        <nav className="cd-sidebar">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`cd-nav-item ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className="cd-nav-icon">{t.icon}</span>
              <span className="cd-nav-label">{t.label}</span>
              {tab === t.key && (
                <span style={{ marginLeft:"auto", color: course.color, fontSize:10 }}>●</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Tab Content ── */}
        <div className="cd-content">

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="cd-tab-content">
              <div style={{ marginBottom: 6 }}>
                <div className="cd-divider" style={{ background: course.color }} />
              </div>
              <div className="cd-overview-grid">
                <div>
                  <p className="cd-section-sub">Everything you'll master in this course</p>
                  <div className="cd-learn-grid">
                    {course.whatYouLearn.map((item, i) => (
                      <div key={i} className="cd-learn-item">
                        <span className="cd-learn-check" style={{ color: course.color }}>✓</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="cd-side-card">
                    <h3>Course Details</h3>
                    <div className="cd-side-stat">
                      <span>⏱</span>
                      <div><strong>{course.duration}</strong><small>Duration</small></div>
                    </div>
                    <div className="cd-side-stat">
                      <span>🧩</span>
                      <div><strong>{course.problems}</strong><small>Problems</small></div>
                    </div>
                    <div className="cd-side-stat">
                      <span>🎯</span>
                      <div><strong>{course.level}</strong><small>Level</small></div>
                    </div>
                    <div className="cd-side-stat">
                      <span>📝</span>
                      <div><strong>MCQ Contest</strong><small>Included</small></div>
                    </div>
                    <button className="cd-side-cta" style={{ background: course.color }} onClick={() => setTab("curriculum")}>
                      Start Learning →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CURRICULUM */}
          {tab === "curriculum" && (
            <div className="cd-tab-content">
              <div className="cd-divider" style={{ background: course.color }} />
              <p className="cd-section-sub">Step-by-step topics from beginner to advanced</p>
              <div className="cd-curriculum-list">
                {course.topics.map((section, i) => (
                  <div key={i} className="cd-level-block">
                    <div className="cd-level-header" style={{ borderLeft: `3px solid ${course.color}` }}>
                      <div className="cd-level-badge" style={{ background: course.color }}>{section.level}</div>
                      <div>
                        <p className="cd-level-sub">Level {section.level}</p>
                        <p className="cd-level-name">{section.name}</p>
                      </div>
                    </div>
                    <div className="cd-level-items">
                      {section.items.map((item, j) => (
                        <div key={j} className="cd-topic-item">
                          <span className="cd-topic-dot" style={{ background: course.color }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

       
          {/* TUTORIALS */}
          {tab === "tutorials" && (
            <div className="cd-tab-content">
              <div className="cd-divider" style={{ background: course.color }} />
              <p className="cd-section-sub">Free video courses to learn {course.title} from scratch</p>
              <div className="cd-link-list">
                {course.youtubeLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className="cd-yt-card">
                    <div className="cd-yt-thumb">▶</div>
                    <div className="cd-yt-info">
                      <p className="cd-yt-label">{link.label}</p>
                      <p className="cd-yt-url">{link.url}</p>
                    </div>
                    <span className="cd-yt-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* THEORY */}
          {tab === "theory" && (
            <div className="cd-tab-content">
              <div className="cd-divider" style={{ background: course.color }} />
              <p className="cd-section-sub">Official docs and reference guides for {course.title}</p>
              <div className="cd-link-list">
                {course.theoryLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className="cd-theory-card">
                    <div className="cd-theory-icon" style={{ color: course.color }}>📖</div>
                    <div className="cd-yt-info">
                      <p className="cd-yt-label">{link.label}</p>
                      <p className="cd-yt-url">{link.url}</p>
                    </div>
                    <span className="cd-yt-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

             {/* PRACTICE */}
          {tab === "practice" && (
            <div className="cd-tab-content">
              <div className="cd-divider" style={{ background: course.color }} />
              <p className="cd-section-sub">Test your knowledge with a timed MCQ contest</p>
              <div className="cd-practice-hero" style={{ borderColor: course.color + "44" }}>
                <div className="cd-ph-left">
                  <span className="cd-ph-icon">🏆</span>
                  <div>
                    <h3 className="cd-ph-title">{course.title} Practice Contest</h3>
                    <p className="cd-ph-sub">20 MCQs · 20 minutes · Auto-graded</p>
                  </div>
                </div>
                <div className="cd-ph-stats">
                  <div className="cd-ph-stat"><span>📝</span><strong>20</strong><small>Questions</small></div>
                  <div className="cd-ph-stat"><span>⏱</span><strong>20 min</strong><small>Duration</small></div>
                  <div className="cd-ph-stat"><span>🎯</span><strong>MCQ</strong><small>Format</small></div>
                  <div className="cd-ph-stat"><span>📊</span><strong>Auto</strong><small>Graded</small></div>
                </div>
              </div>
              <div className="cd-rules-list">
                {[
                  `✅  20 multiple choice questions from ${course.title} topics`,
                  "⏱  Timer starts immediately — 20 minutes total",
                  "📊  Results shown with correct answers after submission",
                  "🔄  You can retake anytime to improve your score",
                  "🏆  Score displayed as percentage with full answer review",
                ].map((r, i) => <div key={i} className="cd-rule-item">{r}</div>)}
              </div>
              <button
                className="cd-start-contest-btn"
                style={{ background: `linear-gradient(135deg, ${course.color}, ${course.color}bb)` }}
                onClick={() => setMcq(true)}
              >
                🚀 Start Practice Contest
              </button>
            </div>
          )}


        </div>
      </div>

      <Chatbot />
    </div>
  );
};

export default CourseDetail;