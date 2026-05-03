const User = require("../models/User");
const Project = require("../models/Project");
const UserProfile = require("../models/UserProfile"); // 👈 Import UserProfile model

// Dashboard API
const getDashboard = async (req, res) => {
  try {
    console.log("🔥 Dashboard API HIT");

    const totalUsers = await User.countDocuments();
    console.log("Users counted");

    const totalProjects = await Project.countDocuments();
    console.log("Projects counted");

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt");

    console.log("Users fetched");

    const recentProjects = await Project.find({}, {
      name: 1,
      status: 1,
      progress: 1,
      deadline: 1,
      createdAt: 1
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log("Projects fetched");

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProjects,
        recentUsers,
        recentProjects
      }
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard"
    });
  }
};

// Users list API
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email role");
    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error("Users Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users"
    });
  }
};

// 👇 NEW: Get user profile + onboarding data
const getUserProfile = async (req, res, next) => {
  try {
    console.log("🔥 USER FROM TOKEN:", req.user);

    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing from token"
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = new UserProfile({ userId });
      await profile.save();
    }

    res.json({ user, profile });

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getUserProfile // 👈 Export the new function
};