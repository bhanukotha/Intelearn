// routes/discussionRoutes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/discussionController");

router.get("/",              auth, ctrl.getPosts);
router.get("/:id",           auth, ctrl.getPost);
router.post("/",             auth, ctrl.createPost);
router.put("/:id/upvote",    auth, ctrl.upvotePost);
router.post("/:id/reply",    auth, ctrl.addReply);
router.put("/:id/reply/:rid/upvote", auth, ctrl.upvoteReply);
router.delete("/:id",        auth, ctrl.deletePost);

module.exports = router;