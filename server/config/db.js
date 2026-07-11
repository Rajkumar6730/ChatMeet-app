const dns = require('dns');
const mongoose = require('mongoose');

// Force Google DNS to resolve Atlas SRV records (bypass local DNS issues)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('⚠️ Warning: Failed to set custom DNS servers:', err.message);
}

/**
 * MongoDB Connection Configuration
 * Handles connection setup and error management
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp', {
            maxPoolSize: 10,
            minPoolSize: 2, // Reduced to avoid aggressive pooling on free tier
            maxIdleTimeMS: 60000,
            connectTimeoutMS: 10000, // Reduced from 30s to 10s to match Vercel timeouts
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000, // Reduced from 30s to 5s to fail fast
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
            bufferCommands: false, // Don't buffer commands if connection drops
            family: 4 // Use IPv4, skip trying IPv6 first for slightly faster resolution
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.info('MongoDB reconnected successfully');
        });

        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        setTimeout(connectDB, 5000);
        throw error;
    }
};

module.exports = connectDB;