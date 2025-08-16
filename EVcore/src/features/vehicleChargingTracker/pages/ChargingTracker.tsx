import React, { useState } from 'react';
import { ChargingTrackerLayout } from '../components/ChargingTrackerLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { AccessForm } from '../components/AccessForm';
import { StartChargingForm } from '../components/StartChargingForm';
import { EndChargingForm } from '../components/EndChargingForm';

type FlowType = 'access' | 'start' | 'end';

interface AccessData {
  vehicleNumber: string;
  pilotId: string;
}

interface StartChargingData {
  odoReading: string;
  chargePercent: string;
  range: string;
  location: 'HUB' | 'Outside';
  brand: string;
  locationName: string;
}

interface EndChargingData {
  chargePercent: string;
  range: string;
  cost: string;
  paymentMode: 'UPI' | 'Cash';
  units: string;
}

const ChargingTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentFlow, setCurrentFlow] = useState<FlowType>('access');
  const [accessData, setAccessData] = useState<AccessData>({
    vehicleNumber: '',
    pilotId: ''
  });
  
  const [startData, setStartData] = useState<StartChargingData>({
    odoReading: '',
    chargePercent: '',
    range: '',
    location: 'HUB',
    brand: '',
    locationName: ''
  });
  
  const [endData, setEndData] = useState<EndChargingData>({
    chargePercent: '',
    range: '',
    cost: '',
    paymentMode: 'UPI',
    units: ''
  });

  const handleAccessSubmit = () => {
    if (!accessData.vehicleNumber || !accessData.pilotId) {
      toast({
        title: "Missing Information",
        description: "Please enter both Vehicle Number and Pilot ID",
        variant: "destructive"
      });
      return;
    }
    // Access data is valid, show Start/End buttons (stay in access flow but enable buttons)
  };

  const handleStartFlow = () => {
    if (!accessData.vehicleNumber || !accessData.pilotId) {
      toast({
        title: "Access Required",
        description: "Please enter Vehicle Number and Pilot ID first",
        variant: "destructive"
      });
      return;
    }
    setCurrentFlow('start');
  };

  const handleEndFlow = () => {
    if (!accessData.vehicleNumber || !accessData.pilotId) {
      toast({
        title: "Access Required",
        description: "Please enter Vehicle Number and Pilot ID first",
        variant: "destructive"
      });
      return;
    }
    setCurrentFlow('end');
  };

  const handleStartSubmit = () => {
    if (!startData.odoReading || !startData.chargePercent || !startData.range) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (startData.location === 'Outside' && (!startData.brand || !startData.locationName)) {
      toast({
        title: "Missing Location Details",
        description: "Please provide brand and location name for outside charging",
        variant: "destructive"
      });
      return;
    }

    console.log('Start Charging Data:', { ...accessData, ...startData });
    toast({
      title: "Charging Session Started",
      description: `Started charging for vehicle ${accessData.vehicleNumber}`,
    });
    
    // Reset form and go back to access
    setStartData({
      odoReading: '',
      chargePercent: '',
      range: '',
      location: 'HUB',
      brand: '',
      locationName: ''
    });
    setCurrentFlow('access');
  };

  const handleEndSubmit = () => {
    if (!endData.chargePercent || !endData.range || !endData.cost || !endData.units) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    console.log('End Charging Data:', { ...accessData, ...endData });
    toast({
      title: "Charging Session Ended",
      description: `Ended charging for vehicle ${accessData.vehicleNumber}`,
    });
    
    // Reset form and go back to access
    setEndData({
      chargePercent: '',
      range: '',
      cost: '',
      paymentMode: 'UPI',
      units: ''
    });
    setCurrentFlow('access');
  };

  return (
    <ChargingTrackerLayout 
      title="⚡ Vehicle Charging Tracker" 
      subtitle="Monitor and track EV charging sessions"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {currentFlow === 'access' && (
          <AccessForm
            accessData={accessData}
            onAccessDataChange={setAccessData}
            onSubmit={handleAccessSubmit}
            onStartFlow={handleStartFlow}
            onEndFlow={handleEndFlow}
          />
        )}
        
        {currentFlow === 'start' && (
          <StartChargingForm
            vehicleNumber={accessData.vehicleNumber}
            pilotId={accessData.pilotId}
            startData={startData}
            onStartDataChange={setStartData}
            onSubmit={handleStartSubmit}
            onBack={() => setCurrentFlow('access')}
          />
        )}
        
        {currentFlow === 'end' && (
          <EndChargingForm
            vehicleNumber={accessData.vehicleNumber}
            pilotId={accessData.pilotId}
            endData={endData}
            onEndDataChange={setEndData}
            onSubmit={handleEndSubmit}
            onBack={() => setCurrentFlow('access')}
          />
        )}
      </div>
    </ChargingTrackerLayout>
  );
};

export default ChargingTracker;
