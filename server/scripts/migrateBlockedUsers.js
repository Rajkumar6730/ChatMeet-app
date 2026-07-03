// server/scripts/migrateBlockedUsers.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model correctly
const User = require('../models/User');
const connectDB = require('../config/db');

const migrateBlockedUsers = async () => {
    try {
        // Connect to database
        await connectDB();
        
        console.log('Starting migration...');

        // Update all users to have blockedUsers array if missing
        const result = await User.updateMany(
            { blockedUsers: { $exists: false } },
            { $set: { blockedUsers: [] } }
        );
        
        console.log(`✅ Migration complete. Updated ${result.modifiedCount} users.`);
        
        // Also add blockedBy field if missing
        const result2 = await User.updateMany(
            { blockedBy: { $exists: false } },
            { $set: { blockedBy: [] } }
        );
        
        console.log(`✅ Added blockedBy field to ${result2.modifiedCount} users.`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

// Run the migration
migrateBlockedUsers();