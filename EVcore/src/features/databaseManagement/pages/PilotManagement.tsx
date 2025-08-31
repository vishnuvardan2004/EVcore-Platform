import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Trash2, 
  UserCheck, 
  Phone, 
  Mail, 
  Calendar,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { pilotApiService } from '../../../services/pilotApi';
import { pilotService, tempPilotService } from '../../../services/database';
import { Pilot, TemporaryPilot } from '../../../types/pilot';
import { useToast } from '../../../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Combined pilot interface for display
interface CombinedPilot {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  type: 'permanent' | 'temporary';
  status: string;
  createdDate: Date;
  pilot?: Pilot;
  tempPilot?: TemporaryPilot;
}

export const PilotManagement: React.FC = () => {
  const [pilots, setPilots] = useState<CombinedPilot[]>([]);
  const [filteredPilots, setFilteredPilots] = useState<CombinedPilot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadPilots = async () => {
    try {
      setLoading(true);
      const combinedPilots: CombinedPilot[] = [];
      
      // Load permanent pilots from API and local DB
      try {
        console.log('🔍 Loading permanent pilots from backend API...');
        const apiPilots = await pilotApiService.getAllPilots();
        console.log('✅ API pilots loaded:', apiPilots.length);
        
        // Convert permanent pilots to combined format
        const permanentPilots: CombinedPilot[] = apiPilots.map(pilot => ({
          id: pilot.id,
          name: pilot.personalInfo.fullName,
          mobile: pilot.personalInfo.mobileNumber,
          email: pilot.personalInfo.emailId,
          type: 'permanent' as const,
          status: pilot.status,
          createdDate: pilot.inductionDate,
          pilot: pilot
        }));
        
        combinedPilots.push(...permanentPilots);
        
        // Sync API pilots to local database for future use
        for (const pilot of apiPilots) {
          try {
            await pilotService.syncPilot(pilot);
          } catch (syncError) {
            console.warn('Could not sync pilot to local DB:', pilot.id, syncError);
          }
        }
        
      } catch (apiError) {
        console.warn('⚠️ Backend API failed for permanent pilots, trying local database...', apiError);
        
        // Fallback to local database for permanent pilots
        const localPilots = await pilotService.getAllPilots();
        console.log('📱 Local permanent pilots loaded:', localPilots.length);
        
        if (localPilots.length > 0) {
          const localPermanentPilots: CombinedPilot[] = localPilots.map(pilot => ({
            id: pilot.id,
            name: pilot.personalInfo.fullName,
            mobile: pilot.personalInfo.mobileNumber,
            email: pilot.personalInfo.emailId,
            type: 'permanent' as const,
            status: pilot.status,
            createdDate: pilot.inductionDate,
            pilot: pilot
          }));
          
          combinedPilots.push(...localPermanentPilots);
        }
      }
      
      // Load temporary pilots from local database
      try {
        console.log('🔍 Loading temporary pilots from local database...');
        const tempPilots = await tempPilotService.getAllTemporaryPilots();
        console.log('✅ Temporary pilots loaded:', tempPilots.length);
        
        // Convert temporary pilots to combined format
        const temporaryPilots: CombinedPilot[] = tempPilots.map(tempPilot => ({
          id: tempPilot.tempId,
          name: tempPilot.fullName,
          mobile: tempPilot.mobileNumber,
          email: tempPilot.emailId,
          type: 'temporary' as const,
          status: tempPilot.status,
          createdDate: tempPilot.registrationDate,
          tempPilot: tempPilot
        }));
        
        combinedPilots.push(...temporaryPilots);
      } catch (tempError) {
        console.warn('⚠️ Could not load temporary pilots:', tempError);
      }
      
      setPilots(combinedPilots);
      setFilteredPilots(combinedPilots);
      
      if (combinedPilots.length > 0) {
        const permanentCount = combinedPilots.filter(p => p.type === 'permanent').length;
        const temporaryCount = combinedPilots.filter(p => p.type === 'temporary').length;
        
        toast({
          title: "Pilots Loaded",
          description: `Loaded ${permanentCount} permanent and ${temporaryCount} temporary pilots`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Data",
          description: "No pilots found in any database",
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error('❌ Error loading pilots:', error);
      setPilots([]);
      setFilteredPilots([]);
      toast({
        title: "Error",
        description: "Failed to load pilots data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPilots();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPilots(pilots);
    } else {
      const filtered = pilots.filter(pilot => 
        pilot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pilot.mobile.includes(searchTerm) ||
        pilot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pilot.email && pilot.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPilots(filtered);
    }
  }, [searchTerm, pilots]);

  const handleAddPilot = () => {
    navigate('/driver-induction');
  };

  const handleDeletePilot = async (pilotId: string) => {
    try {
      setDeleteLoading(pilotId);
      
      const pilot = pilots.find(p => p.id === pilotId);
      if (!pilot) return;
      
      if (pilot.type === 'permanent') {
        await pilotApiService.deletePilot(pilotId);
        // Also try to delete from local database
        try {
          await pilotService.deletePilot(pilotId);
        } catch (localError) {
          console.warn('Could not delete from local DB:', localError);
        }
      } else if (pilot.type === 'temporary') {
        await tempPilotService.deleteTemporaryPilot(pilotId);
      }
      
      toast({
        title: "Success",
        description: `${pilot.type === 'permanent' ? 'Pilot' : 'Temporary pilot'} deleted successfully`,
      });
      
      // Refresh the list
      await loadPilots();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pilot",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      temporary: 'bg-blue-100 text-blue-800 border-blue-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
      converted: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: 'permanent' | 'temporary') => {
    return (
      <Badge 
        variant={type === 'permanent' ? 'default' : 'secondary'}
        className={type === 'permanent' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
      >
        {type === 'permanent' ? 'Permanent' : 'Temporary'}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pilot Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pilot Management</h1>
          <p className="text-gray-600">Manage pilot database and induction records</p>
        </div>
        <Button onClick={handleAddPilot} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Pilot
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search pilots by name, phone, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredPilots.length} pilot{filteredPilots.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Pilots Grid */}
      {filteredPilots.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <UserCheck className="w-12 h-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No pilots found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first pilot'}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={handleAddPilot} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add First Pilot
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPilots.map((pilot) => (
            <Card key={pilot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {pilot.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 font-mono">
                      {pilot.id}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    {getTypeBadge(pilot.type)}
                    {getStatusBadge(pilot.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{pilot.mobile}</span>
                  </div>
                  
                  {pilot.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{pilot.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {pilot.type === 'permanent' ? 'Inducted' : 'Registered'} {formatDate(pilot.createdDate)}
                    </span>
                  </div>
                  
                  {/* Additional info for permanent pilots */}
                  {pilot.type === 'permanent' && pilot.pilot?.personalInfo.designation && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserCheck className="w-4 h-4" />
                      <span>{pilot.pilot.personalInfo.designation}</span>
                    </div>
                  )}
                  
                  {/* Additional info for temporary pilots */}
                  {pilot.type === 'temporary' && pilot.tempPilot && (
                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Rides:</span>
                        <span className="font-medium">
                          {pilot.tempPilot.completedRides} / {pilot.tempPilot.allowedRides}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expires:</span>
                        <span className={`font-medium ${
                          new Date(pilot.tempPilot.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {formatDate(pilot.tempPilot.expiryDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteLoading === pilot.id}
                      >
                        {deleteLoading === pilot.id ? (
                          <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          Delete Pilot
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{pilot.name}</strong> ({pilot.id})?
                          This action cannot be undone and will permanently remove all pilot data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeletePilot(pilot.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Pilot
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
