
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import { Deployment } from '../../../types/vehicle';
import { TripOverviewCard } from './TripOverviewCard';
import { OutDataCard } from './OutDataCard';
import { InDataCard } from './InDataCard';
import { ChecklistMismatchesCard } from './ChecklistMismatchesCard';
import { ExportActions } from './ExportActions';

interface RideDetailModalProps {
  deployment: Deployment;
  open: boolean;
  onClose: () => void;
}

export const RideDetailModal: React.FC<RideDetailModalProps> = ({
  deployment,
  open,
  onClose,
}) => {
  const hasChecklistMismatches = (deployment.inData?.checklistMismatches || []).length > 0;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ride Details - {deployment.vehicleNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <TripOverviewCard deployment={deployment} />
          <OutDataCard deployment={deployment} />
          <InDataCard deployment={deployment} />
          
          {hasChecklistMismatches && (
            <ChecklistMismatchesCard 
              mismatches={deployment.inData!.checklistMismatches!} 
            />
          )}

          <Separator />

          <ExportActions deployment={deployment} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
