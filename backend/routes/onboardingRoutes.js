const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');     // your JWT auth middleware
const UserProfile = require('../models/UserProfile');
const upload = require('../middleware/upload');    // multer config (memory or Cloudinary)


// ===========================================
// HELPER: Get or create user profile
// ===========================================
const getOrCreateProfile = async (userId) => {
  let profile = await UserProfile.findOne({ userId });
  if (!profile) {
    profile = new UserProfile({ userId });
    await profile.save();
  }
  return profile;
};

// ===========================================
// POST /api/onboarding/save-step
// Saves current step data (partial update)
// ===========================================
router.post('/save-step', protect, async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user.id);
    const updates = req.body;

    const allowedFields = [
      'firstName', 'lastName', 'username', 'mobileNumber', 'city', 'country',
      'accountType', 'skills', 'experienceLevel', 'shortBio', 'about', 'languages',
      'preferences', 'socialLinks'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {

        // 🔥 USERNAME FIX (duplicate check)
        if (field === 'username') {
          if (updates.username && updates.username.trim() !== '') {

            const existing = await UserProfile.findOne({
              username: updates.username,
              userId: { $ne: req.user.id }
            });

            if (existing) {
              return res.status(400).json({
                success: false,
                message: "Username already taken"
              });
            }

            profile.username = updates.username;
          }
        }

        // 🔥 socialLinks safe merge
        else if (field === 'socialLinks') {
          profile.socialLinks = {
            ...profile.socialLinks,
            ...updates.socialLinks
          };
        }

        // 🔥 preferences safe merge
        else if (field === 'preferences') {
          profile.preferences = {
            ...profile.preferences,
            ...updates.preferences
          };
        }

        // 🔥 normal fields
        else {
          profile[field] = updates[field];
        }
      }
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Step saved successfully'
    });

  } catch (err) {
    console.error("🔥 SAVE STEP ERROR FULL:", err);

    return res.status(500).json({
      success: false,
      message: "Server error while saving step"
    });
  }
});

// ===========================================
// POST /api/onboarding/complete
// Final submission – marks onboarding as completed
// ===========================================
router.post('/complete', protect, async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.user.id);
    const updates = req.body;

    const allowedFields = [
      'firstName', 'lastName', 'username', 'mobileNumber', 'city', 'country',
      'accountType', 'skills', 'experienceLevel', 'shortBio', 'about', 'languages',
      'preferences', 'socialLinks'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });

    profile.onboardingCompleted = true;
    await profile.save();

    res.json({ success: true, message: 'Onboarding completed' });
  } catch (err) {
  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Server error"
  });
}
});

// ===========================================
// POST /api/onboarding/upload-photo
// Upload profile photo (base64 or Cloudinary)
// ===========================================
router.post('/upload-photo', protect, upload.single('photo'), async (req, res) => {
 console.log("🔥 HEADERS:", req.headers['content-type']);
  console.log("🔥 FILE:", req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    let photoUrl;

    // ✅ If using Cloudinary
    if (req.file.path) {
      photoUrl = req.file.path;
    } 
    
    // ✅ FIX: memoryStorage → buffer → base64
    else if (req.file.buffer) {
      const base64 = req.file.buffer.toString('base64');
      photoUrl = `data:${req.file.mimetype};base64,${base64}`;
    } 
    
    // ❌ fallback
    else {
      return res.status(400).json({
        success: false,
        message: "File upload failed"
      });
    }

    const profile = await getOrCreateProfile(req.user.id);
    profile.profilePhoto = photoUrl;

    await profile.save();

    res.json({ success: true, photoUrl });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;