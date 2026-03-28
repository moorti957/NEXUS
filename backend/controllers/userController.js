const User = require("../models/User");
const Project = require("../models/Project");


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


// 👇 Users list API (यह नया add करो)
const getUsers = async (req, res) => {
  try {

    const users = await User.find().select("name email role");

    res.status(200).json({
      success: true,
      data: {
        users
      }
    });

  } catch (error) {

    console.error("Users Fetch Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching users"
    });

  }
};


module.exports = {
  getDashboard,
  getUsers
};