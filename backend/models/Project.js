const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // ===========================================
  // BASIC PROJECT INFORMATION
  // ===========================================
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [3, 'Project name must be at least 3 characters'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },

  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },

  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },

  // ===========================================
  // PROJECT CATEGORY & TYPE
  // ===========================================
  category: {
    type: String,
    required: [true, 'Project category is required'],
    enum: {
      values: [
        'Web Development',
        'Mobile App',
        'UI/UX Design',
        'Brand Identity',
        'Digital Marketing',
        'E-commerce',
        'Consulting',
        'Custom Software'
      ],
      message: '{VALUE} is not a valid category'
    }
  },

  projectType: {
    type: String,
    enum: ['fixed', 'hourly', 'retainer'],
    default: 'fixed'
  },

  // ===========================================
  // PROJECT STATUS & PROGRESS
  // ===========================================
  status: {
    type: String,
    enum: {
      values: [
        'Planning',
        'In Progress',
        'Review',
        'Completed',
        'On Hold',
        'Cancelled'
      ],
      message: '{VALUE} is not a valid status'
    },
    default: 'Planning'
  },

  progress: {
    type: Number,
    min: [0, 'Progress cannot be less than 0'],
    max: [100, 'Progress cannot exceed 100'],
    default: 0
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },

  // ===========================================
  // DATES & TIMELINE
  // ===========================================
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },

  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Deadline must be after start date'
    }
  },

  completedAt: {
    type: Date
  },

  estimatedHours: {
    type: Number,
    min: 0,
    default: 0
  },

  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },

  // ===========================================
  // FINANCIAL INFORMATION
  // ===========================================
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget cannot be negative']
  },

  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD'],
    default: 'USD'
  },

  totalPaid: {
    type: Number,
    min: 0,
    default: 0
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
    default: 'Pending'
  },

  // ===========================================
  // CLIENT INFORMATION
  // ===========================================
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },

  clientName: {
    type: String,
    required: true
  },

  clientEmail: {
    type: String,
    required: true
  },

  clientCompany: {
    type: String,
    default: ''
  },

  // ===========================================
  // TEAM ASSIGNMENTS
  // ===========================================
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project manager is required']
  },

  teamMembers: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['Lead', 'Developer', 'Designer', 'Strategist', 'Tester']
      },
      assignedAt: {
        type: Date,
        default: Date.now
      },
      hoursAllocated: {
        type: Number,
        default: 0
      }
    }],
    default: []
  },

  // NEW: Simple array of user IDs for fast filtering (freelancer projects)
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // ===========================================
  // TECHNICAL DETAILS
  // ===========================================
  technologies: [{
    type: String,
    trim: true
  }],

  features: [{
    name: String,
    description: String,
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending'
    }
  }],

  // ===========================================
  // MEDIA & LINKS
  // ===========================================
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  thumbnail: {
    type: String,
    default: function() {
      const thumbnails = {
        'Web Development': '💻',
        'Mobile App': '📱',
        'UI/UX Design': '🎨',
        'Brand Identity': '✨',
        'Digital Marketing': '📈',
        'E-commerce': '🛒',
        'Consulting': '💡',
        'Custom Software': '⚙️'
      };
      return thumbnails[this.category] || '📁';
    }
  },

  githubLink: {
    type: String,
    match: [
      /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/,
      'Please provide a valid GitHub URL'
    ]
  },

  liveLink: {
    type: String,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid URL'
    ]
  },

  demoLink: String,

  // ===========================================
  // DOCUMENTS & FILES
  // ===========================================
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ===========================================
  // TASKS & MILESTONES
  // ===========================================
  milestones: {
    type: [{
      title: String,
      description: String,
      dueDate: Date,
      completedAt: Date,
      status: {
        type: String,
        enum: ['Pending','In Progress','Completed'],
        default: 'Pending'
      }
    }],
    default: []
  },

  tasks: {
    type: [{
      title: String,
      description: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['Todo','In Progress','Review','Done'],
        default: 'Todo'
      }
    }],
    default: []
  },

  // ===========================================
  // COMMUNICATION
  // ===========================================
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],

  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ===========================================
  // FEEDBACK & REVIEWS
  // ===========================================
  clientFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    submittedAt: Date
  },

  internalNotes: {
    type: String,
    trim: true
  },

  // ===========================================
  // ANALYTICS & STATS
  // ===========================================
  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  },

  featured: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // INVOICES
  // ===========================================
  invoices: [{
    invoiceNumber: String,
    amount: Number,
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Overdue'],
      default: 'Draft'
    },
    dueDate: Date,
    paidAt: Date,
    url: String
  }],

  // ===========================================
  // TIMELINE
  // ===========================================
  timeline: [{
    event: String,
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ===========================================
  // METADATA
  // ===========================================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isArchived: {
    type: Boolean,
    default: false
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
projectSchema.index({ name: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ featured: 1 });
projectSchema.index({ 'teamMembers.user': 1 });
projectSchema.index({ members: 1 });        // NEW: index for members array
projectSchema.index({ createdBy: 1 });     // NEW: index for createdBy

// ===========================================
// VIRTUAL PROPERTIES (unchanged)
// ===========================================
projectSchema.virtual('duration').get(function() {
  const start = new Date(this.startDate);
  const end = this.completedAt || new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

projectSchema.virtual('isOverdue').get(function() {
  return this.status !== 'Completed' && new Date() > this.deadline;
});

projectSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'Completed') return 0;
  const diffTime = this.deadline - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

projectSchema.virtual('teamCount').get(function() {
  return (this.teamMembers || []).length;
});

projectSchema.virtual('completionPercentage').get(function() {
  if (this.status === 'Completed') return 100;
  if (this.status === 'Planning') return 10;
  if (this.status === 'In Progress') return 50;
  if (this.status === 'Review') return 80;
  return this.progress;
});

projectSchema.virtual('remainingBudget').get(function() {
  return this.budget - this.totalPaid;
});

projectSchema.virtual('milestoneProgress').get(function() {
  const milestones = this.milestones || [];
  if (!milestones.length) return 0;
  const completed = milestones.filter(m => m.status === 'Completed').length;
  return Math.round((completed / milestones.length) * 100);
});

projectSchema.virtual('taskCompletion').get(function() {
  const tasks = this.tasks || [];
  if (!tasks.length) return 0;
  const completed = tasks.filter(t => t.status === 'Done').length;
  return Math.round((completed / tasks.length) * 100);
});

// ===========================================
// PRE-SAVE MIDDLEWARE (UPDATED)
// ===========================================
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Auto-set completedAt when status becomes Completed
  if (this.status === 'Completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }

  // Update progress based on milestones/tasks if not manually set
  if (!this.isModified('progress')) {
    const milestoneProgress = this.milestoneProgress;
    const taskProgress = this.taskCompletion;
    this.progress = Math.round((milestoneProgress + taskProgress) / 2);
  }

  // NEW: Ensure the creator is included in the members array for access control
  if (this.createdBy && !this.members.includes(this.createdBy)) {
    this.members.push(this.createdBy);
  }

  next();
});

// Auto-populate client name and email (unchanged)
projectSchema.pre('save', async function(next) {
  if (this.isModified('client')) {
    const Client = mongoose.model('Client');
    const client = await Client.findById(this.client);
    if (client) {
      this.clientName = client.name;
      this.clientEmail = client.email;
      this.clientCompany = client.company || '';
    }
  }
  next();
});

// ===========================================
// INSTANCE METHODS (UPDATED)
// ===========================================
projectSchema.methods.updateProgress = async function() {
  if ((this.milestones || []).length > 0) {
    const completed = this.milestones.filter(m => m.status === 'Completed').length;
    this.progress = Math.round((completed / this.milestones.length) * 100);
  }
  if (this.progress === 100) {
    this.status = 'Completed';
    this.completedAt = Date.now();
  }
  return this.save();
};

// UPDATED: Add team member also to `members` array
projectSchema.methods.addTeamMember = async function(userId, role, hours) {
  // Add to teamMembers (detailed)
  this.teamMembers.push({
    user: userId,
    role,
    hoursAllocated: hours || 0,
    assignedAt: Date.now()
  });
  // Add to simple members array if not already present
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  this.timeline.push({
    event: 'Team Member Added',
    description: `New team member added with role: ${role}`,
    createdAt: Date.now()
  });
  return this.save();
};

// UPDATED: Remove team member from both arrays
projectSchema.methods.removeTeamMember = async function(userId) {
  this.teamMembers = this.teamMembers.filter(m => m.user.toString() !== userId.toString());
  this.members = this.members.filter(id => id.toString() !== userId.toString());
  this.timeline.push({
    event: 'Team Member Removed',
    description: 'Team member removed from project',
    createdAt: Date.now()
  });
  return this.save();
};

// Add milestone (unchanged)
projectSchema.methods.addMilestone = async function(milestoneData) {
  this.milestones.push(milestoneData);
  this.timeline.push({
    event: 'Milestone Added',
    description: `New milestone: ${milestoneData.title}`,
    createdAt: Date.now()
  });
  return this.save();
};

// Complete milestone (unchanged)
projectSchema.methods.completeMilestone = async function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.status = 'Completed';
    milestone.completedAt = Date.now();
    this.timeline.push({
      event: 'Milestone Completed',
      description: `Milestone completed: ${milestone.title}`,
      createdAt: Date.now()
    });
  }
  await this.updateProgress();
  return this.save();
};

