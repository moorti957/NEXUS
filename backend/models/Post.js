const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: String,
    excerpt: String,
    content: String,
    category: String,
    image: String,

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        text: String,

        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    collaborators: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

    // ⭐ Optional Featured Post
    featured: {
      type: Boolean,
      default: false,
    },
    

    // ✅ NEW FIELD
    acceptedFreelancers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        acceptedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);