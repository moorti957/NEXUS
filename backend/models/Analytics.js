const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // ===========================================
  // DATE & TIME
  // ===========================================
  date: {
    type: Date,
    required: [true, 'Date is required'],
    unique: true,
    index: true
  },

  year: {
    type: Number,
    required: true
  },

  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },

  day: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },

  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },

  quarter: {
    type: Number,
    min: 1,
    max: 4
  },

  // ===========================================
  // WEBSITE TRAFFIC
  // ===========================================
  visitors: {
    total: { type: Number, default: 0 },
    unique: { type: Number, default: 0 },
    returning: { type: Number, default: 0 },
    new: { type: Number, default: 0 }
  },

  pageViews: {
    total: { type: Number, default: 0 },
    average: { type: Number, default: 0 }
  },

  sessions: {
    total: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 }, // in seconds
    bounceRate: { type: Number, default: 0, min: 0, max: 100 }
  },

  // ===========================================
  // TRAFFIC SOURCES
  // ===========================================
  trafficSources: {
    direct: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    organicSearch: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    socialMedia: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    referral: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    email: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    paidAds: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    }
  },

  // ===========================================
  // SOCIAL MEDIA
  // ===========================================
  socialMedia: {
    facebook: {
      clicks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    },
    twitter: {
      clicks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    },
    linkedin: {
      clicks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    },
    instagram: {
      clicks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    }
  },

  // ===========================================
  // GEOGRAPHIC DATA
  // ===========================================
  geography: [{
    country: String,
    countryCode: String,
    visitors: Number,
    percentage: Number,
    cities: [{
      name: String,
      visitors: Number,
      percentage: Number
    }]
  }],

  // ===========================================
  // DEVICE & BROWSER
  // ===========================================
  devices: {
    desktop: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    mobile: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    tablet: {
      visitors: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    }
  },

  browsers: [{
    name: String,
    visitors: Number,
    percentage: Number,
    versions: [{
      version: String,
      visitors: Number
    }]
  }],

  operatingSystems: [{
    name: String,
    visitors: Number,
    percentage: Number
  }],

  // ===========================================
  // PROJECT METRICS
  // ===========================================
  projects: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    planning: { type: Number, default: 0 },
    onHold: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 }
  },

  projectCategories: {
    webDevelopment: { type: Number, default: 0 },
    mobileApp: { type: Number, default: 0 },
    uiUxDesign: { type: Number, default: 0 },
    branding: { type: Number, default: 0 },
    digitalMarketing: { type: Number, default: 0 },
    ecommerce: { type: Number, default: 0 },
    consulting: { type: Number, default: 0 },
    customSoftware: { type: Number, default: 0 }
  },

  projectProgress: {
    average: { type: Number, default: 0, min: 0, max: 100 },
    onTrack: { type: Number, default: 0 },
    atRisk: { type: Number, default: 0 },
    behind: { type: Number, default: 0 }
  },

  // ===========================================
  // FINANCIAL METRICS
  // ===========================================
  revenue: {
    total: { type: Number, default: 0, min: 0 },
    monthly: { type: Number, default: 0, min: 0 },
    quarterly: { type: Number, default: 0, min: 0 },
    yearly: { type: Number, default: 0, min: 0 },
    projected: { type: Number, default: 0, min: 0 },
    growth: { type: Number, default: 0 }, // percentage
    averagePerProject: { type: Number, default: 0 }
  },

  expenses: {
    total: { type: Number, default: 0, min: 0 },
    operational: { type: Number, default: 0 },
    marketing: { type: Number, default: 0 },
    salaries: { type: Number, default: 0 },
    tools: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  profit: {
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    margin: { type: Number, default: 0, min: 0, max: 100 } // percentage
  },

  invoices: {
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    overdue: { type: Number, default: 0 },
    averageValue: { type: Number, default: 0 }
  },

  // ===========================================
  // CLIENT METRICS
  // ===========================================
  clients: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    retention: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    lifetimeValue: { type: Number, default: 0 }
  },

  clientTypes: {
    vip: { type: Number, default: 0 },
    regular: { type: Number, default: 0 },
    lead: { type: Number, default: 0 },
    past: { type: Number, default: 0 }
  },

  leadSources: {
    website: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    google: { type: Number, default: 0 },
    direct: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // ===========================================
  // TEAM METRICS
  // ===========================================
  team: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    away: { type: Number, default: 0 },
    offline: { type: Number, default: 0 },
    productivity: { type: Number, default: 0, min: 0, max: 100 },
    tasksCompleted: { type: Number, default: 0 },
    averageTasksPerMember: { type: Number, default: 0 }
  },

  teamPerformance: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    memberName: String,
    tasksCompleted: Number,
    projectsHandled: Number,
    hoursLogged: Number,
    productivity: Number
  }],

  // ===========================================
  // TASK METRICS
  // ===========================================
  tasks: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    inProgress: { type: Number, default: 0 },
    overdue: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    averageCompletionTime: { type: Number, default: 0 } // in hours
  },

  // ===========================================
  // MESSAGE METRICS
  // ===========================================
  messages: {
    total: { type: Number, default: 0 },
    unread: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    averageResponseTime: { type: Number, default: 0 } // in hours
  },

  // ===========================================
  // BLOG METRICS
  // ===========================================
  blog: {
    totalPosts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    averageViewsPerPost: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    popularPosts: [{
      postId: mongoose.Schema.Types.ObjectId,
      title: String,
      views: Number,
      comments: Number
    }]
  },

  // ===========================================
  // CONVERSION METRICS
  // ===========================================
  conversions: {
    leads: { type: Number, default: 0 },
    qualifiedLeads: { type: Number, default: 0 },
    opportunities: { type: Number, default: 0 },
    wonDeals: { type: Number, default: 0 },
    lostDeals: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 100 },
    averageDealValue: { type: Number, default: 0 }
  },

  salesFunnel: {
    top: { type: Number, default: 0 },      // Awareness
    middle: { type: Number, default: 0 },    // Consideration
    bottom: { type: Number, default: 0 },     // Decision
    closed: { type: Number, default: 0 }      // Purchase
  },

  // ===========================================
  // CUSTOMER SATISFACTION
  // ===========================================
  satisfaction: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    positiveReviews: { type: Number, default: 0 },
    neutralReviews: { type: Number, default: 0 },
    negativeReviews: { type: Number, default: 0 },
    nps: { type: Number, default: 0, min: -100, max: 100 } // Net Promoter Score
  },

  feedback: [{
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    rating: Number,
    comment: String,
    category: String,
    date: Date
  }],

  // ===========================================
  // TIME-BASED COMPARISONS
  // ===========================================
  comparisons: {
    vsYesterday: {
      visitors: { type: Number, default: 0 }, // percentage change
      revenue: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    vsLastWeek: {
      visitors: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    vsLastMonth: {
      visitors: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    },
    vsLastYear: {
      visitors: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 }
    }
  },

  // ===========================================
  // TRENDS
  // ===========================================
  trends: {
    visitors: [{ date: Date, value: Number }],
    revenue: [{ date: Date, value: Number }],
    projects: [{ date: Date, value: Number }],
    clients: [{ date: Date, value: Number }]
  },

  // ===========================================
  // FORECASTS
  // ===========================================
  forecasts: {
    nextMonth: {
      revenue: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      clients: { type: Number, default: 0 }
    },
    nextQuarter: {
      revenue: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      clients: { type: Number, default: 0 }
    },
    nextYear: {
      revenue: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      clients: { type: Number, default: 0 }
    }
  },

  // ===========================================
  // GOALS & TARGETS
  // ===========================================
  goals: {
    revenue: {
      target: { type: Number, default: 0 },
      achieved: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    projects: {
      target: { type: Number, default: 0 },
      achieved: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    clients: {
      target: { type: Number, default: 0 },
      achieved: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    satisfaction: {
      target: { type: Number, default: 0, min: 0, max: 5 },
      achieved: { type: Number, default: 0 },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    }
  },

  // ===========================================
  // CUSTOM EVENTS
  // ===========================================
  customEvents: [{
    name: String,
    count: Number,
    revenue: Number,
    date: Date
  }],

  // ===========================================
  // METADATA
  // ===========================================
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  tags: [String],

  // ===========================================
  // TIMESTAMPS
  // ===========================================
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES FOR PERFORMANCE
// ===========================================
analyticsSchema.index({ date: 1 });
analyticsSchema.index({ year: 1, month: 1 });
analyticsSchema.index({ year: 1, quarter: 1 });
analyticsSchema.index({ 'projects.status': 1 });
analyticsSchema.index({ 'clients.type': 1 });

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================

// Get month name
analyticsSchema.virtual('monthName').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[this.month - 1];
});

// Get day name
analyticsSchema.virtual('dayName').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[this.dayOfWeek];
});

