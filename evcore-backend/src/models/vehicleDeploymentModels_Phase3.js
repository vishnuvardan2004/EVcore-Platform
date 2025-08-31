// Vehicle Deployment Tracker Models Index - Phase 3: Pure Data Hub Reference Architecture
// This file exports all vehicle deployment related models for Phase 3
// Phase 3: Removed local Vehicle model entirely - all vehicle data comes from Data Hub

// Import deployment-related models only (no local vehicle model)
const Deployment = require('./Deployment');
const DeploymentHistory = require('./DeploymentHistory');
const VehicleMaintenanceLog = require('./VehicleMaintenanceLog');

// Phase 3: Export only deployment models
// Vehicle data is now exclusively handled by Data Hub Service
module.exports = {
  // Core deployment models
  Deployment,
  DeploymentHistory,
  VehicleMaintenanceLog,
  
  // Phase 3: Vehicle model removed - use Data Hub Service instead
  // VehicleDeployment model deprecated
  // Vehicle model deprecated
  
  // Legacy aliases for backward compatibility (will show deprecation warnings)
  Vehicle: null, // Deprecated in Phase 3
  VehicleDeployment: null, // Deprecated in Phase 3
};

// Individual exports for backward compatibility
module.exports.Deployment = Deployment;
module.exports.DeploymentHistory = DeploymentHistory;
module.exports.VehicleMaintenanceLog = VehicleMaintenanceLog;

// Deprecation warnings for legacy imports
Object.defineProperty(module.exports, 'Vehicle', {
  get: function() {
    console.warn('⚠️  DEPRECATION WARNING: Vehicle model is deprecated in Phase 3. Use Data Hub Service instead.');
    return null;
  }
});

Object.defineProperty(module.exports, 'VehicleDeployment', {
  get: function() {
    console.warn('⚠️  DEPRECATION WARNING: VehicleDeployment model is deprecated in Phase 3. Use Data Hub Service instead.');
    return null;
  }
});
