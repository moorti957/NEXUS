const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');

const {
  // Dashboard Analytics
  getDashboardAnalytics,
  getRevenueAnalytics,
  getProjectAnalytics,
  getClientAnalytics,
  getTeamAnalytics,
  
 
  getTrafficAnalytics,
  getTrafficSources,
  getGeoAnalytics,
  getDeviceAnalytics,
  
  // Performance Analytics
  getPerformanceMetrics,
  getTaskAnalytics,
  getMessageAnalytics,
  getSatisfactionAnalytics,
  
  // Time-based Analytics
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getQuarterlyAnalytics,
  getYearlyAnalytics,
  getCustomRangeAnalytics,
  
  // Comparative Analytics
  getComparisons,
  getTrends,
  getForecasts,
  
  // Goal Analytics
  getGoalProgress,
  getGoalAchievement,
  
  // Export Analytics
  exportAnalyticsData,
  
  // Real-time Analytics
  getRealtimeAnalytics,
  
  // Custom Reports
  generateCustomReport,
  getSavedReports,
  saveReport,
  deleteReport,
  
  // Analytics Settings
  getAnalyticsSettings,
  updateAnalyticsSettings,
  
  // Data Points
  getTopProjects,
  getTopClients,
  getTopPerformers,
  getPopularServices,
  
  // Conversion Analytics
  getConversionRates,
  getSalesFunnel,
  
  // Financial Analytics
  getFinancialOverview,
  getCashflowAnalytics,
  getInvoiceAnalytics,
  
  // Growth Analytics
  getGrowthMetrics,
  getRetentionAnalytics,
  
  // Custom Metrics
  getCustomMetrics,
  createCustomMetric,
  updateCustomMetric,
  deleteCustomMetric
} = require('../controllers/analyticsController');

// ===========================================
// PROTECT ALL ROUTES
// ===========================================
router.use(protect);

// ===========================================
// DASHBOARD ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get complete dashboard analytics
 * @access  Private
 */
router.get('/dashboard', getDashboardAnalytics);

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Private
 */
router.get('/revenue', getRevenueAnalytics);

/**
 * @route   GET /api/analytics/projects
 * @desc    Get project analytics
 * @access  Private
 */
router.get('/projects', getProjectAnalytics);

/**
 * @route   GET /api/analytics/clients
 * @desc    Get client analytics
 * @access  Private
 */
router.get('/clients', getClientAnalytics);

/**
 * @route   GET /api/analytics/team
 * @desc    Get team analytics
 * @access  Private
 */
router.get('/team', getTeamAnalytics);

// ===========================================
// TRAFFIC ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/traffic
 * @desc    Get traffic analytics
 * @access  Private
 */
router.get('/traffic', getTrafficAnalytics);

/**
 * @route   GET /api/analytics/traffic/sources
 * @desc    Get traffic sources breakdown
 * @access  Private
 */
router.get('/traffic/sources', getTrafficSources);

/**
 * @route   GET /api/analytics/geo
 * @desc    Get geographic analytics
 * @access  Private
 */
router.get('/geo', getGeoAnalytics);

/**
 * @route   GET /api/analytics/devices
 * @desc    Get device analytics
 * @access  Private
 */
router.get('/devices', getDeviceAnalytics);

// ===========================================
// PERFORMANCE ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/performance
 * @desc    Get performance metrics
 * @access  Private
 */
router.get('/performance', getPerformanceMetrics);

/**
 * @route   GET /api/analytics/tasks
 * @desc    Get task analytics
 * @access  Private
 */
router.get('/tasks', getTaskAnalytics);


/**
 * @route   GET /api/analytics/messages
 * @desc    Get message analytics
 * @access  Private
 */
router.get('/messages', getMessageAnalytics);

/**
 * @route   GET /api/analytics/satisfaction
 * @desc    Get customer satisfaction analytics
 * @access  Private
 */
router.get('/satisfaction', getSatisfactionAnalytics);

// ===========================================
// TIME-BASED ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/daily
 * @desc    Get daily analytics
 * @access  Private
 */
router.get('/daily', getDailyAnalytics);

/**
 * @route   GET /api/analytics/weekly
 * @desc    Get weekly analytics
 * @access  Private
 */
router.get('/weekly', getWeeklyAnalytics);

/**
 * @route   GET /api/analytics/monthly
 * @desc    Get monthly analytics
 * @access  Private
 */
router.get('/monthly', getMonthlyAnalytics);

/**
 * @route   GET /api/analytics/quarterly
 * @desc    Get quarterly analytics
 * @access  Private
 */
router.get('/quarterly', getQuarterlyAnalytics);

/**
 * @route   GET /api/analytics/yearly
 * @desc    Get yearly analytics
 * @access  Private
 */
router.get('/yearly', getYearlyAnalytics);

/**
 * @route   GET /api/analytics/custom
 * @desc    Get custom date range analytics
 * @access  Private
 */
router.get('/custom', getCustomRangeAnalytics);

// ===========================================
// COMPARATIVE ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/comparisons
 * @desc    Get comparative analytics
 * @access  Private
 */
router.get('/comparisons', getComparisons);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get trend analytics
 * @access  Private
 */
router.get('/trends', getTrends);

/**
 * @route   GET /api/analytics/forecasts
 * @desc    Get forecast analytics
 * @access  Private (Admin only)
 */
router.get('/forecasts', adminOnly, getForecasts);