// Get formatted date
analyticsSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Get revenue per employee
analyticsSchema.virtual('revenuePerEmployee').get(function() {
  if (this.team.total === 0) return 0;
  return this.revenue.total / this.team.total;
});

// Get project success rate
analyticsSchema.virtual('projectSuccessRate').get(function() {
  if (this.projects.total === 0) return 0;
  return (this.projects.completed / this.projects.total) * 100;
});

// Get client acquisition cost (if you have marketing spend)
analyticsSchema.virtual('clientAcquisitionCost').get(function() {
  if (this.clients.new === 0) return 0;
  return this.expenses.marketing / this.clients.new;
});

// ===========================================
// PRE-SAVE MIDDLEWARE
// ===========================================

// Calculate derived fields
analyticsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Calculate percentages for traffic sources
  const totalVisitors = this.visitors.total || 1;
  
  this.trafficSources.direct.percentage = (this.trafficSources.direct.visitors / totalVisitors) * 100;
  this.trafficSources.organicSearch.percentage = (this.trafficSources.organicSearch.visitors / totalVisitors) * 100;
  this.trafficSources.socialMedia.percentage = (this.trafficSources.socialMedia.visitors / totalVisitors) * 100;
  this.trafficSources.referral.percentage = (this.trafficSources.referral.visitors / totalVisitors) * 100;
  this.trafficSources.email.percentage = (this.trafficSources.email.visitors / totalVisitors) * 100;
  this.trafficSources.paidAds.percentage = (this.trafficSources.paidAds.visitors / totalVisitors) * 100;

  // Calculate device percentages
  this.devices.desktop.percentage = (this.devices.desktop.visitors / totalVisitors) * 100;
  this.devices.mobile.percentage = (this.devices.mobile.visitors / totalVisitors) * 100;
  this.devices.tablet.percentage = (this.devices.tablet.visitors / totalVisitors) * 100;

  // Calculate profit
  this.profit.gross = this.revenue.total - this.expenses.total;
  if (this.revenue.total > 0) {
    this.profit.margin = (this.profit.gross / this.revenue.total) * 100;
  }

  // Calculate conversion rate
  if (this.conversions.leads > 0) {
    this.conversions.conversionRate = (this.conversions.wonDeals / this.conversions.leads) * 100;
  }

  // Calculate goal percentages
  if (this.goals.revenue.target > 0) {
    this.goals.revenue.percentage = (this.goals.revenue.achieved / this.goals.revenue.target) * 100;
  }
  if (this.goals.projects.target > 0) {
    this.goals.projects.percentage = (this.goals.projects.achieved / this.goals.projects.target) * 100;
  }
  if (this.goals.clients.target > 0) {
    this.goals.clients.percentage = (this.goals.clients.achieved / this.goals.clients.target) * 100;
  }
  if (this.goals.satisfaction.target > 0) {
    this.goals.satisfaction.percentage = (this.goals.satisfaction.achieved / this.goals.satisfaction.target) * 100;
  }

  // Calculate average page views
  if (this.visitors.total > 0) {
    this.pageViews.average = this.pageViews.total / this.visitors.total;
  }

  // Calculate average revenue per project
  if (this.projects.completed > 0) {
    this.revenue.averagePerProject = this.revenue.total / this.projects.completed;
  }

  // Set day of week
  this.dayOfWeek = this.date.getDay();

  // Set quarter
  this.quarter = Math.ceil(this.month / 3);

  next();
});

