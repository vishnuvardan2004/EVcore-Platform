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
        'dashboard',
        'driver_induction',
        'trip_details',
        'offline_bookings',
        'charging_tracker',
        'vehicle_deployment',
        'database_management',
        'smart_widgets',
        'global_reports',
        'admin_settings',
        'language_settings',
        'audit_logs'
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
    required: true
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
        { name: 'dashboard', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'driver_induction', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'trip_details', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'offline_bookings', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'charging_tracker', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'vehicle_deployment', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'database_management', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'smart_widgets', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'global_reports', enabled: true, permissions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { name: 'admin_settings', enabled: true, permissions: ['create', 'read', 'update', 'delete'] },
        { name: 'language_settings', enabled: true, permissions: ['read', 'update'] },
        { name: 'audit_logs', enabled: true, permissions: ['read', 'export'] }
      ]
    },
    
    admin: {
      modules: [
        { name: 'dashboard', enabled: true, permissions: ['read'] },
        { name: 'driver_induction', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'trip_details', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'offline_bookings', enabled: true, permissions: ['create', 'read', 'update', 'delete'] },
        { name: 'charging_tracker', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'vehicle_deployment', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'database_management', enabled: true, permissions: ['create', 'read', 'update', 'export'] },
        { name: 'smart_widgets', enabled: true, permissions: ['read'] },
        { name: 'global_reports', enabled: true, permissions: ['read', 'export'] },
        { name: 'admin_settings', enabled: false, permissions: [] },
        { name: 'language_settings', enabled: true, permissions: ['read', 'update'] },
        { name: 'audit_logs', enabled: true, permissions: ['read'] }
      ]
    },
    
    employee: {
      modules: [
        { name: 'dashboard', enabled: true, permissions: ['read'] },
        { name: 'driver_induction', enabled: false, permissions: [] },
        { name: 'trip_details', enabled: true, permissions: ['create', 'read', 'update'] },
        { name: 'offline_bookings', enabled: true, permissions: ['create', 'read', 'update'] },
        { name: 'charging_tracker', enabled: true, permissions: ['create', 'read', 'update'] },
        { name: 'vehicle_deployment', enabled: true, permissions: ['read'] },
        { name: 'database_management', enabled: false, permissions: [] },
        { name: 'smart_widgets', enabled: false, permissions: [] },
        { name: 'global_reports', enabled: false, permissions: [] },
        { name: 'admin_settings', enabled: false, permissions: [] },
        { name: 'language_settings', enabled: true, permissions: ['read'] },
        { name: 'audit_logs', enabled: false, permissions: [] }
      ]
    },
    
    pilot: {
      modules: [
        { name: 'dashboard', enabled: true, permissions: ['read'] },
        { name: 'driver_induction', enabled: false, permissions: [] },
        { name: 'trip_details', enabled: true, permissions: ['create', 'read'] },
        { name: 'offline_bookings', enabled: false, permissions: [] },
        { name: 'charging_tracker', enabled: true, permissions: ['create', 'read'] },
        { name: 'vehicle_deployment', enabled: true, permissions: ['read'] },
        { name: 'database_management', enabled: false, permissions: [] },
        { name: 'smart_widgets', enabled: false, permissions: [] },
        { name: 'global_reports', enabled: false, permissions: [] },
        { name: 'admin_settings', enabled: false, permissions: [] },
        { name: 'language_settings', enabled: true, permissions: ['read'] },
        { name: 'audit_logs', enabled: false, permissions: [] }
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
