import { vehicleService } from '../services/database';

export interface ServiceInitializationResult {
  success: boolean;
  errors: string[];
  services: {
    database: boolean;
    authentication: boolean;
    localStorage: boolean;
    indexedDB: boolean;
  };
}

export const initializeServices = async (): Promise<ServiceInitializationResult> => {
  const result: ServiceInitializationResult = {
    success: false,
    errors: [],
    services: {
      database: false,
      authentication: false,
      localStorage: false,
      indexedDB: false,
    }
  };

  // Initialize localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    result.services.localStorage = true;
  } catch (error) {
    result.errors.push(`LocalStorage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Initialize IndexedDB
  try {
    if ('indexedDB' in window) {
      result.services.indexedDB = true;
    } else {
      result.errors.push('IndexedDB not supported in this browser');
    }
  } catch (error) {
    result.errors.push(`IndexedDB initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Initialize database service
  try {
    // Try to perform a simple database operation
    await vehicleService.getAllVehicles();
    result.services.database = true;
  } catch (error) {
    result.errors.push(`Database service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check authentication
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    result.services.authentication = !!token;
    if (!token) {
      result.errors.push('No authentication token found');
    }
  } catch (error) {
    result.errors.push(`Authentication check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Determine overall success
  const criticalServices = ['localStorage', 'indexedDB'];
  const criticalServicesFailing = criticalServices.some(service => !result.services[service as keyof typeof result.services]);
  result.success = !criticalServicesFailing && result.errors.length === 0;

  return result;
};

export const waitForServices = async (maxAttempts: number = 3, delay: number = 1000): Promise<ServiceInitializationResult> => {
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    console.log(`🔄 Service initialization attempt ${attempt}/${maxAttempts}`);
    
    const result = await initializeServices();
    
    if (result.success || result.services.localStorage && result.services.indexedDB) {
      console.log('✅ Services initialized successfully');
      return result;
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    attempt++;
  }
  
  const finalResult = await initializeServices();
  console.log('❌ Service initialization failed after all attempts');
  return finalResult;
};
