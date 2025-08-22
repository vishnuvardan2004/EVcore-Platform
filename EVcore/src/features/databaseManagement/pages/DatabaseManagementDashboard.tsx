import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
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
  Download,
  Upload,
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
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<DatabaseModule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { hasAccess } = useRoleAccess();
  const { handleError } = useErrorHandler();

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

  const handleModuleClick = (module: DatabaseModule) => {
    setSelectedModule(module);
    // Navigate to module-specific page
    window.location.href = `/database-management/${module}`;
  };

  const handleQuickAction = (module: DatabaseModule, action: string) => {
    switch (action) {
      case 'add':
        window.location.href = `/database-management/${module}/create`;
        break;
      case 'search':
        window.location.href = `/database-management/${module}/search`;
        break;
      case 'export':
        handleExport(module);
        break;
      case 'import':
        window.location.href = `/database-management/${module}/import`;
        break;
      default:
        break;
    }
  };

  const handleExport = async (module: DatabaseModule) => {
    try {
      const blob = await databaseService.exportData(module, { format: 'json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      handleError(error);
    }
  };

  const filteredModules = moduleStats.filter(stat => {
    const config = MODULE_CONFIG[stat.module];
    return config.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           config.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!canManageDatabase) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the Database Management system. 
            Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
          <p className="text-muted-foreground">
            Manage all system modules, data, and configurations
          </p>
        </div>
        
        {canViewAll && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/database-management/audit-logs'}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Audit Logs
            </Button>
            <Button onClick={() => window.location.href = '/database-management/settings'}>
              <Database className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadDashboardData}>
              <Activity className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredModules.length}</div>
            <p className="text-xs text-muted-foreground">
              Active database modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredModules.reduce((sum, stat) => sum + stat.count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Modules</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredModules.filter(stat => stat.status === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully loaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredModules.filter(stat => stat.status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Modules with issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModules.map((stat) => {
          const config = MODULE_CONFIG[stat.module];
          const IconComponent = getModuleIcon(stat.module);
          const StatusIcon = getStatusIcon(stat.status);
          
          return (
            <Card 
              key={stat.module} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleModuleClick(stat.module)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                    <IconComponent className={`h-6 w-6 text-${config.color}-600`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${getStatusColor(stat.status)}`} />
                    <Badge variant={stat.status === 'success' ? 'default' : stat.status === 'error' ? 'destructive' : 'secondary'}>
                      {stat.status}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{config.displayName}</CardTitle>
                <CardDescription className="text-sm">{config.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {stat.status === 'loading' ? '...' : stat.count.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Records</div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(stat.module, 'add');
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(stat.module, 'search');
                    }}
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(stat.module, 'export');
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(stat.module, 'import');
                    }}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <Activity className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      )}

      {filteredModules.length === 0 && !loading && (
        <div className="text-center py-8">
          <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No database modules are available.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagementDashboard;