// ===========================================
// STATIC METHODS
// ===========================================

// Get dashboard summary
analyticsSchema.statics.getDashboardSummary = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [
    todayData,
    monthData,
    yearData,
    previousMonthData,
    previousYearData
  ] = await Promise.all([
    this.findOne({ date: today }),
    this.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: {
        _id: null,
        revenue: { $sum: '$revenue.total' },
        projects: { $sum: '$projects.total' },
        clients: { $sum: '$clients.total' },
        visitors: { $sum: '$visitors.total' }
      }}
    ]),
    this.aggregate([
      { $match: { date: { $gte: startOfYear } } },
      { $group: {
        _id: null,
        revenue: { $sum: '$revenue.total' },
        projects: { $sum: '$projects.total' },
        clients: { $sum: '$clients.total' },
        visitors: { $sum: '$visitors.total' }
      }}
    ]),
    this.aggregate([
      { $match: { 
        date: { 
          $gte: new Date(today.getFullYear(), today.getMonth() - 1, 1),
          $lt: startOfMonth
        }
      }},
      { $group: { _id: null, revenue: { $sum: '$revenue.total' } }}
    ]),
    this.aggregate([
      { $match: { 
        date: { 
          $gte: new Date(today.getFullYear() - 1, 0, 1),
          $lt: startOfYear
        }
      }},
      { $group: { _id: null, revenue: { $sum: '$revenue.total' } }}
    ])
  ]);

  // Calculate growth percentages
  const monthRevenue = monthData[0]?.revenue || 0;
  const previousMonthRevenue = previousMonthData[0]?.revenue || 0;
  const monthGrowth = previousMonthRevenue ? 
    ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

  const yearRevenue = yearData[0]?.revenue || 0;
  const previousYearRevenue = previousYearData[0]?.revenue || 0;
  const yearGrowth = previousYearRevenue ? 
    ((yearRevenue - previousYearRevenue) / previousYearRevenue) * 100 : 0;

  return {
    today: todayData || {
      visitors: { total: 0 },
      revenue: { total: 0 },
      projects: { total: 0 },
      clients: { total: 0 }
    },
    month: {
      revenue: monthRevenue,
      projects: monthData[0]?.projects || 0,
      clients: monthData[0]?.clients || 0,
      visitors: monthData[0]?.visitors || 0,
      growth: monthGrowth
    },
    year: {
      revenue: yearRevenue,
      projects: yearData[0]?.projects || 0,
      clients: yearData[0]?.clients || 0,
      visitors: yearData[0]?.visitors || 0,
      growth: yearGrowth
    }
  };
};

