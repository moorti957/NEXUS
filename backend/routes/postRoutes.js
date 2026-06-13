const express = require("express");

const {
  getPosts,
  createPost,
  likePost,
  getSinglePost,
  addComment,

  // New Functions
  getPostsByUser,
  getComments,
  deletePost,
  getMyPosts,
  getMyCollaborations,
} = require("../controllers/postController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ─────────────────────────────
// Existing Routes (Don't Remove)
// ─────────────────────────────

router.get("/", getPosts);

router.get("/my-posts", protect, getMyPosts);

router.get("/my-collaborations", protect, getMyCollaborations);

router.get("/user/:userId", getPostsByUser);

router.get("/:id/comments", getComments);

router.get("/:id", getSinglePost);

router.post("/", protect, createPost);

router.put("/like/:id", protect, likePost);

router.post("/comment/:id", protect, addComment);

router.post("/:id/comments", protect, addComment);

router.delete("/:id", protect, deletePost);

module.exports = router;