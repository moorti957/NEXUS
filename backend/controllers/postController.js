const Post = require("../models/Post");

// सभी पोस्ट
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name")
      .populate("likes", "name email"); // ✅ ADD THIS

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// पोस्ट बनाना
exports.createPost = async (req, res) => {
  try {
    const post = await Post.create({
      ...req.body,
      author: req.user.id
    });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error creating post" });
  }
};

// like
exports.likePost = async (req, res) => {
  try {
    const userId = req.user.id;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Safety
    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    // Toggle like
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    // 🔥🔥 MAIN FIX (ADD THIS)
    const updatedPost = await Post.findById(post._id)
      .populate("author", "name email")
      .populate("likes", "name email"); // ✅ THIS LINE

    res.json(updatedPost);

  } catch (err) {
    console.log("LIKE ERROR 👉", err);
    res.status(500).json({ message: "Error liking post" });
  }
};

// single post
exports.getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email")
      .populate("likes", "name email")
      .populate("comments.user", "name email"); // ✅ ADD THIS

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error fetching post" });
  }
};
// comment
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      text: req.body.text,
      user: req.user.id
    });

    await post.save();

    // 🔥🔥 MAIN FIX (IMPORTANT)
    const updatedPost = await Post.findById(post._id)
      .populate("author", "name email")
      .populate("likes", "name email")
      .populate("comments.user", "name email"); // ✅ THIS LINE

    res.json(updatedPost);

  } catch (err) {
    console.log("COMMENT ERROR 👉", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};