// Get chart data
analyticsSchema.statics.getChartData = async function(period = 'month') {
  const today = new Date();
  let startDate, groupBy, dateFormat;

  switch(period) {
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
      break;
    case 'quarter':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      groupBy = { $week: '$date' };
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      groupBy = { $month: '$date' };
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
  }

  return this.aggregate([
    { $match: { date: { $gte: startDate } } },
    { $group: {
      _id: groupBy,
      visitors: { $sum: '$visitors.total' },
      revenue: { $sum: '$revenue.total' },
      projects: { $sum: '$projects.total' },
      clients: { $sum: '$clients.total' }
    }},
    { $sort: { _id: 1 } }
  ]);
};

// Get revenue analytics
analyticsSchema.statics.getRevenueAnalytics = async function(period = 'month') {
  const today = new Date();
  let startDate;

  switch(period) {
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'quarter':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
  }

  return this.aggregate([
    { $match: { date: { $gte: startDate } } },
    { $group: {
      _id: null,
      total: { $sum: '$revenue.total' },
      average: { $avg: '$revenue.total' },
      max: { $max: '$revenue.total' },
      min: { $min: '$revenue.total' },
      count: { $sum: 1 }
    }}
  ]);
};

// Get project analytics
analyticsSchema.statics.getProjectAnalytics = async function() {
  return this.aggregate([
    { $group: {
      _id: null,
      totalProjects: { $sum: '$projects.total' },
      activeProjects: { $sum: '$projects.active' },
      completedProjects: { $sum: '$projects.completed' },
      byCategory: {
        webDevelopment: { $sum: '$projectCategories.webDevelopment' },
        mobileApp: { $sum: '$projectCategories.mobileApp' },
        uiUxDesign: { $sum: '$projectCategories.uiUxDesign' },
        branding: { $sum: '$projectCategories.branding' }
      }
    }}
  ]);
};

