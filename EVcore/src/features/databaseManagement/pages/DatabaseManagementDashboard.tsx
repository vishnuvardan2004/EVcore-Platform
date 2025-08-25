import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Input } from "../../../components/ui/input";
import { useToast } from "../../../hooks/use-toast";
import { 
  Car, 
  Battery, 
  Zap, 
  Monitor, 
  Building, 
  Users, 
  UserCheck, 
  MapPin, 
  Route,
  Wrench,
  Database,
  Plus,
  Search,
  Filter,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { databaseService, MODULE_CONFIG, DATABASE_MODULES, type DatabaseModule } from '../services/databaseService';
import { useRoleAccess } from '../../../hooks/useRoleAccess';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

interface ModuleStats {
  module: DatabaseModule;
  count: number;
  status: 'loading' | 'success' | 'error';
  lastUpdated?: string;
}

interface QuickActions {
  module: DatabaseModule;
  actions: Array<{
    label: string;
    icon: React.ElementType;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }>;
}

const DatabaseManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<DatabaseModule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { hasAccess } = useRoleAccess();
  const { handleError } = useErrorHandler();
  const { toast } = useToast();

  // Check if user has database management access
  const canManageDatabase = hasAccess(['super_admin', 'admin', 'db_manager']);
  const canViewAll = hasAccess(['super_admin', 'admin']);

  useEffect(() => {
    if (canManageDatabase) {
      loadDashboardData();
    }
  }, [canManageDatabase]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load platforms
      const platformsData = await databaseService.getPlatforms();
      setPlatforms(platformsData.platforms);

      // Initialize module stats
      const initialStats: ModuleStats[] = databaseService.getAllModules().map(module => ({
        module,
        count: 0,
        status: 'loading' as const
      }));
      setModuleStats(initialStats);

      // Load stats for each module
      for (const module of databaseService.getAllModules()) {
        try {
          const documents = await databaseService.getDocuments(module, { page: 1, limit: 1 });
          setModuleStats(prev => prev.map(stat => 
            stat.module === module 
              ? { ...stat, count: documents.pagination.totalDocuments, status: 'success' as const, lastUpdated: new Date().toISOString() }
              : stat
          ));
        } catch (error) {
          setModuleStats(prev => prev.map(stat => 
            stat.module === module 
              ? { ...stat, status: 'error' as const }
              : stat
          ));
          console.error(`Failed to load stats for ${module}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (module: DatabaseModule) => {
    const config = MODULE_CONFIG[module];
    const iconName = config.icon;
    
    const iconMap: Record<string, React.ElementType> = {
      Car, Battery, Zap, Monitor, Building, Users, UserCheck, MapPin, Route, Wrench
    };
    
    return iconMap[iconName] || Database;
  };

  const getStatusColor = (status: ModuleStats['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: ModuleStats['status']) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'loading': return Activity;
      default: return Database;
    }
  };

  const getModuleGradientClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-gradient-to-br from-blue-500 to-blue-600';
      case 'green': return 'bg-gradient-to-br from-green-500 to-green-600';
      case 'yellow': return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
      case 'purple': return 'bg-gradient-to-br from-purple-500 to-purple-600';
      case 'orange': return 'bg-gradient-to-br from-orange-500 to-orange-600';
      case 'indigo': return 'bg-gradient-to-br from-indigo-500 to-indigo-600';
      case 'red': return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'pink': return 'bg-gradient-to-br from-pink-500 to-pink-600';
      default: return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const getModuleButtonClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
      case 'green': return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
      case 'yellow': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700';
      case 'purple': return 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700';
      case 'orange': return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700';
      case 'indigo': return 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700';
      case 'red': return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
      case 'pink': return 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';
    }
  };

  const handleModuleClick = (module: DatabaseModule) => {
    setSelectedModule(module);
    // Navigate to module-specific page
    navigate(`/database-management/${module}`);
  };

  // Map database module names to their corresponding route names
  const getModuleRoute = (module: DatabaseModule): string => {
    const moduleRouteMap: Record<DatabaseModule, string> = {
      'vehicle': 'vehicles',
      'chargingequipment': 'charging-equipment',
      'electricequipment': 'electrical-equipment',
      'itequipment': 'it-equipment',
      'infrastructurefurniture': 'infra-furniture',
      'employee': 'employees',
      'pilot': 'pilots',
      'chargingstation': 'charging-equipment' // Fallback to charging-equipment for now
    };
    
    return moduleRouteMap[module] || module;
  };

  const handleQuickAction = (module: DatabaseModule, action: string) => {
    switch (action) {
      case 'add':
        const route = getModuleRoute(module);
        navigate(`/database/${route}`);
        break;
      default:
        break;
    }
  };

  const filteredModules = moduleStats.filter(stat => {
    const config = MODULE_CONFIG[stat.module];
    return config.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           config.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!canManageDatabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                You don't have permission to access the Database Management system. 
                Please contact your administrator to request access.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl transform -skew-y-1"></div>
          
          <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Database Management
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Centralized control for all system modules and data operations
                    </p>
                  </div>
                </div>
              </div>
              
              {canViewAll && (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-200"
                    onClick={() => navigate('/database-management/audit-logs')}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Audit Logs
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => navigate('/database-management/settings')}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search modules by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-base shadow-sm"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={loadDashboardData}
                className="h-12 px-6 border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-200 rounded-xl"
              >
                <Activity className="mr-2 h-5 w-5" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Total Modules</CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{filteredModules.length}</div>
              <p className="text-sm text-gray-600 mt-1">
                Active database modules
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Total Records</CardTitle>
              <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {filteredModules.reduce((sum, stat) => sum + stat.count, 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Across all modules
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Online Modules</CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {filteredModules.filter(stat => stat.status === 'success').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Successfully loaded
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Errors</CardTitle>
              <div className="p-2 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                {filteredModules.filter(stat => stat.status === 'error').length}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Modules with issues
              </p>
            </CardContent>
          </Card>
        </div>        {/* Enhanced Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModules.map((stat) => {
            const config = MODULE_CONFIG[stat.module];
            const IconComponent = getModuleIcon(stat.module);
            const StatusIcon = getStatusIcon(stat.status);
            
            return (
              <Card 
                key={stat.module} 
                className="group border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => handleModuleClick(stat.module)}
              >
                {/* Card Header with Gradient Background */}
                <div className={`relative ${getModuleGradientClasses(config.color)} p-6 text-white`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-5 w-5 ${
                          stat.status === 'success' ? 'text-green-300' : 
                          stat.status === 'error' ? 'text-red-300' : 'text-yellow-300'
                        }`} />
                        <Badge 
                          variant={stat.status === 'success' ? 'default' : stat.status === 'error' ? 'destructive' : 'secondary'}
                          className="bg-white/20 text-white border-white/30"
                        >
                          {stat.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                        {config.displayName}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Card Content */}
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Stats Display */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.status === 'loading' ? (
                          <Activity className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                        ) : (
                          stat.count.toLocaleString()
                        )}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        {stat.count === 1 ? 'Record' : 'Records'}
                      </div>
                    </div>
                    
                    {/* Last Updated */}
                    {stat.lastUpdated && (
                      <div className="text-xs text-gray-400 text-center">
                        Updated {new Date(stat.lastUpdated).toLocaleTimeString()}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className={`flex-1 ${getModuleButtonClasses(config.color)} text-white shadow-md hover:shadow-lg transition-all duration-200`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction(stat.module, 'add');
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add New
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Loading State */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-16 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
              <p className="text-gray-600">Fetching module data and statistics...</p>
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {filteredModules.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-200 rounded-full flex items-center justify-center">
              <Database className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm ? 'No modules found' : 'No modules available'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              {searchTerm 
                ? 'Try adjusting your search criteria to find the modules you\'re looking for.' 
                : 'No database modules are currently available. Contact your administrator for access.'
              }
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="mt-4 border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseManagementDashboard;
