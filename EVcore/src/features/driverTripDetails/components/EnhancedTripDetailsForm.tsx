import React from 'react';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { 
  EnhancedEmployeeIdSection,
  EnhancedStartShiftSection,
  EnhancedActiveShiftSection,
  EnhancedAnalyticsSection,
  StepNavigation
} from './index';
import { NetworkStatus } from '../../../components/NetworkStatus';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Wifi, WifiOff, Clock, User, Car, BarChart3, CheckCircle } from 'lucide-react';

export const EnhancedTripDetailsForm: React.FC = () => {
  const { state } = useTripDetails();

  const steps = [
    { 
      id: 'employee-id', 
      title: 'Driver ID', 
      icon: User, 
      completed: !!state.employeeId,
      active: state.currentStep === 'employee-id'
    },
    { 
      id: 'start-shift', 
      title: 'Start Shift', 
      icon: Clock, 
      completed: state.isShiftStarted,
      active: state.currentStep === 'start-shift'
    },
    { 
      id: 'active-shift', 
      title: 'Trip Management', 
      icon: Car, 
      completed: state.trips.length > 0,
      active: state.currentStep === 'active-shift'
    },
    { 
      id: 'analytics', 
      title: 'Analytics', 
      icon: BarChart3, 
      completed: state.isShiftEnded,
      active: state.currentStep === 'analytics'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Network Status & Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant={state.isOffline ? "destructive" : "default"} className="gap-2">
            {state.isOffline ? (
              <>
                <WifiOff className="w-3 h-3" />
                Offline Mode
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3" />
                Online
              </>
            )}
          </Badge>
          
          {state.lastSync && (
            <span className="text-sm text-gray-500">
              Last sync: {state.lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <NetworkStatus />
      </div>

      {/* Enhanced Progress Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center space-y-2 ${
                step.active ? 'text-blue-600' : 
                step.completed ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.completed ? 'bg-green-500 text-white shadow-lg' :
                  step.active ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                  
                  {step.active && (
                    <div className="absolute -inset-1 bg-blue-500 rounded-full animate-pulse opacity-30"></div>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="font-medium text-sm">{step.title}</div>
                  {step.completed && (
                    <div className="text-xs text-green-600">✓ Complete</div>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${
                  steps[index + 1].completed || step.completed ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Step Navigation */}
      <StepNavigation />

      {/* Step Content */}
      <div className="min-h-[600px]">
        {state.currentStep === 'employee-id' && <EnhancedEmployeeIdSection />}
        {(state.currentStep === 'start-shift' && state.employeeId) && <EnhancedStartShiftSection />}
        {(state.currentStep === 'active-shift' && state.isShiftStarted) && <EnhancedActiveShiftSection />}
        {(state.currentStep === 'analytics') && <EnhancedAnalyticsSection />}
      </div>
    </div>
  );
};
