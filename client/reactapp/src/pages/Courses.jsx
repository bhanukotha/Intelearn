// pages/Courses.jsx  — cards only, clicks navigate to /courses/:id
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Chatbot from "../components/Chatbot";
import "./Courses.css";

const COURSES = [
  { id:"java",       title:"Java",              icon:"☕",  color:"#f89820", category:"language", level:"Beginner",         duration:"12 weeks", problems:320, description:"Object-oriented, platform-independent, enterprise-grade programming.", whatYouLearn:["Java Syntax & OOP Concepts","Collections & Generics","Multithreading & Concurrency"] },
  { id:"python",     title:"Python",            icon:"🐍",  color:"#3776ab", category:"language", level:"Beginner",         duration:"10 weeks", problems:400, description:"AI, ML, automation and rapid prototyping made simple.", whatYouLearn:["Python Syntax & Data Types","Functions & Modules","OOP in Python"] },
  { id:"c",          title:"C Programming",     icon:"C",   color:"#5c6bc0", category:"language", level:"Beginner",         duration:"8 weeks",  problems:250, description:"Low-level systems programming, memory management and OS fundamentals.", whatYouLearn:["C Syntax & Structure","Pointers & Memory Management","Arrays & Strings"] },
  { id:"cpp",        title:"C++",               icon:"</>", color:"#00599c", category:"language", level:"Beginner",         duration:"12 weeks", problems:380, description:"High-performance competitive programming and system development.", whatYouLearn:["C++ Syntax & OOP","STL – Vectors, Maps, Sets","Templates & Generic Programming"] },
  { id:"dsa",        title:"DSA",               icon:"🌳",  color:"#22c55e", category:"cs",       level:"Intermediate",     duration:"16 weeks", problems:500, description:"Master problem solving with arrays, trees, graphs, DP and more.", whatYouLearn:["Arrays, Linked Lists, Stacks","Trees & Binary Search Trees","Dynamic Programming"] },
  { id:"mysql",      title:"MySQL",             icon:"🗄️", color:"#f59e0b", category:"database",  level:"Beginner",         duration:"6 weeks",  problems:150, description:"Relational database design, SQL queries and database management.", whatYouLearn:["SQL Basics – SELECT, INSERT","Joins – INNER, LEFT, RIGHT","Stored Procedures & Triggers"] },
  { id:"javascript", title:"JavaScript",        icon:"🟨",  color:"#f7df1e", category:"language", level:"Beginner",         duration:"10 weeks", problems:280, description:"The language of the web — frontend, backend and everything in between.", whatYouLearn:["JS Syntax & ES6+ Features","DOM Manipulation","Async/Await & Promises"] },
  { id:"os",         title:"Operating Systems", icon:"💻",  color:"#8b5cf6", category:"cs",       level:"Intermediate",     duration:"8 weeks",  problems:80,  description:"Process management, memory, file systems and OS internals.", whatYouLearn:["Process & Thread Management","CPU Scheduling Algorithms","Memory Management"] },
  { id:"cn",         title:"Computer Networks", icon:"🌐",  color:"#06b6d4", category:"cs",       level:"Intermediate",     duration:"8 weeks",  problems:70,  description:"TCP/IP, protocols, routing and network security fundamentals.", whatYouLearn:["OSI & TCP/IP Model","IP Addressing & Subnetting","TCP, UDP, HTTP, DNS"] },
  { id:"dbms",       title:"DBMS",              icon:"📊",  color:"#ef4444", category:"database",  level:"Intermediate",     duration:"6 weeks",  problems:90,  description:"Database management theory, ER models, normalization and transactions.", whatYouLearn:["ER Diagrams & Schema Design","Normalization (1NF to BCNF)","Transaction Management & ACID"] },
];

const CATEGORIES = [
  { key:"all",      label:"All Courses" },
  { key:"language", label:"💻 Languages" },
  { key:"database", label:"🗄️ Databases" },
  { key:"cs",       label:"📚 CS Fundamentals" },
];

const CourseCard = ({ course, onSelect }) => (
  <div className="cc-card" onClick={() => onSelect(course.id)}>
    <div className="cc-card-top" style={{ background:`linear-gradient(135deg, ${course.color}22, ${course.color}08)` }}>
      <span className="cc-card-icon" style={{ color: course.color }}>{course.icon}</span>
      <span className="cc-card-level" style={{ background: course.color+"22", color: course.color }}>{course.level}</span>
    </div>
    <div className="cc-card-body">
      <h3 className="cc-card-title">{course.title}</h3>
      <p className="cc-card-desc">{course.description}</p>
      <div className="cc-card-meta">
        <span>📅 {course.duration}</span>
        <span>🧩 {course.problems} problems</span>
      </div>
      <div className="cc-card-topics">
        {course.whatYouLearn.map((t,i) => <span key={i} className="cc-topic-chip">✓ {t}</span>)}
      </div>
      <button className="cc-start-btn" style={{ background: course.color }}
        onClick={e => { e.stopPropagation(); onSelect(course.id); }}>
        Start Learning →
      </button>
    </div>
  </div>
);

const Courses = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("all");
  const [search,   setSearch]   = useState("");

  const filtered = COURSES.filter(c => {
    const matchCat    = category === "all" || c.category === category;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="courses-page">
      <div className="courses-hero">
        <h1 className="courses-hero-title">Courses & Learning Paths</h1>
        <p className="courses-hero-sub">Master programming languages, databases and CS fundamentals. Click any course for full details, curriculum, tutorials and a practice contest!</p>
      </div>
      <div className="courses-filters">
        <input className="courses-search" placeholder="🔍 Search courses…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="courses-cat-btns">
          {CATEGORIES.map(cat => (
            <button key={cat.key} className={`cat-btn ${category===cat.key?"cat-btn-active":""}`}
              onClick={() => setCategory(cat.key)}>{cat.label}</button>
          ))}
        </div>
      </div>
      <p className="courses-count">{filtered.length} course{filtered.length!==1?"s":""} found</p>
      {filtered.length===0
        ? <div className="courses-empty"><p style={{fontSize:32}}>🔍</p><p>No courses match your search.</p></div>
        : <div className="courses-grid">{filtered.map(c => <CourseCard key={c.id} course={c} onSelect={(id) => navigate(`/courses/${id}`)}/>)}</div>
      }
      <Chatbot />
    </div>
  );
};

export default Courses;