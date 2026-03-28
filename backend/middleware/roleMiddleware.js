const User = require('../models/User');

// ===========================================
// ROLE DEFINITIONS & PERMISSIONS
// ===========================================

/**
 * Permission definitions for different roles
 * This defines what each role can access
 */
const rolePermissions = {
  admin: {
    // Full system access
    dashboard: ['view', 'edit', 'delete', 'export'],
    projects: ['create', 'read', 'update', 'delete', 'assign', 'archive', 'export'],
    clients: ['create', 'read', 'update', 'delete', 'export', 'import'],
    team: ['create', 'read', 'update', 'delete', 'manage_roles', 'invite', 'fire'],
    messages: ['create', 'read', 'update', 'delete', 'archive'],
    analytics: ['view', 'export', 'manage_reports', 'forecast'],
    settings: ['view', 'update', 'configure'],
    billing: ['view', 'create', 'update', 'delete', 'refund'],
    roles: ['create', 'read', 'update', 'delete'],
    permissions: ['grant', 'revoke'],
    system: ['manage', 'configure', 'logs']
  },

  manager: {
    // Team management access
    dashboard: ['view', 'export'],
    projects: ['create', 'read', 'update', 'assign', 'archive'],
    clients: ['create', 'read', 'update', 'export'],
    team: ['read', 'update', 'manage_roles', 'invite'],
    messages: ['create', 'read', 'update', 'archive'],
    analytics: ['view', 'export', 'manage_reports'],
    settings: ['view'],
    billing: ['view'],
    permissions: []
  },

  moderator: {
    // Content moderation access
    dashboard: ['view'],
    projects: ['read', 'update'],
    clients: ['read', 'update'],
    team: ['read'],
    messages: ['read', 'update', 'archive'],
    analytics: ['view'],
    settings: [],
    billing: [],
    permissions: []
  },

  user: {
    // Basic user access
    dashboard: ['view'],
    projects: ['read', 'update_assigned'],
    clients: ['read_assigned'],
    team: ['read_basic'],
    messages: ['create', 'read_own', 'update_own'],
    analytics: ['view_personal'],
    settings: ['view_personal'],
    billing: ['view_own'],
    permissions: []
  },

  client: {
    // Client portal access
    dashboard: ['view_portal'],
    projects: ['read_own', 'view_progress'],
    messages: ['create', 'read_own'],
    billing: ['view_own', 'pay'],
    analytics: ['view_own_stats'],
    permissions: []
  },

  guest: {
    // Public access
    dashboard: [],
    projects: ['read_public'],
    messages: [],
    analytics: [],
    permissions: []
  }
};

// ===========================================
// ROLE CHECK MIDDLEWARE
// ===========================================

/**
 * Check if user has required role
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const hasRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}`,
          code: 'INSUFFICIENT_ROLE'
        });
      }

      next();
    } catch (error) {
      console.error('Role Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during role check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// PERMISSION CHECK MIDDLEWARE
// ===========================================

/**
 * Check if user has specific permission
 * @param {string} resource - Resource name (projects, clients, etc.)
 * @param {string} action - Action (create, read, update, delete)
 * @returns {Function} Middleware function
 */
const hasPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userRole = req.user.role;
      const permissions = rolePermissions[userRole] || rolePermissions.guest;

      // Check if resource exists and user has permission
      if (!permissions[resource]) {
        return res.status(403).json({
          success: false,
          message: `No permissions defined for resource: ${resource}`,
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Admin has all permissions
      if (userRole === 'admin') {
        return next();
      }

      // Check specific action
      if (!permissions[resource].includes(action) && 
          !permissions[resource].includes('*')) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${action} on ${resource}`,
          code: 'PERMISSION_DENIED',
          required: { resource, action }
        });
      }

      next();
    } catch (error) {
      console.error('Permission Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during permission check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// RESOURCE OWNERSHIP MIDDLEWARE
// ===========================================

/**
 * Check if user owns the resource or has admin role
 * @param {Function} getResourceUserId - Function to extract user ID from resource
 * @returns {Function} Middleware function
 */
const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource owner ID
      const resourceUserId = await getResourceUserId(req);

      // Check if user owns the resource
      if (req.user._id.toString() !== resourceUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not own this resource',
          code: 'NOT_OWNER'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// TEAM ACCESS MIDDLEWARE
// ===========================================

/**
 * Check if user is part of the same team
 * @param {Function} getTeamId - Function to extract team ID from resource
 * @returns {Function} Middleware function
 */
const isSameTeam = (getTeamId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin can access any team
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource team ID
      const resourceTeamId = await getTeamId(req);

      // Check if user is in the same team
      if (req.user.teamId?.toString() !== resourceTeamId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not in the same team',
          code: 'DIFFERENT_TEAM'
        });
      }

      next();
    } catch (error) {
      console.error('Team Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during team check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// PROJECT ACCESS MIDDLEWARE
// ===========================================

/**
 * Check if user has access to project
 * @param {Object} options - Access options
 * @returns {Function} Middleware function
 */
const hasProjectAccess = (options = {}) => {
  const { requireManager = false, requireTeamMember = false } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const Project = require('../models/Project');
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Admin has full access
      if (req.user.role === 'admin') {
        req.project = project;
        return next();
      }

      // Check if user is project manager
      const isManager = project.projectManager?.toString() === req.user._id.toString();

      // Check if user is team member
      const isTeamMember = project.teamMembers?.some(
        member => member.user?.toString() === req.user._id.toString()
      );

      if (requireManager && !isManager) {
        return res.status(403).json({
          success: false,
          message: 'Project manager access required',
          code: 'MANAGER_REQUIRED'
        });
      }

      if (requireTeamMember && !isTeamMember && !isManager) {
        return res.status(403).json({
          success: false,
          message: 'Team member access required',
          code: 'TEAM_MEMBER_REQUIRED'
        });
      }

      // Attach project to request for later use
      req.project = project;
      next();
    } catch (error) {
      console.error('Project Access Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during project access check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// CLIENT ACCESS MIDDLEWARE
// ===========================================

/**
 * Check if user has access to client
 * @returns {Function} Middleware function
 */
const hasClientAccess = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const Client = require('../models/Client');
      const client = await Client.findById(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      // Admin has full access
      if (req.user.role === 'admin') {
        req.client = client;
        return next();
      }

      // Check if user is assigned to client
      const isAssigned = client.assignedTo?.toString() === req.user._id.toString();

      // Check if user has projects with this client
      const Project = require('../models/Project');
      const hasProject = await Project.exists({
        client: client._id,
        'teamMembers.user': req.user._id
      });

      if (!isAssigned && !hasProject) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this client',
          code: 'CLIENT_ACCESS_DENIED'
        });
      }

      req.client = client;
      next();
    } catch (error) {
      console.error('Client Access Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during client access check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// HIERARCHY-BASED ACCESS
// ===========================================

/**
 * Check if user is manager of the target user
 * @returns {Function} Middleware function
 */
const isManagerOf = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin can manage anyone
      if (req.user.role === 'admin') {
        return next();
      }

      const targetUser = await User.findById(req.params.userId || req.params.id);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if current user is manager of target user
      const isManager = targetUser.managerId?.toString() === req.user._id.toString();

      if (!isManager) {
        return res.status(403).json({
          success: false,
          message: 'You are not the manager of this user',
          code: 'NOT_MANAGER'
        });
      }

      next();
    } catch (error) {
      console.error('Manager Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during manager check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// DEPARTMENT ACCESS MIDDLEWARE
// ===========================================

/**
 * Check if users are in same department
 * @returns {Function} Middleware function
 */
const sameDepartment = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin can access any department
      if (req.user.role === 'admin') {
        return next();
      }

      const targetUser = await User.findById(req.params.userId || req.params.id);

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if same department
      if (req.user.department !== targetUser.department) {
        return res.status(403).json({
          success: false,
          message: 'Users are in different departments',
          code: 'DIFFERENT_DEPARTMENT'
        });
      }

      next();
    } catch (error) {
      console.error('Department Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during department check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// FEATURE ACCESS MIDDLEWARE
// ===========================================

/**
 * Check if feature is enabled for user's role
 * @param {string} feature - Feature name
 * @returns {Function} Middleware function
 */
const hasFeatureAccess = (feature) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Define feature access by role
      const featureAccess = {
        advanced_analytics: ['admin', 'manager'],
        team_management: ['admin', 'manager'],
        billing: ['admin'],
        api_access: ['admin', 'manager', 'developer'],
        export_data: ['admin', 'manager', 'moderator'],
        invite_users: ['admin', 'manager']
      };

      const allowedRoles = featureAccess[feature] || [];

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Feature '${feature}' not available for your role`,
          code: 'FEATURE_UNAVAILABLE'
        });
      }

      next();
    } catch (error) {
      console.error('Feature Access Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during feature access check',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ===========================================
// RATE LIMIT BY ROLE MIDDLEWARE
// ===========================================

/**
 * Apply different rate limits based on user role
 * @param {Object} limits - Rate limits per role
 * @returns {Function} Middleware function
 */
const rateLimitByRole = (limits) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role || 'guest';
      const limit = limits[userRole] || limits.default || 100;

      // Add rate limit info to headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Role', userRole);

      // You can implement actual rate limiting here
      // This could use express-rate-limit with a custom key generator

      next();
    } catch (error) {
      console.error('Rate Limit Error:', error);
      next();
    }
  };
};

