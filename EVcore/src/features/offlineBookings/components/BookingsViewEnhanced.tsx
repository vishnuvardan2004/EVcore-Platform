/**
 * Enhanced Bookings View Component
 * 
 * This component provides comprehensive booking management with Smart Bookings API integration,
 * including pagination, filtering, real-time updates, and error handling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Car,
  MapPin,
  Phone,
  MoreVertical,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar as CalendarIconSmall
} from 'lucide-react';
import { format, addDays, isToday, isTomorrow, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { bookingService, BookingData, BookingStats } from '../../../services/bookingService';
import { useOfflineSync } from '../../../hooks/useOfflineSync';

// Filter interface
interface BookingFilters {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  customerPhone?: string;
  vehicleNumber?: string;
}

// Pagination interface
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const BookingsViewEnhanced: React.FC = () => {
  // State management
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [stats, setStats] = useState<BookingStats | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<BookingFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const { toast } = useToast();
  const { isOnline } = useOfflineSync();

  // Load bookings and stats
  const loadBookings = useCallback(async (page = 1, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Prepare filter parameters
      const params = {
        page,
        limit: pagination.limit,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { bookingType: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(dateRange.from && { dateFrom: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange.to && { dateTo: format(dateRange.to, 'yyyy-MM-dd') }),
        ...filters
      };

      console.log('🔍 Loading bookings with params:', params);
      const data = await bookingService.getBookings(params);
      
      setBookings(data);
      
      // Update pagination (if using Smart Bookings API, it would return pagination info)
      // For now, calculate based on returned data
      setPagination(prev => ({
        ...prev,
        page,
        total: data.length >= prev.limit ? (page * prev.limit) + 1 : (page - 1) * prev.limit + data.length,
        totalPages: Math.ceil(((page - 1) * prev.limit + data.length) / prev.limit)
      }));

      console.log('✅ Bookings loaded successfully:', data.length);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      toast({
        title: "Error Loading Bookings",
        description: "Failed to load bookings. Please try again or check your connection.",
        variant: "destructive",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [pagination.limit, statusFilter, typeFilter, searchTerm, dateRange, filters, toast]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await bookingService.getBookingStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBookings();
    loadStats();
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings(pagination.page, false);
    await loadStats();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Booking data has been updated.",
    });
  };

  // Search functionality
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadBookings(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateRange({});
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
    loadBookings(1);
  };

  // Status update
  const handleStatusUpdate = async (bookingId: string, newStatus: BookingData['status']) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
          : booking
      ));

      toast({
        title: "Status Updated",
        description: `Booking status updated to ${newStatus}`,
      });
      
      // Refresh stats
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      await bookingService.cancelBooking(selectedBooking.id!, cancellationReason || 'Cancelled by user');
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { 
              ...booking, 
              status: 'cancelled' as const, 
              cancellationReason: cancellationReason || 'Cancelled by user',
              cancelledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            }
          : booking
      ));

      toast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled.",
      });
      
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancellationReason('');
      
      // Refresh stats
      loadStats();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    loadBookings(page);
  };

  // Status badge styling
  const getStatusBadge = (status: BookingData['status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: AlertCircle, color: 'text-yellow-600' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
      assigned: { variant: 'default' as const, icon: User, color: 'text-indigo-600' },
      in_progress: { variant: 'default' as const, icon: Car, color: 'text-green-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-700' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All Bookings
          </CardTitle>
          <CardDescription>Comprehensive booking management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.scheduledRides}</p>
                  <p className="text-sm text-gray-600">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
                  <p className="text-sm text-gray-600">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Bookings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                All Bookings
                {!isOnline && (
                  <Badge variant="destructive" className="text-xs">
                    Offline Mode
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Comprehensive booking management with real-time updates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by customer name, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} size="sm">
                Search
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="airport">Airport</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Pick date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">No bookings found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters or create a new booking</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.customerPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium capitalize">{booking.bookingType}</p>
                          {booking.subType && (
                            <p className="text-sm text-gray-500 capitalize">{booking.subType}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatDate(booking.scheduledDate)}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.scheduledTime}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {booking.vehicleNumber ? (
                            <p className="font-medium flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {booking.vehicleNumber}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Not assigned</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">₹{(booking.actualCost || booking.estimatedCost).toLocaleString()}</p>
                          <p className="text-sm text-gray-500 capitalize">{booking.paymentStatus}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <>
                              <Select
                                value={booking.status}
                                onValueChange={(value: BookingData['status']) => 
                                  handleStatusUpdate(booking.id!, value)
                                }
                              >
                                <SelectTrigger className="w-auto h-8 px-2">
                                  <Edit className="w-3 h-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCancelDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {pagination.page} of {pagination.totalPages}
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={pagination.page === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                      className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information for booking {selectedBooking?.bookingId || selectedBooking?.id?.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer</Label>
                  <p className="font-medium">{selectedBooking.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.customerPhone}</p>
                  {selectedBooking.customerEmail && (
                    <p className="text-sm text-gray-600">{selectedBooking.customerEmail}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Booking Type</Label>
                  <p className="font-medium capitalize">{selectedBooking.bookingType}</p>
                  {selectedBooking.subType && (
                    <p className="text-sm text-gray-600 capitalize">{selectedBooking.subType}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Schedule</Label>
                  <p className="font-medium">{formatDate(selectedBooking.scheduledDate)}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.scheduledTime}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>

                {selectedBooking.pickupLocation && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Pickup Location</Label>
                    <p className="font-medium">{selectedBooking.pickupLocation}</p>
                  </div>
                )}

                {selectedBooking.dropLocation && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Drop Location</Label>
                    <p className="font-medium">{selectedBooking.dropLocation}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-500">Payment</Label>
                  <p className="font-medium">₹{(selectedBooking.actualCost || selectedBooking.estimatedCost).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {selectedBooking.paymentMode} - {selectedBooking.paymentStatus}
                  </p>
                </div>

                {selectedBooking.vehicleNumber && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Vehicle</Label>
                    <p className="font-medium">{selectedBooking.vehicleNumber}</p>
                  </div>
                )}
              </div>

              {selectedBooking.specialRequests && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Special Requests</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {selectedBooking.cancellationReason && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cancellation Reason</Label>
                  <p className="text-sm bg-red-50 text-red-700 p-2 rounded">{selectedBooking.cancellationReason}</p>
                </div>
              )}

              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-xs font-medium text-gray-400">Created</Label>
                  <p>{selectedBooking.createdAt ? format(parseISO(selectedBooking.createdAt), 'PPp') : 'N/A'}</p>
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-400">Last Updated</Label>
                  <p>{selectedBooking.updatedAt ? format(parseISO(selectedBooking.updatedAt), 'PPp') : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking for {selectedBooking?.customerName}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowCancelDialog(false);
              setCancellationReason('');
            }}>
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
