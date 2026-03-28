const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // ===========================================
  // BASIC CLIENT INFORMATION
  // ===========================================
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },

  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      'Please provide a valid phone number'
    ]
  },

  alternativePhone: {
    type: String,
    trim: true
  },

  // ===========================================
  // COMPANY INFORMATION
  // ===========================================
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },

  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },

  website: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please provide a valid URL'
    ]
  },

  industry: {
    type: String,
    trim: true
  },

  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10'
  },

  // ===========================================
  // ADDRESS INFORMATION
  // ===========================================
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zipCode: { type: String, default: '' }
  },

  // ===========================================
  // SOCIAL MEDIA LINKS
  // ===========================================
  socialLinks: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },

  // ===========================================
  // AVATAR & MEDIA
  // ===========================================
  avatar: {
    type: String,
   default: function () {
  const name = this.name || 'Client';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
}
  },

  companyLogo: {
    type: String,
    default: ''
  },

  // ===========================================
  // CLIENT STATUS
  // ===========================================
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Lead', 'Past Client'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Lead'
  },

  clientType: {
    type: String,
    enum: ['New', 'Regular', 'VIP', 'Enterprise'],
    default: 'New'
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },

  leadSource: {
    type: String,
    enum: ['Website', 'Referral', 'Social Media', 'Google', 'Direct', 'Other'],
    default: 'Website'
  },

  // ===========================================
  // PROJECTS & FINANCIALS
  // ===========================================
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],

  totalProjects: {
    type: Number,
    default: 0
  },

  activeProjects: {
    type: Number,
    default: 0
  },

  completedProjects: {
    type: Number,
    default: 0
  },

  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },

  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD'],
    default: 'USD'
  },

  paymentTerms: {
    type: String,
    enum: ['Net 15', 'Net 30', 'Net 60', 'Due on Receipt'],
    default: 'Net 30'
  },

  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },

  // ===========================================
  // INVOICES & PAYMENTS
  // ===========================================
  invoices: {
  type: [{
    invoiceNumber: String,
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    amount: Number,
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Draft'
    },
    dueDate: Date,
    paidAt: Date,
    paidAmount: Number,
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  default: []
},

  paymentHistory: [{
    invoiceId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    method: {
      type: String,
      enum: ['Bank Transfer', 'Credit Card', 'PayPal', 'Cash', 'Check']
    },
    transactionId: String,
    paidAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ===========================================
  // COMMUNICATION
  // ===========================================
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],

  unreadMessages: {
    type: Number,
    default: 0
  },

  lastContacted: {
    type: Date
  },

  preferredContactMethod: {
    type: String,
    enum: ['Email', 'Phone', 'WhatsApp', 'Video Call'],
    default: 'Email'
  },

  contactHistory: [{
    type: {
      type: String,
      enum: ['Call', 'Email', 'Meeting', 'Message']
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // ===========================================
  // NOTES & DOCUMENTS
  // ===========================================
  notes: [{
    title: String,
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],

  documents: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['Contract', 'Brief', 'Invoice', 'Other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // ===========================================
  // CONTRACTS & AGREEMENTS
  // ===========================================
  contracts: [{
    title: String,
    signedDate: Date,
    expiryDate: Date,
    fileUrl: String,
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Signed', 'Expired'],
      default: 'Draft'
    }
  }],

  // ===========================================
  // FEEDBACK & REVIEWS
  // ===========================================
  feedback: [{
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    submittedAt: Date
  }],

  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },

  // ===========================================
  // REFERRALS
  // ===========================================
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },

  referrals: [{
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    date: Date,
    status: {
      type: String,
      enum: ['Pending', 'Converted', 'Lost'],
      default: 'Pending'
    }
  }],

  // ===========================================
  // TAGS & CATEGORIES
  // ===========================================
  tags: [{
    type: String,
    trim: true
  }],

  categories: [{
    type: String,
    trim: true
  }],

  // ===========================================
  // SETTINGS & PREFERENCES
  // ===========================================
  notificationPreferences: {
    emailUpdates: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    invoiceAlerts: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },

  timezone: {
    type: String,
    default: 'UTC'
  },

  language: {
    type: String,
    enum: ['en', 'es', 'fr', 'de', 'hi'],
    default: 'en'
  },

  // ===========================================
  // METADATA
  // ===========================================
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Account manager assigned to this client'
  },

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

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: Date,

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
  },

  lastActivity: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES FOR PERFORMANCE
// ===========================================
clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ clientType: 1 });
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ 'address.country': 1 });
clientSchema.index({ tags: 1 });
clientSchema.index({ createdAt: -1 });

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================

// Get full address
clientSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.country) parts.push(this.address.country);
  if (this.address.zipCode) parts.push(this.address.zipCode);
  return parts.join(', ');
});

