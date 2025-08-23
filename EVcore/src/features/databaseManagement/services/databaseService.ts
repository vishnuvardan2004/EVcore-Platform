import { APIService } from '../../../services/api';
import { config } from '../../../config/environment';

// Define all available modules in the database management system
export const DATABASE_MODULES = {
  VEHICLES: 'vehicle',
  CHARGING_EQUIPMENT: 'chargingequipment',
  ELECTRICAL_EQUIPMENT: 'electricequipment',
  IT_EQUIPMENT: 'itequipment',
  INFRASTRUCTURE_FURNITURE: 'infrastructurefurniture',
  EMPLOYEES: 'employee',
  PILOTS: 'pilot',
  CHARGING_STATIONS: 'chargingstation',
  TRIPS: 'trip',
  MAINTENANCE: 'maintenance'
} as const;

export type DatabaseModule = typeof DATABASE_MODULES[keyof typeof DATABASE_MODULES];

// Module configurations with display names and icons
export const MODULE_CONFIG = {
  [DATABASE_MODULES.VEHICLES]: {
    displayName: 'Vehicles',
    icon: 'Car',
    description: 'Electric vehicle fleet management',
    color: 'blue'
  },
  [DATABASE_MODULES.CHARGING_EQUIPMENT]: {
    displayName: 'Charging Equipment',
    icon: 'Battery',
    description: 'Charging infrastructure management',
    color: 'green'
  },
  [DATABASE_MODULES.ELECTRICAL_EQUIPMENT]: {
    displayName: 'Electrical Equipment',
    icon: 'Zap',
    description: 'Electrical infrastructure and components',
    color: 'yellow'
  },
  [DATABASE_MODULES.IT_EQUIPMENT]: {
    displayName: 'IT Equipment',
    icon: 'Monitor',
    description: 'Computer systems and network devices',
    color: 'purple'
  },
  [DATABASE_MODULES.INFRASTRUCTURE_FURNITURE]: {
    displayName: 'Infrastructure & Furniture',
    icon: 'Building',
    description: 'Office furniture and building infrastructure',
    color: 'orange'
  },
  [DATABASE_MODULES.EMPLOYEES]: {
    displayName: 'Employees',
    icon: 'Users',
    description: 'Staff management and permissions',
    color: 'indigo'
  },
  [DATABASE_MODULES.PILOTS]: {
    displayName: 'Pilots',
    icon: 'UserCheck',
    description: 'Driver management and licensing',
    color: 'red'
  },
  [DATABASE_MODULES.CHARGING_STATIONS]: {
    displayName: 'Charging Stations',
    icon: 'MapPin',
    description: 'Multi-charger station management',
    color: 'teal'
  },
  [DATABASE_MODULES.TRIPS]: {
    displayName: 'Trips',
    icon: 'Route',
    description: 'Journey tracking and analytics',
    color: 'cyan'
  },
  [DATABASE_MODULES.MAINTENANCE]: {
    displayName: 'Maintenance',
    icon: 'Wrench',
    description: 'Equipment and vehicle maintenance',
    color: 'gray'
  }
};

// Generic interfaces for database operations
export interface DatabaseDocument {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  filters?: Record<string, any>;
  searchText?: string;
  searchFields?: string[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalDocuments: number;
  documentsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  documentsReturned: number;
}

export interface DocumentsResponse<T = DatabaseDocument> {
  documents: T[];
  pagination: PaginationInfo;
  module: string;
  timestamp: string;
}

export interface SearchResponse<T = DatabaseDocument> extends DocumentsResponse<T> {
  searchCriteria: {
    filters?: Record<string, any>;
    searchText?: string;
    searchFields?: string[];
  };
}

export interface PlatformInfo {
  name: string;
  displayName: string;
  documentCount: number;
  isActive: boolean;
  schema: any;
}

export interface PlatformsResponse {
  platforms: PlatformInfo[];
  totalPlatforms: number;
}

export interface BulkOperationRequest {
  operation: 'create' | 'update' | 'delete';
  documents: any[];
  options?: {
    validateOnly?: boolean;
    continueOnError?: boolean;
  };
}

export interface BulkOperationResponse {
  successful: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
    document?: any;
  }>;
  results: any[];
}

export interface ImportOptions {
  overwrite?: boolean;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  mapping?: Record<string, string>;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  filters?: Record<string, any>;
  fields?: string[];
}

