import React, { useState, useEffect, Suspense } from 'react';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { checkServiceHealth, ServiceHealth, logServiceHealth } from '../../../utils/serviceHealth';
import { waitForServices } from '../../../utils/serviceInitializer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  Database,
  Shield,
  HardDrive,
  Wifi,
  Settings
} from 'lucide-react';

// Lazy load the main Database component
const LazyDatabase = React.lazy(() => import('../../../pages/Database'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Database Management...</h2>
      <p className="text-gray-600">Initializing database services and components</p>
    </div>
  </div>
);

const ServiceHealthIndicator: React.FC<{ health: ServiceHealth; onRetry: () => void }> = ({ 
  health, 
  onRetry 
}) => {
  const services = [
    { key: 'database', label: 'Database Service', icon: Database, status: health.database },
    { key: 'authentication', label: 'Authentication', icon: Shield, status: health.authentication },
    { key: 'localStorage', label: 'Local Storage', icon: HardDrive, status: health.localStorage },
    { key: 'indexedDB', label: 'IndexedDB', icon: HardDrive, status: health.indexedDB },
    { key: 'serviceWorker', label: 'Service Worker', icon: Wifi, status: health.serviceWorker },
  ];

  const hasErrors = health.errors.length > 0;
  const criticalServices = ['database', 'authentication'];
  const hasCriticalErrors = criticalServices.some(service => !health[service as keyof ServiceHealth]);

  if (!hasErrors && !hasCriticalErrors) {
    return null; // All good, don't show anything
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">Database Service Health Check</CardTitle>
                <p className="text-orange-700 text-sm mt-1">
                  {hasCriticalErrors 
                    ? 'Critical services are not available. Database Management cannot load properly.' 
                    : 'Some non-critical services are unavailable, but the app should still function.'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(({ key, label, icon: Icon, status }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{label}</p>
                    <Badge 
                      variant={status ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {status ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  {status ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              ))}
            </div>

            {health.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Detected Issues:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {health.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry Health Check
              </Button>
              {!hasCriticalErrors && (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Continue Anyway
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card className="max-w-md w-full border-red-200 bg-red-50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <CardTitle className="text-red-900">Database Management Error</CardTitle>
            <p className="text-red-700 text-sm mt-1">
              An unexpected error occurred while loading the Database Management feature.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-100 border border-red-200 rounded p-3">
          <p className="text-sm font-mono text-red-800">{error.message}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={retry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const DatabaseWrapper: React.FC = () => {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      // Wait for services to be ready
      await waitForServices(3, 1500);
      
      await logServiceHealth(); // Log to console
      const healthResult = await checkServiceHealth();
      setHealth(healthResult);
      
      // If critical services are failing, don't continue
      const criticalServices = ['authentication']; // Database management needs auth more than vehicle service
      const hasCriticalErrors = criticalServices.some(service => !healthResult[service as keyof ServiceHealth]);
      
      if (!hasCriticalErrors) {
        // Small delay to ensure services are ready
        setTimeout(() => setIsLoading(false), 500);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({
        database: false,
        authentication: false,
        localStorage: false,
        serviceWorker: false,
        indexedDB: false,
        errors: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performHealthCheck();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(count => count + 1);
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!health) {
    return <ErrorFallback error={new Error('Failed to check service health')} retry={handleRetry} />;
  }

  // Check if critical services are failing
  const criticalServices = ['authentication'];
  const hasCriticalErrors = criticalServices.some(service => !health[service as keyof ServiceHealth]);

  if (hasCriticalErrors) {
    return <ServiceHealthIndicator health={health} onRetry={handleRetry} />;
  }

  // All good, load the main component
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <LazyDatabase />
      </Suspense>
    </ErrorBoundary>
  );
};
