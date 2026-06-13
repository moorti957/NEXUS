const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    // ✅ FIX 1: createdBy को required किया — यही ownership का आधार है
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Service owner is required'],
      index: true,                    // fast filter के लिए
    },

    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    longDescription: {
      type: String,
      trim: true,
      maxlength: [2000, 'Long description cannot exceed 2000 characters'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['development', 'design', 'marketing', 'branding', 'consulting'],
    },
    features: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Cannot have more than 20 features',
      },
    },
    technologies: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Cannot have more than 20 technologies',
      },
    },
    price: {
      type: String,
      trim: true,
      default: 'Contact for pricing',
    },
    timeline: {
      type: String,
      trim: true,
      default: 'To be discussed',
    },
    keywords: {
      type: [String],
      default: [],
    },
    gradient: {
      type: String,
      default: 'from-indigo-500 to-purple-600',
    },
    lightGradient: {
      type: String,
      default: 'from-indigo-500/10 to-purple-600/10',
    },
    iconType: {
      type: String,
      default: 'code',
      enum: [
        'code', 'design', 'chart', 'brand',
        'mobile', 'consulting', 'star', 'rocket', 'shield', 'globe',
      ],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ FIX 2: Compound indexes — dashboard और public दोनों queries fast होंगी
ServiceSchema.index({ createdBy: 1, status: 1 });   // dashboard filter
ServiceSchema.index({ status: 1, category: 1 });    // public filter
ServiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Service', ServiceSchema);