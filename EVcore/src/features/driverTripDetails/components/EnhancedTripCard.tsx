import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  Trash2, MapPin, CreditCard, Clock, Star, 
  Edit, Eye, Navigation, Phone, User,
  TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { Trip } from '../types';
import { format } from 'date-fns';

interface EnhancedTripCardProps {
  trip: Trip;
  showActions?: boolean;
  compact?: boolean;
}

export const EnhancedTripCard: React.FC<EnhancedTripCardProps> = ({ 
  trip, 
  showActions = true,
  compact = false 
}) => {
  const { deleteTrip, updateTrip } = useTripDetails();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'disputed': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'active': return Clock;
      case 'pending': return Clock;
      case 'cancelled': return AlertCircle;
      case 'disputed': return AlertCircle;
      default: return Clock;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'EVZIP App': return '📱';
      case 'Rental Package': return '📦';
      case 'Subscription': return '🔄';
      case 'Airport': return '✈️';
      case 'UBER': return '🚗';
      case 'Rapido': return '🏍️';
      case 'Direct Booking': return '📞';
      case 'Corporate': return '🏢';
      default: return '🚗';
    }
  };

  const getPaymentIcon = (mode: string) => {
    switch (mode) {
      case 'Cash': return '💵';
      case 'UPI - QR': return '📱';
      case 'Wallet': return '💳';
      case 'Card': return '💳';
      case 'Uber': return '🚗';
      case 'Bank Transfer': return '🏦';
      case 'Pending': return '⏳';
      default: return '💳';
    }
  };

  const StatusIcon = getStatusIcon(trip.status);
  const totalAmount = trip.amount + trip.tip;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      deleteTrip(trip.id);
    }
  };

  const toggleStatus = () => {
    const newStatus = trip.status === 'completed' ? 'pending' : 'completed';
    updateTrip(trip.id, { status: newStatus });
  };

  if (compact) {
    return (
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl">{getModeIcon(trip.mode)}</div>
              <div>
                <div className="font-medium text-sm">{trip.mode}</div>
                <div className="text-xs text-gray-500">
                  {format(trip.timestamp, 'HH:mm')}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-green-600">₹{totalAmount}</div>
              <Badge variant="secondary" className="text-xs">
                {trip.paymentMode}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 hover:shadow-lg transition-all duration-200 ${
      trip.status === 'completed' ? 'border-l-green-500' : 
      trip.status === 'active' ? 'border-l-blue-500' : 
      trip.status === 'pending' ? 'border-l-yellow-500' : 
      'border-l-red-500'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">{getModeIcon(trip.mode)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{trip.mode}</h3>
                  <Badge 
                    variant="secondary" 
                    className={`text-white ${getStatusColor(trip.status)}`}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{format(trip.timestamp, 'MMM dd, yyyy • HH:mm')}</span>
                  {trip.duration > 0 && (
                    <>
                      <span>•</span>
                      <span>{trip.duration} mins</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-2 mt-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-0.5 h-6 bg-gray-300"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{trip.startLocation || 'Start location not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">{trip.endLocation || 'End location not specified'}</span>
                  </div>
                </div>
                {trip.distance > 0 && (
                  <div className="text-right">
                    <div className="text-sm font-medium">{trip.distance} km</div>
                    <div className="text-xs text-gray-500">Distance</div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">₹{trip.amount}</div>
                <div className="text-xs text-blue-600">Base Amount</div>
              </div>
              
              {trip.tip > 0 && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">₹{trip.tip}</div>
                  <div className="text-xs text-green-600">Tip</div>
                </div>
              )}
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-700">₹{totalAmount}</div>
                <div className="text-xs text-purple-600">Total</div>
              </div>
              
              <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{getPaymentIcon(trip.paymentMode)}</span>
                <div className="text-center">
                  <div className="text-sm font-medium">{trip.paymentMode}</div>
                  <div className="text-xs text-gray-500">Payment</div>
                </div>
              </div>
            </div>

            {/* Part Payment Details */}
            {trip.partPayment?.enabled && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Split Payment</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {trip.partPayment.payments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{getPaymentIcon(payment.mode)} {payment.mode}</span>
                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        ₹{payment.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Details */}
            {trip.customer?.name && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">{trip.customer.name}</span>
                    {trip.customer.phone && (
                      <>
                        <Phone className="w-3 h-3 text-blue-600" />
                        <span className="text-sm text-blue-600">{trip.customer.phone}</span>
                      </>
                    )}
                  </div>
                  {trip.customer.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{trip.customer.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {trip.notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <strong>Notes:</strong> {trip.notes}
                </div>
              </div>
            )}

            {/* Expandable Details */}
            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-800">Additional Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Trip ID:</span>
                    <span className="ml-2 font-mono">{trip.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">{format(trip.timestamp, 'PPP p')}</span>
                  </div>
                  {trip.distance > 0 && (
                    <div>
                      <span className="text-gray-600">Distance:</span>
                      <span className="ml-2">{trip.distance} km</span>
                    </div>
                  )}
                  {trip.duration > 0 && (
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2">{trip.duration} minutes</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleStatus}
                className="text-orange-600 hover:text-orange-700"
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
