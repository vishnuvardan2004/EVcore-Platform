/**
 * Smart Bookings API Service
 * 
 * This service provides comprehensive API integration for Smart Bookings functionality
 * with the production-ready backend. It handles authentication, error management,
 * pagination, filtering, and provides a clean interface for all booking operations.
 */

import { apiService } from './api';
import type { APIResponse } from './api';

// Types matching the backend API
export interface SmartBooking {
  _id?: string;
  bookingId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingType: 'airport' | 'rental' | 'subscription';
  subType?: 'pickup' | 'drop' | 'package' | 'monthly' | 'quarterly' | 'yearly';
  scheduledDate: string; // ISO string
  scheduledTime: string; // HH:MM format
  pickupLocation: string;
  dropLocation?: string;
  estimatedDistance?: number;
  estimatedCost: number;
  actualCost?: number;
  vehicleNumber?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Card' | 'Part Payment';
  paymentStatus?: 'pending' | 'paid' | 'partial' | 'failed';
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  rating?: number;
  feedback?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  updatedBy?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  cancelledBy?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  bookingType?: string;
  customerPhone?: string;
  vehicleNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  averageCost: number;
  statusBreakdown: {
    pending: number;
    confirmed: number;
    assigned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  typeBreakdown: {
    airport: number;
    rental: number;
    subscription: number;
  };
  paymentBreakdown: {
    cash: number;
    upi: number;
    card: number;
    partPayment: number;
  };
  ratingStats: {
    totalRatings: number;
    averageRating: number;
  };
  vehicleUtilization: {
    uniqueVehicles: number;
  };
  period?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface BookingTrend {
  date: string;
  bookingsCount: number;
  revenue: number;
  completedBookings: number;
  cancelledBookings: number;
  successRate: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
}

export interface BookingListResponse {
  success: boolean;
  data: SmartBooking[];
  pagination: PaginationInfo;
}

export interface BookingResponse {
  success: boolean;
  data: SmartBooking;
  message?: string;
}

export interface StatsResponse {
  success: boolean;
  data: BookingStats;
}

export interface TrendsResponse {
  success: boolean;
  data: BookingTrend[];
}

export interface CancelResponse {
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    status: string;
    cancelledAt: string;
    reason: string;
  };
}

/**
 * Smart Bookings API Service Class
 */
class SmartBookingsAPIService {
  private baseEndpoint = '/api/smart-bookings';

