import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  FileText, 
  Download, 
  Settings,
  Info
} from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'json', options: ExportOptions) => void;
  moduleName: string;
  recordCount: number;
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
  onExport,
  moduleName,
  recordCount
}) => {
  const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeStatistics, setIncludeStatistics] = useState(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [maxRecords, setMaxRecords] = useState<number>(recordCount);

  const handleExport = () => {
    const options: ExportOptions = {
      includeMetadata,
      includeStatistics,
      orientation,
      maxRecords: maxRecords > 0 ? maxRecords : undefined
    };
    
    onExport(format, options);
    onClose();
  };

  const getFormatDescription = (selectedFormat: string) => {
    switch (selectedFormat) {
      case 'pdf':
        return 'Professional PDF report with formatted tables, charts, and metadata';
      case 'json':
        return 'JSON format for programmatic access and data processing';
      default:
        return '';
    }
  };

  const getFormatIcon = (selectedFormat: string) => {
    switch (selectedFormat) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'json':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {moduleName} Data
          </DialogTitle>
          <DialogDescription>
            Choose your export format and customize the output options for {recordCount} records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'json')}>
                <div className="space-y-3">
                  {(['pdf', 'json'] as const).map((formatOption) => (
                    <div key={formatOption} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={formatOption} id={formatOption} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={formatOption} className="flex items-center gap-2 font-medium cursor-pointer">
                          {getFormatIcon(formatOption)}
                          {formatOption.toUpperCase()}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {getFormatDescription(formatOption)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Include Metadata */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
                />
                <Label htmlFor="metadata" className="text-sm font-medium">
                  Include metadata (export date, record count, etc.)
                </Label>
              </div>

              {/* Include Statistics */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="statistics" 
                  checked={includeStatistics}
                  onCheckedChange={(checked) => setIncludeStatistics(!!checked)}
                />
                <Label htmlFor="statistics" className="text-sm font-medium">
                  Include statistics and summary information
                </Label>
              </div>

              {/* Orientation (for PDF only) */}
              {format === 'pdf' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Page Orientation</Label>
                  <Select value={orientation} onValueChange={(value) => setOrientation(value as 'portrait' | 'landscape')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Landscape (Recommended for tables)</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Max Records */}
              <div className="space-y-2">
                <Label htmlFor="maxRecords" className="text-sm font-medium">
                  Maximum Records to Export
                </Label>
                <Input
                  id="maxRecords"
                  type="number"
                  value={maxRecords}
                  onChange={(e) => setMaxRecords(parseInt(e.target.value) || recordCount)}
                  min={1}
                  max={recordCount}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Available: {recordCount} records
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Export Preview</p>
              <p className="text-blue-700">
                {maxRecords} {moduleName.toLowerCase()} records will be exported as {format.toUpperCase()} 
                {format === 'pdf' && ` in ${orientation} orientation`}
                {includeMetadata && ', including metadata'}
                {includeStatistics && ', with statistics'}.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}