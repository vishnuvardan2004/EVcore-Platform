import { vehicleService } from '../services/database';

export interface ServiceHealth {
  database: boolean;
  authentication: boolean;
  localStorage: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;
  errors: string[];
}

export const checkServiceHealth = async (): Promise<ServiceHealth> => {
  const health: ServiceHealth = {
    database: false,
    authentication: false,
    localStorage: false,
    serviceWorker: false,
    indexedDB: false,
    errors: []
  };

  try {
    // Check localStorage
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    health.localStorage = true;
  } catch (error) {
    health.errors.push(`LocalStorage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Check IndexedDB
    if ('indexedDB' in window) {
      health.indexedDB = true;
    } else {
      health.errors.push('IndexedDB not supported');
    }
  } catch (error) {
    health.errors.push(`IndexedDB failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Check Service Worker
    if ('serviceWorker' in navigator) {
      health.serviceWorker = true;
    }
  } catch (error) {
    health.errors.push(`ServiceWorker failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Check database service
    await vehicleService.getAllVehicles();
    health.database = true;
  } catch (error) {
    health.errors.push(`Database service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Check authentication
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    health.authentication = !!token;
    if (!token) {
      health.errors.push('No authentication token found');
    }
  } catch (error) {
    health.errors.push(`Authentication check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return health;
};

export const logServiceHealth = async (): Promise<void> => {
  const health = await checkServiceHealth();
  console.group('🔍 Service Health Check');
  console.log('Database:', health.database ? '✅' : '❌');
  console.log('Authentication:', health.authentication ? '✅' : '❌');
  console.log('LocalStorage:', health.localStorage ? '✅' : '❌');
  console.log('ServiceWorker:', health.serviceWorker ? '✅' : '❌');
  console.log('IndexedDB:', health.indexedDB ? '✅' : '❌');
  if (health.errors.length > 0) {
    console.warn('Errors:', health.errors);
  }
  console.groupEnd();
};
