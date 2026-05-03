const Analytics = require('../models/Analytics');
const Project = require('../models/Project');
const Client = require('../models/Client');
const User = require('../models/User');
const Message = require('../models/Message');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, format } = require('date-fns');

// ===========================================
// DASHBOARD OVERVIEW ANALYTICS
// ===========================================

/**
 * @desc    Get main dashboard analytics
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Get date ranges
    const now = new Date();
    let startDate, endDate, previousStartDate;

    switch(period) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        previousStartDate = startOfDay(subDays(now, 1));
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = now;
        previousStartDate = startOfMonth(subMonths(now, 6));
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        previousStartDate = startOfYear(subYears(now, 1));
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
    }

    // Fetch all analytics data in parallel
    const [
      revenueData,
      projectsData,
      clientsData,
      teamData,
      messagesData,
      trafficData,
      previousPeriodData
    ] = await Promise.all([
      // Current period revenue
      fetchRevenueAnalytics(startDate, endDate),
      
      // Current period projects
      fetchProjectAnalytics(startDate, endDate),
      
      // Current period clients
      fetchClientAnalytics(startDate, endDate),
      
      // Team statistics
      fetchTeamAnalytics(),
      
      // Message statistics
      fetchMessageAnalytics(startDate, endDate),
      
      // Traffic analytics
      fetchTrafficAnalytics(startDate, endDate),
      
      // Previous period for comparison
      fetchPreviousPeriodAnalytics(previousStartDate, startDate)
    ]);

    // Calculate trends
    const trends = calculateTrendsData(revenueData, projectsData, clientsData, previousPeriodData);

    // Get chart data
    const chartData = await fetchChartData(period);

    res.json({
      success: true,
      data: {
        overview: {
          revenue: {
            total: revenueData.total,
            target: revenueData.target,
            percentage: revenueData.percentage,
            trend: trends.revenue
          },
          projects: {
            total: projectsData.total,
            active: projectsData.active,
            completed: projectsData.completed,
            trend: trends.projects
          },
          clients: {
            total: clientsData.total,
            new: clientsData.new,
            active: clientsData.active,
            trend: trends.clients
          },
          team: {
            online: teamData.online,
            total: teamData.total,
            productivity: teamData.productivity
          }
        },
        charts: chartData,
        recent: {
          projects: projectsData.recent,
          clients: clientsData.recent,
          messages: messagesData.recent,
          activities: [...projectsData.recent, ...clientsData.recent].sort((a, b) => b.date - a.date).slice(0, 10)
        },
        traffic: trafficData,
        messages: {
          unread: messagesData.unread,
          total: messagesData.total,
          responseRate: messagesData.responseRate
        }
      }
    });
  } catch (error) {
    console.error('Get Dashboard Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// REVENUE ANALYTICS
// ===========================================

/**
 * @desc    Get revenue analytics
 * @route   GET /api/analytics/revenue
 * @access  Private
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'month', compare = true } = req.query;
    
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;

    switch(period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = now;
        previousStartDate = startOfMonth(subMonths(now, 6));
        previousEndDate = startOfMonth(subMonths(now, 3));
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        previousStartDate = startOfYear(subYears(now, 1));
        previousEndDate = endOfYear(subYears(now, 1));
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
    }

    // Get revenue data
    const [currentRevenue, previousRevenue, revenueByCategory, revenueByClient, revenueMonthlyTrend] = await Promise.all([
      // Current period revenue
      Project.aggregate([
        {
          $match: {
            status: 'Completed',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$budget' },
            count: { $sum: 1 },
            average: { $avg: '$budget' },
            min: { $min: '$budget' },
            max: { $max: '$budget' }
          }
        }
      ]),

      // Previous period revenue for comparison
      compare ? Project.aggregate([
        {
          $match: {
            status: 'Completed',
            completedAt: { $gte: previousStartDate, $lte: previousEndDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$budget' }
          }
        }
      ]) : Promise.resolve([{ total: 0 }]),

      // Revenue by category
      Project.aggregate([
        {
          $match: {
            status: 'Completed',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$budget' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]),

      // Revenue by client
      Project.aggregate([
        {
          $match: {
            status: 'Completed',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$client',
            total: { $sum: '$budget' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: '_id',
            as: 'client'
          }
        },
        { $unwind: '$client' }
      ]),

      // Monthly trend
      Project.aggregate([
        {
          $match: {
            status: 'Completed',
            completedAt: { $gte: startOfYear(now), $lte: now }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$completedAt' },
              month: { $month: '$completedAt' }
            },
            total: { $sum: '$budget' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Calculate growth
    const currentTotal = currentRevenue[0]?.total || 0;
    const previousTotal = previousRevenue[0]?.total || 0;
    const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 100;

    // Get projected revenue
    const projectedRevenue = await calculateProjectedRevenueData(currentTotal, growth, period);

    res.json({
      success: true,
      data: {
        current: {
          total: currentTotal,
          count: currentRevenue[0]?.count || 0,
          average: currentRevenue[0]?.average || 0,
          min: currentRevenue[0]?.min || 0,
          max: currentRevenue[0]?.max || 0
        },
        previous: {
          total: previousTotal
        },
        growth: Math.round(growth * 10) / 10,
        projected: projectedRevenue,
        byCategory: revenueByCategory.map(c => ({
          category: c._id,
          total: c.total,
          count: c.count
        })),
        topClients: revenueByClient.map(c => ({
          id: c._id,
          name: c.client.name,
          company: c.client.company,
          total: c.total,
          count: c.count
        })),
        trend: revenueMonthlyTrend.map(t => ({
          month: `${t._id.year}-${t._id.month}`,
          total: t.total,
          count: t.count
        }))
      }
    });
  } catch (error) {
    console.error('Get Revenue Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching revenue analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// PROJECT ANALYTICS
// ===========================================

/**
 * @desc    Get project analytics
 * @route   GET /api/analytics/projects
 * @access  Private
 */
const getProjectAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate, endDate;

    switch(period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = now;
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const [
      projectStatusDistribution,
      projectCategoryDistribution,
      projectProgressStats,
      projectTimeline,
      projectTeamPerformance
    ] = await Promise.all([
      // Projects by status
      Project.aggregate([
        {
          $match: {
            createdAt: { $lte: now }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' },
            avgProgress: { $avg: '$progress' }
          }
        }
      ]),

      // Projects by category
      Project.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Progress statistics
      Project.aggregate([
        {
          $group: {
            _id: null,
            avgProgress: { $avg: '$progress' },
            minProgress: { $min: '$progress' },
            maxProgress: { $max: '$progress' },
            onTrack: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'Completed'] },
                    { $gte: ['$deadline', new Date()] }
                  ]},
                  1, 0
                ]
              }
            },
            atRisk: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'Completed'] },
                    { $lt: ['$deadline', new Date()] },
                    { $gt: ['$deadline', subDays(new Date(), 7)] }
                  ]},
                  1, 0
                ]
              }
            },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$status', 'Completed'] },
                    { $lt: ['$deadline', subDays(new Date(), 7)] }
                  ]},
                  1, 0
                ]
              }
            }
          }
        }
      ]),

      // Timeline (projects created over time)
      Project.aggregate([
        {
          $match: {
            createdAt: { $gte: subMonths(now, 6) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              week: { $week: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
      ]),

      // Team performance on projects
      Project.aggregate([
        { $unwind: '$teamMembers' },
        {
          $group: {
            _id: '$teamMembers.user',
            projectsCount: { $sum: 1 },
            totalHours: { $sum: '$teamMembers.hoursAllocated' },
            completedTasks: { $sum: '$tasks.completed' }
          }
        },
        { $sort: { projectsCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: projectStatusDistribution.reduce((sum, s) => sum + s.count, 0),
          byStatus: projectStatusDistribution,
          avgProgress: projectProgressStats[0]?.avgProgress || 0,
          onTrack: projectProgressStats[0]?.onTrack || 0,
          atRisk: projectProgressStats[0]?.atRisk || 0,
          overdue: projectProgressStats[0]?.overdue || 0
        },
        byCategory: projectCategoryDistribution,
        timeline: projectTimeline.map(t => ({
          period: `${t._id.year}-${t._id.month}`,
          count: t.count
        })),
        teamPerformance: projectTeamPerformance.map(t => ({
          id: t.user._id,
          name: t.user.name,
          avatar: t.user.avatar,
          projectsCount: t.projectsCount,
          totalHours: t.totalHours,
          completedTasks: t.completedTasks
        }))
      }
    });
  } catch (error) {
    console.error('Get Project Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// CLIENT ANALYTICS
// ===========================================

/**
 * @desc    Get client analytics
 * @route   GET /api/analytics/clients
 * @access  Private
 */
const getClientAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate, endDate;

    switch(period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = now;
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const [
      clientStatusDistribution,
      clientTypeDistribution,
      clientSourceDistribution,
      clientAcquisitionTrend,
      topSpendingClients,
      clientRetentionRate
    ] = await Promise.all([
      // Clients by status
      Client.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalSpent: { $sum: '$totalSpent' }
          }
        }
      ]),

      // Clients by type
      Client.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: '$clientType',
            count: { $sum: 1 },
            avgSpent: { $avg: '$totalSpent' }
          }
        }
      ]),

      // Clients by lead source
      Client.aggregate([
        {
          $match: { 
            isActive: true,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$leadSource',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Acquisition trend
      Client.aggregate([
        {
          $match: {
            createdAt: { $gte: subMonths(now, 12) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalSpent: { $sum: '$totalSpent' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Top clients by spending
      Client.find({ isActive: true })
        .sort('-totalSpent')
        .limit(5)
        .select('name company totalSpent projects avatar')
        .populate('projects', 'name status'),

      // Retention rate
      calculateRetentionRateData()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: clientStatusDistribution.reduce((sum, s) => sum + s.count, 0),
          byStatus: clientStatusDistribution,
          byType: clientTypeDistribution,
          retention: clientRetentionRate
        },
        leadSources: clientSourceDistribution,
        acquisitionTrend: clientAcquisitionTrend.map(t => ({
          month: `${t._id.year}-${t._id.month}`,
          count: t.count,
          revenue: t.totalSpent
        })),
        topClients: topSpendingClients.map(c => ({
          id: c._id,
          name: c.name,
          company: c.company,
          avatar: c.avatar,
          totalSpent: c.totalSpent,
          projectsCount: c.projects.length
        }))
      }
    });
  } catch (error) {
    console.error('Get Client Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM ANALYTICS
// ===========================================

/**
 * @desc    Get team analytics
 * @route   GET /api/analytics/team
 * @access  Private
 */
const getTeamAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startDate = startOfMonth(now);

    const [
      teamOverallStats,
      teamMemberPerformance,
      teamActivityStats,
      teamRoleDistribution
    ] = await Promise.all([
      // Team statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            online: {
              $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
            },
            away: {
              $sum: { $cond: [{ $eq: ['$status', 'away'] }, 1, 0] }
            },
            offline: {
              $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
            },
            byRole: {
              $push: {
                role: '$role',
                status: '$status'
              }
            }
          }
        }
      ]),

      // Team performance
      User.aggregate([
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: 'teamMembers.user',
            as: 'projects'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            role: 1,
            status: 1,
            projectsCount: { $size: '$projects' },
            activeProjects: {
              $size: {
                $filter: {
                  input: '$projects',
                  as: 'p',
                  cond: { $eq: ['$$p.status', 'In Progress'] }
                }
              }
            },
            completedProjects: {
              $size: {
                $filter: {
                  input: '$projects',
                  as: 'p',
                  cond: { $eq: ['$$p.status', 'Completed'] }
                }
              }
            },
            stats: 1
          }
        },
        { $sort: { projectsCount: -1 } }
      ]),

      // Activity in last 30 days
      User.aggregate([
        {
          $match: {
            lastSeen: { $gte: subDays(now, 30) }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$lastSeen' } }
            },
            active: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Project contribution by role
      Project.aggregate([
        { $unwind: '$teamMembers' },
        {
          $group: {
            _id: '$teamMembers.role',
            count: { $sum: 1 },
            projects: { $addToSet: '$_id' }
          }
        },
        {
          $project: {
            role: '$_id',
            count: 1,
            uniqueProjects: { $size: '$projects' }
          }
        }
      ])
    ]);

    // Calculate productivity score
    const productivityScore = await calculateProductivityScoreData();

    res.json({
      success: true,
      data: {
        overview: {
          total: teamOverallStats[0]?.total || 0,
          online: teamOverallStats[0]?.online || 0,
          away: teamOverallStats[0]?.away || 0,
          offline: teamOverallStats[0]?.offline || 0,
          productivity: productivityScore
        },
        members: teamMemberPerformance.map(m => ({
          id: m._id,
          name: m.name,
          email: m.email,
          avatar: m.avatar,
          role: m.role,
          status: m.status,
          projectsCount: m.projectsCount,
          activeProjects: m.activeProjects,
          completedProjects: m.completedProjects,
          tasksCompleted: m.stats?.tasksCompleted || 0,
          hoursLogged: m.stats?.totalHours || 0
        })),
        activity: teamActivityStats.map(a => ({
          date: a._id.date,
          active: a.active
        })),
        roleDistribution: teamRoleDistribution.map(r => ({
          role: r.role,
          count: r.count,
          projects: r.uniqueProjects
        }))
      }
    });
  } catch (error) {
    console.error('Get Team Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TRAFFIC ANALYTICS
// ===========================================

/**
 * @desc    Get traffic analytics
 * @route   GET /api/analytics/traffic
 * @access  Private
 */
const getTrafficAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate, endDate, previousStartDate;

    switch(period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = now;
        previousStartDate = startOfMonth(subMonths(now, 6));
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        previousStartDate = startOfYear(subYears(now, 1));
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
    }

    const [currentTraffic, previousTraffic, dailyTraffic, trafficSources, topPages] = await Promise.all([
      // Current period traffic
      Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalVisitors: { $sum: '$visitors.total' },
            uniqueVisitors: { $sum: '$visitors.unique' },
            pageViews: { $sum: '$pageViews.total' },
            avgSessionDuration: { $avg: '$sessions.averageDuration' },
            bounceRate: { $avg: '$sessions.bounceRate' }
          }
        }
      ]),

      // Previous period traffic for comparison
      Analytics.aggregate([
        {
          $match: {
            date: { $gte: previousStartDate, $lt: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalVisitors: { $sum: '$visitors.total' }
          }
        }
      ]),

      // Daily traffic for chart
      Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $project: {
            date: 1,
            visitors: '$visitors.total',
            pageViews: '$pageViews.total'
          }
        },
        { $sort: { date: 1 } }
      ]),

      // Traffic sources
      Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            direct: { $sum: '$trafficSources.direct.visitors' },
            organic: { $sum: '$trafficSources.organicSearch.visitors' },
            social: { $sum: '$trafficSources.socialMedia.visitors' },
            referral: { $sum: '$trafficSources.referral.visitors' },
            email: { $sum: '$trafficSources.email.visitors' },
            paid: { $sum: '$trafficSources.paidAds.visitors' }
          }
        }
      ]),

      // Top pages (if you have page tracking)
      Analytics.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $unwind: '$topPages' },
        {
          $group: {
            _id: '$topPages.url',
            views: { $sum: '$topPages.views' },
            avgTimeOnPage: { $avg: '$topPages.avgTime' }
          }
        },
        { $sort: { views: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Calculate growth
    const currentVisitors = currentTraffic[0]?.totalVisitors || 0;
    const previousVisitors = previousTraffic[0]?.totalVisitors || 0;
    const trafficGrowth = previousVisitors > 0 ? ((currentVisitors - previousVisitors) / previousVisitors) * 100 : 0;

    // Prepare source data for pie chart
    const sourceData = trafficSources[0] || {};
    const totalSourceVisitors = Object.values(sourceData).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      data: {
        overview: {
          visitors: currentVisitors,
          uniqueVisitors: currentTraffic[0]?.uniqueVisitors || 0,
          pageViews: currentTraffic[0]?.pageViews || 0,
          avgSessionDuration: currentTraffic[0]?.avgSessionDuration || 0,
          bounceRate: Math.round(currentTraffic[0]?.bounceRate || 0),
          growth: Math.round(trafficGrowth * 10) / 10
        },
        sources: Object.keys(sourceData).map(key => ({
          source: key,
          visitors: sourceData[key],
          percentage: totalSourceVisitors > 0 ? (sourceData[key] / totalSourceVisitors) * 100 : 0
        })),
        daily: dailyTraffic.map(d => ({
          date: format(d.date, 'yyyy-MM-dd'),
          visitors: d.visitors,
          pageViews: d.pageViews
        })),
        topPages: topPages.map(p => ({
          url: p._id,
          views: p.views,
          avgTimeOnPage: p.avgTimeOnPage
        }))
      }
    });
  } catch (error) {
    console.error('Get Traffic Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching traffic analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// HELPER FUNCTIONS (PRIVATE - NOT EXPORTED)
// ===========================================

/**
 * Fetch revenue analytics for date range
 */
const fetchRevenueAnalytics = async (startDate, endDate) => {
  const [revenue, target] = await Promise.all([
    Project.aggregate([
      {
        $match: {
          status: 'Completed',
          completedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$budget' },
          count: { $sum: 1 }
        }
      }
    ]),

    // Get monthly target from settings or calculate from average
    Project.aggregate([
      {
        $match: {
          status: 'Completed',
          completedAt: { $gte: subMonths(startDate, 12), $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgMonthly: { $avg: '$budget' }
        }
      }
    ])
  ]);

  const total = revenue[0]?.total || 0;
  const targetValue = target[0]?.avgMonthly * 1.1 || total * 1.1; // 10% growth target

  return {
    total,
    count: revenue[0]?.count || 0,
    target: targetValue,
    percentage: targetValue > 0 ? (total / targetValue) * 100 : 0
  };
};

/**
 * Fetch project analytics for date range
 */
const fetchProjectAnalytics = async (startDate, endDate) => {
  const [projects, recent] = await Promise.all([
    Project.aggregate([
      {
        $match: {
          createdAt: { $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      }
    ]),

    Project.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('client', 'name company')
    .sort('-createdAt')
    .limit(5)
  ]);

  return {
    total: projects[0]?.total || 0,
    active: projects[0]?.active || 0,
    completed: projects[0]?.completed || 0,
    recent: recent.map(p => ({
      id: p._id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      client: p.client?.name || 'Unknown',
      date: p.createdAt
    }))
  };
};

/**
 * Fetch client analytics for date range
 */
const fetchClientAnalytics = async (startDate, endDate) => {
  const [clients, recent] = await Promise.all([
    Client.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          new: {
            $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] }
          }
        }
      }
    ]),

    Client.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .select('name company email avatar createdAt')
    .sort('-createdAt')
    .limit(5)
  ]);

  return {
    total: clients[0]?.total || 0,
    active: clients[0]?.active || 0,
    new: clients[0]?.new || 0,
    recent: recent.map(c => ({
      id: c._id,
      name: c.name,
      company: c.company,
      email: c.email,
      avatar: c.avatar,
      date: c.createdAt
    }))
  };
};

