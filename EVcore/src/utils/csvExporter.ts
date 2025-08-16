
import { Deployment } from '../types/vehicle';
import { calculateDuration } from './reportGenerator';

export const exportDeploymentToCSV = (deployments: Deployment[], filename?: string) => {
  const headers = [
    'Vehicle Number',
    'OUT Date & Time',
    'IN Date & Time',
    'Driver/Employee Name',
    'Purpose',
    'Total Duration',
    'Total KMs',
    'OUT Supervisor',
    'IN Supervisor',
    'OUT Odometer',
    'IN Odometer',
    'Battery Charge',
    'Range',
    'Location',
    'Pilot ID',
    'Checklist Mismatches',
    'Notes'
  ];

  const csvData = deployments.map(deployment => [
    deployment.vehicleNumber,
    deployment.outTimestamp ? new Date(deployment.outTimestamp).toLocaleString() : 'N/A',
    deployment.inTimestamp ? new Date(deployment.inTimestamp).toLocaleString() : 'N/A',
    deployment.outData?.driverName || deployment.outData?.employeeName || 'N/A',
    deployment.purpose,
    deployment.outTimestamp && deployment.inTimestamp 
      ? calculateDuration(deployment.outTimestamp, deployment.inTimestamp)
      : 'N/A',
    deployment.totalKms || 'N/A',
    deployment.outData?.supervisorName || 'N/A',
    deployment.inData?.inSupervisorName || 'N/A',
    deployment.outData?.odometer || 'N/A',
    deployment.inData?.returnOdometer || 'N/A',
    deployment.outData?.batteryCharge || 'N/A',
    deployment.outData?.range || 'N/A',
    deployment.outData?.location || 'N/A',
    deployment.outData?.pilotId || 'N/A',
    deployment.inData?.checklistMismatches?.join('; ') || 'None',
    deployment.outData?.notes || 'N/A'
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `ride-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportVehicleHistoryToCSV = (vehicleNumber: string, deployments: Deployment[]) => {
  const filename = `vehicle-history-${vehicleNumber}-${new Date().toISOString().split('T')[0]}.csv`;
  exportDeploymentToCSV(deployments, filename);
};

export const exportDriverHistoryToCSV = (driverName: string, deployments: Deployment[]) => {
  const filename = `driver-history-${driverName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
  exportDeploymentToCSV(deployments, filename);
};
