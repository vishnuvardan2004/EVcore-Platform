const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    enum: ['super_admin', 'admin', 'employee', 'pilot'],
  },
  
  modules: [{
    name: {
      type: String,
      required: true,
      enum: [
        // Core 6 Platform Modules
        'vehicle_deployment',
        'smart_bookings', 
        'data_hub',
        'driver_onboarding',
        'trip_analytics',
        'energy_management',
        // Administrative Modules
        'audit_logs',
        'admin_settings',
        // Legacy modules (for backward compatibility)
        'dashboard',
        'database_management',
        'smart_widgets',
        'global_reports',
        'language_settings'
      ]
    },
    
    enabled: {
      type: Boolean,
      default: true
    },
    
    permissions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'export', 'import']
    }]
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow system initialization without user reference
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static method to get default permissions for a role
rolePermissionSchema.statics.getDefaultPermissions = function(role) {
  const defaultPermissions = {
    super_admin: {
      modules: [
        // Core 6 Platform Modules - Full Access
        { name: 'vehicle_deployment', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'smart_bookings', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'data_hub', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'driver_onboarding', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'trip_analytics', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'energy_management', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        // Administrative Modules - Full Access
        { name: 'audit_logs', enabled: true, permissions: ['read', 'export'] },
        { name: 'admin_settings', enabled: true, permissions: ['create', 'read', 'update', 'delete'] },
        // Legacy modules - Full Access  
        { name: 'dashboard', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'database_management', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'smart_widgets', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'global_reports', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'language_settings', enabled: true, permissions: ['read', 'update'] }
      ]
    },
    
    admin: {
      modules: [
        // Core 6 Platform Modules - All except Audit Logs
        { name: 'vehicle_deployment', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export'] },
        { name: 'smart_bookings', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export'] },
        { name: 'data_hub', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export'] },
        { name: 'driver_onboarding', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export'] },
        { name: 'trip_analytics', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export'] },
        { name: 'energy_management', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export'] },
        // Administrative Modules - No Audit Logs
        { name: 'audit_logs', enabled: false, permissions: [] },
        { name: 'admin_settings', enabled: true, permissions: ['create', 'read', 'update'] },
        // Legacy modules
        { name: 'dashboard', enabled: true, permissions: ['read'] },
        { name: 'database_management', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'smart_widgets', enabled: true, permissions: ['read'] },
        { name: 'global_reports', enabled: true, permissions: ['read', 'export'] },
        { name: 'language_settings', enabled: true, permissions: ['read', 'update'] }
      ]
    },
    
    employee: {
      modules: [
        // Core 6 Platform Modules - Employee Access (5 out of 6 modules)
        { name: 'vehicle_deployment', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'smart_bookings', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'data_hub', enabled: false, permissions: [] }, // No Data Hub access
        { name: 'driver_onboarding', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'trip_analytics', enabled: true, permissions: ['read', 'export'] },
        { name: 'energy_management', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        // Administrative Modules - No Access
        { name: 'audit_logs', enabled: false, permissions: [] },
        { name: 'admin_settings', enabled: false, permissions: [] },
        // Legacy modules
        { name: 'dashboard', enabled: true, permissions: ['read'] },
        { name: 'database_management', enabled: false, permissions: [] },
        { name: 'smart_widgets', enabled: false, permissions: [] },
        { name: 'global_reports', enabled: false, permissions: [] },
        { name: 'language_settings', enabled: true, permissions: ['read'] }
      ]
    },
    
    pilot: {
      modules: [
        // Core 6 Platform Modules - Pilot Access (Only Trip Analytics & Energy Management)
        { name: 'vehicle_deployment', enabled: false, permissions: [] },
        { name: 'smart_bookings', enabled: false, permissions: [] },
        { name: 'data_hub', enabled: false, permissions: [] },
        { name: 'driver_onboarding', enabled: false, permissions: [] },
        { name: 'trip_analytics', enabled: true, permissions: ['read', 'export'] },
        { name: 'energy_management', enabled: true, permissions: ['read', 'export'] },
        // Administrative Modules - No Access
        { name: 'audit_logs', enabled: false, permissions: [] },
        { name: 'admin_settings', enabled: false, permissions: [] },
        // Legacy modules
        { name: 'dashboard', enabled: true, permissions: ['read'] },
        { name: 'database_management', enabled: false, permissions: [] },
        { name: 'smart_widgets', enabled: false, permissions: [] },
        { name: 'global_reports', enabled: false, permissions: [] },
        { name: 'language_settings', enabled: true, permissions: ['read'] }
      ]
    }
  };

  return defaultPermissions[role] || null;
};

// Instance method to check if role has access to a module
rolePermissionSchema.methods.hasModuleAccess = function(moduleName) {
  const module = this.modules.find(m => m.name === moduleName);
  return module && module.enabled;
};

// Instance method to check if role has specific permission in a module
rolePermissionSchema.methods.hasPermission = function(moduleName, permission) {
  const module = this.modules.find(m => m.name === moduleName);
  return module && module.enabled && module.permissions.includes(permission);
};

// Instance method to update module access
rolePermissionSchema.methods.updateModuleAccess = function(moduleName, enabled, permissions = null) {
  const moduleIndex = this.modules.findIndex(m => m.name === moduleName);
  
  if (moduleIndex !== -1) {
    this.modules[moduleIndex].enabled = enabled;
    if (permissions) {
      this.modules[moduleIndex].permissions = permissions;
    }
  } else {
    // Add new module if it doesn't exist
    this.modules.push({
      name: moduleName,
      enabled,
      permissions: permissions || []
    });
  }
};

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
