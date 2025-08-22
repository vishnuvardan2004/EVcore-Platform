
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { useOfflineSync } from '../../../../hooks/useOfflineSync';

export const NetworkStatus: React.FC = () => {
  const { isOnline, pendingSubmissions } = useOfflineSync();

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
      </Badge>
      
      {pendingSubmissions.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {pendingSubmissions.length} pending
        </Badge>
      )}
    </div>
  );
};
