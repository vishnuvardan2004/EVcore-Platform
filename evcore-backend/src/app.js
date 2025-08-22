const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const database = require('./config/database');
const logger = require('./utils/logger');

// Import middleware
const { 
  generalRateLimit,
  securityHeaders,
  dataSanitization,
  compressionMiddleware 
} = require('./middleware/securityEnhanced');
const requestLogger = require('./middleware/requestLogger');
const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const databaseMgmtRoutes = require('./routes/databaseMgmt');
// const pilotsRoutes = require('./routes/pilots');
// const driverInductionRoutes = require('./routes/driverInduction');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Trust proxy (for rate limiting and IP detection)
    this.app.set('trust proxy', 1);

    // ✅ CORS MUST be the very first middleware
    this.app.use((req, res, next) => {
      if (config.isDevelopment) {
        console.log('🌐 CORS Request:', req.method, req.url, 'Origin:', req.get('Origin'));
      }
      next();
    });

    // Configure CORS with comprehensive options
    this.app.use(cors(config.cors));

    // Handle preflight OPTIONS requests explicitly
    this.app.options('*', (req, res) => {
      if (config.isDevelopment) {
        console.log('✈️ Preflight request for:', req.url);
      }
      res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      res.sendStatus(204);
    });

    // Security middleware (AFTER CORS)
    this.app.use(securityHeaders);
    this.app.use(compressionMiddleware);

    // Rate limiting
    this.app.use(generalRateLimit);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Cookie parser middleware (for secure httpOnly cookies)
    this.app.use(cookieParser());

    // Data sanitization
    this.app.use(dataSanitization);

    // Request logging (only in development)
    if (config.isDevelopment) {
      this.app.use(requestLogger);
    }
  }

  setupRoutes() {
    // Health check route
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'EVcore Backend API is running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/employees', employeeRoutes);
    this.app.use('/api/database-mgmt', databaseMgmtRoutes);
    // this.app.use('/api/pilots', pilotsRoutes);
    // this.app.use('/api/driver-induction', driverInductionRoutes);

    // Test pilot endpoints with direct database service calls
    this.app.get('/api/pilots', async (req, res) => {
      try {
        const DatabaseService = require('./services/databaseService');
        const databaseService = new DatabaseService();
        
        const pilots = await databaseService.findAll('Pilot', { isActive: true });
        
        res.status(200).json({
          success: true,
          message: 'Pilots retrieved successfully',
          data: pilots
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error fetching pilots',
          error: error.message
        });
      }
    });

    this.app.post('/api/pilots', async (req, res) => {
      try {
        const DatabaseService = require('./services/databaseService');
        const databaseService = new DatabaseService();
        
        const pilotData = {
          ...req.body,
          createdBy: req.user?.id || 'system',
          updatedBy: req.user?.id || 'system'
        };
        
        const pilot = await databaseService.createDocument('Pilot', pilotData);
        
        res.status(201).json({
          success: true,
          message: 'Pilot created successfully',
          data: pilot
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error creating pilot',
          error: error.message
        });
      }
    });

    this.app.get('/api/driver-induction/pilots', async (req, res) => {
      try {
        const DatabaseService = require('./services/databaseService');
        const databaseService = new DatabaseService();
        
        const {
          page = 1,
          limit = 20,
          search = ''
        } = req.query;

        const query = { isActive: true };
        
        if (search) {
          query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { pilotId: { $regex: search, $options: 'i' } }
          ];
        }

        const result = await databaseService.getPaginatedResults(
          'Pilot',
          query,
          {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
        );

        res.status(200).json({
          success: true,
          message: 'Driver induction pilots retrieved successfully',
          data: {
            pilots: result.data,
            total: result.pagination.total,
            page: result.pagination.page,
            limit: result.pagination.limit,
            totalPages: result.pagination.totalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error fetching driver induction pilots',
          error: error.message
        });
      }
    });

    // File upload placeholder
    this.app.post('/api/upload', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'File upload module - Coming soon',
        data: { fileUrl: '/uploads/placeholder.jpg' }
      });
    });
  }

  setupErrorHandling() {
    // Handle undefined routes
    this.app.all('*', notFound);

    // Global error handler
    this.app.use(globalErrorHandler);
  }

  async start() {
    try {
      // Connect to database
      await database.connect();

      // Start server
      const server = this.app.listen(config.port, () => {
        logger.info(`EVcore Backend Server running on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        
        // Handle CORS origins logging (could be array or function)
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
          'http://localhost:5173', 
          'http://localhost:8080', 
          'http://localhost:8081', 
          'http://localhost:8083'
        ];
        logger.info(`CORS Origins: ${allowedOrigins.join(', ')}`);
      });

      // Graceful shutdown
      const gracefulShutdown = (signal) => {
        logger.info(`${signal} received, shutting down gracefully`);
        server.close(async () => {
          await database.disconnect();
          logger.info('Server closed');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      return server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