// Get client initials
clientSchema.virtual('initials').get(function() {
  return this.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

clientSchema.virtual('outstandingBalance').get(function() {

  const invoices = this.invoices || [];

  return invoices
    .filter(inv => inv.status === 'Sent' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

});
// Get total revenue
clientSchema.virtual('totalRevenue').get(function () {

  const payments = this.paymentHistory || [];

  return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

});

// Check if client is VIP
clientSchema.virtual('isVIP').get(function() {
  return this.clientType === 'VIP' || this.totalSpent > 50000;
});

// Get lifetime value
clientSchema.virtual('lifetimeValue').get(function() {
  return this.totalSpent;
});

// Get days since last contact
clientSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContacted) return null;
  const diffTime = Date.now() - this.lastContacted;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// ===========================================
// PRE-SAVE MIDDLEWARE
// ===========================================

// Update timestamps and calculate fields
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Update project counts
  if (this.projects) {
    this.totalProjects = this.projects.length;
  }

  // Calculate average rating
  if (this.feedback && this.feedback.length > 0) {
    const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
    this.averageRating = sum / this.feedback.length;
  }

  next();
});

// Auto-update lastActivity
clientSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

// ===========================================
// INSTANCE METHODS
// ===========================================

// Add project to client
clientSchema.methods.addProject = async function(projectId, budget) {
  if (!this.projects.includes(projectId)) {
    this.projects.push(projectId);
    this.totalProjects = this.projects.length;
    this.activeProjects++;
    
    if (budget) {
      this.totalSpent += budget;
    }

    await this.save();
  }
  return this;
};

// Add payment
clientSchema.methods.addPayment = async function(paymentData) {
  this.paymentHistory.push(paymentData);
  
  // Update invoice status
  const invoice = this.invoices.id(paymentData.invoiceId);
  if (invoice) {
    invoice.status = 'Paid';
    invoice.paidAt = paymentData.paidAt;
    invoice.paidAmount = paymentData.amount;
  }

  this.lastActivity = Date.now();
  await this.save();
  return this;
};

// Add contact history
clientSchema.methods.addContact = async function(contactData) {
  this.contactHistory.push(contactData);
  this.lastContacted = Date.now();
  await this.save();
  return this;
};

// Add note
clientSchema.methods.addNote = async function(noteData) {
  this.notes.push(noteData);
  await this.save();
  return this;
};

// Update client status
clientSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  await this.save();
  return this;
};

// Add feedback
clientSchema.methods.addFeedback = async function(feedbackData) {
  this.feedback.push(feedbackData);
  
  // Recalculate average
  if (this.feedback && this.feedback.length > 0) {
  const sum = this.feedback.reduce((acc, f) => acc + (f.rating || 0), 0);
  this.averageRating = sum / this.feedback.length;
}
  
  await this.save();
  return this;
};

// Send message to client
clientSchema.methods.sendMessage = async function(messageData) {
  const Message = mongoose.model('Message');
  const message = await Message.create({
    ...messageData,
    receiver: this._id
  });
  
  this.messages.push(message._id);
  this.unreadMessages++;
  await this.save();
  
  return message;
};

// Mark messages as read
clientSchema.methods.markMessagesAsRead = async function() {
  const Message = mongoose.model('Message');
  await Message.updateMany(
    { receiver: this._id, read: false },
    { read: true }
  );
  this.unreadMessages = 0;
  await this.save();
};

// ===========================================
// STATIC METHODS
// ===========================================

// Get clients by status
clientSchema.statics.getByStatus = async function(status) {
  return this.find({ status, isActive: true })
    .populate('projects', 'name status budget')
    .sort('-createdAt');
};

// Get clients by account manager
clientSchema.statics.getByAccountManager = async function(managerId) {
  return this.find({ assignedTo: managerId, isActive: true })
    .populate('projects', 'name status');
};

// Get recent clients
clientSchema.statics.getRecent = async function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.find({
    createdAt: { $gte: date },
    isActive: true
  }).sort('-createdAt');
};

// Get dashboard stats
clientSchema.statics.getDashboardStats = async function() {
  const total = await this.countDocuments({ isActive: true });
  const active = await this.countDocuments({ status: 'Active', isActive: true });
  const leads = await this.countDocuments({ status: 'Lead', isActive: true });
  const past = await this.countDocuments({ status: 'Past Client', isActive: true });

  const totalRevenue = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$totalSpent' } } }
  ]);

  const recent = await this.find({ isActive: true })
    .sort('-createdAt')
    .limit(5)
    .select('name company email status totalSpent createdAt');

  const topClients = await this.find({ isActive: true })
    .sort('-totalSpent')
    .limit(5)
    .select('name company totalSpent projects');

  return {
    total,
    active,
    leads,
    past,
    revenue: totalRevenue[0]?.total || 0,
    recent,
    topClients
  };
};

// Get client growth stats
clientSchema.statics.getGrowthStats = async function(year) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
        totalSpent: { $sum: '$totalSpent' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Search clients
clientSchema.statics.search = async function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { company: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  })
  .limit(20)
  .select('name email company avatar status totalSpent');
};

// ===========================================
// QUERY MIDDLEWARE
// ===========================================

// Populate references by default
clientSchema.pre(/^find/, function(next) {

  this.where({ isDeleted: { $ne: true } });

  if (!this.options.skipPopulate) {
    this.populate({
      path: 'projects',
      select: 'name status budget progress deadline'
    }).populate({
      path: 'assignedTo',
      select: 'name email avatar'
    }).populate({
      path: 'createdBy',
      select: 'name'
    });
  }

  next();
});

// ===========================================
// EXPORT MODEL
// ===========================================
const Client = mongoose.model('Client', clientSchema);

module.exports = Client;