// Get client analytics
analyticsSchema.statics.getClientAnalytics = async function() {
  return this.aggregate([
    { $group: {
      _id: null,
      totalClients: { $sum: '$clients.total' },
      activeClients: { $sum: '$clients.active' },
      newClients: { $sum: '$clients.new' },
      byType: {
        vip: { $sum: '$clientTypes.vip' },
        regular: { $sum: '$clientTypes.regular' },
        lead: { $sum: '$clientTypes.lead' }
      }
    }}
  ]);
};

// Get traffic analytics
analyticsSchema.statics.getTrafficAnalytics = async function(period = 'month') {
  const today = new Date();
  let startDate;

  switch(period) {
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return this.aggregate([
    { $match: { date: { $gte: startDate } } },
    { $group: {
      _id: null,
      totalVisitors: { $sum: '$visitors.total' },
      uniqueVisitors: { $sum: '$visitors.unique' },
      pageViews: { $sum: '$pageViews.total' },
      bounceRate: { $avg: '$sessions.bounceRate' },
      avgSessionDuration: { $avg: '$sessions.averageDuration' },
      trafficSources: {
        direct: { $sum: '$trafficSources.direct.visitors' },
        organic: { $sum: '$trafficSources.organicSearch.visitors' },
        social: { $sum: '$trafficSources.socialMedia.visitors' },
        referral: { $sum: '$trafficSources.referral.visitors' }
      }
    }}
  ]);
};

// Get performance metrics
analyticsSchema.statics.getPerformanceMetrics = async function() {
  return this.aggregate([
    { $group: {
      _id: null,
      avgProjectCompletion: { $avg: '$projectProgress.average' },
      avgClientSatisfaction: { $avg: '$satisfaction.averageRating' },
      teamProductivity: { $avg: '$team.productivity' },
      taskCompletionRate: { $avg: '$tasks.completionRate' },
      messageResponseRate: { $avg: '$messages.responseRate' }
    }}
  ]);
};

// Get comparison data
analyticsSchema.statics.getComparisonData = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    todayData,
    yesterdayData,
    lastWeekData,
    lastMonthData
  ] = await Promise.all([
    this.findOne({ date: today }),
    this.findOne({ date: yesterday }),
    this.aggregate([
      { $match: { date: { $gte: lastWeek, $lt: today } } },
      { $group: { _id: null, revenue: { $sum: '$revenue.total' }, visitors: { $sum: '$visitors.total' } }}
    ]),
    this.aggregate([
      { $match: { date: { $gte: lastMonth, $lt: today } } },
      { $group: { _id: null, revenue: { $sum: '$revenue.total' }, visitors: { $sum: '$visitors.total' } }}
    ])
  ]);

  return {
    today: todayData,
    yesterday: yesterdayData,
    lastWeek: lastWeekData[0],
    lastMonth: lastMonthData[0]
  };
};

// Create or update analytics for date
analyticsSchema.statics.recordAnalytics = async function(date, data) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return this.findOneAndUpdate(
    { date },
    {
      $set: {
        ...data,
        year,
        month,
        day
      },
      $inc: {
        'visitors.total': data.visitors?.total || 0,
        'pageViews.total': data.pageViews?.total || 0
      }
    },
    { upsert: true, new: true }
  );
};

// ===========================================
// EXPORT MODEL
// ===========================================
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;