import { apiService } from './api';
import { useOfflineSync } from '../hooks/useOfflineSync';

export interface BookingData {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingType: 'airport' | 'rental' | 'subscription';
  subType?: 'pickup' | 'drop' | 'package' | 'monthly' | 'quarterly' | 'yearly';
  pickupLocation?: string;
  dropLocation?: string;
  scheduledDate: string;
  scheduledTime: string;
  pilotName?: string;
  vehicleNumber?: string;
  estimatedCost: number;
  actualCost?: number;
  paymentMode: 'Cash' | 'UPI' | 'Part Payment' | 'Card' | 'Wallet';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'failed';
  partPaymentCash?: number;
  partPaymentUPI?: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  specialRequirements?: string;
  distance?: number;
  duration?: number;
  rating?: number;
  feedback?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  startTime?: string;
  endTime?: string;
}

export interface BookingStats {
  totalBookings: number;
  scheduledRides: number;
  completedToday: number;
  pendingPayments: number;
  totalRevenue: number;
  averageRating: number;
  activeVehicles: number;
  topDestinations: Array<{ location: string; count: number }>;
  revenueByType: Record<string, number>;
  bookingsByStatus: Record<string, number>;
}

class BookingService {
  private api = apiService;
  private offlineStorage: string = 'smartBookings';

  constructor() {
    // Removed APIService instantiation
  }