// ===========================================
// GOAL ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/goals/progress
 * @desc    Get goal progress analytics
 * @access  Private
 */
router.get('/goals/progress', getGoalProgress);

/**
 * @route   GET /api/analytics/goals/achievement
 * @desc    Get goal achievement analytics
 * @access  Private
 */
router.get('/goals/achievement', getGoalAchievement);

// ===========================================
// TOP LISTS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/top/projects
 * @desc    Get top projects
 * @access  Private
 */
router.get('/top/projects', getTopProjects);

/**
 * @route   GET /api/analytics/top/clients
 * @desc    Get top clients
 * @access  Private
 */
router.get('/top/clients', getTopClients);

/**
 * @route   GET /api/analytics/top/performers
 * @desc    Get top performing team members
 * @access  Private
 */
router.get('/top/performers', getTopPerformers);

/**
 * @route   GET /api/analytics/top/services
 * @desc    Get most popular services
 * @access  Private
 */
router.get('/top/services', getPopularServices);

// ===========================================
// CONVERSION ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/conversions/rates
 * @desc    Get conversion rates
 * @access  Private
 */
router.get('/conversions/rates', getConversionRates);

/**
 * @route   GET /api/analytics/conversions/funnel
 * @desc    Get sales funnel analytics
 * @access  Private
 */
router.get('/conversions/funnel', getSalesFunnel);

// ===========================================
// FINANCIAL ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/financial/overview
 * @desc    Get financial overview
 * @access  Private
 */
router.get('/financial/overview', getFinancialOverview);

/**
 * @route   GET /api/analytics/financial/cashflow
 * @desc    Get cashflow analytics
 * @access  Private
 */
router.get('/financial/cashflow', getCashflowAnalytics);

/**
 * @route   GET /api/analytics/financial/invoices
 * @desc    Get invoice analytics
 * @access  Private
 */
router.get('/financial/invoices', getInvoiceAnalytics);

// ===========================================
// GROWTH ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/growth/metrics
 * @desc    Get growth metrics
 * @access  Private
 */
router.get('/growth/metrics', getGrowthMetrics);

/**
 * @route   GET /api/analytics/growth/retention
 * @desc    Get client retention analytics
 * @access  Private
 */
router.get('/growth/retention', getRetentionAnalytics);

// ===========================================
// REAL-TIME ANALYTICS ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/realtime
 * @desc    Get real-time analytics
 * @access  Private
 */
router.get('/realtime', getRealtimeAnalytics);

// ===========================================
// CUSTOM REPORTS ROUTES
// ===========================================

/**
 * @route   POST /api/analytics/reports/generate
 * @desc    Generate custom report
 * @access  Private
 */
router.post('/reports/generate', generateCustomReport);

/**
 * @route   GET /api/analytics/reports/saved
 * @desc    Get saved reports
 * @access  Private
 */
router.get('/reports/saved', getSavedReports);

/**
 * @route   POST /api/analytics/reports/save
 * @desc    Save current report
 * @access  Private
 */
router.post('/reports/save', saveReport);

/**
 * @route   DELETE /api/analytics/reports/:reportId
 * @desc    Delete saved report
 * @access  Private
 */
router.delete('/reports/:reportId', deleteReport);

// ===========================================
// EXPORT ROUTES
// ===========================================

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data
 * @access  Private
 */
router.get('/export', exportAnalyticsData);

// ===========================================
// CUSTOM METRICS ROUTES (Admin Only)
// ===========================================

/**
 * @route   GET /api/analytics/custom/metrics
 * @desc    Get custom metrics
 * @access  Private (Admin only)
 */
router.get('/custom/metrics', adminOnly, getCustomMetrics);

/**
 * @route   POST /api/analytics/custom/metrics
 * @desc    Create custom metric
 * @access  Private (Admin only)
 */
router.post('/custom/metrics', adminOnly, createCustomMetric);

/**
 * @route   PUT /api/analytics/custom/metrics/:metricId
 * @desc    Update custom metric
 * @access  Private (Admin only)
 */
router.put('/custom/metrics/:metricId', adminOnly, updateCustomMetric);

/**
 * @route   DELETE /api/analytics/custom/metrics/:metricId
 * @desc    Delete custom metric
 * @access  Private (Admin only)
 */
router.delete('/custom/metrics/:metricId', adminOnly, deleteCustomMetric);

// ===========================================
// ANALYTICS SETTINGS ROUTES (Admin Only)
// ===========================================

/**
 * @route   GET /api/analytics/settings
 * @desc    Get analytics settings
 * @access  Private (Admin only)
 */
router.get('/settings', adminOnly, getAnalyticsSettings);

/**
 * @route   PUT /api/analytics/settings
 * @desc    Update analytics settings
 * @access  Private (Admin only)
 */
router.put('/settings', adminOnly, updateAnalyticsSettings);

// ===========================================
// BULK OPERATIONS (Optional)
// ===========================================

/**
 * @route   POST /api/analytics/bulk/daily
 * @desc    Get bulk daily analytics
 * @access  Private
 */
// router.post('/bulk/daily', getBulkDailyAnalytics);

/**
 * @route   POST /api/analytics/bulk/compare
 * @desc    Bulk comparison analytics
 * @access  Private
 */
// router.post('/bulk/compare', getBulkComparisons);

// ===========================================
// EXPORT ROUTER
// ===========================================



module.exports = router;