// Add payment (unchanged)
projectSchema.methods.addPayment = async function(amount) {
  this.totalPaid += amount;
  if (this.totalPaid >= this.budget) {
    this.paymentStatus = 'Paid';
  } else if (this.totalPaid > 0) {
    this.paymentStatus = 'Partial';
  }
  this.timeline.push({
    event: 'Payment Received',
    description: `Payment of ${this.currency} ${amount} received`,
    createdAt: Date.now()
  });
  return this.save();
};

// Add timeline event (unchanged)
projectSchema.methods.addTimelineEvent = async function(event, description) {
  this.timeline.push({
    event,
    description,
    createdBy: this.projectManager,
    createdAt: Date.now()
  });
  return this.save();
};

// ===========================================
// STATIC METHODS (UPDATED for freelancer filtering)
// ===========================================
projectSchema.statics.getByStatus = async function(status) {
  return this.find({ status })
    .populate('client', 'name company')
    .populate('projectManager', 'name email')
    .sort('-createdAt');
};

projectSchema.statics.getByClient = async function(clientId) {
  return this.find({ client: clientId })
    .populate('projectManager', 'name')
    .sort('-createdAt');
};

// UPDATED: Get projects where a user is either creator or member
projectSchema.statics.getByTeamMember = async function(userId) {
  return this.find({
    $or: [
      { createdBy: userId },
      { members: userId }
    ]
  })
  .populate('client', 'name')
  .populate('projectManager', 'name')
  .populate('createdBy', 'name email');
};