export interface AuditLogEntry {
  _id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  collection?: string;
  documentId?: string;
  details: any;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  pagination: PaginationInfo;
  timestamp: string;
}

export class DatabaseManagementService extends APIService {
  private basePath = '/api/database-mgmt';

  // HTTP helper methods
  protected async get<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint);
  }

  protected async post<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, {
      method: 'DELETE',
    });
  }

  protected getBaseURL(): string {
    return config.API_BASE_URL;
  }

  protected getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Platform management methods
  async getPlatforms(): Promise<PlatformsResponse> {
    const response = await this.get<PlatformsResponse>(`${this.basePath}/platforms`);
    return response.data;
  }

  async createPlatform(platformData: {
    name: string;
    displayName: string;
    schema: any;
  }): Promise<PlatformInfo> {
    const response = await this.post<PlatformInfo>(`${this.basePath}/platforms`, platformData);
    return response.data;
  }

  // Document operations for any module
  async getDocuments<T = DatabaseDocument>(
    module: DatabaseModule,
    params?: PaginationParams
  ): Promise<DocumentsResponse<T>> {
    const queryString = params ? this.buildQueryString(params) : '';
    const response = await this.get<DocumentsResponse<T>>(
      `${this.basePath}/platforms/${module}/documents${queryString}`
    );
    return response.data;
  }

  async getDocument<T = DatabaseDocument>(
    module: DatabaseModule,
    documentId: string
  ): Promise<T> {
    const response = await this.get<T>(`${this.basePath}/platforms/${module}/documents/${documentId}`);
    return response.data;
  }

  async createDocument<T = DatabaseDocument>(
    module: DatabaseModule,
    documentData: Partial<T>
  ): Promise<T> {
    const response = await this.post<T>(
      `${this.basePath}/platforms/${module}/documents`,
      documentData
    );
    return response.data;
  }

  async updateDocument<T = DatabaseDocument>(
    module: DatabaseModule,
    documentId: string,
    updates: Partial<T>
  ): Promise<T> {
    const response = await this.put<T>(
      `${this.basePath}/platforms/${module}/documents/${documentId}`,
      { updates }
    );
    return response.data;
  }

  async deleteDocument(module: DatabaseModule, documentId: string): Promise<void> {
    await this.delete(`${this.basePath}/platforms/${module}/documents/${documentId}`);
  }

  // Search operations
  async searchDocuments<T = DatabaseDocument>(
    module: DatabaseModule,
    searchParams: SearchParams
  ): Promise<SearchResponse<T>> {
    const response = await this.post<SearchResponse<T>>(
      `${this.basePath}/platforms/${module}/search`,
      searchParams
    );
    return response.data;
  }

  // Bulk operations
  async bulkOperation<T = DatabaseDocument>(
    module: DatabaseModule,
    bulkRequest: BulkOperationRequest
  ): Promise<BulkOperationResponse> {
    const response = await this.post<BulkOperationResponse>(
      `${this.basePath}/platforms/${module}/bulk`,
      bulkRequest
    );
    return response.data;
  }

  // Import/Export operations
  async exportData(
    module: DatabaseModule,
    options: ExportOptions
  ): Promise<Blob> {
    const queryString = this.buildQueryString(options);
    const response = await fetch(
      `${this.getBaseURL()}${this.basePath}/platforms/${module}/export${queryString}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async importData(
    module: DatabaseModule,
    file: File,
    options?: ImportOptions
  ): Promise<BulkOperationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await fetch(
      `${this.getBaseURL()}${this.basePath}/platforms/${module}/import`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Import failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Statistics and analytics
  async getPlatformStats(module: DatabaseModule): Promise<any> {
    const response = await this.get<any>(`${this.basePath}/platforms/${module}/stats`);
    return response.data;
  }

  // Audit logs
  async getAuditLogs(params?: {
    platform?: string;
    action?: string;
    adminId?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    const queryString = params ? this.buildQueryString(params) : '';
    const response = await this.get<AuditLogsResponse>(`${this.basePath}/audit-logs${queryString}`);
    return response.data;
  }

  // Utility methods
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Module validation
  isValidModule(module: string): module is DatabaseModule {
    return Object.values(DATABASE_MODULES).includes(module as DatabaseModule);
  }

  getModuleConfig(module: DatabaseModule) {
    return MODULE_CONFIG[module];
  }

  getAllModules(): DatabaseModule[] {
    return Object.values(DATABASE_MODULES);
  }
}

// Export singleton instance
export const databaseService = new DatabaseManagementService();
