import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import { 
  FileText, 
  Download, 
  FileSpreadsheet,
  X
} from 'lucide-react';
import { DatabaseModule, MODULE_CONFIG } from '../services/databaseService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: DatabaseModule;
  onExport: (format: 'pdf' | 'json', options: ExportOptions) => Promise<void>;
  dataCount: number;
}

interface ExportOptions {
  includeMetadata: boolean;
  includeStatistics: boolean;
  orientation: 'portrait' | 'landscape';
  maxRecords?: number;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  module,
  onExport,
  dataCount
}) => {
  const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeStatistics, setIncludeStatistics] = useState(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isExporting, setIsExporting] = useState(false);

  const moduleConfig = MODULE_CONFIG[module];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, {
        includeMetadata,
        includeStatistics,
        orientation,
        maxRecords: format === 'pdf' ? 1000 : undefined
      });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'json': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (fmt: string) => {
    switch (fmt) {
      case 'pdf': return 'Professional report with tables and formatting';
      case 'json': return 'Raw data format for developers and APIs';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {moduleConfig?.displayName || module}
          </DialogTitle>
          <DialogDescription>
            Choose your export format and options for {dataCount} records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'json')}>
              {(['pdf', 'json'] as const).map((fmt) => (
                <div key={fmt} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                  <RadioGroupItem value={fmt} id={fmt} />
                  <div className="flex-1">
                    <Label htmlFor={fmt} className="flex items-center gap-2 cursor-pointer">
                      {getFormatIcon(fmt)}
                      <span className="font-medium uppercase">{fmt}</span>
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {getFormatDescription(fmt)}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* PDF-specific options */}
          {format === 'pdf' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">PDF Options</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="metadata" 
                    checked={includeMetadata}
                    onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                  />
                  <Label htmlFor="metadata" className="text-sm">Include metadata and export details</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="statistics" 
                    checked={includeStatistics}
                    onCheckedChange={(checked) => setIncludeStatistics(checked === true)}
                  />
                  <Label htmlFor="statistics" className="text-sm">Include summary statistics</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Page Orientation</Label>
                <RadioGroup value={orientation} onValueChange={(value) => setOrientation(value as 'portrait' | 'landscape')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape" className="text-sm">Landscape (recommended for tables)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="portrait" id="portrait" />
                    <Label htmlFor="portrait" className="text-sm">Portrait</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Data preview */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              <strong>Data Summary:</strong><br />
              Module: {moduleConfig?.displayName || module}<br />
              Records: {dataCount.toLocaleString()}<br />
              {format === 'pdf' && dataCount > 1000 && (
                <span className="text-amber-600">Note: PDF export limited to 1,000 records for performance</span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
