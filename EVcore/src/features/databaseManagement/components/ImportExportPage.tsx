import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  ArrowLeft,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  File,
  Database,
  X
} from 'lucide-react';
import { 
  databaseService, 
  MODULE_CONFIG, 
  type DatabaseModule 
} from '../services/databaseService';
import { useRoleAccess } from '../../../hooks/useRoleAccess';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

const ImportExportPage: React.FC = () => {
  const { module } = useParams<{ module: string }>();
  const navigate = useNavigate();
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importResults, setImportResults] = useState<any>(null);
  
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

  const canManage = hasAccess(['super_admin', 'admin', 'db_manager']);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!importFile || !module || !databaseService.isValidModule(module as DatabaseModule)) return;

    try {
      setImporting(true);
      setImportProgress({ message: 'Uploading file...', progress: 0 });
      
      const options = {
        overwrite: false,
        validateOnly: false,
        skipDuplicates: true
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress((prev: any) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 500);

      const result = await databaseService.importData(module as DatabaseModule, importFile, options);
      
      clearInterval(progressInterval);
      setImportProgress({ message: 'Import completed', progress: 100 });
      setImportResults(result);
      
    } catch (error) {
      handleError(error, 'Import failed');
      setImportProgress(null);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    if (!module || !databaseService.isValidModule(module as DatabaseModule)) return;

    try {
      setExporting(true);
      
      const blob = await databaseService.exportData(module as DatabaseModule, {
        format: exportFormat
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module}_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      handleError(error, 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportProgress(null);
    setImportResults(null);
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

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to import/export data for this module.
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
            <h1 className="text-3xl font-bold">Import/Export Data</h1>
            <p className="text-muted-foreground">Manage data for {moduleConfig?.displayName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Upload a JSON or CSV file to import data into {moduleConfig?.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!importFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Drag and drop a file here, or click to select
                </p>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Select File
                  </Button>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: JSON, CSV (max 50MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{importFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(importFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetImport}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {importProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{importProgress.message}</span>
                      <span>{importProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {importResults && (
                  <Alert variant={importResults.errors?.length > 0 ? "destructive" : "default"}>
                    {importResults.errors?.length > 0 ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>
                          Import completed: {importResults.successful} successful, {importResults.failed} failed
                        </p>
                        {importResults.errors?.length > 0 && (
                          <div>
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc list-inside text-sm">
                              {importResults.errors.slice(0, 5).map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                              {importResults.errors.length > 5 && (
                                <li>... and {importResults.errors.length - 5} more errors</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleImport} 
                    disabled={importing}
                    className="flex-1"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetImport}>
                    Reset
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Import Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure your data matches the required schema</li>
                <li>• Duplicate entries will be skipped</li>
                <li>• Invalid data will be reported in the results</li>
                <li>• A backup will be created before import</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>
              Download all data from {moduleConfig?.displayName} in your preferred format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Export Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      className="mr-2"
                    />
                    JSON (Complete data with metadata)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      className="mr-2"
                    />
                    CSV (Spreadsheet compatible)
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleExport} 
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export as {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Export Information:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• All records will be included in the export</li>
                <li>• Metadata and audit information included</li>
                <li>• Exported files can be re-imported later</li>
                <li>• Files are generated in real-time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Schema Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Schema
          </CardTitle>
          <CardDescription>
            Required fields and data structure for {moduleConfig?.displayName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSchemaFields(module as DatabaseModule).map((field, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{field.name}</span>
                    {field.required && (
                      <span className="text-red-500 text-sm">Required</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{field.type}</p>
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getSchemaFields = (module: DatabaseModule) => {
  const commonFields = [
    { name: '_id', type: 'String', required: false, description: 'Auto-generated unique identifier' },
    { name: 'createdAt', type: 'Date', required: false, description: 'Creation timestamp' },
    { name: 'updatedAt', type: 'Date', required: false, description: 'Last update timestamp' }
  ];

  const moduleFields: Record<DatabaseModule, any[]> = {
    vehicles: [
      { name: 'vehicleId', type: 'String', required: true, description: 'Unique vehicle identifier' },
      { name: 'make', type: 'String', required: true, description: 'Vehicle manufacturer' },
      { name: 'model', type: 'String', required: true, description: 'Vehicle model' },
      { name: 'year', type: 'Number', required: false, description: 'Manufacturing year' },
      { name: 'licensePlate', type: 'String', required: true, description: 'License plate number' },
      { name: 'vin', type: 'String', required: true, description: 'Vehicle identification number' },
      { name: 'status', type: 'String', required: false, description: 'Current status (active, inactive, etc.)' },
      { name: 'currentBatteryLevel', type: 'Number', required: false, description: 'Battery level percentage' },
      { name: 'batteryCapacity', type: 'Number', required: false, description: 'Battery capacity in kWh' },
      { name: 'range', type: 'Number', required: false, description: 'Vehicle range in km' }
    ],
    employees: [
      { name: 'employeeId', type: 'String', required: true, description: 'Unique employee identifier' },
      { name: 'fullName', type: 'String', required: true, description: 'Full name' },
      { name: 'email', type: 'String', required: true, description: 'Email address' },
      { name: 'phoneNumber', type: 'String', required: false, description: 'Phone number' },
      { name: 'department', type: 'String', required: true, description: 'Department name' },
      { name: 'position', type: 'String', required: true, description: 'Job position' },
      { name: 'hireDate', type: 'Date', required: false, description: 'Date of hire' },
      { name: 'salary', type: 'Number', required: false, description: 'Annual salary' }
    ],
    pilots: [
      { name: 'pilotId', type: 'String', required: true, description: 'Unique pilot identifier' },
      { name: 'fullName', type: 'String', required: true, description: 'Full name' },
      { name: 'licenseNumber', type: 'String', required: true, description: 'Driver license number' },
      { name: 'licenseType', type: 'String', required: true, description: 'License type/class' },
      { name: 'experience', type: 'Number', required: false, description: 'Years of experience' },
      { name: 'currentStatus', type: 'String', required: false, description: 'Current availability status' },
      { name: 'rating', type: 'Number', required: false, description: 'Performance rating (1-5)' }
    ],
    chargingequipment: [
      { name: 'chargingEquipmentId', type: 'String', required: true, description: 'Unique equipment identifier' },
      { name: 'name', type: 'String', required: true, description: 'Equipment name' },
      { name: 'brand', type: 'String', required: true, description: 'Manufacturer brand' },
      { name: 'model', type: 'String', required: true, description: 'Equipment model' },
      { name: 'powerRating', type: 'Number', required: false, description: 'Power rating in kW' },
      { name: 'connectorType', type: 'String', required: false, description: 'Connector type' },
      { name: 'status', type: 'String', required: false, description: 'Operational status' }
    ],
    itequipment: [
      { name: 'itEquipmentId', type: 'String', required: true, description: 'Unique IT equipment identifier' },
      { name: 'name', type: 'String', required: true, description: 'Equipment name' },
      { name: 'category', type: 'String', required: true, description: 'Equipment category' },
      { name: 'brand', type: 'String', required: false, description: 'Manufacturer brand' },
      { name: 'model', type: 'String', required: false, description: 'Equipment model' },
      { name: 'assetTag', type: 'String', required: false, description: 'Asset tag number' },
      { name: 'status', type: 'String', required: false, description: 'Equipment status' }
    ],
    electricequipment: [
      { name: 'equipmentId', type: 'String', required: true, description: 'Unique equipment identifier' },
      { name: 'name', type: 'String', required: true, description: 'Equipment name' },
      { name: 'type', type: 'String', required: true, description: 'Equipment type' },
      { name: 'voltage', type: 'Number', required: false, description: 'Operating voltage' },
      { name: 'current', type: 'Number', required: false, description: 'Operating current' },
      { name: 'status', type: 'String', required: false, description: 'Equipment status' }
    ],
    infrastructurefurniture: [
      { name: 'assetId', type: 'String', required: true, description: 'Unique asset identifier' },
      { name: 'name', type: 'String', required: true, description: 'Asset name' },
      { name: 'category', type: 'String', required: true, description: 'Asset category' },
      { name: 'location', type: 'String', required: false, description: 'Physical location' },
      { name: 'condition', type: 'String', required: false, description: 'Asset condition' },
      { name: 'status', type: 'String', required: false, description: 'Asset status' }
    ],
    chargingstations: [
      { name: 'stationId', type: 'String', required: true, description: 'Unique station identifier' },
      { name: 'name', type: 'String', required: true, description: 'Station name' },
      { name: 'location', type: 'Object', required: false, description: 'Station location with address and coordinates' }
    ],
    trips: [
      { name: 'tripId', type: 'String', required: true, description: 'Unique trip identifier' },
      { name: 'startLocation', type: 'Object', required: true, description: 'Trip start location' },
      { name: 'endLocation', type: 'Object', required: true, description: 'Trip end location' }
    ],
    maintenance: [
      { name: 'maintenanceId', type: 'String', required: true, description: 'Unique maintenance identifier' },
      { name: 'description', type: 'String', required: true, description: 'Maintenance description' },
      { name: 'target', type: 'Object', required: true, description: 'Target vehicle or equipment' }
    ]
  };

  return [...(moduleFields[module] || []), ...commonFields];
};

export default ImportExportPage;