  /**
   * Create a new booking
   */
  async createBooking(bookingData: Omit<SmartBooking, '_id' | 'bookingId' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SmartBooking> {
    try {
      console.log('🚀 Creating booking:', bookingData);

      const response = await apiService.request<SmartBooking>(
        this.baseEndpoint,
        {
          method: 'POST',
          body: JSON.stringify(bookingData),
        }
      );

      if (response.success) {
        console.log('✅ Booking created successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('❌ Create booking failed:', error);
      
      // Handle validation errors specifically
      if (error.status === 400 && error.errors) {
        const validationMessages = error.errors.map((e: any) => e.message).join(', ');
        throw new Error(`Validation failed: ${validationMessages}`);
      }
      
      throw error;
    }
  }

  /**
   * Get bookings with filtering and pagination
   */
  async getBookings(filters: BookingFilters = {}): Promise<BookingListResponse> {
    try {
      console.log('📋 Fetching bookings with filters:', filters);

      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint;

      const response = await apiService.request<BookingListResponse>(endpoint);

      if (response.success) {
        console.log('✅ Bookings fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('❌ Get bookings failed:', error);
      throw error;
    }
  }

  /**
   * Get active bookings (non-cancelled)
   */
  async getActiveBookings(filters: Omit<BookingFilters, 'status'> = {}): Promise<BookingListResponse> {
    try {
      console.log('📋 Fetching active bookings with filters:', filters);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseEndpoint}/active?${queryString}` : `${this.baseEndpoint}/active`;

      const response = await apiService.request<BookingListResponse>(endpoint);

      if (response.success) {
        console.log('✅ Active bookings fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch active bookings');
      }
    } catch (error) {
      console.error('❌ Get active bookings failed:', error);
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<SmartBooking> {
    try {
      console.log('🔍 Fetching booking by ID:', id);

      const response = await apiService.request<SmartBooking>(`${this.baseEndpoint}/${id}`);

      if (response.success) {
        console.log('✅ Booking fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Booking not found');
      }
    } catch (error) {
      console.error('❌ Get booking by ID failed:', error);
      throw error;
    }
  }

  /**
   * Get booking by booking ID (string format like SB2025090100001)
   */
  async getBookingByBookingId(bookingId: string): Promise<SmartBooking> {
    try {
      console.log('🔍 Fetching booking by booking ID:', bookingId);

      const response = await apiService.request<SmartBooking>(`${this.baseEndpoint}/booking-id/${bookingId}`);

      if (response.success) {
        console.log('✅ Booking fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Booking not found');
      }
    } catch (error) {
      console.error('❌ Get booking by booking ID failed:', error);
      throw error;
    }
  }

  /**
   * Update booking
   */
  async updateBooking(id: string, updates: Partial<SmartBooking>): Promise<SmartBooking> {
    try {
      console.log('📝 Updating booking:', id, updates);

      const response = await apiService.request<SmartBooking>(
        `${this.baseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );

      if (response.success) {
        console.log('✅ Booking updated successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update booking');
      }
    } catch (error: any) {
      console.error('❌ Update booking failed:', error);
      
      // Handle validation errors
      if (error.status === 400 && error.errors) {
        const validationMessages = error.errors.map((e: any) => e.message).join(', ');
        throw new Error(`Validation failed: ${validationMessages}`);
      }
      
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason: string): Promise<CancelResponse> {
    try {
      console.log('❌ Cancelling booking:', id, 'Reason:', reason);

      const response = await apiService.request<CancelResponse>(
        `${this.baseEndpoint}/${id}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ reason }),
        }
      );

      if (response.success) {
        console.log('✅ Booking cancelled successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('❌ Cancel booking failed:', error);
      throw error;
    }
  }

  /**
   * Get customer bookings
   */
  async getCustomerBookings(phone: string, filters: Omit<BookingFilters, 'customerPhone'> = {}): Promise<BookingListResponse> {
    try {
      console.log('👤 Fetching customer bookings for:', phone);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseEndpoint}/customer/${phone}?${queryString}` : `${this.baseEndpoint}/customer/${phone}`;

      const response = await apiService.request<BookingListResponse>(endpoint);

      if (response.success) {
        console.log('✅ Customer bookings fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch customer bookings');
      }
    } catch (error) {
      console.error('❌ Get customer bookings failed:', error);
      throw error;
    }
  }

  /**
   * Get vehicle bookings
   */
  async getVehicleBookings(vehicleNumber: string, filters: Omit<BookingFilters, 'vehicleNumber'> = {}): Promise<BookingListResponse> {
    try {
      console.log('🚗 Fetching vehicle bookings for:', vehicleNumber);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseEndpoint}/vehicle/${vehicleNumber}?${queryString}` : `${this.baseEndpoint}/vehicle/${vehicleNumber}`;

      const response = await apiService.request<BookingListResponse>(endpoint);

      if (response.success) {
        console.log('✅ Vehicle bookings fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch vehicle bookings');
      }
    } catch (error) {
      console.error('❌ Get vehicle bookings failed:', error);
      throw error;
    }
  }

  /**
   * Get bookings by status
   */
  async getBookingsByStatus(status: string, filters: Omit<BookingFilters, 'status'> = {}): Promise<BookingListResponse> {
    try {
      console.log('📊 Fetching bookings by status:', status);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseEndpoint}/status/${status}?${queryString}` : `${this.baseEndpoint}/status/${status}`;

      const response = await apiService.request<BookingListResponse>(endpoint);

      if (response.success) {
        console.log('✅ Status-based bookings fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch bookings by status');
      }
    } catch (error) {
      console.error('❌ Get bookings by status failed:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(period?: 'all' | 'today' | 'week' | 'month' | 'custom', dateFrom?: string, dateTo?: string): Promise<BookingStats> {
    try {
      console.log('📊 Fetching booking statistics:', { period, dateFrom, dateTo });

      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseEndpoint}/analytics/stats?${queryString}` : `${this.baseEndpoint}/analytics/stats`;

      const response = await apiService.request<BookingStats>(endpoint);

      if (response.success) {
        console.log('✅ Booking stats fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch booking statistics');
      }
    } catch (error) {
      console.error('❌ Get booking stats failed:', error);
      throw error;
    }
  }

  /**
   * Get booking trends
   */
  async getBookingTrends(days: number = 30): Promise<BookingTrend[]> {
    try {
      console.log('📈 Fetching booking trends for days:', days);

      const response = await apiService.request<BookingTrend[]>(`${this.baseEndpoint}/analytics/trends?days=${days}`);

      if (response.success) {
        console.log('✅ Booking trends fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch booking trends');
      }
    } catch (error) {
      console.error('❌ Get booking trends failed:', error);
      throw error;
    }
  }

  /**
   * Get scheduled rides (confirmed/assigned/pending for today and tomorrow)
   */
  async getScheduledRides(): Promise<SmartBooking[]> {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await this.getBookings({
      status: 'pending,confirmed,assigned',
      dateFrom: today,
      dateTo: tomorrow,
      sortBy: 'scheduledDate',
      sortOrder: 'asc'
    });

    return response.data;
  }

  /**
   * Get completed rides (last 30 days by default)
   */
  async getCompletedRides(days: number = 30): Promise<SmartBooking[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const toDate = new Date();

    const response = await this.getBookings({
      status: 'completed',
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: toDate.toISOString().split('T')[0],
      sortBy: 'completedAt',
      sortOrder: 'desc'
    });

    return response.data;
  }
}

// Export singleton instance
export const smartBookingsAPI = new SmartBookingsAPIService();
export default smartBookingsAPI;
