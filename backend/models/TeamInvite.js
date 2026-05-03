const mongoose = require('mongoose');

const TeamInviteSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner (sender) is required']
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member (invited user) is required'],
    validate: {
      validator: function(value) {
        // Prevent self-invite
        return this.owner.toString() !== value.toString();
      },
      message: 'You cannot send an invite to yourself'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'rejected'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  }
}, {
  timestamps: true,  // Automatically adds createdAt & updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES FOR PERFORMANCE
// ===========================================
TeamInviteSchema.index({ owner: 1, status: 1 });
TeamInviteSchema.index({ member: 1, status: 1 });
TeamInviteSchema.index({ owner: 1, member: 1 }, { unique: true }); // Prevent duplicate invites

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================
TeamInviteSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

TeamInviteSchema.virtual('isAccepted').get(function() {
  return this.status === 'accepted';
});

TeamInviteSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

// ===========================================
// PRE-SAVE MIDDLEWARE
// ===========================================
TeamInviteSchema.pre('save', function(next) {
  // If status changes to accepted/rejected, we can add custom logic here
  if (this.isModified('status')) {
    // Example: log the change (optional)
    console.log(`Invite ${this._id} status changed to ${this.status}`);
  }
  next();
});

// ===========================================
// INSTANCE METHODS
// ===========================================
/**
 * Accept the invite
 * @returns {Promise<TeamInvite>}
 */
TeamInviteSchema.methods.accept = async function() {
  this.status = 'accepted';
  return this.save();
};

/**
 * Reject the invite
 * @returns {Promise<TeamInvite>}
 */
TeamInviteSchema.methods.reject = async function() {
  this.status = 'rejected';
  return this.save();
};

/**
 * Check if the invite can be responded to by a given user
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
TeamInviteSchema.methods.canRespond = function(userId) {
  return this.member.toString() === userId.toString() && this.status === 'pending';
};

// ===========================================
// STATIC METHODS
// ===========================================
/**
 * Find all pending invites for a member
 * @param {string} memberId - Invited user ID
 * @returns {Promise<Array>}
 */
TeamInviteSchema.statics.findPendingByMember = async function(memberId) {
  return this.find({ member: memberId, status: 'pending' })
    .populate('owner', 'name email avatar')
    .sort('-createdAt');
};

/**
 * Find all accepted invites for an owner (team members)
 * @param {string} ownerId - Team owner ID
 * @returns {Promise<Array>}
 */
TeamInviteSchema.statics.findAcceptedByOwner = async function(ownerId) {
  const invites = await this.find({ owner: ownerId, status: 'accepted' })
    .populate('member', 'name email avatar role')
    .sort('-createdAt');
  return invites.map(invite => invite.member);
};

/**
 * Check if an invite already exists (pending)
 * @param {string} ownerId - Sender ID
 * @param {string} memberId - Receiver ID
 * @returns {Promise<boolean>}
 */
TeamInviteSchema.statics.existsPending = async function(ownerId, memberId) {
  const invite = await this.findOne({
    owner: ownerId,
    member: memberId,
    status: 'pending'
  });
  return !!invite;
};

/**
 * Get or create an invite (avoid duplicates)
 * @param {string} ownerId - Sender ID
 * @param {string} memberId - Receiver ID
 * @returns {Promise<TeamInvite>}
 */
TeamInviteSchema.statics.getOrCreate = async function(ownerId, memberId) {
  let invite = await this.findOne({
    owner: ownerId,
    member: memberId,
    status: 'pending'
  });
  if (!invite) {
    invite = new this({ owner: ownerId, member: memberId });
    await invite.save();
  }
  return invite;
};

// ===========================================
// EXPORT MODEL
// ===========================================
module.exports = mongoose.model('TeamInvite', TeamInviteSchema);