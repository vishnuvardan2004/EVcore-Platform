
import React from 'react';
import { DeploymentStepRenderer } from './DeploymentStepRenderer';
import { useVehicleDeployment } from '../hooks/useVehicleDeployment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ScanLine, 
  Navigation, 
  Target, 
  FileText, 
  User, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const VehicleDeploymentForm: React.FC = () => {
  const {
    currentStep,
    selectedVehicle,
    selectedDirection,
    vehicleData,
    tripSummary,
    canGoOut,
    canComeIn,
    handleVehicleDetected,
    handleDirectionSelected,
    handlePurposeSelected,
    handleFormSubmit,
    handleBack,
    resetApp,
  } = useVehicleDeployment();

  // Step configuration for progress indicator
  const steps = [
    { key: 'scanner', label: 'Enter Vehicle Number', icon: ScanLine },
    { key: 'direction', label: 'Select Direction', icon: Navigation },
    { key: 'purpose', label: 'Choose Purpose', icon: Target },
    { key: 'office-form', label: 'Office Details', icon: FileText },
    { key: 'pilot-form', label: 'Pilot Details', icon: User },
    { key: 'summary', label: 'Summary', icon: CheckCircle2 }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    // Only show progress after completing steps, not during them
    return (currentIndex+1/ steps.length) * 100;
  };

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(step => step.key === stepKey);
    const currentIndex = getCurrentStepIndex();
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <Card className="bg-white shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-semibold flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <ScanLine className="w-5 h-5" />
          </div>
          Start Vehicle Deployment
        </CardTitle>
        <CardDescription className="text-blue-100">
          Follow the steps below to track vehicle IN/OUT operations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Enhanced Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {getCurrentStepIndex() + 1} of {steps.length}
            </span>
          </div>
          
          <Progress value={getProgressPercentage()} className="h-2 mb-6" />
          
          {/* Step Indicators */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              const StepIcon = step.icon;
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                    ${status === 'completed' 
                      ? 'bg-green-100 text-green-600 border-2 border-green-300' 
                      : status === 'current'
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-300 ring-4 ring-blue-100'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }
                  `}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`
                    text-xs text-center leading-tight
                    ${status === 'current' 
                      ? 'text-blue-600 font-medium' 
                      : status === 'completed'
                      ? 'text-green-600 font-medium'
                      : 'text-gray-500'
                    }
                  `}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-gray-300 absolute translate-x-8 -translate-y-6 hidden md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          <DeploymentStepRenderer
            currentStep={currentStep}
            selectedVehicle={selectedVehicle}
            selectedDirection={selectedDirection}
            vehicleData={vehicleData}
            tripSummary={tripSummary}
            canGoOut={canGoOut}
            canComeIn={canComeIn}
            onVehicleDetected={handleVehicleDetected}
            onDirectionSelected={handleDirectionSelected}
            onPurposeSelected={handlePurposeSelected}
            onFormSubmit={handleFormSubmit}
            onBack={handleBack}
            onClose={resetApp}
          />
        </div>
      </CardContent>
    </Card>
  );
};
