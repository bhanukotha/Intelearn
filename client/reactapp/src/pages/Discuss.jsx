// pages/Discuss.jsx
import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Chatbot from "../components/Chatbot";
import "./Discuss.css";

const API  = "http://localhost:5000/api/discuss";
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });

const CATEGORIES = ["All","General","DSA","Career","Contest","Interview","Courses","Feedback","Jobs"];
const CAT_ICONS  = { All:"🔥", General:"💬", DSA:"🌳", Career:"💼", Contest:"🏆", Interview:"🎯", Courses:"📚", Feedback:"📣", Jobs:"💰" };
const CAT_COLORS = { All:"#4f8ef7", General:"#8b5cf6", DSA:"#22c55e", Career:"#f59e0b", Contest:"#a855f7", Interview:"#ef4444", Courses:"#06b6d4", Feedback:"#f97316", Jobs:"#10b981" };

const timeAgo = (date) => {
  const d = (Date.now() - new Date(date)) / 1000;
  if (d < 60)   return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400)return `${Math.floor(d/3600)}h ago`;
  return new Date(date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
};

const Avatar = ({ name, size = 36 }) => {
  const colors = ["#4f8ef7","#22c55e","#f59e0b","#ef4444","#a855f7","#06b6d4","#f97316"];
  const color  = colors[(name?.charCodeAt(0)||0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.4, fontWeight:700, color:"#fff", flexShrink:0, fontFamily:"Inter,sans-serif" }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

// ── Create Post Modal ──────────────────────────────────────────────────────────
const CreatePost = ({ onClose, onCreated }) => {
  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [category, setCategory] = useState("General");
  const [tags,     setTags]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const submit = async () => {
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await axios.post(API, { title, content, category, tags }, { headers: hdrs() });
      onCreated(res.data);
      onClose();
    } catch (e) { setError(e.response?.data?.message || "Failed to create post."); }
    finally { setSaving(false); }
  };

  return (
    <div className="disc-overlay" onClick={onClose}>
      <div className="disc-create-modal" onClick={e => e.stopPropagation()}>
        <div className="disc-modal-hdr">
          <h2>✏️ Create Post</h2>
          <button className="disc-x-btn" onClick={onClose}>✕</button>
        </div>
        {error && <div className="disc-error">{error}</div>}
        <div className="disc-field">
          <label>Category</label>
          <div className="disc-cat-row">
            {CATEGORIES.filter(c=>c!=="All").map(c => (
              <button key={c} className={`disc-cat-tag ${category===c?"active":""}`}
                style={category===c?{background:CAT_COLORS[c],borderColor:CAT_COLORS[c]}:{}}
                onClick={() => setCategory(c)}>
                {CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>
        </div>
        <div className="disc-field">
          <label>Title *</label>
          <input className="disc-input" placeholder="Write a clear, descriptive title…" value={title} onChange={e=>setTitle(e.target.value)} maxLength={200}/>
          <span className="disc-char-count">{title.length}/200</span>
        </div>
        <div className="disc-field">
          <label>Content *</label>
          <textarea className="disc-textarea" rows={8} placeholder="Share your thoughts, question, or insight…" value={content} onChange={e=>setContent(e.target.value)}/>
        </div>
        <div className="disc-field">
          <label>Tags <span className="disc-optional">(comma separated)</span></label>
          <input className="disc-input" placeholder="e.g. binary search, arrays, interview" value={tags} onChange={e=>setTags(e.target.value)}/>
        </div>
        <div className="disc-modal-footer">
          <button className="disc-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="disc-post-btn" onClick={submit} disabled={saving}>
            {saving ? "Posting…" : "✔ Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Post Detail View ───────────────────────────────────────────────────────────
const PostDetail = ({ postId, onBack, currentUser }) => {
  const [post,      setPost]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [reply,     setReply]     = useState("");
  const [replying,  setReplying]  = useState(false);
  const [replyTo,   setReplyTo]   = useState(null); // reply quote

  useEffect(() => {
    axios.get(`${API}/${postId}`, { headers: hdrs() })
      .then(r => setPost(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const upvotePost = async () => {
    const res = await axios.put(`${API}/${postId}/upvote`, {}, { headers: hdrs() });
    setPost(p => ({ ...p, upvoteCount: res.data.upvoteCount, hasUpvoted: res.data.hasUpvoted }));
  };

  const upvoteReply = async (rid) => {
    const res = await axios.put(`${API}/${postId}/reply/${rid}/upvote`, {}, { headers: hdrs() });
    setPost(p => ({ ...p, replies: p.replies.map(r => r._id===rid ? {...r, upvoteCount:res.data.upvoteCount, hasUpvoted:res.data.hasUpvoted} : r) }));
  };

  const submitReply = async () => {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      const content = replyTo ? `> @${replyTo.name}: "${replyTo.snippet}"\n\n${reply}` : reply;
      const res = await axios.post(`${API}/${postId}/reply`, { content }, { headers: hdrs() });
      setPost(p => ({ ...p, replies: [...(p.replies||[]), res.data], replyCount: (p.replyCount||0)+1 }));
      setReply(""); setReplyTo(null);
    } catch {}
    finally { setReplying(false); }
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    await axios.delete(`${API}/${postId}`, { headers: hdrs() });
    onBack();
  };

  if (loading) return <div className="disc-loading"><div className="disc-spinner"/><p>Loading post…</p></div>;
  if (!post)   return <div className="disc-loading"><p>Post not found.</p><button onClick={onBack}>← Back</button></div>;

  return (
    <div className="disc-detail-page">
      {/* Top */}
      <div className="disc-detail-topbar">
        <button className="disc-back-btn" onClick={onBack}>← Back</button>
        <div className="disc-detail-topbar-right">
          {(post.userId?._id===currentUser?.id || currentUser?.isAdmin) && (
            <button className="disc-delete-btn" onClick={deletePost}>🗑 Delete</button>
          )}
        </div>
      </div>

      <div className="disc-detail-wrap">
        {/* Post */}
        <div className="disc-detail-card">
          <div className="disc-detail-meta">
            <Avatar name={post.userId?.name} size={40}/>
            <div>
              <span className="disc-author">{post.userId?.name || "Unknown"}</span>
              <span className="disc-dot">·</span>
              <span className="disc-time">{timeAgo(post.createdAt)}</span>
            </div>
            <span className="disc-cat-badge" style={{ background: CAT_COLORS[post.category]+"22", color: CAT_COLORS[post.category] }}>
              {CAT_ICONS[post.category]} {post.category}
            </span>
          </div>

          <h1 className="disc-detail-title">{post.title}</h1>

          {post.tags?.length > 0 && (
            <div className="disc-tags">
              {post.tags.map(t => <span key={t} className="disc-tag">{t}</span>)}
            </div>
          )}

          <div className="disc-detail-content">{post.content}</div>

          <div className="disc-detail-actions">
            <button className={`disc-vote-btn ${post.hasUpvoted?"voted":""}`} onClick={upvotePost}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={post.hasUpvoted?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              {post.upvoteCount || 0}
            </button>
            <span className="disc-action-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {post.replies?.length || 0} comments
            </span>
            <span className="disc-action-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {post.views || 0} views
            </span>
          </div>
        </div>

        {/* Comments */}
        <div className="disc-comments-section">
          <h3 className="disc-comments-title">Comments ({post.replies?.length || 0})</h3>

          {/* Reply Box */}
          <div className="disc-reply-box">
            {replyTo && (
              <div className="disc-reply-quote">
                <span>Replying to <strong>@{replyTo.name}</strong>:</span>
                <p>"{replyTo.snippet}"</p>
                <button onClick={() => setReplyTo(null)}>✕</button>
              </div>
            )}
            <textarea className="disc-reply-textarea" rows={4}
              placeholder="Write your comment here…"
              value={reply} onChange={e => setReply(e.target.value)}/>
            <div className="disc-reply-footer">
              <button className="disc-comment-btn" onClick={submitReply} disabled={replying||!reply.trim()}>
                {replying ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>

          {/* List of replies */}
          {post.replies?.length === 0 && (
            <div className="disc-no-comments">No comments yet. Be the first to comment!</div>
          )}
          {post.replies?.map(r => (
            <div key={r._id} className="disc-comment-card">
              <Avatar name={r.userId?.name} size={32}/>
              <div className="disc-comment-body">
                <div className="disc-comment-meta">
                  <span className="disc-comment-author">{r.userId?.name || "Unknown"}</span>
                  <span className="disc-comment-time">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="disc-comment-text">{r.content}</p>
                <div className="disc-comment-actions">
                  <button className={`disc-vote-btn sm ${r.hasUpvoted?"voted":""}`} onClick={() => upvoteReply(r._id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={r.hasUpvoted?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    {r.upvoteCount || 0}
                  </button>
                  <button className="disc-reply-link" onClick={() => setReplyTo({ name: r.userId?.name, snippet: r.content.slice(0,80) })}>
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Post Card (list view) ──────────────────────────────────────────────────────
const PostCard = ({ post, onClick }) => (
  <div className="disc-post-card" onClick={() => onClick(post._id)}>
    <div className="disc-post-left">
      <Avatar name={post.userId?.name} size={38}/>
    </div>
    <div className="disc-post-right">
      <div className="disc-post-top">
        <span className="disc-post-author">{post.userId?.name || "Anonymous"}</span>
        {post.userId?.name === "Intelearn" && <span className="disc-verified">✔</span>}
        <span className="disc-dot">·</span>
        <span className="disc-post-time">{timeAgo(post.createdAt)}</span>
        <span className="disc-cat-pill" style={{ background: CAT_COLORS[post.category]+"20", color: CAT_COLORS[post.category] }}>
          {CAT_ICONS[post.category]} {post.category}
        </span>
        {post.isPinned && <span className="disc-pinned-badge">📌 Pinned</span>}
      </div>
      <h3 className="disc-post-title">{post.title}</h3>
      <p className="disc-post-preview">{post.content.slice(0,180)}{post.content.length>180?"…":""}</p>
      {post.tags?.length > 0 && (
        <div className="disc-post-tags">
          {post.tags.slice(0,4).map(t => <span key={t} className="disc-tag">{t}</span>)}
        </div>
      )}
      <div className="disc-post-stats">
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg> {post.upvoteCount||0}</span>
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> {post.views||0}</span>
        <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> {post.replyCount||0}</span>
      </div>
    </div>
  </div>
);

// ── Main Discuss Page ──────────────────────────────────────────────────────────
const Discuss = () => {
  const { user } = useContext(AuthContext);
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState("All");
  const [sort,       setSort]       = useState("newest");
  const [search,     setSearch]     = useState("");
  const [searchInput,setSearchInput]= useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const searchTimer = useRef(null);

  const fetchPosts = async (cat=category, s=sort, q=search, pg=1) => {
    setLoading(true);
    try {
      const res = await axios.get(API, {
        headers: hdrs(),
        params: { category: cat==="All"?undefined:cat, sort:s, search:q||undefined, page:pg }
      });
      setPosts(pg===1 ? res.data.posts : prev => [...prev, ...res.data.posts]);
      setTotalPages(res.data.totalPages);
      setPage(pg);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCategory = (cat) => { setCategory(cat); fetchPosts(cat, sort, search, 1); };
  const handleSort     = (s)   => { setSort(s);    fetchPosts(category, s, search, 1); };
  const handleSearch   = (v)   => {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); fetchPosts(category, sort, v, 1); }, 400);
  };

  const onCreated = (post) => setPosts(prev => [{ ...post, upvoteCount:0, replyCount:0, hasUpvoted:false }, ...prev]);

  if (activePost) return <PostDetail postId={activePost} onBack={() => { setActivePost(null); fetchPosts(); }} currentUser={user}/>;

  return (
    <div className="disc-page">
      {/* Hero */}
      <div className="disc-hero">
        <div className="disc-hero-inner">
          <h1 className="disc-hero-title">Discuss</h1>
          <p className="disc-hero-sub">Share ideas, ask questions, and discuss DSA, careers, interviews and more with the community.</p>
        </div>
        <button className="disc-create-btn" onClick={() => setShowCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Create
        </button>
      </div>

      <div className="disc-layout">
        {/* Main */}
        <div className="disc-main">
          {/* Category tabs */}
          <div className="disc-cats">
            {CATEGORIES.map(c => (
              <button key={c} className={`disc-cat-btn ${category===c?"active":""}`}
                style={category===c?{color:CAT_COLORS[c],borderBottomColor:CAT_COLORS[c]}:{}}
                onClick={() => handleCategory(c)}>
                {CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="disc-toolbar">
            <div className="disc-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input className="disc-search" placeholder="Search discussions…" value={searchInput} onChange={e=>handleSearch(e.target.value)}/>
            </div>
            <div className="disc-sort-btns">
              <button className={`disc-sort-btn ${sort==="newest"?"active":""}`} onClick={() => handleSort("newest")}>
                ✨ Newest
              </button>
              <button className={`disc-sort-btn ${sort==="votes"?"active":""}`} onClick={() => handleSort("votes")}>
                ⬆ Most Votes
              </button>
            </div>
          </div>

          {/* Posts */}
          {loading && posts.length===0 ? (
            <div className="disc-loading"><div className="disc-spinner"/><p>Loading discussions…</p></div>
          ) : posts.length===0 ? (
            <div className="disc-empty">
              <p style={{fontSize:40}}>💬</p>
              <p>No posts yet. Be the first to start a discussion!</p>
              <button className="disc-create-btn" onClick={() => setShowCreate(true)}>Create Post</button>
            </div>
          ) : (
            <>
              {posts.map(p => <PostCard key={p._id} post={p} onClick={setActivePost}/>)}
              {page < totalPages && (
                <button className="disc-load-more" onClick={() => fetchPosts(category, sort, search, page+1)}>
                  Load More
                </button>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="disc-sidebar">
          <div className="disc-sb-card">
            <h3>📋 Categories</h3>
            <div className="disc-sb-cats">
              {CATEGORIES.filter(c=>c!=="All").map(c => (
                <button key={c} className={`disc-sb-cat ${category===c?"active":""}`}
                  style={category===c?{background:CAT_COLORS[c]+"15",color:CAT_COLORS[c],borderColor:CAT_COLORS[c]+"40"}:{}}
                  onClick={() => handleCategory(c)}>
                  <span>{CAT_ICONS[c]}</span> {c}
                </button>
              ))}
            </div>
          </div>

          <div className="disc-sb-card">
            <h3>📝 Community Guidelines</h3>
            <ul className="disc-sb-rules">
              <li>✅ Be respectful and helpful</li>
              <li>✅ Share knowledge, not spam</li>
              <li>✅ Tag your posts correctly</li>
              <li>✅ Upvote helpful content</li>
              <li>❌ No offensive language</li>
              <li>❌ No plagiarism</li>
            </ul>
          </div>

          <div className="disc-sb-card disc-sb-cta">
            <p>Have a question or insight?</p>
            <button className="disc-create-btn full" onClick={() => setShowCreate(true)}>
              ✏️ Create Post
            </button>
          </div>
        </div>
      </div>

      {showCreate && <CreatePost onClose={() => setShowCreate(false)} onCreated={onCreated}/>}
      <Chatbot/>
    </div>
  );
};

export default Discuss;