// Dashboard stats (unchanged – but can be filtered later)
projectSchema.statics.getDashboardStats = async function(filter = {}) {
  const total = await this.countDocuments({ isActive: true, ...filter });
  const active = await this.countDocuments({ status: 'In Progress', ...filter });
  const completed = await this.countDocuments({ status: 'Completed', ...filter });
  const planning = await this.countDocuments({ status: 'Planning', ...filter });
  const review = await this.countDocuments({ status: 'Review', ...filter });
  const onHold = await this.countDocuments({ status: 'On Hold', ...filter });
  const overdue = await this.countDocuments({ 
    status: { $ne: 'Completed' },
    deadline: { $lt: new Date() },
    ...filter
  });

  const earnings = await this.aggregate([
    { $match: { status: 'Completed', ...filter } },
    { $group: { 
      _id: null, 
      total: { $sum: '$budget' },
      avg: { $avg: '$budget' }
    }}
  ]);

  const categories = await this.aggregate([
    { $match: filter },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  return {
    total,
    active,
    completed,
    planning,
    review,
    onHold,
    overdue,
    earnings: earnings[0]?.total || 0,
    averageBudget: earnings[0]?.avg || 0,
    categories
  };
};

// Monthly stats (unchanged – can be filtered)
projectSchema.statics.getMonthlyStats = async function(year, filter = {}) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        },
        ...filter
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        revenue: { $sum: '$budget' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Get upcoming deadlines (unchanged – can be filtered)
projectSchema.statics.getUpcomingDeadlines = async function(days = 7, filter = {}) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    status: { $ne: 'Completed' },
    deadline: { $gte: new Date(), $lte: futureDate },
    ...filter
  })
  .populate('client', 'name company')
  .populate('projectManager', 'name')
  .sort('deadline');
};

// ===========================================
// QUERY MIDDLEWARE (unchanged)
// ===========================================
projectSchema.pre(/^find/, function(next) {
  next();
});

// ===========================================
// EXPORT MODEL
// ===========================================
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;