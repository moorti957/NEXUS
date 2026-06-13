const Post = require("../models/Post");

// सभी पोस्ट
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email avatar role")
      .populate("comments.user", "name email avatar role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyCollaborations = async (req, res) => {
  try {
    const posts = await Post.find({
      "acceptedFreelancers.userId": req.user.id
    })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("MY COLLAB ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// पोस्ट बनाना
exports.createPost = async (req, res) => {
  try {

    console.log("USER =", req.user.id);

    const post = await Post.create({
      ...req.body,
      author: req.user.id,
    });

    console.log("POST AUTHOR =", post.author);

    res.json(post);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error creating post",
    });
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

// Get posts by user
exports.getPostsByUser = async (req, res) => {
  try {
     console.log("USER ID =", req.params.userId);
    const posts = await Post.find({
      author: req.params.userId
    })
      .populate("author", "name email avatar role")
      .populate("comments.user", "name email avatar role")
      .sort({ createdAt: -1 });
      console.log("FOUND POSTS =", posts.length);

    res.json(posts);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching user posts"
    });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      author: req.user.id
    })
      .populate("author", "name email avatar role")
      .populate("comments.user", "name email avatar role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching my posts"
    });
  }
};

// Get comments of a post
exports.getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("comments.user", "name email");

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    res.json(post.comments);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching comments"
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting post"
    });
  }
};

// single post
exports.getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email avatar role")
      .populate("likes", "name email avatar")
      .populate("comments.user", "name email avatar role");

    res.json(post);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching post"
    });
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