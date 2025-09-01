/**
 * Enhanced Booking Service with Smart Bookings API Integration
 * 
 * This service provides a comprehensive booking management interface that integrates
 * with the production-ready Smart Bookings backend API while maintaining offline
 * support and backward compatibility.
 */

import { apiService } from './api';
import { smartBookingsAPI, SmartBooking, BookingStats as SmartBookingStats, BookingFilters } from './smartBookingsAPI';
import { useOfflineSync } from '../hooks/useOfflineSync';

// Legacy interface for backward compatibility
export interface BookingData {
  id?: string;
  _id?: string;
  bookingId?: string;
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
  paymentMode?: 'Cash' | 'UPI' | 'Part Payment' | 'Card' | 'Wallet';
  paymentStatus?: 'pending' | 'paid' | 'partial' | 'failed';
  partPaymentCash?: number;
  partPaymentUPI?: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  specialRequirements?: string;
  specialRequests?: string;
  distance?: number;
  estimatedDistance?: number;
  duration?: number;
  rating?: number;
  feedback?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  startTime?: string;
  endTime?: string;
  cancellationReason?: string;
}

// Updated stats interface
export interface BookingStats {
  totalBookings: number;
  scheduledRides: number;
  completedToday: number;
  pendingPayments: number;
  totalRevenue: number;
  averageRating: number;
  activeVehicles: number;
  topDestinations?: Array<{ location: string; count: number }>;
  revenueByType?: Record<string, number>;
  bookingsByStatus?: Record<string, number>;
  // New fields from backend
  averageCost?: number;
  statusBreakdown?: {
    pending: number;
    confirmed: number;
    assigned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  typeBreakdown?: {
    airport: number;
    rental: number;
    subscription: number;
  };
  paymentBreakdown?: {
    cash: number;
    upi: number;
    card: number;
    partPayment: number;
  };
  ratingStats?: {
    totalRatings: number;
    averageRating: number;
  };
  vehicleUtilization?: {
    uniqueVehicles: number;
  };
}

/**
 * Enhanced Booking Service Class
 */
class BookingService {
  private api = apiService;
  private smartAPI = smartBookingsAPI;
  private offlineStorage: string = 'smartBookings';
  private legacyStorage: string = 'bookings'; // For backward compatibility
  constructor() {
    // Initialize with offline support
  }

  /**
   * Convert SmartBooking to legacy BookingData format for backward compatibility
   */
  private convertToLegacyFormat(smartBooking: SmartBooking): BookingData {
    return {
      id: smartBooking._id,
      _id: smartBooking._id,
      bookingId: smartBooking.bookingId,
      customerName: smartBooking.customerName,
      customerPhone: smartBooking.customerPhone,
      customerEmail: smartBooking.customerEmail,
      bookingType: smartBooking.bookingType,
      subType: smartBooking.subType,
      pickupLocation: smartBooking.pickupLocation,
      dropLocation: smartBooking.dropLocation,
      scheduledDate: smartBooking.scheduledDate,
      scheduledTime: smartBooking.scheduledTime,
      vehicleNumber: smartBooking.vehicleNumber,
      estimatedCost: smartBooking.estimatedCost,
      actualCost: smartBooking.actualCost,
      paymentMode: smartBooking.paymentMode as any,
      paymentStatus: smartBooking.paymentStatus,
      status: smartBooking.status,
      specialRequirements: smartBooking.specialRequests,
      specialRequests: smartBooking.specialRequests,
      estimatedDistance: smartBooking.estimatedDistance,
      rating: smartBooking.rating,
      feedback: smartBooking.feedback,
      createdAt: smartBooking.createdAt,
      updatedAt: smartBooking.updatedAt,
      completedAt: smartBooking.completedAt,
      cancelledAt: smartBooking.cancelledAt,
      cancellationReason: smartBooking.cancellationReason
    };
  }

  /**
   * Convert legacy BookingData to SmartBooking format
   */
  private convertFromLegacyFormat(booking: Partial<BookingData>): Omit<SmartBooking, '_id' | 'bookingId' | 'createdAt' | 'updatedAt'> {
    return {
      customerName: booking.customerName || '',
      customerPhone: booking.customerPhone || '',
      customerEmail: booking.customerEmail,
      bookingType: booking.bookingType || 'airport',
      subType: booking.subType,
      scheduledDate: booking.scheduledDate || '',
      scheduledTime: booking.scheduledTime || '',
      pickupLocation: booking.pickupLocation || '',
      dropLocation: booking.dropLocation,
      estimatedCost: booking.estimatedCost || 0,
      actualCost: booking.actualCost,
      vehicleNumber: booking.vehicleNumber,
      paymentMode: booking.paymentMode as any,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequirements || booking.specialRequests,
      estimatedDistance: booking.distance || booking.estimatedDistance,
      status: booking.status || 'pending',
      rating: booking.rating,
      feedback: booking.feedback
    };
  }

