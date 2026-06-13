// controllers/collaborationController.js

const AcceptedCollaboration = require('../models/AcceptedCollaboration');
const Post                   = require('../models/Post');
const User                   = require('../models/User');
const { createNotification } = require('./notificationController');

// POST /api/collaborations/accept
// Body: { freelancerId, postId }
exports.acceptFreelancer = async (req, res) => {
  try {
    const { freelancerId, postId } = req.body;
    const clientId = req.user._id;

    // Verify post belongs to this client
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== clientId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check already accepted
    const exists = await AcceptedCollaboration.findOne({ clientId, freelancerId, postId });
    if (exists) {
      return res.status(400).json({ message: 'Already accepted this freelancer' });
    }

    // Save collaboration
    const collab = await AcceptedCollaboration.create({ clientId, freelancerId, postId });

    // Add to post's acceptedFreelancers array
    await Post.findByIdAndUpdate(postId, {
      $addToSet: { acceptedFreelancers: { userId: freelancerId } },
    });

    // Fetch names for notification messages
    const client     = await User.findById(clientId).select('name');
    const freelancer = await User.findById(freelancerId).select('name');

    // Notify freelancer
    await createNotification({
      receiver:  freelancerId,
      sender:    clientId,
      type:      'accepted_by_client',
      postId,
      message:   `Your proposal has been accepted by ${client.name} for "${post.title}"`,
    });

    // Notify client (confirmation)
    await createNotification({
      receiver:  clientId,
      sender:    freelancerId,
      type:      'accept_freelancer',
      postId,
      message:   `You have accepted ${freelancer.name} for "${post.title}"`,
    });

    res.status(201).json({ success: true, data: collab });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/collaborations/mine
// Returns role-aware list: clients get freelancers, freelancers get clients
exports.getMyCollaborations = async (req, res) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role; // 'client' | 'freelancer'

    let collabs;

    if (role === 'client') {
      collabs = await AcceptedCollaboration.find({ clientId: userId })
        .populate('freelancerId', 'name avatar skills city country')
        .populate('postId', 'title');
    } else {
      collabs = await AcceptedCollaboration.find({ freelancerId: userId })
        .populate('clientId', 'name companyName avatar')
        .populate('postId', 'title');
    }

    res.json({ success: true, data: collabs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};