
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { apiService } from '../services/api';
import { config } from '../config/environment';

interface User {
  email: string;
  role: 'super_admin' | 'admin' | 'employee' | 'pilot';
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessFeature: (featureId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data with supported roles
const mockUsers = [
  { email: "superadmin@example.com", password: "superadmin123", role: "super_admin" as const },
  { email: "admin@example.com", password: "admin123", role: "admin" as const },
  { email: "employee@example.com", password: "employee123", role: "employee" as const },
  { email: "pilot@example.com", password: "pilot123", role: "pilot" as const }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Initializing authentication...');
      setIsLoading(true);
      
      const token = localStorage.getItem(config.TOKEN_STORAGE_KEY);
      
      if (!token) {
        // No token found - user needs to login
        console.log('❌ No token found, redirecting to login');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('🔍 Token found, validating...', token.substring(0, 20) + '...');
      
      // Clear any existing user state first
      setUser(null);
      
      // Token exists - must be validated before allowing access
      try {
        // Check if it's a JWT (has 3 parts separated by dots)
        const isJWT = token.split('.').length === 3;

        if (isJWT) {
          // Real JWT token - MUST verify with backend
          console.log('🌐 JWT token detected, verifying with backend...');
          try {
            const response = await apiService.auth.verifyToken();
            if (response.success && response.data && response.data.user) {
              console.log('✅ JWT token verified successfully');
              setUser(response.data.user);
            } else {
              console.log('❌ JWT token verification failed - invalid response');
              // Clear all auth data
              localStorage.removeItem(config.TOKEN_STORAGE_KEY);
              localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
              setUser(null);
            }
          } catch (error) {
            console.error('❌ JWT token verification error:', error);
            // Clear all auth data on any error
            localStorage.removeItem(config.TOKEN_STORAGE_KEY);
            localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
            setUser(null);
          }
        } else {
          // Mock token - validate locally with strict checks
          console.log('🧪 Mock token detected, validating locally...');
          try {
            // Check if it's a proper JWT format (3 parts separated by dots)
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
              console.error('❌ Invalid JWT format for mock token');
              localStorage.removeItem(config.TOKEN_STORAGE_KEY);
              localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
              setUser(null);
              return;
            }
            
            // Decode the payload (second part of JWT)
            const decoded = JSON.parse(atob(tokenParts[1]));
            
            // Strict validation of mock token structure and expiry
            if (decoded && decoded.email && decoded.role && decoded.exp && typeof decoded.exp === 'number') {
              const now = Math.floor(Date.now() / 1000); // Convert to seconds to match JWT standard
              const tokenExpiry = decoded.exp;
              
              console.log('⏰ Token expiry check:', new Date(tokenExpiry * 1000), 'vs now:', new Date(now * 1000));
              
              if (now < tokenExpiry) {
                console.log('🔍 Mock token not expired, finding user data...');
                const mockUser = mockUsers.find(u => u.email === decoded.email && u.role === decoded.role);
                
                if (mockUser) {
                  console.log('✅ Mock user found and validated');
                  setUser({
                    email: mockUser.email,
                    role: mockUser.role
                  });
                } else {
                  console.log('❌ Mock user not found in database, invalid token');
                  localStorage.removeItem(config.TOKEN_STORAGE_KEY);
                  localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
                  setUser(null);
                }
              } else {
                console.log('❌ Mock token expired, removing');
                localStorage.removeItem(config.TOKEN_STORAGE_KEY);
                localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
                setUser(null);
              }
            } else {
              console.log('❌ Invalid mock token structure, removing');
              localStorage.removeItem(config.TOKEN_STORAGE_KEY);
              localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
              setUser(null);
            }
          } catch (decodeError) {
            console.error('❌ Failed to decode token, removing:', decodeError);
            localStorage.removeItem(config.TOKEN_STORAGE_KEY);
            localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Token processing error, clearing all auth data:', error);
        localStorage.removeItem(config.TOKEN_STORAGE_KEY);
        localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
        setUser(null);
      }

      setIsLoading(false);
      console.log('🔐 Authentication initialization complete');
    };

    initializeAuth();
  }, []);

  // Development helper function to enable auto-login
  const enableDevelopmentAutoLogin = () => {
    if (config.IS_DEVELOPMENT && !localStorage.getItem(config.TOKEN_STORAGE_KEY)) {
      console.log('Development auto-login enabled manually');
      const demoUser = mockUsers[0]; // Use first mock user
      const mockToken = btoa(JSON.stringify({ 
        email: demoUser.email, 
        role: demoUser.role, 
        exp: Date.now() + 86400000 
      }));
      localStorage.setItem(config.TOKEN_STORAGE_KEY, mockToken);
      setUser({ email: demoUser.email, role: demoUser.role });
      return true;
    }
    return false;
  };

  // Development helper to clear all auth state
  const clearAuthState = () => {
    console.log('🧹 Clearing all authentication state...');
    localStorage.removeItem(config.TOKEN_STORAGE_KEY);
    localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
    setUser(null);
    console.log('✅ Authentication state cleared');
  };

  // Development helper to create an expired token for testing
  const createExpiredToken = () => {
    console.log('⏰ Creating expired token for testing...');
    const expiredToken = btoa(JSON.stringify({
      email: 'admin@example.com',
      role: 'admin',
      exp: Date.now() - 1000, // Expired 1 second ago
      iat: Date.now() - 86400000, // Issued 24 hours ago
      type: 'mock'
    }));
    localStorage.setItem(config.TOKEN_STORAGE_KEY, expiredToken);
    console.log('💾 Expired token stored. Refresh page to test validation.');
  };

  // Development helper to check current token status
  const checkTokenStatus = () => {
    const token = localStorage.getItem('authToken'); // Use direct key for consistency
    console.log('🔍 Token Status Check:');
    console.log('📍 localStorage keys:', Object.keys(localStorage));
    console.log('🔑 authToken exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found in localStorage["authToken"]');
      return;
    }
    
    console.log('📏 Token length:', token.length);
    console.log('🔗 Token preview:', token.substring(0, 30) + '...');
    
    // Check JWT format
    const parts = token.split('.');
    console.log('🧩 JWT parts count:', parts.length);
    
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT format - expected 3 parts, got:', parts.length);
      return;
    }
    
