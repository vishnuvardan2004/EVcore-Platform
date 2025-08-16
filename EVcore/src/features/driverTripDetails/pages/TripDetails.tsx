
import React from 'react';
import { PageLayout } from '../../../components/PageLayout';
import { TripDetailsProvider } from '../contexts/EnhancedTripDetailsContext';
import { EnhancedTripDetailsForm } from '../components/EnhancedTripDetailsForm';

const TripDetails = () => {
  return (
    <TripDetailsProvider>
      <PageLayout 
        title="� Trip Analytics" 
        subtitle="Professional driver performance management system"
      >
        <div className="max-w-7xl mx-auto">
          <EnhancedTripDetailsForm />
        </div>
      </PageLayout>
    </TripDetailsProvider>
  );
};

export default TripDetails;
