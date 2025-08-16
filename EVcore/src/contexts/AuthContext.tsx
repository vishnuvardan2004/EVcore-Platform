
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { apiService } from '../services/api';
import { config } from '../config/environment';

interface User {
  email: string;
  role: 'super-admin' | 'admin' | 'leadership' | 'manager' | 'supervisor' | 'pilot' | 'lead' | 'security' | 'hr' | 'finance';
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessFeature: (featureId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data with expanded roles
const mockUsers = [
  { email: "superadmin@example.com", password: "superadmin123", role: "super-admin" as const },
  { email: "admin@example.com", password: "admin123", role: "admin" as const },
  { email: "leadership@example.com", password: "leadership123", role: "leadership" as const },
  { email: "manager@example.com", password: "manager123", role: "manager" as const },
  { email: "supervisor@example.com", password: "super123", role: "supervisor" as const },
  { email: "pilot@example.com", password: "pilot123", role: "pilot" as const },
  { email: "lead@example.com", password: "lead123", role: "lead" as const },
  { email: "security@example.com", password: "security123", role: "security" as const },
  { email: "hr@example.com", password: "hr123", role: "hr" as const },
  { email: "finance@example.com", password: "finance123", role: "finance" as const }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(config.TOKEN_STORAGE_KEY);
      if (token) {
        try {
          const response = await apiService.auth.verifyToken();
          if (response.success) {
            setUser(response.data.user);
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem(config.TOKEN_STORAGE_KEY);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem(config.TOKEN_STORAGE_KEY);
        }
      }
      
      // Auto-login with demo user for development
      const demoUser = mockUsers[0]; // Use admin user
      const mockToken = btoa(JSON.stringify({ 
        email: demoUser.email, 
        role: demoUser.role, 
        exp: Date.now() + 86400000 
      }));
      localStorage.setItem(config.TOKEN_STORAGE_KEY, mockToken);
      setUser({
        email: demoUser.email,
        role: demoUser.role
      });
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

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
        // Create a mock token for development
        const mockToken = btoa(JSON.stringify({ email: foundUser.email, role: foundUser.role, exp: Date.now() + 86400000 }));
        localStorage.setItem(config.TOKEN_STORAGE_KEY, mockToken);
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
      await apiService.auth.logout();
    } catch (error) {
      console.log('API logout failed, proceeding with local logout');
    } finally {
      localStorage.removeItem(config.TOKEN_STORAGE_KEY);
      localStorage.removeItem(config.REFRESH_TOKEN_STORAGE_KEY);
      setUser(null);
      console.log('User logged out');
      
      toast({
        title: "👋 Logged Out",
        description: "You have been successfully logged out.",
      });
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Role hierarchy with permission levels
    const roleHierarchy = {
      'super-admin': 10,
      'admin': 9,
      'leadership': 8,
      'manager': 7,
      'supervisor': 6,
      'lead': 5,
      'security': 4,
      'hr': 4,
      'finance': 4,
      'pilot': 3
    };
    
    // Super admin and admin have all permissions
    if (user.role === 'super-admin' || user.role === 'admin') return true;
    
    return user.permissions?.includes(permission) || false;
  };

  const canAccessFeature = (featureId: string): boolean => {
    if (!user) return false;
    
    // Super admin and admin can access everything
    if (user.role === 'super-admin' || user.role === 'admin') return true;
    
    // Role-based feature access matrix
    const roleFeatureAccess = {
      'leadership': [
        'vehicle-deployment', 'database-management', 'driver-induction', 
        'trip-details', 'offline-bookings', 'charging-tracker', 'attendance',
        'reports', 'dashboard', 'settings'
      ],
      'manager': [
        'vehicle-deployment', 'database-management', 'driver-induction', 
        'trip-details', 'offline-bookings', 'charging-tracker', 'attendance',
        'reports'
      ],
      'supervisor': [
        'vehicle-deployment', 'database-management', 'driver-induction', 
        'trip-details', 'offline-bookings', 'charging-tracker', 'attendance'
      ],
      'lead': [
        'vehicle-deployment', 'driver-induction', 'trip-details', 
        'charging-tracker', 'attendance'
      ],
      'security': [
        'vehicle-deployment', 'driver-induction', 'attendance', 'reports'
      ],
      'hr': [
        'driver-induction', 'attendance', 'reports'
      ],
      'finance': [
        'reports', 'database-management', 'trip-details'
      ],
      'pilot': [
        'vehicle-deployment', 'trip-details', 'charging-tracker'
      ]
    };
    
    return roleFeatureAccess[user.role]?.includes(featureId) || false;
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
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