    try {
      // Decode header
      const header = JSON.parse(atob(parts[0]));
      console.log('📄 JWT Header:', header);
      
      // Decode payload
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000); // JWT uses seconds
      const isExpired = payload.exp < now;
      
      console.log('� JWT Payload:', {
        email: payload.email,
        role: payload.role,
        type: payload.type,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        isExpired,
        timeUntilExpiry: isExpired ? 'EXPIRED' : `${Math.round((payload.exp - now) / 60)} minutes`
      });
      
      console.log('✅ Token format is valid for API requests');
    } catch (error) {
      console.error('❌ Failed to decode JWT:', error);
    }
  };

  // Expose development helpers
  if (config.IS_DEVELOPMENT) {
    (window as any).clearAuthState = clearAuthState;
    (window as any).createExpiredToken = createExpiredToken;
    (window as any).checkTokenStatus = checkTokenStatus;
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Try API login first
      const response = await apiService.auth.login({ email, password });
      
      if (response.success) {
        localStorage.setItem(config.TOKEN_STORAGE_KEY, response.data.token);
        setUser(response.data.user);
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${response.data.user.role.replace('-', ' ')}`,
        });
        return true;
      }
    } catch (error) {
      console.log('API login failed, trying mock authentication...');
      
      // Fallback to mock authentication for development
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        console.log('✅ Mock user found:', foundUser.email);
        
        // Create a proper JWT-like mock token (header.payload.signature format)
        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        
        // JWT Header (base64 encoded)
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        
        // JWT Payload (base64 encoded)
        const payload = btoa(JSON.stringify({ 
          email: foundUser.email, 
          role: foundUser.role, 
          exp: Math.floor(tokenExpiry / 1000), // JWT exp should be in seconds, not milliseconds
          iat: Math.floor(Date.now() / 1000), // issued at time in seconds
          type: 'mock' // explicitly mark as mock token
        }));
        
        // Mock signature (base64 encoded)
        const signature = btoa('mock-signature-for-development');
        
        // Combine into proper JWT format: header.payload.signature
        const mockToken = `${header}.${payload}.${signature}`;
        
        console.log('💾 Storing mock JWT token with expiry:', new Date(tokenExpiry));
        console.log('🔍 Mock token parts:', mockToken.split('.').length, 'parts');
        console.log('📏 Mock token length:', mockToken.length);
        localStorage.setItem(config.TOKEN_STORAGE_KEY, mockToken);
        
        console.log('👤 Setting user state:', { email: foundUser.email, role: foundUser.role });
        setUser({ email: foundUser.email, role: foundUser.role });
        
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${foundUser.role.replace('-', ' ')} (Mock)`,
        });
        return true;
      }
    }
    
    console.log('Login failed: Invalid credentials or insufficient permissions');
    
    toast({
      title: "Login Failed",
      description: "Incorrect credentials or insufficient permissions. Please try again.",
      variant: "destructive",
    });
    
    return false;
  };

  const logout = async () => {
    try {
      // Try to logout from backend API
      await apiService.auth.logout();
    } catch (error) {
      console.log('API logout failed, proceeding with local logout');
    } finally {
      // Complete cleanup - remove all tokens and reset state
      localStorage.removeItem(config.TOKEN_STORAGE_KEY);
      localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
      
      // Clear any session storage if exists
      sessionStorage.removeItem(config.TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
      
      // Reset user state
      setUser(null);
      
      console.log('User logged out completely');
      
      toast({
        title: "👋 Logged Out",
        description: "You have been successfully logged out.",
      });

      // Force navigation to login page
      window.location.href = '/login';
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Role hierarchy with permission levels
    const roleHierarchy = {
      'super_admin': 10,
      'admin': 9,
      'employee': 5,
      'pilot': 3
    };
    
    // Super admin and admin have all permissions
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    
    return user.permissions?.includes(permission) || false;
  };

  const canAccessFeature = (featureId: string): boolean => {
    if (!user) return false;
    
    // Super admin and admin can access everything
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    
    // Role-based feature access matrix
    const roleFeatureAccess = {
      'employee': [
        'vehicle-deployment', 'database-management', 'driver-induction', 
        'trip-details', 'offline-bookings', 'charging-tracker', 'attendance',
        'reports'
      ],
      'pilot': [
        'vehicle-deployment', 'trip-details', 'charging-tracker'
      ]
    };
    
    return roleFeatureAccess[user.role]?.includes(featureId) || false;
  };

  const isAuthenticated = user !== null;

  // Debug logging for authentication state
  console.log('AuthContext State:', { 
    user, 
    isAuthenticated, 
    isLoading,
    userEmail: user?.email,
    userRole: user?.role 
  });

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      isLoading,
      hasRole, 
      hasPermission, 
      canAccessFeature 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