/**
 * Fetch team analytics
 */
const fetchTeamAnalytics = async () => {
  const team = await User.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        online: {
          $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
        },
        away: {
          $sum: { $cond: [{ $eq: ['$status', 'away'] }, 1, 0] }
        }
      }
    }
  ]);

  // Calculate productivity based on tasks completed
  const productivity = await calculateProductivityScoreData();

  return {
    total: team[0]?.total || 0,
    online: team[0]?.online || 0,
    away: team[0]?.away || 0,
    productivity
  };
};

/**
 * Fetch message analytics for date range
 */
const fetchMessageAnalytics = async (startDate, endDate) => {
  const [messages, unread, recent] = await Promise.all([
    Message.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    }),

    Message.countDocuments({
      isRead: false,
      receiver: { $exists: true }
    }),

    Message.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name company')
    .sort('-createdAt')
    .limit(5)
  ]);

  // Calculate response rate
  const respondedMessages = await Message.countDocuments({
    isReply: true,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const responseRate = messages > 0 ? (respondedMessages / messages) * 100 : 0;

  return {
    total: messages,
    unread,
    responseRate,
    recent: recent.map(m => ({
      id: m._id,
      subject: m.subject,
      sender: m.sender?.name || 'Unknown',
      senderAvatar: m.sender?.avatar,
      receiver: m.receiver?.name || 'Unknown',
      date: m.createdAt,
      isRead: m.isRead
    }))
  };
};

/**
 * Fetch traffic analytics for date range
 */
const fetchTrafficAnalytics = async (startDate, endDate) => {
  const traffic = await Analytics.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        visitors: { $sum: '$visitors.total' },
        pageViews: { $sum: '$pageViews.total' }
      }
    }
  ]);

  return {
    visitors: traffic[0]?.visitors || 0,
    pageViews: traffic[0]?.pageViews || 0
  };
};

