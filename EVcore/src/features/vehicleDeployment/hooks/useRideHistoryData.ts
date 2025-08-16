
import { useState, useEffect } from 'react';
import { Deployment } from '../../../types/vehicle';
import { vehicleService } from '../../../services/database';
import { useToast } from '../../../hooks/use-toast';

export const useRideHistoryData = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    try {
      const allDeployments = await vehicleService.getDeploymentHistory();
      // Only show completed deployments (those with both OUT and IN data)
      const completedDeployments = allDeployments.filter(d => d.inTimestamp && d.outTimestamp);
      
      // Sort by most recent OUT timestamp first
      const sortedDeployments = completedDeployments.sort((a, b) => {
        const aTime = new Date(a.outTimestamp!).getTime();
        const bTime = new Date(b.outTimestamp!).getTime();
        return bTime - aTime; // Most recent first
      });
      
      setDeployments(sortedDeployments);
    } catch (error) {
      console.error('Error loading deployments:', error);
      toast({
        title: "Error",
        description: "Failed to load ride history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    deployments,
    loading,
    loadDeployments,
  };
};
