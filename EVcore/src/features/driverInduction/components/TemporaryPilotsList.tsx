import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  Calendar,
  Car,
  Edit,
  Trash2,
  UserCheck
} from 'lucide-react';
import { TemporaryPilot } from '../../../types/pilot';

interface TemporaryPilotsListProps {
  tempPilots: TemporaryPilot[];
  onConvertToFull: (tempPilot: TemporaryPilot) => void;
  onExtendAccess: (tempId: string, additionalRides: number, additionalDays: number) => void;
  onRevokeAccess: (tempId: string) => void;
}

export const TemporaryPilotsList: React.FC<TemporaryPilotsListProps> = ({
  tempPilots,
  onConvertToFull,
  onExtendAccess,
  onRevokeAccess
}) => {
  const getStatusBadge = (pilot: TemporaryPilot) => {
    const isExpired = new Date() > pilot.expiryDate;
    const ridesExhausted = pilot.completedRides >= pilot.allowedRides;

    if (pilot.status === 'expired' || isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (pilot.status === 'converted') {
      return <Badge className="bg-green-100 text-green-800">Converted to Full</Badge>;
    }
    if (ridesExhausted) {
      return <Badge variant="secondary">Rides Exhausted</Badge>;
    }
    if (pilot.status === 'temporary') {
      return <Badge className="bg-yellow-100 text-yellow-800">Temporary Access</Badge>;
    }
    if (pilot.status === 'pending_verification') {
      return <Badge className="bg-blue-100 text-blue-800">Pending Verification</Badge>;
    }
    return <Badge variant="outline">{pilot.status}</Badge>;
  };

  const getTimeRemaining = (expiryDate: Date) => {
    const now = new Date();
    const timeLeft = expiryDate.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    
    if (hoursLeft < 24) {
      return `${hoursLeft}h remaining`;
    }
    
    const daysLeft = Math.floor(hoursLeft / 24);
    return `${daysLeft}d remaining`;
  };

  const isAccessBlocked = (pilot: TemporaryPilot) => {
    const isExpired = new Date() > pilot.expiryDate;
    const ridesExhausted = pilot.completedRides >= pilot.allowedRides;
    return isExpired || ridesExhausted || pilot.status === 'expired';
  };

  if (tempPilots.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Temporary Pilots</h3>
          <p className="text-gray-600">
            All pilots have been fully registered or there are no temporary registrations yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Temporary Pilots</h3>
          <p className="text-gray-600">Pilots with temporary access pending full documentation</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {tempPilots.filter(p => p.status === 'temporary').length} Active
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {tempPilots.filter(p => p.status === 'temporary').length}
            </div>
            <div className="text-sm text-gray-600">Active Temporary</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {tempPilots.filter(p => new Date() > p.expiryDate).length}
            </div>
            <div className="text-sm text-gray-600">Expired</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tempPilots.filter(p => p.status === 'pending_verification').length}
            </div>
            <div className="text-sm text-gray-600">Pending Verification</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tempPilots.reduce((sum, p) => sum + p.completedRides, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Rides</div>
          </CardContent>
        </Card>
      </div>

      {/* Pilots List */}
      <div className="space-y-4">
        {tempPilots.map((pilot) => {
          const isBlocked = isAccessBlocked(pilot);
          const needsAttention = new Date() > new Date(pilot.expiryDate.getTime() - 24 * 60 * 60 * 1000) || 
                                pilot.completedRides >= pilot.allowedRides - 1;

          return (
            <Card 
              key={pilot.tempId} 
              className={`${isBlocked ? 'border-red-200 bg-red-50' : needsAttention ? 'border-yellow-200 bg-yellow-50' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{pilot.fullName}</h3>
                        <p className="text-sm text-gray-600">ID: {pilot.tempId}</p>
                      </div>
                      {getStatusBadge(pilot)}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Contact */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{pilot.mobileNumber}</span>
                        </div>
                        {pilot.emailId && (
                          <div className="text-xs text-gray-500 ml-6">{pilot.emailId}</div>
                        )}
                      </div>

                      {/* Rides Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {pilot.completedRides}/{pilot.allowedRides} rides
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                            <div
                              className={`h-2 rounded-full ${
                                pilot.completedRides >= pilot.allowedRides ? 'bg-red-500' : 
                                pilot.completedRides >= pilot.allowedRides - 1 ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${Math.min((pilot.completedRides / pilot.allowedRides) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Time Remaining */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm ${new Date() > pilot.expiryDate ? 'text-red-600' : needsAttention ? 'text-yellow-600' : 'text-gray-700'}`}>
                            {getTimeRemaining(pilot.expiryDate)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          Expires: {pilot.expiryDate.toLocaleDateString()}
                        </div>
                      </div>

                      {/* Registration Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{pilot.registeredBy}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          {pilot.registrationDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {pilot.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 mb-1">Notes:</div>
                        <div className="text-sm text-gray-700">{pilot.notes}</div>
                      </div>
                    )}

                    {/* Warning Messages */}
                    {needsAttention && !isBlocked && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          {pilot.completedRides >= pilot.allowedRides - 1 && 'Only 1 ride remaining. '}
                          {new Date() > new Date(pilot.expiryDate.getTime() - 24 * 60 * 60 * 1000) && 'Access expires within 24 hours. '}
                          Consider converting to full registration or extending access.
                        </AlertDescription>
                      </Alert>
                    )}

                    {isBlocked && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          {new Date() > pilot.expiryDate && 'Temporary access has expired. '}
                          {pilot.completedRides >= pilot.allowedRides && 'Maximum rides completed. '}
                          Cannot assign new rides.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {pilot.status === 'temporary' && !isBlocked && (
                      <Button 
                        size="sm" 
                        onClick={() => onConvertToFull(pilot)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Convert to Full
                      </Button>
                    )}
                    
                    {pilot.status === 'temporary' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onExtendAccess(pilot.tempId, 5, 2)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Extend Access
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onRevokeAccess(pilot.tempId)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
