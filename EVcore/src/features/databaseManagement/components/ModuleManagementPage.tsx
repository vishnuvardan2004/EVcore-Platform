import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  databaseService, 
  MODULE_CONFIG, 
  type DatabaseModule,
  type DocumentsResponse,
  type PaginationParams 
} from '../services/databaseService';
import { useRoleAccess } from '../../../hooks/useRoleAccess';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

interface ModuleManagementPageProps {
  module?: DatabaseModule;
}

const ModuleManagementPage: React.FC<ModuleManagementPageProps> = ({ module: propModule }) => {
  const { module: paramModule } = useParams<{ module: string }>();
  const navigate = useNavigate();
  
  const module = propModule || paramModule as DatabaseModule;
  const moduleConfig = module ? MODULE_CONFIG[module] : null;
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { hasAccess } = useRoleAccess();
  const { handleError: baseHandleError } = useErrorHandler();

  // Enhanced error handler that accepts custom messages
  const handleError = (error: any, customMessage?: string) => {
    if (customMessage) {
      console.error(customMessage, error);
      // Display custom message but still log the original error
      baseHandleError(new Error(customMessage));
    } else {
      baseHandleError(error);
    }
  };

  const canManage = hasAccess(['super_admin', 'admin', 'db_manager']);
  const canEdit = hasAccess(['super_admin', 'admin']);
  const canDelete = hasAccess(['super_admin']);

  useEffect(() => {
    if (module && databaseService.isValidModule(module)) {
      loadDocuments();
    }
  }, [module, currentPage, pageSize, sortBy, sortOrder]);

  const loadDocuments = async () => {
    if (!module) return;
    
    try {
      setLoading(true);
      const params: PaginationParams = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder
      };
      
      const response: DocumentsResponse = await databaseService.getDocuments(module, params);
      setDocuments(response.documents);
      setPagination(response.pagination);
    } catch (error) {
      handleError(error, `Failed to load ${moduleConfig?.displayName || module} data`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!module || !searchTerm.trim()) {
      loadDocuments();
      return;
    }

    try {
      setLoading(true);
      const response = await databaseService.searchDocuments(module, {
        searchText: searchTerm,
        searchFields: getSearchFields(module),
        filters,
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder
      });
      setDocuments(response.documents);
      setPagination(response.pagination);
    } catch (error) {
      handleError(error, 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getSearchFields = (module: DatabaseModule): string[] => {
    // Return relevant search fields based on module type
    const commonFields = ['name', 'description'];
    const moduleSpecificFields: Record<DatabaseModule, string[]> = {
      vehicles: ['vehicleId', 'make', 'model', 'licensePlate'],
      chargingequipment: ['chargingEquipmentId', 'name', 'brand', 'model'],
      electricequipment: ['equipmentId', 'name', 'brand', 'model'],
      itequipment: ['itEquipmentId', 'name', 'brand', 'model', 'assetTag'],
      infrastructurefurniture: ['assetId', 'name', 'brand', 'model', 'assetTag'],
      employees: ['fullName', 'email', 'employeeId', 'department'],
      pilots: ['fullName', 'email', 'pilotId', 'licenseNumber'],
      chargingstations: ['stationId', 'name', 'location.address'],
      trips: ['tripId', 'startLocation.address', 'endLocation.address'],
      maintenance: ['maintenanceId', 'description', 'target.name']
    };

    return [...commonFields, ...(moduleSpecificFields[module] || [])];
  };

  const handleDelete = async (id: string) => {
    if (!module || !canDelete) return;
    
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await databaseService.deleteDocument(module, id);
      loadDocuments();
    } catch (error) {
      handleError(error, 'Failed to delete item');
    }
  };

  const handleBulkDelete = async () => {
    if (!module || !canDelete || selectedItems.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return;

    try {
      await databaseService.bulkOperation(module, {
        operation: 'delete',
        documents: selectedItems.map(id => ({ _id: id }))
      });
      setSelectedItems([]);
      loadDocuments();
    } catch (error) {
      handleError(error, 'Failed to delete items');
    }
  };

  const handleExport = async () => {
    if (!module) return;
    
    try {
      const blob = await databaseService.exportData(module, { 
        format: 'json',
        filters 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      handleError(error, 'Export failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; color: string }> = {
      active: { variant: 'default', color: 'green' },
      available: { variant: 'default', color: 'green' },
      operational: { variant: 'default', color: 'green' },
      inactive: { variant: 'secondary', color: 'gray' },
      offline: { variant: 'secondary', color: 'gray' },
      maintenance: { variant: 'outline', color: 'yellow' },
      error: { variant: 'destructive', color: 'red' },
      faulty: { variant: 'destructive', color: 'red' }
    };

    const config = statusConfig[status?.toLowerCase()] || { variant: 'outline', color: 'gray' };
    return <Badge variant={config.variant}>{status}</Badge>;
  };

  const renderTableRows = () => {
    return documents.map((doc: any) => (
      <tr key={doc._id} className="border-b hover:bg-gray-50">
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selectedItems.includes(doc._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedItems([...selectedItems, doc._id]);
              } else {
                setSelectedItems(selectedItems.filter(id => id !== doc._id));
              }
            }}
            className="rounded border-gray-300"
          />
        </td>
        
        {/* Render module-specific columns */}
        {renderModuleSpecificColumns(doc, module)}
        
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(`/database-management/${module}/${doc._id}`)}>
              <Eye className="h-3 w-3" />
            </Button>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => navigate(`/database-management/${module}/${doc._id}/edit`)}>
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="destructive" onClick={() => handleDelete(doc._id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </td>
      </tr>
    ));
  };

  const renderModuleSpecificColumns = (doc: any, module: DatabaseModule) => {
    switch (module) {
      case 'vehicles':
        return (
          <>
            <td className="px-4 py-3 font-medium">{doc.vehicleId}</td>
            <td className="px-4 py-3">{doc.make} {doc.model}</td>
            <td className="px-4 py-3">{doc.licensePlate}</td>
            <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
            <td className="px-4 py-3">{doc.currentBatteryLevel}%</td>
          </>
        );
      case 'employees':
        return (
          <>
            <td className="px-4 py-3 font-medium">{doc.employeeId}</td>
            <td className="px-4 py-3">{doc.fullName}</td>
            <td className="px-4 py-3">{doc.email}</td>
            <td className="px-4 py-3">{doc.department}</td>
            <td className="px-4 py-3">{doc.position}</td>
          </>
        );
      case 'pilots':
        return (
          <>
            <td className="px-4 py-3 font-medium">{doc.pilotId}</td>
            <td className="px-4 py-3">{doc.fullName}</td>
            <td className="px-4 py-3">{doc.licenseNumber}</td>
            <td className="px-4 py-3">{getStatusBadge(doc.currentStatus)}</td>
            <td className="px-4 py-3">{doc.experience} years</td>
          </>
        );
      case 'chargingequipment':
        return (
          <>
            <td className="px-4 py-3 font-medium">{doc.chargingEquipmentId}</td>
            <td className="px-4 py-3">{doc.name}</td>
            <td className="px-4 py-3">{doc.brand} {doc.model}</td>
            <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
            <td className="px-4 py-3">{doc.powerRating} kW</td>
          </>
        );
      case 'itequipment':
        return (
          <>
            <td className="px-4 py-3 font-medium">{doc.itEquipmentId}</td>
            <td className="px-4 py-3">{doc.name}</td>
            <td className="px-4 py-3">{doc.category}</td>
            <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
            <td className="px-4 py-3">{doc.assignedTo?.employeeName || 'Unassigned'}</td>
          </>
        );
      default:
        return (
          <>
            <td className="px-4 py-3 font-medium">{doc.name || doc.id || doc._id}</td>
            <td className="px-4 py-3">{doc.description || 'N/A'}</td>
            <td className="px-4 py-3">{getStatusBadge(doc.status || 'active')}</td>
            <td className="px-4 py-3">{new Date(doc.createdAt).toLocaleDateString()}</td>
          </>
        );
    }
  };

  const renderTableHeaders = (module: DatabaseModule) => {
    const headers = ['', 'ID', 'Name', 'Type/Brand', 'Status', 'Details', 'Actions'];
    
    switch (module) {
      case 'vehicles':
        return ['', 'Vehicle ID', 'Make/Model', 'License Plate', 'Status', 'Battery %', 'Actions'];
      case 'employees':
        return ['', 'Employee ID', 'Full Name', 'Email', 'Department', 'Position', 'Actions'];
      case 'pilots':
        return ['', 'Pilot ID', 'Full Name', 'License Number', 'Status', 'Experience', 'Actions'];
      case 'chargingequipment':
        return ['', 'Equipment ID', 'Name', 'Brand/Model', 'Status', 'Power Rating', 'Actions'];
      case 'itequipment':
        return ['', 'IT Equipment ID', 'Name', 'Category', 'Status', 'Assigned To', 'Actions'];
      default:
        return headers;
    }
  };

  if (!module || !databaseService.isValidModule(module)) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid module specified. Please check the URL and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to manage this module.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/database-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{moduleConfig?.displayName}</h1>
            <p className="text-muted-foreground">{moduleConfig?.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => navigate(`/database-management/${module}/create`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => navigate(`/database-management/${module}/import`)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder={`Search ${moduleConfig?.displayName?.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={loadDocuments}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Items Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span>{selectedItems.length} items selected</span>
              <div className="flex gap-2">
                {canDelete && (
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedItems([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination ? `${pagination.totalDocuments.toLocaleString()} Records` : 'Records'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No records found</div>
              {canEdit && (
                <Button onClick={() => navigate(`/database-management/${module}/create`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Record
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {renderTableHeaders(module).map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left font-medium text-gray-900">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderTableRows()}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.totalDocuments)} of {pagination.totalDocuments} results
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleManagementPage;
