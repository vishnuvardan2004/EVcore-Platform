
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { Deployment, TripSummary } from '../../../types/vehicle';
import { calculateDuration, generateTripReport } from '../../../utils/reportGenerator';
import { exportDeploymentToCSV } from '../../../utils/csvExporter';

interface ExportActionsProps {
  deployment: Deployment;
  onClose: () => void;
}

export const ExportActions: React.FC<ExportActionsProps> = ({ deployment, onClose }) => {
  const exportToPDF = () => {
    const summary: TripSummary = {
      vehicleNumber: deployment.vehicleNumber,
      outDateTime: deployment.outTimestamp ? new Date(deployment.outTimestamp).toLocaleString() : 'N/A',
      inDateTime: deployment.inTimestamp ? new Date(deployment.inTimestamp).toLocaleString() : 'N/A',
      totalDuration: deployment.outTimestamp && deployment.inTimestamp 
        ? calculateDuration(deployment.outTimestamp, deployment.inTimestamp)
        : 'N/A',
      totalKms: deployment.totalKms || 0,
      mismatches: deployment.inData?.checklistMismatches || [],
      outSupervisor: deployment.outData?.supervisorName || '',
      inSupervisor: deployment.inData?.inSupervisorName || '',
      purpose: deployment.purpose,
    };
    
    generateTripReport(summary);
  };

  const exportToCSV = () => {
    exportDeploymentToCSV([deployment]);
  };

  return (
    <div className="flex gap-4 justify-end">
      <Button variant="outline" onClick={exportToCSV}>
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      <Button onClick={exportToPDF}>
        <FileText className="w-4 h-4 mr-2" />
        Export PDF Report
      </Button>
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    </div>
  );
};
