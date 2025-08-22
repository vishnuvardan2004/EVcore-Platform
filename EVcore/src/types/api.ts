// API Response Types
export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  permissions?: string[];
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'employee'
  | 'pilot';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresAt: string;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  registrationNumber: string;
  styleClass: VehicleStyleClass;
  brand: string;
  model: string;
  vin: string;
  type: VehicleType;
  status: VehicleStatus;
  location?: string;
  purchaseDate: string;
  warrantyExpiry: string;
  mileage?: number;
  batteryCapacity?: number;
  chargingType?: string;
  insuranceExpiry?: string;
  maintenanceSchedule?: MaintenanceRecord[];
  documents?: VehicleDocument[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type VehicleStatus = 'Available' | 'In Use' | 'Maintenance' | 'Out of Service';
export type VehicleStyleClass = 'SUV' | 'Sedan' | 'Hatchback' | 'Coupe' | 'Truck' | 'Van';
export type VehicleType = 'Electric' | 'Hybrid' | 'Petrol' | 'Diesel';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'scheduled' | 'repair' | 'inspection';
  description: string;
  cost: number;
  performedBy: string;
  performedAt: string;
  nextDueDate?: string;
  documents?: string[];
}

export interface VehicleDocument {
  id: string;
  type: 'registration' | 'insurance' | 'warranty' | 'manual' | 'other';
  name: string;
  url: string;
  expiryDate?: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Booking Types
export interface Booking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  customer: Customer;
  vehicle?: Vehicle;
  driver?: User;
  pickupLocation: string;
  dropLocation?: string;
  scheduledDate: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  distance?: number;
  fare: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  cancellationReason?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type BookingType = 'airport' | 'rental' | 'subscription' | 'emergency';
export type BookingStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  isVerified: boolean;
  totalBookings: number;
  averageRating?: number;
  createdAt: string;
}

// Dashboard Types
export interface DashboardStats {
  vehicles: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
  };
  bookings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    target: number;
  };
  drivers: {
    total: number;
    active: number;
    onDuty: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'booking' | 'vehicle' | 'user' | 'maintenance';
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  metadata?: any;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Filter Types
export interface VehicleFilters extends PaginationParams {
  search?: string;
  status?: VehicleStatus;
  type?: VehicleType;
  styleClass?: VehicleStyleClass;
  brand?: string;
  location?: string;
}

export interface BookingFilters extends PaginationParams {
  search?: string;
  status?: BookingStatus;
  type?: BookingType;
  dateFrom?: string;
  dateTo?: string;
  vehicleId?: string;
  driverId?: string;
}

export interface UserFilters extends PaginationParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: number;
}

export interface RealTimeUpdate {
  type: 'vehicle_status' | 'booking_update' | 'driver_location' | 'system_alert';
  id: string;
  data: any;
  timestamp: string;
}

// Export all types - just the file, not as object
export type * from './api';
