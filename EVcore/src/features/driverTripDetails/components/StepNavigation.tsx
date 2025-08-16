import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useTripDetails } from '../contexts/EnhancedTripDetailsContext';
import { ChevronLeft, ChevronRight, RotateCcw, Download, Eye, BarChart3, List } from 'lucide-react';

export const StepNavigation: React.FC = () => {
  const { state, navigateToStep, setView, resetState } = useTripDetails();

  const canGoBack = () => {
    switch (state.currentStep) {
      case 'start-shift':
        return !!state.employeeId;
      case 'active-shift':
        return state.isShiftStarted;
      case 'analytics':
        return true;
      default:
        return false;
    }
  };

  const canGoForward = () => {
    switch (state.currentStep) {
      case 'employee-id':
        return !!state.employeeId;
      case 'start-shift':
        return state.isShiftStarted;
      case 'active-shift':
        return state.trips.length > 0;
      default:
        return false;
    }
  };

  const handleBack = () => {
    switch (state.currentStep) {
      case 'start-shift':
        navigateToStep('employee-id');
        break;
      case 'active-shift':
        navigateToStep('start-shift');
        break;
      case 'analytics':
        navigateToStep('active-shift');
        break;
    }
  };

  const handleForward = () => {
    switch (state.currentStep) {
      case 'employee-id':
        if (state.employeeId) navigateToStep('start-shift');
        break;
      case 'start-shift':
        if (state.isShiftStarted) navigateToStep('active-shift');
        break;
      case 'active-shift':
        if (state.trips.length > 0) navigateToStep('analytics');
        break;
    }
  };

  const exportData = () => {
    const data = {
      employeeId: state.employeeId,
      shiftData: state.shiftData,
      trips: state.trips,
      analytics: state.analytics,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-analytics-${state.employeeId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={!canGoBack()}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleForward}
            disabled={!canGoForward()}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* View Controls - Show during active shift and analytics */}
        {(state.currentStep === 'active-shift' || state.currentStep === 'analytics') && (
          <div className="flex items-center gap-2">
            {state.currentStep === 'active-shift' && (
              <>
                <Button
                  variant={state.view === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="gap-2"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
                
                <Button
                  variant={state.view === 'analytics' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('analytics')}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              </>
            )}
            
            {state.currentStep === 'analytics' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToStep('active-shift')}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                View Trips
              </Button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {state.trips.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
                resetState();
              }
            }}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};
