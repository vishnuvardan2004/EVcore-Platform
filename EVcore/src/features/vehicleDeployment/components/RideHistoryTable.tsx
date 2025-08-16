import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, Paperclip, Clock } from 'lucide-react';
import { Deployment } from '../../../types/vehicle';
import { calculateDuration } from '../../../utils/reportGenerator';

interface GroupedDeployment {
  period: string;
  deployments: Deployment[];
}

interface RideHistoryTableProps {
  deployments: Deployment[];
  selectedRows: string[];
  onRowSelect: (deploymentId: string) => void;
  onSelectAll: () => void;
  onViewDetails: (deployment: Deployment) => void;
  loading: boolean;
}

export const RideHistoryTable: React.FC<RideHistoryTableProps> = ({
  deployments,
  selectedRows,
  onRowSelect,
  onSelectAll,
  onViewDetails,
  loading,
}) => {
  const hasChecklistMismatches = (deployment: Deployment): boolean => {
    return (deployment.inData?.checklistMismatches || []).length > 0;
  };

  const hasAttachments = (deployment: Deployment): boolean => {
    return Boolean(deployment.outData?.vehiclePhotos?.length || deployment.inData?.vehiclePhotos?.length);
  };

  const formatDateTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimePeriod = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return 'This Week';
    } else if (diffDays <= 30) {
      return 'This Month';
    } else if (diffDays <= 90) {
      return 'Last 3 Months';
    } else {
      return 'Older';
    }
  };

  const groupDeploymentsByTime = (deployments: Deployment[]): GroupedDeployment[] => {
    const groups: { [key: string]: Deployment[] } = {};
    
    deployments.forEach(deployment => {
      const period = getTimePeriod(deployment.outTimestamp!);
      if (!groups[period]) {
        groups[period] = [];
      }
      groups[period].push(deployment);
    });

    // Define the order of periods
    const periodOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Last 3 Months', 'Older'];
    
    return periodOrder
      .filter(period => groups[period] && groups[period].length > 0)
      .map(period => ({
        period,
        deployments: groups[period]
      }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p>Loading ride history...</p>
        </div>
      </Card>
    );
  }

  if (deployments.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No rides found matching your criteria</p>
        </div>
      </Card>
    );
  }

  const groupedDeployments = groupDeploymentsByTime(deployments);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Deployment Records ({deployments.length})
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSelectAll}
          >
            {selectedRows.length === deployments.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {groupedDeployments.map((group) => (
          <div key={group.period} className="space-y-2">
            {/* Period Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Clock className="w-5 h-5 text-blue-600" />
                {group.period}
              </div>
              <div className="h-px bg-gray-200 flex-1"></div>
              <Badge variant="outline" className="text-xs">
                {group.deployments.length} {group.deployments.length === 1 ? 'ride' : 'rides'}
              </Badge>
            </div>

            {/* Table for this period */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={group.deployments.every(d => selectedRows.includes(d.id))}
                        onChange={() => {
                          const allSelected = group.deployments.every(d => selectedRows.includes(d.id));
                          group.deployments.forEach(d => {
                            if (allSelected && selectedRows.includes(d.id)) {
                              onRowSelect(d.id);
                            } else if (!allSelected && !selectedRows.includes(d.id)) {
                              onRowSelect(d.id);
                            }
                          });
                        }}
                      />
                    </TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>OUT Date & Time</TableHead>
                    <TableHead>IN Date & Time</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>KMs</TableHead>
                    <TableHead>Supervisors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.deployments.map((deployment) => (
                    <TableRow key={deployment.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(deployment.id)}
                          onChange={() => onRowSelect(deployment.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{deployment.vehicleNumber}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {deployment.outTimestamp ? formatDateTime(deployment.outTimestamp) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {deployment.inTimestamp ? formatDateTime(deployment.inTimestamp) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {deployment.outData?.driverName || deployment.outData?.employeeName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={deployment.purpose === 'Office' ? 'default' : 'secondary'}
                          className={deployment.purpose === 'Office' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {deployment.purpose}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deployment.outTimestamp && deployment.inTimestamp 
                          ? calculateDuration(deployment.outTimestamp, deployment.inTimestamp)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{deployment.totalKms || 'N/A'} km</TableCell>
                      <TableCell className="text-sm">
                        <div>OUT: {deployment.outData?.supervisorName || 'N/A'}</div>
                        <div>IN: {deployment.inData?.inSupervisorName || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {hasChecklistMismatches(deployment) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          {hasAttachments(deployment) && (
                            <Paperclip className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(deployment);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
