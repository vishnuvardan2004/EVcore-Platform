
import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ChecklistMismatchesCardProps {
  mismatches: string[];
}

export const ChecklistMismatchesCard: React.FC<ChecklistMismatchesCardProps> = ({ mismatches }) => {
  if (!mismatches || mismatches.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 border-red-200">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700">
        <AlertTriangle className="w-5 h-5" />
        Checklist Mismatches
      </h3>
      <div className="space-y-2">
        {mismatches.map((mismatch, index) => (
          <div key={index} className="text-red-600 text-sm">
            • {mismatch}
          </div>
        ))}
      </div>
    </Card>
  );
};
