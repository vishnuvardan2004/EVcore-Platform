// Admin Settings API Service
import apiService from './api';

export interface ModulePermission {
  enabled: boolean;
  permissions: string[];
}

export interface RolePermissions {
  role: string;
  modules: { [moduleName: string]: ModulePermission };
  lastUpdated?: string;
  lastUpdatedBy?: any;
}

export interface AdminSettingsResponse {
  permissions: { [role: string]: RolePermissions };
  totalRoles: number;
}

export interface UpdateModuleRequest {
  modules: Array<{
    name: string;
    enabled: boolean;
    permissions: string[];
  }>;
}

class AdminSettingsService {
  private baseUrl = '/api/admin-settings';

  /**
   * Get all role permissions
   */
  async getAllPermissions(): Promise<AdminSettingsResponse> {
    try {
      const response = await apiService.request<AdminSettingsResponse>(`${this.baseUrl}/permissions`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all permissions:', error);
      throw new Error('Failed to fetch role permissions. Please try again.');
    }
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(role: string): Promise<RolePermissions> {
    try {
      const response = await apiService.request<RolePermissions>(`${this.baseUrl}/permissions/${role}`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch permissions for role ${role}:`, error);
      throw new Error(`Failed to fetch permissions for ${role}. Please try again.`);
    }
  }

  /**
   * Update permissions for a specific role
   */
  async updateRolePermissions(role: string, modules: UpdateModuleRequest['modules']): Promise<RolePermissions> {
    try {
      const response = await apiService.request<RolePermissions>(`${this.baseUrl}/permissions/${role}`, {
        method: 'PUT',
        body: JSON.stringify({ modules }),
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to update permissions for role ${role}:`, error);
      throw new Error(`Failed to update permissions for ${role}. Please try again.`);
    }
  }

  /**
   * Update a specific module's permissions for a role
   */
  async updateModulePermission(
    role: string, 
    moduleName: string, 
    enabled?: boolean, 
    permissions?: string[]
  ): Promise<{ role: string; module: ModulePermission & { name: string } }> {
    try {
      const body: any = {};
      if (enabled !== undefined) body.enabled = enabled;
      if (permissions !== undefined) body.permissions = permissions;

      const response = await apiService.request<{ role: string; module: ModulePermission & { name: string } }>(`${this.baseUrl}/permissions/${role}/modules/${moduleName}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to update module ${moduleName} for role ${role}:`, error);
      throw new Error(`Failed to update ${moduleName} permissions. Please try again.`);
    }
  }

  /**
   * Reset permissions for a role to default
   */
  async resetRolePermissions(role: string): Promise<{ role: string; modulesReset: number }> {
    try {
      const response = await apiService.request<{ role: string; modulesReset: number }>(`${this.baseUrl}/permissions/${role}/reset`, {
        method: 'POST',
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to reset permissions for role ${role}:`, error);
      throw new Error(`Failed to reset permissions for ${role}. Please try again.`);
    }
  }

  /**
   * Batch update multiple modules for a role (optimistic updates)
   */
  async batchUpdateModules(
    role: string,
    updates: Array<{ moduleName: string; enabled?: boolean; permissions?: string[] }>
  ): Promise<RolePermissions> {
    try {
      // Convert updates to the format expected by the API
      const modules = updates.map(update => ({
        name: update.moduleName,
        enabled: update.enabled ?? true,
        permissions: update.permissions ?? ['read']
      }));

      return await this.updateRolePermissions(role, modules);
    } catch (error) {
      console.error(`Failed to batch update modules for role ${role}:`, error);
      throw new Error(`Failed to update multiple permissions for ${role}. Please try again.`);
    }
  }

  /**
   * Get available modules list
   */
  getAvailableModules(): string[] {
    return [
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
    ];
  }

  /**
   * Get available permission types
   */
  getAvailablePermissions(): string[] {
    return ['create', 'read', 'update', 'delete', 'export', 'import'];
  }

  /**
   * Validate module name
   */
  isValidModule(moduleName: string): boolean {
    return this.getAvailableModules().includes(moduleName);
  }

  /**
   * Validate permission type
   */
  isValidPermission(permission: string): boolean {
    return this.getAvailablePermissions().includes(permission);
  }
}

// Export singleton instance
export const adminSettingsService = new AdminSettingsService();
export default adminSettingsService;
