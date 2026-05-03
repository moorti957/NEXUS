const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },

  username: {
    type: String,
    unique: true,
    sparse: true
  },

  mobileNumber: { type: String, default: '' },
  city: { type: String, default: '' },
  country: { type: String, default: '' },

  accountType: {
    type: String,
    enum: ['Freelancer','Viewer','Client'],
    default: 'Freelancer'
  },

  skills: [{ type:String }],

  experienceLevel: {
    type:String,
    enum:['Beginner','Intermediate','Expert'],
    default:'Beginner'
  },

  socialLinks:{
    instagram:{ type:String, default:'' },
    facebook:{ type:String, default:'' },
    linkedin:{ type:String, default:'' },
    portfolio:{ type:String, default:'' }
  },

  shortBio:{ type:String, default:'' },
  about:{ type:String, default:'' },

  languages:[{ type:String }],

  profilePhoto:{ type:String, default:'' },

  onboardingCompleted:{
    type:Boolean,
    default:false
  },

  preferences:{
    notifications:{
      type:Boolean,
      default:true
    },

    privacySettings:{
      type:String,
      enum:['public','private'],
      default:'public'
    }
  }

},{ timestamps:true });


// Indexes (important for freelancers query speed)
UserProfileSchema.index({ accountType:1 });
UserProfileSchema.index({ userId:1 });
UserProfileSchema.index({ accountType:1, userId:1 }); // added compound index


module.exports =
 mongoose.models.UserProfile ||
 mongoose.model('UserProfile', UserProfileSchema);