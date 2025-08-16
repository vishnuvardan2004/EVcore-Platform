import React, { useState } from 'react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { MapPin, Clock, Star, AlertTriangle } from 'lucide-react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { Trip, TripMode, PaymentMode, TripStatus } from '../types';

interface EnhancedTripEntryFormProps {
  onSubmit: () => void;
  editingTrip?: Trip;
}

export const EnhancedTripEntryForm: React.FC<EnhancedTripEntryFormProps> = ({ 
  onSubmit, 
  editingTrip 
}) => {
  const { addTrip, updateTrip } = useTripDetails();
  const [formData, setFormData] = useState({
    mode: editingTrip?.mode || '',
    amount: editingTrip?.amount || 0,
    tip: editingTrip?.tip || 0,
    paymentMode: editingTrip?.paymentMode || '',
    status: editingTrip?.status || 'completed',
    startLocation: editingTrip?.startLocation || '',
    endLocation: editingTrip?.endLocation || '',
    distance: editingTrip?.distance || 0,
    duration: editingTrip?.duration || 0,
    notes: editingTrip?.notes || '',
    partPaymentEnabled: editingTrip?.partPayment?.enabled || false,
    customerName: editingTrip?.customer?.name || '',
    customerPhone: editingTrip?.customer?.phone || '',
    customerRating: editingTrip?.customer?.rating || 5,
    payments: editingTrip?.partPayment?.payments || [
      { amount: 0, mode: 'Cash' as PaymentMode, status: 'completed' as const },
      { amount: 0, mode: 'UPI - QR' as PaymentMode, status: 'completed' as const }
    ],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tripModes: { value: TripMode; label: string; icon: string }[] = [
    { value: 'EVZIP App', label: 'EVZIP App Booking', icon: '📱' },
    { value: 'Rental Package', label: 'Rental Package', icon: '📦' },
    { value: 'Subscription', label: 'Subscription Ride', icon: '🔄' },
    { value: 'Airport', label: 'Airport Transfer', icon: '✈️' },
    { value: 'UBER', label: 'Uber Ride', icon: '🚗' },
    { value: 'Rapido', label: 'Rapido Ride', icon: '🏍️' },
    { value: 'Direct Booking', label: 'Direct Booking', icon: '📞' },
    { value: 'Corporate', label: 'Corporate Ride', icon: '🏢' },
  ];

  const paymentModes: { value: PaymentMode; label: string; icon: string }[] = [
    { value: 'Cash', label: 'Cash Payment', icon: '💵' },
    { value: 'UPI - QR', label: 'UPI/QR Code', icon: '📱' },
    { value: 'Wallet', label: 'Digital Wallet', icon: '💳' },
    { value: 'Card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'Uber', label: 'Uber Payment', icon: '🚗' },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'Pending', label: 'Payment Pending', icon: '⏳' },
  ];

  const statusOptions: { value: TripStatus; label: string; color: string }[] = [
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'active', label: 'In Progress', color: 'blue' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'disputed', label: 'Disputed', color: 'orange' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.mode) newErrors.mode = 'Trip mode is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Trip amount must be greater than 0';
    if (!formData.paymentMode) newErrors.paymentMode = 'Payment mode is required';
    if (!formData.startLocation.trim()) newErrors.startLocation = 'Start location is required';
    if (!formData.endLocation.trim()) newErrors.endLocation = 'End location is required';
    
    if (formData.partPaymentEnabled) {
      const totalPartPayment = formData.payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (Math.abs(totalPartPayment - formData.amount) > 0.01) {
        newErrors.partPayment = 'Part payment amounts must sum to total amount';
      }
      
      formData.payments.forEach((payment, index) => {
        if (!payment.amount || payment.amount <= 0) {
          newErrors[`payment${index}`] = `Payment ${index + 1} amount is required`;
        }
        if (!payment.mode) {
          newErrors[`paymentMode${index}`] = `Payment ${index + 1} mode is required`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const trip: Trip = {
        id: editingTrip?.id || Date.now().toString(),
        mode: formData.mode as TripMode,
        amount: formData.amount,
        tip: formData.tip,
        paymentMode: formData.paymentMode as PaymentMode,
        status: formData.status as TripStatus,
        startLocation: formData.startLocation,
        endLocation: formData.endLocation,
        distance: formData.distance,
        duration: formData.duration,
        timestamp: editingTrip?.timestamp || new Date(),
        notes: formData.notes,
        partPayment: formData.partPaymentEnabled ? {
          enabled: true,
          payments: formData.payments,
        } : undefined,
        customer: formData.customerName ? {
          name: formData.customerName,
          phone: formData.customerPhone,
          rating: formData.customerRating,
        } : undefined,
        rating: formData.customerRating,
      };
      
      if (editingTrip) {
        updateTrip(editingTrip.id, trip);
      } else {
        addTrip(trip);
      }
      
      // Reset form
      if (!editingTrip) {
        setFormData({
          mode: '',
          amount: 0,
          tip: 0,
          paymentMode: '',
          status: 'completed',
          startLocation: '',
          endLocation: '',
          distance: 0,
          duration: 0,
          notes: '',
          partPaymentEnabled: false,
          customerName: '',
          customerPhone: '',
          customerRating: 5,
          payments: [
            { amount: 0, mode: 'Cash', status: 'completed' },
            { amount: 0, mode: 'UPI - QR', status: 'completed' }
          ],
        });
      }
      
      onSubmit();
    }
  };

  const updatePayment = (index: number, field: string, value: any) => {
    const newPayments = [...formData.payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setFormData(prev => ({ ...prev, payments: newPayments }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Trip Mode */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Trip Mode <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.mode} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, mode: value }))}
            >
              <SelectTrigger className={`h-12 ${errors.mode ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select trip mode" />
              </SelectTrigger>
              <SelectContent>
                {tripModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex items-center gap-2">
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mode && <p className="text-sm text-red-500">{errors.mode}</p>}
          </div>

          {/* Trip Status */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Trip Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TripStatus }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${status.color}-500`}></div>
                      <span>{status.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startLocation" className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Start Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startLocation"
                placeholder="Enter pickup location"
                value={formData.startLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, startLocation: e.target.value }))}
                className={`h-12 ${errors.startLocation ? 'border-red-500' : ''}`}
              />
              {errors.startLocation && <p className="text-sm text-red-500">{errors.startLocation}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endLocation" className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                End Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endLocation"
                placeholder="Enter drop location"
                value={formData.endLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, endLocation: e.target.value }))}
                className={`h-12 ${errors.endLocation ? 'border-red-500' : ''}`}
              />
              {errors.endLocation && <p className="text-sm text-red-500">{errors.endLocation}</p>}
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance" className="text-base font-medium">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                placeholder="0.0"
                value={formData.distance || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration (mins)
              </Label>
              <Input
                id="duration"
                type="number"
                placeholder="0"
                value={formData.duration || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="h-12"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Amount & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-medium">
                Trip Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className={`h-12 text-lg ${errors.amount ? 'border-red-500' : ''}`}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tip" className="text-base font-medium">Tip (Optional)</Label>
              <Input
                id="tip"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.tip || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, tip: parseFloat(e.target.value) || 0 }))}
                className="h-12 text-lg"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Payment Mode <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.paymentMode} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMode: value }))}
            >
              <SelectTrigger className={`h-12 ${errors.paymentMode ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex items-center gap-2">
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMode && <p className="text-sm text-red-500">{errors.paymentMode}</p>}
          </div>

          {/* Part Payment Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Split Payment</Label>
              <p className="text-sm text-gray-600">Enable if payment was made in multiple modes</p>
            </div>
            <Switch
              checked={formData.partPaymentEnabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, partPaymentEnabled: checked }))}
            />
          </div>

          {/* Part Payment Details */}
          {formData.partPaymentEnabled && (
            <Card className="p-4 border-orange-200 bg-orange-50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Split Payment Details</span>
                </div>
                
                {formData.payments.map((payment, index) => (
                  <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-white rounded border">
                    <div className="space-y-1">
                      <Label className="text-sm">Amount {index + 1}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={payment.amount || ''}
                        onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                        className={errors[`payment${index}`] ? 'border-red-500' : ''}
                      />
                      {errors[`payment${index}`] && (
                        <p className="text-xs text-red-500">{errors[`payment${index}`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">Mode {index + 1}</Label>
                      <Select 
                        value={payment.mode} 
                        onValueChange={(value) => updatePayment(index, 'mode', value)}
                      >
                        <SelectTrigger className={errors[`paymentMode${index}`] ? 'border-red-500' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentModes.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.icon} {mode.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`paymentMode${index}`] && (
                        <p className="text-xs text-red-500">{errors[`paymentMode${index}`]}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {errors.partPayment && (
                  <p className="text-sm text-red-500">{errors.partPayment}</p>
                )}
              </div>
            </Card>
          )}

          {/* Customer Details */}
          <Card className="p-4 border-blue-200 bg-blue-50">
            <div className="space-y-4">
              <Label className="text-base font-medium">Customer Details (Optional)</Label>
              
              <div className="grid grid-cols-1 gap-3">
                <Input
                  placeholder="Customer name"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                />
                
                <Input
                  placeholder="Customer phone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                />
                
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <Label className="text-sm">Rating:</Label>
                  <Select 
                    value={formData.customerRating.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customerRating: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating}★
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base font-medium">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional details about this trip..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="min-h-[80px]"
        />
      </div>

      {/* Total Display */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">Total Trip Value:</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-700">
              ₹{(formData.amount + formData.tip).toLocaleString()}
            </div>
            {formData.tip > 0 && (
              <div className="text-sm text-green-600">
                ₹{formData.amount} + ₹{formData.tip} tip
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        {editingTrip ? '✏️ Update Trip' : '✅ Save Trip'}
      </Button>
    </form>
  );
};
