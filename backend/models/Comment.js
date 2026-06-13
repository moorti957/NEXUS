// ============================================================
// models/Comment.js  —  NEW FILE (separate collection)
// ============================================================

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ✅ Role is stored ON the comment so badge is always accurate
    role: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);