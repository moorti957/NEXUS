const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

// =========================
// GET FREELANCER PROFILE
// =========================
const getFreelancerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profile = await UserProfile.findOne({
      userId: req.user._id
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user._id
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          _id: user._id,

          // User Collection
          name: user.name || '',
          email: user.email || '',

          // UserProfile Collection
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          username: profile.username || '',

          phone: profile.mobileNumber || '',
          mobileNumber: profile.mobileNumber || '',

          city: profile.city || '',
          country: profile.country || '',

          shortBio: profile.shortBio || '',
          about: profile.about || '',

          skills: profile.skills || [],
          languages: profile.languages || [],

          experienceLevel:
            profile.experienceLevel || 'Beginner',

          socialLinks:
            profile.socialLinks || {
              instagram: '',
              facebook: '',
              linkedin: '',
              portfolio: ''
            },

          avatar: profile.profilePhoto || '',
          profilePhoto: profile.profilePhoto || '',

          onboardingCompleted:
            profile.onboardingCompleted || false,

          accountType:
            profile.accountType || 'Freelancer',

          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get Freelancer Profile Error:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================
// UPDATE FREELANCER PROFILE
// =========================
const updateFreelancerProfile = async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      username,
      shortBio,
      about,
      city,
      country,
      skills,
      languages,
      experienceLevel,
      phone,
      email,
      socialLinks
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: `${firstName || ''} ${lastName || ''}`.trim(),
        email
      },
      { new: true }
    );

    let profile = await UserProfile.findOne({
      userId: req.user._id
    });

    if (!profile) {
      profile = new UserProfile({
        userId: req.user._id
      });
    }

    profile.firstName = firstName || '';
    profile.lastName = lastName || '';
    profile.username = username || '';

    profile.mobileNumber = phone || '';

    profile.shortBio = shortBio || '';
    profile.about = about || '';

    profile.city = city || '';
    profile.country = country || '';

    profile.skills = skills || [];
    profile.languages = languages || [];

    profile.experienceLevel =
      experienceLevel || 'Beginner';

    profile.socialLinks =
      socialLinks || {
        instagram: '',
        facebook: '',
        linkedin: '',
        portfolio: ''
      };

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Freelancer profile updated successfully',
      data: {
        user,
        profile
      }
    });

  } catch (error) {
    console.error(
      'Freelancer Update Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =========================
// GET PUBLIC FREELANCER PROFILE (by ID)
// =========================
const getPublicFreelancerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -tokens -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found'
      });
    }

    const profile = await UserProfile.findOne({ userId: id });
    const completeness = computeCompleteness(profile);

    return res.status(200).json({
  success: true,
  data: {
    _id: user._id,
    name: user.name || '',
    email: user.email || '',
    avatar: profile?.profilePhoto || '',
    username: profile?.username || '',
    phone: profile?.mobileNumber || '',
    city: profile?.city || '',
    country: profile?.country || '',
    location: [profile?.city, profile?.country].filter(Boolean).join(', '),
    bio: profile?.shortBio || '',
    about: profile?.about || '',
    skills: profile?.skills || [],
    languages: profile?.languages || [],
    experienceLevel: profile?.experienceLevel || 'Beginner',
    availability: profile?.availability || 'Available',
    socialLinks: profile?.socialLinks || {},
    awards: profile?.awards || [],
    certifications: profile?.certifications || [],
    rating: profile?.rating || 0,
    reviewsCount: profile?.reviewsCount || 0,
    reviews: profile?.reviews || [],
    isOnline: user.isOnline || false,
    memberSince: user.createdAt,
    completeness,
    projects: {        // ✅ yahan add karo
      total: 0,
      completed: 0,
      active: 0
    },
  }
});

  } catch (error) {
    console.error('Get Public Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// helper
function computeCompleteness(profile) {
  if (!profile) return 0;
  const fields = [
    profile.profilePhoto,
    profile.shortBio,
    profile.city,
    profile.skills?.length,
    profile.mobileNumber,
    profile.socialLinks?.linkedin,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

module.exports = {
  getFreelancerProfile,
  updateFreelancerProfile,
  getPublicFreelancerProfile
};