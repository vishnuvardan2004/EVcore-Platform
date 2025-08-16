const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoUri = config.isTest ? config.mongoTestUri : config.mongoUri;
      
      this.connection = await mongoose.connect(mongoUri);

      logger.info(`MongoDB connected: ${this.connection.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      }
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }

  async dropDatabase() {
    try {
      if (config.isTest && this.connection) {
        await mongoose.connection.db.dropDatabase();
        logger.info('Test database dropped');
      }
    } catch (error) {
      logger.error('Error dropping test database:', error);
    }
  }
}

module.exports = new Database();
