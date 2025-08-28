import { config } from '../config/environment';

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

export class APIService {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  
  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  private getAuthToken(): string | null {
    // Get token from localStorage using the correct key
    const token = localStorage.getItem('authToken'); // Using direct key to avoid any config issues
    
    console.log('🔑 Getting auth token from localStorage["authToken"]:', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    if (!token) {
      console.warn('⚠️ No token found in localStorage');
      return null;
    }
    
    // Validate JWT format (should have 3 parts separated by dots)
    const jwtParts = token.split('.');
    if (jwtParts.length !== 3) {
      console.error('❌ Invalid JWT format - expected 3 parts, got:', jwtParts.length);
      console.error('Token preview:', token.substring(0, 50) + '...');
      console.error('Clearing invalid token from localStorage');
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
    
    console.log('✅ JWT format valid - 3 parts found');
    return token;
  }

  private async handleTokenRefresh(): Promise<void> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Include httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          // In development, token might be returned in response
          if (result.data?.token) {
            localStorage.setItem(config.TOKEN_STORAGE_KEY, result.data.token);
          }
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          throw new Error('Refresh token expired');
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    
    console.log('🌐 API Request Details:', { 
      url, 
      method: options.method || 'GET',
      endpoint,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token found'
    });

    // Check if this is a protected route that requires authentication
    const isPublicRoute = endpoint.includes('/login') || 
                         endpoint.includes('/register') || 
                         endpoint.includes('/health') ||
                         endpoint.includes('/public');

    // Validate token for protected routes
    if (!token && !isPublicRoute) {
      console.error('❌ No authentication token found for protected route:', endpoint);
      console.error('Available localStorage keys:', Object.keys(localStorage));
      console.error('authToken value:', localStorage.getItem('authToken'));
      console.error('Redirecting to login...');
      
      // Clear any existing auth state
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      throw new Error('Authentication required - no token found');
    }
    
    // Build request config
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for CORS with credentials and httpOnly cookies
      ...options,
    };

    // Add Authorization header only if token exists
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
      console.log('� Added Authorization header: Bearer [token]');
      console.log('� Token details - Length:', token.length, 'Parts:', token.split('.').length);
    } else if (!isPublicRoute) {
      console.error('❌ No token available for protected route');
    }

    // Log final request details
    console.log('� Final request headers:', Object.keys(config.headers || {}));
    console.log('🔍 Authorization header present:', !!(config.headers as any)?.Authorization);

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Try to refresh token and retry
        await this.handleTokenRefresh();
        
        // Update token in config if it was refreshed to localStorage
        const newToken = this.getAuthToken();
        if (newToken && config.headers) {
          (config.headers as any).Authorization = `Bearer ${newToken}`;
        }
        
        const retryResponse = await fetch(url, config);
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw {
            message: errorData.message || `HTTP Error: ${retryResponse.status}`,
            status: retryResponse.status,
            code: errorData.code,
          } as APIError;
        }
        return await retryResponse.json();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        console.log('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
        
        // Handle JWT malformed error specifically
        if (response.status === 401 && (
          errorData.message?.includes('jwt malformed') || 
          errorData.message?.includes('invalid token') ||
          errorData.message?.includes('JsonWebTokenError')
        )) {
          console.log('🔥 JWT malformed error detected, clearing token and redirecting...');
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          
          // If we're not already on the login page, redirect
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          throw {
            message: 'Authentication token is invalid. Please log in again.',
            status: 401,
            code: 'JWT_MALFORMED',
          } as APIError;
        }
        
        throw {
          message: errorData.message || `HTTP Error: ${response.status}`,
          status: response.status,
          code: errorData.code,
        } as APIError;
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
        } as APIError;
      }
      throw error;
    }
  }

  public async requestBlob(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    const config: RequestInit = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    const doFetch = async () => {
      const res = await fetch(url, config);
      if (res.status === 401) {
        await this.handle401AndRetry();
        const retry = await fetch(url, config);
        if (!retry.ok) throw new Error(`HTTP ${retry.status}`);
        return retry.blob();
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    };
    return doFetch();
  }

  private async handle401AndRetry() {
    if (this.isRefreshing) {
      if (this.refreshPromise) {
        await this.refreshPromise;
      }
      return;
    }
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const result = await this.auth.refreshToken();
        if (result?.success && result.data?.token) {
          localStorage.setItem('authToken', result.data.token);
        } else {
          localStorage.removeItem('authToken');
          throw new Error('Token refresh failed');
        }
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();
    await this.refreshPromise;
  }

  // Authentication endpoints
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request<{ token?: string; refreshToken?: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    logout: () =>
      this.request('/api/auth/logout', {
        method: 'POST',
      }),
    
    refreshToken: () =>
      this.request<{ token?: string; refreshToken?: string }>('/api/auth/refresh', {
        method: 'POST',
      }),
    
    verifyToken: () =>
      this.request<{ user: any }>('/api/auth/verify', {
        method: 'GET',
      }),
    
    changePassword: (data: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) =>
      this.request('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    firstLoginPasswordChange: (data: { newPassword: string; newPasswordConfirm: string }) =>
      this.request('/api/auth/first-login-password-change', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // Vehicle management endpoints
  vehicles = {
    getAll: (params?: { 
      search?: string; 
      status?: string; 
      type?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const query = queryParams.toString();
      return this.request<any[]>(`/api/vehicles${query ? `?${query}` : ''}`);
    },
    
    getById: (id: string) =>
      this.request<any>(`/api/vehicles/${id}`),
    
    create: (data: any) =>
      this.request<any>('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      this.request<any>(`/api/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      this.request(`/api/vehicles/${id}`, {
        method: 'DELETE',
      }),
  };

  // Booking management endpoints
  bookings = {
    getAll: (params?: { 
      status?: string; 
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const query = queryParams.toString();
      return this.request<any[]>(`/api/bookings${query ? `?${query}` : ''}`);
    },
    
    create: (data: any) =>
      this.request<any>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      this.request<any>(`/api/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    cancel: (id: string, reason?: string) =>
      this.request(`/api/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  };

  // User management endpoints
  users = {
    getAll: (params?: { role?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const query = queryParams.toString();
      return this.request<any[]>(`/api/users${query ? `?${query}` : ''}`);
    },
    
    create: (data: any) =>
      this.request<any>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      this.request<any>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // File upload endpoint
  upload = {
    single: (file: File, type: 'document' | 'image' = 'document') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      return this.request<{ url: string; filename: string }>('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Remove Content-Type to let browser set boundary for FormData
        },
      });
    },
  };

  // Dashboard/Analytics endpoints
  dashboard = {
    getStats: () =>
      this.request<any>('/api/dashboard/stats'),
    
    getRecentActivity: (limit = 10) =>
      this.request<any[]>(`/api/dashboard/activity?limit=${limit}`),
  };

  // Database Management endpoints
  databaseMgmt = {
    pilots: {
      getAll: () =>
        this.request<any[]>('/api/database-mgmt/platforms/pilot/documents'),
      
      getById: (id: string) =>
        this.request<any>(`/api/pilots/${id}`),
      
      create: (data: any) =>
        this.request<any>('/api/pilots', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      update: (id: string, data: any) =>
        this.request<any>(`/api/pilots/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      delete: (id: string) =>
        this.request<any>(`/api/pilots/${id}`, {
          method: 'DELETE',
        }),
    },
  };
}

export const apiService = new APIService();
export default apiService;
