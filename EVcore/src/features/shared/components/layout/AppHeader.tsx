
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { NetworkStatus } from '../status/NetworkStatus';

export const AppHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex justify-center gap-4 flex-1">
        <Link 
          to="/history" 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Ride History & Reports
        </Link>
      </div>
      <NetworkStatus />
    </div>
  );
};
