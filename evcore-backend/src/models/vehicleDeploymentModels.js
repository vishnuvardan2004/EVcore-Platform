// Vehicle Deployment Tracker Models Index
// This file exports all vehicle deployment related models for easy importing

const Vehicle = require('./Vehicle');
const Deployment = require('./Deployment');
const DeploymentHistory = require('./DeploymentHistory');
const VehicleMaintenanceLog = require('./VehicleMaintenanceLog');

// Export all models
module.exports = {
  Vehicle,
  Deployment,
  DeploymentHistory,
  VehicleMaintenanceLog
};

// Individual exports for specific imports
module.exports.Vehicle = Vehicle;
module.exports.Deployment = Deployment;
module.exports.DeploymentHistory = DeploymentHistory;
module.exports.VehicleMaintenanceLog = VehicleMaintenanceLog;
