
import { useState, useEffect } from 'react';
import { vehicleService } from '../services/database';
import { useToast } from './use-toast';

interface PendingSubmission {
  id: string;
  timestamp: string;
  type: 'deployment' | 'update';
  data: any;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load pending submissions from localStorage
    const stored = localStorage.getItem('pendingSubmissions');
    if (stored) {
      setPendingSubmissions(JSON.parse(stored));
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing pending data...",
      });
      syncPendingSubmissions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Working offline. Data will sync when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const addToSyncQueue = (type: 'deployment' | 'update', data: any) => {
    const submission: PendingSubmission = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      data
    };

    const updated = [...pendingSubmissions, submission];
    setPendingSubmissions(updated);
    localStorage.setItem('pendingSubmissions', JSON.stringify(updated));

    toast({
      title: "Offline",
      description: "Submission saved to sync queue.",
      variant: "destructive",
    });
  };

  const syncPendingSubmissions = async () => {
    if (pendingSubmissions.length === 0) return;

    try {
      for (const submission of pendingSubmissions) {
        if (submission.type === 'deployment') {
          await vehicleService.createDeployment(submission.data);
        } else if (submission.type === 'update') {
          await vehicleService.updateDeployment(submission.data.id, submission.data.updates);
        }
      }

      // Clear successful submissions
      setPendingSubmissions([]);
      localStorage.removeItem('pendingSubmissions');

      toast({
        title: "✅ Synced Successfully",
        description: "All pending submissions have been synced.",
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some submissions couldn't be synced. Will retry later.",
        variant: "destructive",
      });
    }
  };

  const submitFormData = async (type: 'deployment' | 'update', data: any) => {
    if (isOnline) {
      try {
        if (type === 'deployment') {
          await vehicleService.createDeployment(data);
        } else {
          await vehicleService.updateDeployment(data.id, data.updates);
        }
        
        toast({
          title: "Success",
          description: `Vehicle ${data.vehicleNumber || 'submission'} processed successfully!`,
        });
        
        return true;
      } catch (error) {
        console.error('Submission failed:', error);
        toast({
          title: "Error",
          description: "Submission failed. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } else {
      addToSyncQueue(type, data);
      return true; // Return true since we've queued it
    }
  };

  return {
    isOnline,
    pendingSubmissions,
    submitFormData,
    syncPendingSubmissions
  };
};
