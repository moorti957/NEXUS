const express = require("express");

const {
  getPosts,
  createPost,
  likePost,
  getSinglePost,
  addComment
} = require("../controllers/postController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getPosts);
router.post("/", protect, createPost);
router.put("/like/:id", protect, likePost);
router.get("/:id", getSinglePost);
router.post("/comment/:id", protect, addComment);

module.exports = router;