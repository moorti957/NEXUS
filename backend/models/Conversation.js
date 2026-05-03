const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    participantModel: {
      type: String,
      enum: ["User", "Client"],
      default: "User"
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },

    lastMessageAt: {
      type: Date,
      default: Date.now
    },

    isArchived: {
      type: Boolean,
      default: false
    },

    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// STATIC: Get or Create Conversation
// ============================================

conversationSchema.statics.getOrCreate = async function (user1, user2) {

  let conversation = await this.findOne({
    participants: { $all: [user1, user2] }
  });

  if (!conversation) {
    conversation = await this.create({
      participants: [user1, user2]
    });
  }

  return conversation;
};

// ============================================
// METHODS
// ============================================

conversationSchema.methods.updateLastMessage = function (messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  return this.save();
};

conversationSchema.methods.incrementUnread = function (userId) {
  const count = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), count + 1);
  return this.save();
};

conversationSchema.methods.resetUnread = function (userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

module.exports = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);