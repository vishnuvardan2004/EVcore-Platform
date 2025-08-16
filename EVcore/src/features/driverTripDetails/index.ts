
// Main page component
export { default as TripDetails } from './pages/TripDetails';

// Enhanced components - completely rebuilt trip analytics
export { EnhancedTripDetailsForm } from './components/EnhancedTripDetailsForm';
export { EnhancedEmployeeIdSection } from './components/EnhancedEmployeeIdSection';
export { EnhancedStartShiftSection } from './components/EnhancedStartShiftSection';
export { EnhancedActiveShiftSection } from './components/EnhancedActiveShiftSection';
export { EnhancedAnalyticsSection } from './components/EnhancedAnalyticsSection';
export { EnhancedTripEntryForm } from './components/EnhancedTripEntryForm';
export { EnhancedTripCard } from './components/EnhancedTripCard';
export { StepNavigation } from './components/StepNavigation';
export { TripFilters } from './components/TripFilters';

// Enhanced context and types
export { TripDetailsProvider as EnhancedTripDetailsProvider, useTripDetails as useEnhancedTripDetails } from './contexts/EnhancedTripDetailsContext';
export type * from './types';
