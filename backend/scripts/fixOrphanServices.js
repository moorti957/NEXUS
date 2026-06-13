// scripts/fixOrphanServices.js

require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../models/Service');

async function fixOrphanServices() {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Connected');

    // Find services without owner
    const orphanServices = await Service.find({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });

    console.log(`Found ${orphanServices.length} orphan services`);

    if (orphanServices.length > 0) {
      const result = await Service.deleteMany({
        $or: [
          { createdBy: { $exists: false } },
          { createdBy: null }
        ]
      });

      console.log(`${result.deletedCount} orphan services deleted`);
    } else {
      console.log('No orphan services found');
    }

    console.log('Process completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOrphanServices();