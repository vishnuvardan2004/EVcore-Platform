import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Clock,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Building,
  Car,
  Battery,
  Zap,
  Monitor,
  Wrench,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { 
  databaseService, 
  MODULE_CONFIG, 
  type DatabaseModule 
} from '../services/databaseService';
import { useRoleAccess } from '../../../hooks/useRoleAccess';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

const DocumentDetailView: React.FC = () => {
  const { module, id } = useParams<{ module: string; id: string }>();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  
  const { hasAccess } = useRoleAccess();
  const { handleError: baseHandleError } = useErrorHandler();

  // Enhanced error handler that accepts custom messages
  const handleError = (error: any, customMessage?: string) => {
    if (customMessage) {
      console.error(customMessage, error);
      baseHandleError(new Error(customMessage));
    } else {
      baseHandleError(error);
    }
  };

  const moduleConfig = module && databaseService.isValidModule(module as DatabaseModule) 
    ? MODULE_CONFIG[module as DatabaseModule] 
    : null;

  const canEdit = hasAccess(['super_admin', 'admin']);
  const canDelete = hasAccess(['super_admin']);
  const canViewAudit = hasAccess(['super_admin', 'admin']);

  useEffect(() => {
    if (module && id && databaseService.isValidModule(module as DatabaseModule)) {
      loadDocument();
    }
  }, [module, id]);

  const loadDocument = async () => {
    if (!module || !id) return;
    
    try {
      setLoading(true);
      const doc = await databaseService.getDocument(module as DatabaseModule, id);
      setDocument(doc);
      
      if (canViewAudit) {
        loadAuditLogs();
      }
    } catch (error) {
      handleError(error, 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!module || !id) return;
    
    try {
      const logsResponse = await databaseService.getAuditLogs({
        platform: module,
        page: 1,
        limit: 50
      });
      setAuditLogs(logsResponse.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleDelete = async () => {
    if (!module || !id || !canDelete) return;
    
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    try {
      await databaseService.deleteDocument(module as DatabaseModule, id);
      navigate(`/database-management/${module}`);
    } catch (error) {
      handleError(error, 'Failed to delete document');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; color: string }> = {
      active: { variant: 'default', icon: CheckCircle, color: 'green' },
      available: { variant: 'default', icon: CheckCircle, color: 'green' },
      operational: { variant: 'default', icon: CheckCircle, color: 'green' },
      inactive: { variant: 'secondary', icon: Clock, color: 'gray' },
      offline: { variant: 'secondary', icon: Clock, color: 'gray' },
      maintenance: { variant: 'outline', icon: Wrench, color: 'yellow' },
      error: { variant: 'destructive', icon: AlertCircle, color: 'red' },
      faulty: { variant: 'destructive', icon: AlertCircle, color: 'red' }
    };

    const config = statusConfig[status?.toLowerCase()] || { variant: 'outline', icon: Clock, color: 'gray' };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const renderModuleSpecificDetails = (doc: any, module: DatabaseModule) => {
    switch (module) {
      case 'vehicles':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle ID:</span>
                  <span className="font-medium">{doc.vehicleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Make & Model:</span>
                  <span className="font-medium">{doc.make} {doc.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year:</span>
                  <span className="font-medium">{doc.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Plate:</span>
                  <span className="font-medium">{doc.licensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIN:</span>
                  <span className="font-medium">{doc.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(doc.status)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  Battery & Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Battery:</span>
                  <span className="font-medium">{doc.currentBatteryLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Battery Capacity:</span>
                  <span className="font-medium">{doc.batteryCapacity} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Range:</span>
                  <span className="font-medium">{doc.range} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Odometer:</span>
                  <span className="font-medium">{doc.currentOdometer?.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efficiency:</span>
                  <span className="font-medium">{doc.efficiency} km/kWh</span>
                </div>
              </CardContent>
            </Card>

            {doc.location && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{doc.location.address}</p>
                  {doc.location.coordinates && (
                    <p className="text-sm text-muted-foreground">
                      Coordinates: {doc.location.coordinates.lat}, {doc.location.coordinates.lng}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'employees':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="font-medium">{doc.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{doc.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="font-medium">{new Date(doc.dateOfBirth).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium">{doc.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marital Status:</span>
                  <span className="font-medium">{doc.maritalStatus}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{doc.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium">{doc.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hire Date:</span>
                  <span className="font-medium">{new Date(doc.hireDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employment Type:</span>
                  <span className="font-medium">{doc.employmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="font-medium">${doc.salary?.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{doc.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{doc.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">{doc.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emergency Contact:</span>
                  <span className="font-medium">{doc.emergencyContact?.name} ({doc.emergencyContact?.phoneNumber})</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'pilots':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Pilot Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pilot ID:</span>
                  <span className="font-medium">{doc.pilotId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{doc.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Number:</span>
                  <span className="font-medium">{doc.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Type:</span>
                  <span className="font-medium">{doc.licenseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(doc.currentStatus)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Experience & Certification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience:</span>
                  <span className="font-medium">{doc.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Expiry:</span>
                  <span className="font-medium">{new Date(doc.licenseExpiryDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="font-medium">{doc.rating}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Trips:</span>
                  <span className="font-medium">{doc.totalTrips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Distance:</span>
                  <span className="font-medium">{doc.totalDistanceDriven?.toLocaleString()} km</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'chargingequipment':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Equipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equipment ID:</span>
                  <span className="font-medium">{doc.chargingEquipmentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{doc.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{doc.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{doc.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(doc.status)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Power Rating:</span>
                  <span className="font-medium">{doc.powerRating} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connector Type:</span>
                  <span className="font-medium">{doc.connectorType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voltage:</span>
                  <span className="font-medium">{doc.voltage} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">{doc.current} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installation Date:</span>
                  <span className="font-medium">{new Date(doc.installationDate).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'itequipment':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Equipment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IT Equipment ID:</span>
                  <span className="font-medium">{doc.itEquipmentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{doc.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{doc.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{doc.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{doc.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(doc.status)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Assignment & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset Tag:</span>
                  <span className="font-medium">{doc.assetTag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned To:</span>
                  <span className="font-medium">{doc.assignedTo?.employeeName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{doc.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Date:</span>
                  <span className="font-medium">{new Date(doc.purchaseDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Warranty Expiry:</span>
                  <span className="font-medium">{new Date(doc.warrantyExpiry).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(doc).map(([key, value]) => {
                if (key.startsWith('_') || typeof value === 'object') return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
    }
  };

  if (!module || !databaseService.isValidModule(module as DatabaseModule)) {
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2">Loading document...</span>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Document not found. It may have been deleted or you may not have permission to view it.
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
          <Button variant="outline" onClick={() => navigate(`/database-management/${module}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {moduleConfig?.displayName}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {(document as any).name || (document as any).fullName || 
               (document as any).vehicleId || (document as any).pilotId || 
               (document as any).employeeId || id}
            </h1>
            <p className="text-muted-foreground">{moduleConfig?.displayName} Details</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => navigate(`/database-management/${module}/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Document Details */}
      {renderModuleSpecificDetails(document, module as DatabaseModule)}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{new Date((document as any).createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Modified:</span>
            <span className="font-medium">{new Date((document as any).updatedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Document ID:</span>
            <span className="font-medium font-mono text-sm">{(document as any)._id}</span>
          </div>
          {(document as any).createdBy && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created By:</span>
              <span className="font-medium">{(document as any).createdBy}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      {canViewAudit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setShowAuditLogs(!showAuditLogs)}
              >
                {showAuditLogs ? 'Hide' : 'Show'} Audit Logs
              </Button>
            </div>
          </CardHeader>
          {showAuditLogs && (
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-muted-foreground">No audit logs available.</p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            By {log.userId} on {new Date(log.timestamp).toLocaleString()}
                          </p>
                          {log.details && (
                            <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                          )}
                        </div>
                        <Badge variant="outline">{log.action}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default DocumentDetailView;
