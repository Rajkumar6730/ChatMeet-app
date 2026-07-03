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
            minPoolSize: 5,
            maxIdleTimeMS: 60000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
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