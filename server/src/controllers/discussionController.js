// controllers/discussionController.js
const Discussion = require("../models/Discussion");
const mongoose   = require("mongoose");

// GET /api/discuss?category=&sort=&search=&page=
exports.getPosts = async (req, res) => {
  try {
    const { category, sort = "newest", search, page = 1 } = req.query;
    const limit  = 20;
    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (search) filter.$or = [
      { title:   { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
    const sortObj = sort === "votes" ? { "upvotes.length": -1, createdAt: -1 } : { isPinned: -1, createdAt: -1 };

    const posts = await Discussion.find(filter)
      .populate("userId", "name email avatar")
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Add counts
    const enriched = posts.map(p => ({
      ...p,
      upvoteCount:  p.upvotes.length,
      replyCount:   p.replies.length,
      hasUpvoted:   p.upvotes.map(String).includes(req.user.id),
    }));

    const total = await Discussion.countDocuments(filter);
    res.json({ posts: enriched, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/discuss/:id
exports.getPost = async (req, res) => {
  try {
    const post = await Discussion.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    )
    .populate("userId", "name email avatar")
    .populate("replies.userId", "name email avatar")
    .lean();
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({
      ...post,
      upvoteCount: post.upvotes.length,
      hasUpvoted:  post.upvotes.map(String).includes(req.user.id),
      replies: post.replies.map(r => ({
        ...r,
        upvoteCount: r.upvotes.length,
        hasUpvoted:  r.upvotes.map(String).includes(req.user.id),
      }))
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/discuss
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Title and content required" });
    const post = await Discussion.create({
      userId: req.user.id, title: title.trim(), content: content.trim(),
      category: category || "General",
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map(t=>t.trim()).filter(Boolean) : []),
    });
    const populated = await post.populate("userId", "name email avatar");
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/discuss/:id/upvote
exports.upvotePost = async (req, res) => {
  try {
    const uid  = new mongoose.Types.ObjectId(req.user.id);
    const post = await Discussion.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const idx = post.upvotes.findIndex(u => u.equals(uid));
    if (idx > -1) post.upvotes.splice(idx, 1);
    else          post.upvotes.push(uid);
    await post.save();
    res.json({ upvoteCount: post.upvotes.length, hasUpvoted: idx === -1 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/discuss/:id/reply
exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Reply content required" });
    const post = await Discussion.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.replies.push({ userId: req.user.id, content: content.trim() });
    await post.save();
    await post.populate("replies.userId", "name email avatar");
    const newReply = post.replies[post.replies.length - 1];
    res.status(201).json({ ...newReply.toObject(), upvoteCount: 0, hasUpvoted: false });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/discuss/:id/reply/:rid/upvote
exports.upvoteReply = async (req, res) => {
  try {
    const uid  = new mongoose.Types.ObjectId(req.user.id);
    const post = await Discussion.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const reply = post.replies.id(req.params.rid);
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    const idx = reply.upvotes.findIndex(u => u.equals(uid));
    if (idx > -1) reply.upvotes.splice(idx, 1);
    else          reply.upvotes.push(uid);
    await post.save();
    res.json({ upvoteCount: reply.upvotes.length, hasUpvoted: idx === -1 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/discuss/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Discussion.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });
    if (post.userId.toString() !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ message: "Not authorized" });
    await post.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};