/**
 * Fetch previous period analytics for comparison
 */
const fetchPreviousPeriodAnalytics = async (startDate, endDate) => {
  const [revenue, projects, clients] = await Promise.all([
    Project.aggregate([
      {
        $match: {
          status: 'Completed',
          completedAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$budget' }
        }
      }
    ]),

    Project.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    }),

    Client.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    })
  ]);

  return {
    revenue: revenue[0]?.total || 0,
    projects,
    clients
  };
};

/**
 * Calculate trends based on current and previous periods
 */
const calculateTrendsData = (currentRevenue, currentProjects, currentClients, previousPeriod) => {
  const calculateTrend = (currentVal, previousVal) => {
    if (previousVal === 0) return 100;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  return {
    revenue: calculateTrend(currentRevenue.total, previousPeriod.revenue),
    projects: calculateTrend(currentProjects.total, previousPeriod.projects),
    clients: calculateTrend(currentClients.total, previousPeriod.clients)
  };
};

/**
 * Fetch chart data based on period
 */
const fetchChartData = async (period) => {
  const now = new Date();
  let startDate, groupFormat;

  switch(period) {
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      groupFormat = '%Y-%m-%d';
      break;
    case 'month':
      startDate = startOfMonth(now);
      groupFormat = '%Y-%m-%d';
      break;
    case 'quarter':
      startDate = startOfMonth(subMonths(now, 3));
      groupFormat = '%Y-%m-%d';
      break;
    case 'year':
      startDate = startOfYear(now);
      groupFormat = '%Y-%m';
      break;
    default:
      startDate = startOfMonth(now);
      groupFormat = '%Y-%m-%d';
  }

  const [revenueChart, projectsChart, clientsChart] = await Promise.all([
    // Revenue chart data
    Project.aggregate([
      {
        $match: {
          status: 'Completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$completedAt' } },
          value: { $sum: '$budget' }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Projects chart data
    Project.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          value: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Clients chart data
    Client.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          value: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return {
    revenue: revenueChart.map(d => ({ label: d._id, value: d.value })),
    projects: projectsChart.map(d => ({ label: d._id, value: d.value })),
    clients: clientsChart.map(d => ({ label: d._id, value: d.value }))
  };
};

/**
 * Calculate projected revenue
 */
const calculateProjectedRevenueData = async (currentRevenue, growth, period) => {
  const monthlyAverage = currentRevenue / (period === 'year' ? 12 : 1);
  
  return {
    nextMonth: monthlyAverage * (1 + growth / 100 / 12),
    nextQuarter: monthlyAverage * 3 * (1 + growth / 100 / 4),
    nextYear: monthlyAverage * 12 * (1 + growth / 100)
  };
};

/**
 * Calculate retention rate
 */
const calculateRetentionRateData = async () => {
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  
  const [oldClients, currentActive] = await Promise.all([
    Client.countDocuments({
      createdAt: { $lte: sixMonthsAgo },
      isActive: true
    }),
    
    Client.countDocuments({
      createdAt: { $lte: sixMonthsAgo },
      isActive: true,
      status: 'Active'
    })
  ]);

  return oldClients > 0 ? (currentActive / oldClients) * 100 : 100;
};

/**
 * Calculate productivity score
 */
const calculateProductivityScoreData = async () => {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [totalTasks, completedTasks, totalHours, targetHours] = await Promise.all([
    Project.aggregate([
      { $unwind: '$tasks' },
      {
        $match: {
          'tasks.createdAt': { $gte: thirtyDaysAgo }
        }
      },
      { $count: 'total' }
    ]),

    Project.aggregate([
      { $unwind: '$tasks' },
      {
        $match: {
          'tasks.completedAt': { $gte: thirtyDaysAgo }
        }
      },
      { $count: 'completed' }
    ]),

    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$stats.totalHours' }
        }
      }
    ]),

    // Target hours (8 hours per day, 22 working days)
    Promise.resolve(8 * 22 * 10) // Assuming 10 team members
  ]);

  const taskCompletionRate = totalTasks[0]?.total > 0 
    ? (completedTasks[0]?.completed / totalTasks[0]?.total) * 100 
    : 100;

  const hourUtilization = targetHours > 0 
    ? (totalHours[0]?.total / targetHours) * 100 
    : 100;

  return Math.round((taskCompletionRate * 0.6 + hourUtilization * 0.4) * 10) / 10;
};

// ===========================================
// EXPORT CONTROLLERS (PUBLIC)
// ===========================================
const notImplemented = (req,res)=>{
  res.json({message:"Analytics endpoint working"});
};

module.exports = {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getProjectAnalytics,
  getClientAnalytics,
  getTeamAnalytics,
  getTrafficAnalytics,

  getTrafficSources:notImplemented,
  getGeoAnalytics:notImplemented,
  getDeviceAnalytics:notImplemented,
  getPerformanceMetrics:notImplemented,
  getTaskAnalytics:notImplemented,
  getMessageAnalytics:notImplemented,
  getSatisfactionAnalytics:notImplemented,
  getDailyAnalytics:notImplemented,
  getWeeklyAnalytics:notImplemented,
  getMonthlyAnalytics:notImplemented,
  getQuarterlyAnalytics:notImplemented,
  getYearlyAnalytics:notImplemented,
  getCustomRangeAnalytics:notImplemented,
  getComparisons:notImplemented,
  getTrends:notImplemented,
  getForecasts:notImplemented,
  getGoalProgress:notImplemented,
  getGoalAchievement:notImplemented,
  exportAnalyticsData:notImplemented,
  getRealtimeAnalytics:notImplemented,
  generateCustomReport:notImplemented,
  getSavedReports:notImplemented,
  saveReport:notImplemented,
  deleteReport:notImplemented,
  getAnalyticsSettings:notImplemented,
  updateAnalyticsSettings:notImplemented,
  getTopProjects:notImplemented,
  getTopClients:notImplemented,
  getTopPerformers:notImplemented,
  getPopularServices:notImplemented,
  getConversionRates:notImplemented,
  getSalesFunnel:notImplemented,
  getFinancialOverview:notImplemented,
  getCashflowAnalytics:notImplemented,
  getInvoiceAnalytics:notImplemented,
  getGrowthMetrics:notImplemented,
  getRetentionAnalytics:notImplemented,
  getCustomMetrics:notImplemented,
  createCustomMetric:notImplemented,
  updateCustomMetric:notImplemented,
  deleteCustomMetric:notImplemented
};