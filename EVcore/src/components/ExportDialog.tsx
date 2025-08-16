
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Table } from 'lucide-react';
import { Deployment, TripSummary } from '../types/vehicle';
import { generateTripReport, calculateDuration } from '../utils/reportGenerator';
import { exportDeploymentToCSV, exportVehicleHistoryToCSV, exportDriverHistoryToCSV } from '../utils/csvExporter';
import { vehicleService } from '../services/database';
import { useToast } from '../hooks/use-toast';

interface ExportDialogProps {
  deployments: Deployment[];
  open: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  deployments,
  open,
  onClose,
}) => {
  const [exportType, setExportType] = useState<'selected' | 'vehicle-history' | 'driver-history'>('selected');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      switch (exportType) {
        case 'selected':
          if (format === 'pdf') {
            await exportSelectedAsPDF();
          } else {
            exportDeploymentToCSV(deployments);
          }
          break;
        case 'vehicle-history':
          if (!vehicleNumber.trim()) {
            toast({
              title: "Error",
              description: "Please enter a vehicle number",
              variant: "destructive",
            });
            return;
          }
          await exportVehicleHistory();
          break;
        case 'driver-history':
          if (!driverName.trim()) {
            toast({
              title: "Error", 
              description: "Please enter a driver name",
              variant: "destructive",
            });
            return;
          }
          await exportDriverHistory();
          break;
      }

      toast({
        title: "Success",
        description: "Export completed successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Export failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportSelectedAsPDF = async () => {
    // Generate individual PDF reports for each deployment
    for (const deployment of deployments) {
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
      
      // Add a small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const exportVehicleHistory = async () => {
    const vehicleDeployments = await vehicleService.getDeploymentHistory(vehicleNumber);
    const completedDeployments = vehicleDeployments.filter(d => d.inTimestamp && d.outTimestamp);
    
    if (completedDeployments.length === 0) {
      toast({
        title: "No Data",
        description: `No completed trips found for vehicle ${vehicleNumber}`,
        variant: "destructive",
      });
      return;
    }

    if (format === 'pdf') {
      await exportSelectedAsPDF();
    } else {
      exportVehicleHistoryToCSV(vehicleNumber, completedDeployments);
    }
  };

  const exportDriverHistory = async () => {
    const allDeployments = await vehicleService.getDeploymentHistory();
    const driverDeployments = allDeployments.filter(d => {
      const deploymentDriverName = d.outData?.driverName || d.outData?.employeeName || '';
      return deploymentDriverName.toLowerCase().includes(driverName.toLowerCase()) && 
             d.inTimestamp && d.outTimestamp;
    });

    if (driverDeployments.length === 0) {
      toast({
        title: "No Data",
        description: `No completed trips found for driver ${driverName}`,
        variant: "destructive",
      });
      return;
    }

    if (format === 'pdf') {
      for (const deployment of driverDeployments) {
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
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      exportDriverHistoryToCSV(driverName, driverDeployments);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="export-type">Export Type</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selected">Selected Rows ({deployments.length})</SelectItem>
                <SelectItem value="vehicle-history">Vehicle Full History</SelectItem>
                <SelectItem value="driver-history">Driver Full History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType === 'vehicle-history' && (
            <div>
              <Label htmlFor="vehicle-number">Vehicle Number</Label>
              <Input
                id="vehicle-number"
                placeholder="Enter vehicle number..."
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>
          )}

          {exportType === 'driver-history' && (
            <div>
              <Label htmlFor="driver-name">Driver Name</Label>
              <Input
                id="driver-name"
                placeholder="Enter driver name..."
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF Report(s)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    CSV Spreadsheet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              {loading ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
