const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const database = require('./config/database');
const DatabaseService = require('./services/databaseService');
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
const pilotsRoutes = require('./routes/pilots');
const driverInductionRoutes = require('./routes/driverInduction');
const userAccountRoutes = require('./routes/userAccounts');

// New 6 Core Platform Module Routes
const vehicleDeploymentRoutes = require('./routes/vehicleDeployment');
const smartBookingsRoutes = require('./routes/smartBookings');
const dataHubRoutes = require('./routes/dataHub');
const driverOnboardingRoutes = require('./routes/driverOnboarding');
const tripAnalyticsRoutes = require('./routes/tripAnalytics');
const energyManagementRoutes = require('./routes/energyManagement');
const auditLogsRoutes = require('./routes/auditLogs');

class App {
  constructor() {
    this.app = express();
    this.databaseService = DatabaseService.getInstance();
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

    // 🚨 DEVELOPMENT ONLY: Debug endpoint to get user credentials
    if (config.isDevelopment) {
      this.app.get('/debug/user-credentials/:email', async (req, res) => {
        try {
          const User = require('./models/User');
          const user = await User.findOne({ email: req.params.email });
          
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found with that email'
            });
          }

          const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Welcome123!';

          res.status(200).json({
            success: true,
            message: '🔐 User Credentials (DEVELOPMENT ONLY)',
            data: {
              evzipId: user.evzipId,
              username: user.username,
              email: user.email,
              role: user.role,
              defaultPassword: defaultPassword,
              isTemporaryPassword: user.isTemporaryPassword,
              mustChangePassword: user.mustChangePassword,
              loginInstructions: {
                step1: `Use email "${user.email}" or username "${user.username}" with password "${defaultPassword}"`,
                step2: 'System will force you to change password on first login',
                step3: 'After password change, you can access the system normally'
              }
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Error retrieving user credentials',
            error: error.message
          });
        }
      });

      // 🚨 DEVELOPMENT ONLY: List all users in database
      this.app.get('/debug/all-users', async (req, res) => {
        try {
          const User = require('./models/User');
          const users = await User.find({}, 'email username evzipId role isTemporaryPassword mustChangePassword createdAt').limit(10);
          
          res.status(200).json({
            success: true,
            message: '📋 All Users in Database (DEVELOPMENT ONLY)',
            data: {
              totalUsers: users.length,
              users: users.map(user => ({
                email: user.email,
                username: user.username,
                evzipId: user.evzipId,
                role: user.role,
                isTemporaryPassword: user.isTemporaryPassword,
                mustChangePassword: user.mustChangePassword,
                createdAt: user.createdAt
              }))
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Error retrieving users',
            error: error.message
          });
        }
      });

      // 🚨 DEVELOPMENT ONLY: Test password hash
      this.app.post('/debug/test-password', async (req, res) => {
        try {
          const { email, password } = req.body;
          const User = require('./models/User');
          const user = await User.findOne({ email }).select('+password');
          
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }

          const isMatch = await user.correctPassword(password, user.password);
          
          res.status(200).json({
            success: true,
            message: '🔐 Password Test (DEVELOPMENT ONLY)',
            data: {
              userEmail: user.email,
              testPassword: password,
              passwordMatches: isMatch,
              userRole: user.role,
              isTemporaryPassword: user.isTemporaryPassword
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Error testing password',
            error: error.message
          });
        }
      });
    }

    // API routes
    this.app.use('/api/auth', authRoutes);
    
    // Test route to verify backend is running current code
    const testRoutes = require('./routes/test');
    this.app.use('/api/test', testRoutes);
    
    this.app.use('/api/employees', employeeRoutes);
    this.app.use('/api/database-mgmt', databaseMgmtRoutes);
    this.app.use('/api/pilots', pilotsRoutes);
    this.app.use('/api/driver-induction', driverInductionRoutes);
    this.app.use('/api/user-accounts', userAccountRoutes);

    // 🚀 NEW: Core 6 Platform Module Routes with RBAC
    this.app.use('/api/vehicle-deployment', vehicleDeploymentRoutes);
    this.app.use('/api/smart-bookings', smartBookingsRoutes);
    this.app.use('/api/data-hub', dataHubRoutes);
    this.app.use('/api/driver-onboarding', driverOnboardingRoutes);
    this.app.use('/api/trip-analytics', tripAnalyticsRoutes);
    this.app.use('/api/energy-management', energyManagementRoutes);
    
    // 🔒 RESTRICTED: Audit Logs (Super Admin Only)
    this.app.use('/api/audit-logs', auditLogsRoutes);

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
      
      // Initialize database service schemas
      await this.databaseService.initialize();

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