  /**
   * Create new booking with Smart Bookings API
   */
  async createBooking(bookingData: Omit<BookingData, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<BookingData> {
    try {
      console.log('📝 Creating booking via Smart Bookings API...');

      // Convert to Smart Booking format
      const smartBookingData = this.convertFromLegacyFormat(bookingData);

      // Create via Smart Bookings API
      const smartBooking = await this.smartAPI.createBooking(smartBookingData);

      // Convert back to legacy format
      const legacyBooking = this.convertToLegacyFormat(smartBooking);

      console.log('✅ Booking created successfully:', legacyBooking);
      return legacyBooking;

    } catch (error) {
      console.error('❌ Smart Bookings API failed, falling back to offline storage:', error);

      // Fallback to offline storage
      const booking: BookingData = {
        ...bookingData,
        id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending'
      };

      await this.storeBookingLocally(booking);
      await this.queueForSync(booking, 'create');

      return booking;
    }
  }

  /**
   * Get all bookings with filtering and pagination
   */
  async getBookings(params?: {
    status?: string;
    type?: string;
    bookingType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    customerPhone?: string;
    vehicleNumber?: string;
    search?: string;
  }): Promise<BookingData[]> {
    try {
      console.log('📋 Fetching bookings via Smart Bookings API...');

      // Map legacy params to Smart Bookings API format
      const filters: BookingFilters = {
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
        bookingType: params?.bookingType || params?.type,
        customerPhone: params?.customerPhone,
        vehicleNumber: params?.vehicleNumber,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        search: params?.search
      };

      const response = await this.smartAPI.getBookings(filters);

      // Convert to legacy format
      const legacyBookings = response.data.map(booking => this.convertToLegacyFormat(booking));

      console.log('✅ Bookings fetched successfully:', legacyBookings.length);
      return legacyBookings;

    } catch (error) {
      console.warn('⚠️ Smart Bookings API unavailable, using local data:', error);
      return await this.getLocalBookings(params);
    }
  }

  /**
   * Get scheduled rides
   */
  async getScheduledRides(): Promise<BookingData[]> {
    try {
      console.log('📅 Fetching scheduled rides via Smart Bookings API...');

      const smartBookings = await this.smartAPI.getScheduledRides();
      const legacyBookings = smartBookings.map(booking => this.convertToLegacyFormat(booking));

      console.log('✅ Scheduled rides fetched successfully:', legacyBookings.length);
      return legacyBookings;

    } catch (error) {
      console.warn('⚠️ Smart Bookings API unavailable, using local data:', error);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return await this.getBookings({
        status: 'confirmed,assigned,pending',
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: tomorrow.toISOString().split('T')[0]
      });
    }
  }

  /**
   * Get completed rides
   */
  async getCompletedRides(days: number = 30): Promise<BookingData[]> {
    try {
      console.log('✅ Fetching completed rides via Smart Bookings API...');

      const smartBookings = await this.smartAPI.getCompletedRides(days);
      const legacyBookings = smartBookings.map(booking => this.convertToLegacyFormat(booking));

      console.log('✅ Completed rides fetched successfully:', legacyBookings.length);
      return legacyBookings;

    } catch (error) {
      console.warn('⚠️ Smart Bookings API unavailable, using local data:', error);

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      return await this.getBookings({
        status: 'completed',
        dateFrom: fromDate.toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      });
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(id: string, status: BookingData['status'], additionalData?: Partial<BookingData>): Promise<BookingData> {
    try {
      console.log('📝 Updating booking via Smart Bookings API...');

      // Prepare update data in Smart Booking format
      const updateData: Partial<SmartBooking> = {
        status,
        ...(additionalData && this.convertFromLegacyFormat(additionalData as BookingData))
      };

      const smartBooking = await this.smartAPI.updateBooking(id, updateData);
      const legacyBooking = this.convertToLegacyFormat(smartBooking);

      console.log('✅ Booking updated successfully:', legacyBooking);
      return legacyBooking;

    } catch (error) {
      console.warn('⚠️ Smart Bookings API unavailable, updating locally:', error);

      const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'completed' && { completedAt: new Date().toISOString() }),
        ...additionalData
      };

      const booking = await this.updateLocalBookingStatus(id, updateData);
      await this.queueForSync(booking, 'update');
      return booking;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason?: string): Promise<void> {
    try {
      console.log('❌ Cancelling booking via Smart Bookings API...');

      await this.smartAPI.cancelBooking(id, reason || 'Booking cancelled by user');
      console.log('✅ Booking cancelled successfully');

    } catch (error) {
      console.warn('⚠️ Smart Bookings API unavailable, cancelling locally:', error);
      
      await this.updateBookingStatus(id, 'cancelled', { 
        cancellationReason: reason || 'Booking cancelled by user',
        cancelledAt: new Date().toISOString()
      });
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(): Promise<BookingStats> {
    try {
      console.log('📊 Fetching stats via Smart Bookings API...');

      const smartStats = await this.smartAPI.getBookingStats();
      
      // Convert to legacy format with new fields
      const legacyStats: BookingStats = {
        totalBookings: smartStats.totalBookings,
        scheduledRides: (smartStats.statusBreakdown?.pending || 0) + 
                       (smartStats.statusBreakdown?.confirmed || 0) + 
                       (smartStats.statusBreakdown?.assigned || 0),
        completedToday: smartStats.statusBreakdown?.completed || 0,
        pendingPayments: smartStats.statusBreakdown?.pending || 0,
        totalRevenue: smartStats.totalRevenue,
        averageRating: smartStats.ratingStats?.averageRating || 0,
        activeVehicles: smartStats.vehicleUtilization?.uniqueVehicles || 0,
        
        // Enhanced fields from Smart Bookings API
        averageCost: smartStats.averageCost,
        statusBreakdown: smartStats.statusBreakdown,
        typeBreakdown: smartStats.typeBreakdown,
        paymentBreakdown: smartStats.paymentBreakdown,
        ratingStats: smartStats.ratingStats,
        vehicleUtilization: smartStats.vehicleUtilization,

        // Legacy compatibility fields (calculated from new data)
        revenueByType: {
          airport: smartStats.typeBreakdown?.airport || 0,
          rental: smartStats.typeBreakdown?.rental || 0,
          subscription: smartStats.typeBreakdown?.subscription || 0
        },
        bookingsByStatus: {
          pending: smartStats.statusBreakdown?.pending || 0,
          confirmed: smartStats.statusBreakdown?.confirmed || 0,
          assigned: smartStats.statusBreakdown?.assigned || 0,
          in_progress: smartStats.statusBreakdown?.in_progress || 0,
          completed: smartStats.statusBreakdown?.completed || 0,
          cancelled: smartStats.statusBreakdown?.cancelled || 0
        }
      };

      console.log('✅ Stats fetched successfully:', legacyStats);
      return legacyStats;

    } catch (error) {
      console.warn('⚠️ Smart Bookings API unavailable, calculating stats locally:', error);
      return await this.calculateLocalStats();
    }
  }

  /**
   * Get booking by ID (supports both MongoDB ObjectId and booking ID)
   */
  async getBookingById(id: string): Promise<BookingData | null> {
    try {
      let smartBooking: SmartBooking;

      // Check if it's a booking ID format (SB...)
      if (id.startsWith('SB') && id.length === 17) {
        smartBooking = await this.smartAPI.getBookingByBookingId(id);
      } else {
        smartBooking = await this.smartAPI.getBookingById(id);
      }

      return this.convertToLegacyFormat(smartBooking);

    } catch (error) {
      console.warn('⚠️ Smart Bookings API unavailable, checking local data:', error);
      
      // Fallback to local storage lookup
      const bookings = await this.getLocalBookings();
      const booking = bookings.find(b => b.id === id || b.bookingId === id);
      return booking || null;
    }
  }

  // ========================================
  // LEGACY METHODS FOR BACKWARD COMPATIBILITY
  // ========================================

  /**
   * Private methods for local storage operations (offline support)
   */
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

  private async updateLocalBookingStatus(id: string, updateData: Partial<BookingData>): Promise<BookingData> {
    const bookings = await this.getLocalBookings();
    const bookingIndex = bookings.findIndex(b => b.id === id);
    
    if (bookingIndex >= 0) {
      bookings[bookingIndex] = { ...bookings[bookingIndex], ...updateData };
      localStorage.setItem(this.offlineStorage, JSON.stringify(bookings));
      return bookings[bookingIndex];
    }
    
    throw new Error('Booking not found');
  }

  private async getLocalBookings(params?: {
    status?: string;
    type?: string;
    bookingType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    customerPhone?: string;
    vehicleNumber?: string;
    search?: string;
  }): Promise<BookingData[]> {
    try {
      const stored = localStorage.getItem(this.offlineStorage);
      let bookings: BookingData[] = stored ? JSON.parse(stored) : [];
      
      // Also check legacy storage
      const legacyStored = localStorage.getItem(this.legacyStorage);
      if (legacyStored) {
        const legacyBookings: BookingData[] = JSON.parse(legacyStored);
        bookings = [...bookings, ...legacyBookings.filter(lb => 
          !bookings.some(b => b.id === lb.id)
        )];
      }

      // Apply filters
      if (params) {
        if (params.status) {
          const statusFilters = params.status.split(',');
          bookings = bookings.filter(b => statusFilters.includes(b.status));
        }
        
        if (params.bookingType || params.type) {
          const type = params.bookingType || params.type;
          bookings = bookings.filter(b => b.bookingType === type);
        }
        
        if (params.customerPhone) {
          bookings = bookings.filter(b => b.customerPhone === params.customerPhone);
        }
        
        if (params.vehicleNumber) {
          bookings = bookings.filter(b => b.vehicleNumber?.toUpperCase() === params.vehicleNumber?.toUpperCase());
        }
        
        if (params.dateFrom && params.dateTo) {
          const fromDate = new Date(params.dateFrom);
          const toDate = new Date(params.dateTo);
          bookings = bookings.filter(b => {
            const bookingDate = new Date(b.scheduledDate);
            return bookingDate >= fromDate && bookingDate <= toDate;
          });
        }
        
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          bookings = bookings.filter(b =>
            b.customerName.toLowerCase().includes(searchLower) ||
            b.customerPhone.includes(params.search!) ||
            b.pickupLocation?.toLowerCase().includes(searchLower) ||
            b.dropLocation?.toLowerCase().includes(searchLower)
          );
        }
      }

      // Sort by creation date (newest first)
      bookings.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      // Apply pagination
      if (params?.page && params?.limit) {
        const start = (params.page - 1) * params.limit;
        const end = start + params.limit;
        bookings = bookings.slice(start, end);
      }

      return bookings;
    } catch (error) {
      console.error('Failed to get local bookings:', error);
      return [];
    }
  }

  private async updateLocalCache(bookings: BookingData[]): Promise<void> {
    localStorage.setItem(this.offlineStorage, JSON.stringify(bookings));
  }

  private async queueForSync(booking: BookingData, operation: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      syncQueue.push({
        id: booking.id,
        data: booking,
        operation,
        timestamp: Date.now()
      });
      localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    } catch (error) {
      console.error('Failed to queue for sync:', error);
    }
  }

  private async calculateLocalStats(): Promise<BookingStats> {
    try {
      const bookings = await this.getLocalBookings();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const stats: BookingStats = {
        totalBookings: bookings.length,
        scheduledRides: bookings.filter(b => 
          ['pending', 'confirmed', 'assigned'].includes(b.status) &&
          b.scheduledDate >= today
        ).length,
        completedToday: bookings.filter(b => 
          b.status === 'completed' &&
          b.completedAt?.split('T')[0] === today
        ).length,
        pendingPayments: bookings.filter(b => 
          b.paymentStatus === 'pending' || b.paymentStatus === 'partial'
        ).length,
        totalRevenue: bookings.reduce((sum, b) => 
          sum + (b.actualCost || b.estimatedCost), 0
        ),
        averageRating: bookings.filter(b => b.rating).length > 0 ?
          bookings.reduce((sum, b) => sum + (b.rating || 0), 0) / 
          bookings.filter(b => b.rating).length : 0,
        activeVehicles: new Set(bookings
          .filter(b => b.vehicleNumber && b.status !== 'cancelled')
          .map(b => b.vehicleNumber)
        ).size,
        
        // Calculate breakdown stats
        statusBreakdown: {
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          assigned: bookings.filter(b => b.status === 'assigned').length,
          in_progress: bookings.filter(b => b.status === 'in_progress').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length
        },
        
        typeBreakdown: {
          airport: bookings.filter(b => b.bookingType === 'airport').length,
          rental: bookings.filter(b => b.bookingType === 'rental').length,
          subscription: bookings.filter(b => b.bookingType === 'subscription').length
        },
        
        // Legacy compatibility fields
        revenueByType: {
          airport: bookings.filter(b => b.bookingType === 'airport')
            .reduce((sum, b) => sum + (b.actualCost || b.estimatedCost), 0),
          rental: bookings.filter(b => b.bookingType === 'rental')
            .reduce((sum, b) => sum + (b.actualCost || b.estimatedCost), 0),
          subscription: bookings.filter(b => b.bookingType === 'subscription')
            .reduce((sum, b) => sum + (b.actualCost || b.estimatedCost), 0)
        },
        
        bookingsByStatus: {
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          assigned: bookings.filter(b => b.status === 'assigned').length,
          in_progress: bookings.filter(b => b.status === 'in_progress').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length
        }
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to calculate local stats:', error);
      // Return empty stats
      return {
        totalBookings: 0,
        scheduledRides: 0,
        completedToday: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        averageRating: 0,
        activeVehicles: 0,
        revenueByType: { airport: 0, rental: 0, subscription: 0 },
        bookingsByStatus: { pending: 0, confirmed: 0, assigned: 0, in_progress: 0, completed: 0, cancelled: 0 }
      };
    }
  }
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
