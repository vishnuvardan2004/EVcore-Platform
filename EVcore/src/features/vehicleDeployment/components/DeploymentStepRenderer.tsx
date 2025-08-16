
import React from 'react';
import { VehicleScanner } from './VehicleScanner';
import { DirectionSelector } from './DirectionSelector';
import { PurposeSelector } from './PurposeSelector';
import { OfficeForm } from './OfficeForm';
import { PilotForm } from './PilotForm';
import { TripSummary } from './TripSummary';
import { Vehicle, TripSummary as TripSummaryType } from '../../../types/vehicle';

type AppStep = 
  | 'scanner' 
  | 'direction' 
  | 'purpose' 
  | 'office-form' 
  | 'pilot-form' 
  | 'summary';

interface DeploymentStepRendererProps {
  currentStep: AppStep;
  selectedVehicle: string;
  selectedDirection: 'OUT' | 'IN' | null;
  vehicleData: Vehicle | null;
  tripSummary: TripSummaryType | null;
  canGoOut: boolean;
  canComeIn: boolean;
  onVehicleDetected: (vehicleNumber: string) => void;
  onDirectionSelected: (direction: 'OUT' | 'IN') => void;
  onPurposeSelected: (purpose: 'Office' | 'Pilot') => void;
  onFormSubmit: (formData: any) => void;
  onBack: () => void;
  onClose: () => void;
}

export const DeploymentStepRenderer: React.FC<DeploymentStepRendererProps> = ({
  currentStep,
  selectedVehicle,
  selectedDirection,
  vehicleData,
  tripSummary,
  canGoOut,
  canComeIn,
  onVehicleDetected,
  onDirectionSelected,
  onPurposeSelected,
  onFormSubmit,
  onBack,
  onClose,
}) => {
  switch (currentStep) {
    case 'scanner':
      return <VehicleScanner onVehicleDetected={onVehicleDetected} />;

    case 'direction':
      return (
        <DirectionSelector
          vehicleNumber={selectedVehicle}
          canGoOut={canGoOut}
          canComeIn={canComeIn}
          onDirectionSelected={onDirectionSelected}
        />
      );

    case 'purpose':
      return <PurposeSelector onPurposeSelected={onPurposeSelected} />;

    case 'office-form':
      return (
        <OfficeForm
          direction={selectedDirection!}
          onSubmit={onFormSubmit}
          onBack={onBack}
          previousData={vehicleData?.currentDeployment}
        />
      );

    case 'pilot-form':
      return (
        <PilotForm
          direction={selectedDirection!}
          onSubmit={onFormSubmit}
          onBack={onBack}
          previousData={vehicleData?.currentDeployment}
        />
      );

    case 'summary':
      return tripSummary ? (
        <TripSummary summary={tripSummary} onClose={onClose} />
      ) : null;

    default:
      return null;
  }
};
