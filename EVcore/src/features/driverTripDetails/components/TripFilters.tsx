import React from 'react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { X, Filter, Calendar, DollarSign } from 'lucide-react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { TripMode, PaymentMode, TripStatus } from '../types';

export const TripFilters: React.FC = () => {
  const { state, setFilters, clearFilters } = useTripDetails();
  const { filters } = state;

  const tripModes: TripMode[] = [
    'EVZIP App', 'Rental Package', 'Subscription', 'Airport', 
    'UBER', 'Rapido', 'Direct Booking', 'Corporate'
  ];

  const paymentModes: PaymentMode[] = [
    'Cash', 'UPI - QR', 'Wallet', 'Card', 'Uber', 'Bank Transfer', 'Pending'
  ];

  const statusOptions: TripStatus[] = [
    'completed', 'active', 'pending', 'cancelled', 'disputed'
  ];

  const handleStatusFilter = (status: TripStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handlePaymentModeFilter = (mode: PaymentMode) => {
    const currentModes = filters.paymentMode || [];
    const newModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    
    setFilters({ paymentMode: newModes.length > 0 ? newModes : undefined });
  };

  const handleTripModeFilter = (mode: TripMode) => {
    const currentModes = filters.tripMode || [];
    const newModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    
    setFilters({ tripMode: newModes.length > 0 ? newModes : undefined });
  };

  const handleAmountRangeFilter = (field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    const currentRange = filters.amountRange || { min: 0, max: 0 };
    
    const newRange = {
      ...currentRange,
      [field]: numValue
    };
    
    setFilters({ 
      amountRange: (newRange.min > 0 || newRange.max > 0) ? newRange : undefined 
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.paymentMode?.length) count++;
    if (filters.tripMode?.length) count++;
    if (filters.amountRange?.min || filters.amountRange?.max) count++;
    if (filters.dateRange) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trip Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Trip Status</Label>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={filters.status?.includes(status) ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(status)}
                className="text-xs h-7"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Payment Mode Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Payment Mode</Label>
          <div className="flex flex-wrap gap-1">
            {paymentModes.slice(0, 4).map((mode) => (
              <Button
                key={mode}
                variant={filters.paymentMode?.includes(mode) ? "default" : "outline"}
                size="sm"
                onClick={() => handlePaymentModeFilter(mode)}
                className="text-xs h-7"
              >
                {mode}
              </Button>
            ))}
          </div>
          {paymentModes.length > 4 && (
            <Select onValueChange={(value) => handlePaymentModeFilter(value as PaymentMode)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="More..." />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.slice(4).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Trip Mode Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Trip Mode</Label>
          <div className="flex flex-wrap gap-1">
            {tripModes.slice(0, 3).map((mode) => (
              <Button
                key={mode}
                variant={filters.tripMode?.includes(mode) ? "default" : "outline"}
                size="sm"
                onClick={() => handleTripModeFilter(mode)}
                className="text-xs h-7"
              >
                {mode}
              </Button>
            ))}
          </div>
          <Select onValueChange={(value) => handleTripModeFilter(value as TripMode)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select mode..." />
            </SelectTrigger>
            <SelectContent>
              {tripModes.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Amount Range
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.amountRange?.min || ''}
              onChange={(e) => handleAmountRangeFilter('min', e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.amountRange?.max || ''}
              onChange={(e) => handleAmountRangeFilter('max', e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Filters:</Label>
          <div className="flex flex-wrap gap-2">
            {filters.status?.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1">
                Status: {status}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleStatusFilter(status)}
                />
              </Badge>
            ))}
            
            {filters.paymentMode?.map((mode) => (
              <Badge key={mode} variant="secondary" className="gap-1">
                Payment: {mode}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handlePaymentModeFilter(mode)}
                />
              </Badge>
            ))}
            
            {filters.tripMode?.map((mode) => (
              <Badge key={mode} variant="secondary" className="gap-1">
                Mode: {mode}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleTripModeFilter(mode)}
                />
              </Badge>
            ))}
            
            {(filters.amountRange?.min || filters.amountRange?.max) && (
              <Badge variant="secondary" className="gap-1">
                Amount: ₹{filters.amountRange?.min || 0} - ₹{filters.amountRange?.max || '∞'}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setFilters({ amountRange: undefined })}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