// ===========================================
// AUDIT LOG MIDDLEWARE
// ===========================================

/**
 * Log access attempts for audit purposes
 * @param {string} action - Action being performed
 * @returns {Function} Middleware function
 */
const auditLog = (action) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to capture response
    res.json = function(data) {
      // Log after response is sent
      const logEntry = {
        timestamp: new Date().toISOString(),
        user: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        success: data?.success
      };

      // Save to database or file (implement your logging)
      console.log('Audit Log:', logEntry);

      // Call original json method
      originalJson.call(this, data);
    };

    next();
  };
};

// ===========================================
// EXPORT MIDDLEWARE
// ===========================================
module.exports = {
  // Role definitions
  rolePermissions,
  
  // Role checks
  hasRole,
  hasPermission,
  
  // Ownership checks
  isOwnerOrAdmin,
  
  // Team access
  isSameTeam,
  
  // Resource access
  hasProjectAccess,
  hasClientAccess,
  
  // Hierarchy access
  isManagerOf,
  sameDepartment,
  
  // Feature access
  hasFeatureAccess,
  
  // Rate limiting
  rateLimitByRole,
  
  // Audit logging
  auditLog,
  
  // Predefined role checks
  isAdmin: hasRole('admin'),
  isManager: hasRole('admin', 'manager'),
  isModerator: hasRole('admin', 'manager', 'moderator'),
  isUser: hasRole('admin', 'manager', 'moderator', 'user'),
  
  // Permission shortcuts
  canManageProjects: hasPermission('projects', '*'),
  canViewProjects: hasPermission('projects', 'read'),
  canCreateProjects: hasPermission('projects', 'create'),
  canUpdateProjects: hasPermission('projects', 'update'),
  canDeleteProjects: hasPermission('projects', 'delete'),
  
  canManageClients: hasPermission('clients', '*'),
  canViewClients: hasPermission('clients', 'read'),
  canCreateClients: hasPermission('clients', 'create'),
  
  canManageTeam: hasPermission('team', '*'),
  canViewTeam: hasPermission('team', 'read'),
  
  canManageMessages: hasPermission('messages', '*'),
  canViewMessages: hasPermission('messages', 'read'),
  
  canViewAnalytics: hasPermission('analytics', 'view'),
  canExportAnalytics: hasPermission('analytics', 'export'),
  
  canManageSettings: hasPermission('settings', '*'),
  canViewSettings: hasPermission('settings', 'view')
};