import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// Update the import path if the file exists elsewhere, for example:
import { TripSummary as TripSummaryType } from '../../../types/vehicle';

import { generateTripReport } from '../../../utils/reportGenerator';

interface TripSummaryProps {
  summary: TripSummaryType;
  onClose: () => void;
}

export const TripSummary: React.FC<TripSummaryProps> = ({ summary, onClose }) => {
  const handleExportPDF = () => {
    generateTripReport(summary);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Trip Summary Report</h2>
        <p className="text-gray-600">Auto-generated trip summary</p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-3">Vehicle Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Vehicle Number:</span> {summary.vehicleNumber}</p>
              <p><span className="font-medium">Purpose:</span> {summary.purpose}</p>
              <p><span className="font-medium">Total KMs Run:</span> {summary.totalKms} km</p>
              <p><span className="font-medium">Total Duration:</span> {summary.totalDuration}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Trip Details</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">OUT Date & Time:</span> {summary.outDateTime}</p>
              <p><span className="font-medium">IN Date & Time:</span> {summary.inDateTime}</p>
              <p><span className="font-medium">OUT Supervisor:</span> {summary.outSupervisor}</p>
              <p><span className="font-medium">IN Supervisor:</span> {summary.inSupervisor}</p>
            </div>
          </div>
        </div>

        {summary.mismatches.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Checklist Mismatches</h3>
            <ul className="space-y-1 text-sm text-red-700">
              {summary.mismatches.map((mismatch, index) => (
                <li key={index}>• {mismatch}</li>
              ))}
            </ul>
          </div>
        )}

        {summary.mismatches.length === 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">✓ No checklist mismatches detected</p>
          </div>
        )}
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={handleExportPDF} className="flex-1">
          Export PDF Report
        </Button>
      </div>
    </div>
  );
};
