// Vehicle Deployment Tracker Models Index
// This file exports all vehicle deployment related models for easy importing

const VehicleDeployment = require('./Vehicle');
const Deployment = require('./Deployment');
const DeploymentHistory = require('./DeploymentHistory');
const VehicleMaintenanceLog = require('./VehicleMaintenanceLog');

// Export all models
module.exports = {
  Vehicle: VehicleDeployment, // Alias for backward compatibility
  VehicleDeployment,
  Deployment,
  DeploymentHistory,
  VehicleMaintenanceLog
};

// Individual exports for specific imports
module.exports.Vehicle = VehicleDeployment;
module.exports.VehicleDeployment = VehicleDeployment;
module.exports.Deployment = Deployment;
module.exports.DeploymentHistory = DeploymentHistory;
module.exports.VehicleMaintenanceLog = VehicleMaintenanceLog;