  // Create new booking with offline support
  async createBooking(bookingData: Omit<BookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<BookingData> {
    const booking: BookingData = {
      ...bookingData,
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      // Try to create booking via API
      const response = await this.api.bookings.create(booking);
      
      if (response.success) {
        // Update local storage with server response
        await this.updateLocalBooking(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.warn('API unavailable, storing booking locally:', error);
      
      // Store locally for offline sync
      await this.storeBookingLocally(booking);
      
      // Queue for sync when online
      await this.queueForSync(booking, 'create');
      
      return booking;
    }
  }

  // Get all bookings with filtering and pagination
  async getBookings(params?: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingData[]> {
    try {
      const response = await this.api.bookings.getAll(params);
      if (response.success) {
        // Update local cache
        await this.updateLocalCache(response.data);
        return response.data;
      }
    } catch (error) {
      console.warn('API unavailable, using local data:', error);
    }
    
    // Fallback to local data
    return await this.getLocalBookings(params);
  }

  // Get scheduled rides
  async getScheduledRides(): Promise<BookingData[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await this.getBookings({
      status: 'confirmed,assigned,pending',
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: tomorrow.toISOString().split('T')[0]
    });
  }

  // Get completed rides
  async getCompletedRides(days: number = 30): Promise<BookingData[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    return await this.getBookings({
      status: 'completed',
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    });
  }

  // Update booking status
  async updateBookingStatus(id: string, status: BookingData['status'], additionalData?: Partial<BookingData>): Promise<BookingData> {
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'completed' && { completedAt: new Date().toISOString() }),
      ...additionalData
    };

    try {
      const response = await this.api.bookings.update(id, updateData);
      if (response.success) {
        await this.updateLocalBooking(response.data);
        return response.data;
      }
    } catch (error) {
      console.warn('API unavailable, updating locally:', error);
    }
    
    // Update locally
    const booking = await this.updateLocalBookingStatus(id, updateData);
    await this.queueForSync(booking, 'update');
    return booking;
  }

  // Cancel booking
  async cancelBooking(id: string, reason?: string): Promise<void> {
    try {
      await this.api.bookings.cancel(id, reason);
    } catch (error) {
      console.warn('API unavailable, cancelling locally:', error);
    }
    
    await this.updateBookingStatus(id, 'cancelled', { 
      specialRequirements: reason ? `Cancelled: ${reason}` : 'Cancelled' 
    });
  }

  // Get booking statistics
  async getBookingStats(): Promise<BookingStats> {
    try {
      // Try to get stats from API first
      const response = await this.api.request<BookingStats>('/api/bookings/stats');
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('API unavailable, calculating stats locally:', error);
    }
    
    // Calculate stats from local data
    return await this.calculateLocalStats();
  }

  // Private methods for local storage operations
  private async storeBookingLocally(booking: BookingData): Promise<void> {
    const bookings = await this.getLocalBookings();
    const existingIndex = bookings.findIndex(b => b.id === booking.id);
    
    if (existingIndex >= 0) {
      bookings[existingIndex] = booking;
    } else {
      bookings.push(booking);
    }
    
    localStorage.setItem(this.offlineStorage, JSON.stringify(bookings));
  }

  private async updateLocalBooking(booking: BookingData): Promise<void> {
    await this.storeBookingLocally(booking);
  }

  private async getLocalBookings(params?: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingData[]> {
    const stored = localStorage.getItem(this.offlineStorage);
    let bookings: BookingData[] = stored ? JSON.parse(stored) : [];
    
    // Apply filters
    if (params) {
      if (params.status) {
        const statuses = params.status.split(',');
        bookings = bookings.filter(b => statuses.includes(b.status));
      }
      
      if (params.type) {
        bookings = bookings.filter(b => b.bookingType === params.type);
      }
      
      if (params.dateFrom) {
        bookings = bookings.filter(b => b.scheduledDate >= params.dateFrom!);
      }
      
      if (params.dateTo) {
        bookings = bookings.filter(b => b.scheduledDate <= params.dateTo!);
      }
      
      // Pagination
      if (params.page && params.limit) {
        const start = (params.page - 1) * params.limit;
        bookings = bookings.slice(start, start + params.limit);
      }
    }
    
    return bookings.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  private async updateLocalBookingStatus(id: string, updateData: Partial<BookingData>): Promise<BookingData> {
    const bookings = await this.getLocalBookings();
    const bookingIndex = bookings.findIndex(b => b.id === id);
    
    if (bookingIndex === -1) {
      throw new Error('Booking not found');
    }
    
    bookings[bookingIndex] = { ...bookings[bookingIndex], ...updateData };
    localStorage.setItem(this.offlineStorage, JSON.stringify(bookings));
    
    return bookings[bookingIndex];
  }

  private async updateLocalCache(serverBookings: BookingData[]): Promise<void> {
    localStorage.setItem(this.offlineStorage, JSON.stringify(serverBookings));
  }

  private async queueForSync(booking: BookingData, operation: 'create' | 'update'): Promise<void> {
    const pendingSync = JSON.parse(localStorage.getItem('pendingBookingSync') || '[]');
    
    pendingSync.push({
      id: `${operation}_${booking.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'booking',
      operation,
      data: booking
    });
    
    localStorage.setItem('pendingBookingSync', JSON.stringify(pendingSync));
  }

  private async calculateLocalStats(): Promise<BookingStats> {
    const allBookings = await this.getLocalBookings();
    const today = new Date().toISOString().split('T')[0];
    
    const totalBookings = allBookings.length;
    const scheduledRides = allBookings.filter(b => 
      ['confirmed', 'assigned', 'pending'].includes(b.status) &&
      b.scheduledDate >= today
    ).length;
    
    const completedToday = allBookings.filter(b => 
      b.status === 'completed' && 
      b.completedAt?.split('T')[0] === today
    ).length;
    
    const pendingPayments = allBookings.filter(b => 
      b.paymentStatus === 'pending' || b.paymentStatus === 'partial'
    ).length;
    
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.actualCost || b.estimatedCost), 0);
    
    const ratedBookings = completedBookings.filter(b => b.rating);
    const averageRating = ratedBookings.length > 0 
      ? ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBookings.length 
      : 0;
    
    const activeVehicles = new Set(
      allBookings
        .filter(b => ['confirmed', 'assigned', 'in_progress'].includes(b.status))
        .map(b => b.vehicleNumber)
        .filter(Boolean)
    ).size;
    
    // Calculate top destinations
    const destinationCounts: Record<string, number> = {};
    allBookings.forEach(b => {
      if (b.dropLocation) {
        destinationCounts[b.dropLocation] = (destinationCounts[b.dropLocation] || 0) + 1;
      }
    });
    
    const topDestinations = Object.entries(destinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));
    
    // Revenue by type
    const revenueByType: Record<string, number> = {};
    completedBookings.forEach(b => {
      const revenue = b.actualCost || b.estimatedCost;
      revenueByType[b.bookingType] = (revenueByType[b.bookingType] || 0) + revenue;
    });
    
    // Bookings by status
    const bookingsByStatus: Record<string, number> = {};
    allBookings.forEach(b => {
      bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
    });
    
    return {
      totalBookings,
      scheduledRides,
      completedToday,
      pendingPayments,
      totalRevenue,
      averageRating,
      activeVehicles,
      topDestinations,
      revenueByType,
      bookingsByStatus
    };
  }

  // Sync pending submissions when online
  async syncPendingSubmissions(): Promise<void> {
    const pendingSync = JSON.parse(localStorage.getItem('pendingBookingSync') || '[]');
    
    if (pendingSync.length === 0) return;
    
    const synced = [];
    
    for (const item of pendingSync) {
      try {
        if (item.operation === 'create') {
          await this.api.bookings.create(item.data);
        } else if (item.operation === 'update') {
          await this.api.bookings.update(item.data.id, item.data);
        }
        synced.push(item.id);
      } catch (error) {
        console.error('Failed to sync booking:', item.id, error);
      }
    }
    
    // Remove synced items
    const remaining = pendingSync.filter((item: any) => !synced.includes(item.id));
    localStorage.setItem('pendingBookingSync', JSON.stringify(remaining));
  }
}

export const bookingService = new BookingService();
