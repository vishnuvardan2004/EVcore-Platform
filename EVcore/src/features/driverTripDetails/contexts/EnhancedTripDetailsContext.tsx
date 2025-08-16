import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { 
  TripDetailsState, 
  TripDetailsAction, 
  Trip, 
  ShiftData,
  Analytics,
  HourlyData,
  PaymentBreakdown,
  TripModeStats,
  EfficiencyMetrics
} from '../types';

// Load initial state from localStorage with session persistence
const loadInitialState = (): TripDetailsState => {
  try {
    const saved = localStorage.getItem('tripDetailsSession');
    const session = localStorage.getItem('driverSession');
    
    const defaultState: TripDetailsState = {
      employeeId: '',
      currentStep: 'employee-id',
      shiftData: {
        vehicleNumber: '',
        shiftType: 'day',
        vehicleCategory: '4W',
        startTime: new Date(),
        totalTripsPlanned: 0,
      },
      trips: [],
      isShiftStarted: false,
      isShiftEnded: false,
      analytics: {
        totalEarnings: 0,
        totalTrips: 0,
        averageTrip: 0,
        highestTrip: 0,
        hourlyEarnings: [],
        paymentBreakdown: { cash: 0, digital: 0, pending: 0 },
        tripModeStats: [],
        efficiency: {
          tripsPerHour: 0,
          earningsPerHour: 0,
          earningsPerKm: 0,
          utilizationRate: 0,
        },
      },
      filters: {},
      view: 'list',
      isOffline: false,
    };

    // If there's a saved session, restore it
    if (saved) {
      const parsedState = JSON.parse(saved);
      // Convert date strings back to Date objects
      if (parsedState.shiftData?.startTime) {
        parsedState.shiftData.startTime = new Date(parsedState.shiftData.startTime);
      }
      if (parsedState.shiftData?.endTime) {
        parsedState.shiftData.endTime = new Date(parsedState.shiftData.endTime);
      }
      
      // Check if shift is still active (within 24 hours)
      const now = new Date();
      const shiftStart = new Date(parsedState.shiftData?.startTime || now);
      const hoursSinceStart = (now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
      
      // If shift started more than 24 hours ago, reset to employee ID step
      if (hoursSinceStart > 24) {
        return {
          ...defaultState,
          employeeId: parsedState.employeeId || '', // Keep employee ID for convenience
        };
      }
      
      return {
        ...defaultState,
        ...parsedState,
        // Recalculate analytics based on restored trips
        analytics: calculateAnalytics(parsedState.trips || [], parsedState.shiftData || defaultState.shiftData),
      };
    }

    // Check for persistent driver session (employee ID only)
    if (session) {
      const sessionData = JSON.parse(session);
      if (sessionData.employeeId && sessionData.lastLogin) {
        const lastLogin = new Date(sessionData.lastLogin);
        const daysSinceLogin = (new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        
        // Keep employee ID for 7 days
        if (daysSinceLogin < 7) {
          return {
            ...defaultState,
            employeeId: sessionData.employeeId,
          };
        }
      }
    }

    return defaultState;
  } catch (error) {
    console.error('Error loading trip details state:', error);
    return {
      employeeId: '',
      currentStep: 'employee-id',
      shiftData: {
        vehicleNumber: '',
        shiftType: 'day',
        vehicleCategory: '4W',
        startTime: new Date(),
        totalTripsPlanned: 0,
      },
      trips: [],
      isShiftStarted: false,
      isShiftEnded: false,
      analytics: {
        totalEarnings: 0,
        totalTrips: 0,
        averageTrip: 0,
        highestTrip: 0,
        hourlyEarnings: [],
        paymentBreakdown: { cash: 0, digital: 0, pending: 0 },
        tripModeStats: [],
        efficiency: {
          tripsPerHour: 0,
          earningsPerHour: 0,
          earningsPerKm: 0,
          utilizationRate: 0,
        },
      },
      filters: {},
      view: 'list',
      isOffline: false,
    };
  }
};

const initialState = loadInitialState();

function calculateAnalytics(trips: Trip[], shiftData: ShiftData): Analytics {
  if (trips.length === 0) {
    return initialState.analytics;
  }

  const totalEarnings = trips.reduce((sum, trip) => sum + trip.amount + trip.tip, 0);
  const totalTrips = trips.length;
  const averageTrip = totalEarnings / totalTrips;
  const highestTrip = Math.max(...trips.map(trip => trip.amount + trip.tip));

  // Calculate hourly data
  const hourlyData: { [hour: number]: { earnings: number; trips: number } } = {};
  trips.forEach(trip => {
    const hour = trip.timestamp.getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { earnings: 0, trips: 0 };
    }
    hourlyData[hour].earnings += trip.amount + trip.tip;
    hourlyData[hour].trips += 1;
  });

  const hourlyEarnings: HourlyData[] = Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    earnings: data.earnings,
    trips: data.trips,
  }));

  // Calculate payment breakdown
  const paymentBreakdown: PaymentBreakdown = trips.reduce((breakdown, trip) => {
    const total = trip.amount + trip.tip;
    
    if (trip.partPayment?.enabled) {
      trip.partPayment.payments.forEach(payment => {
        const key = payment.mode === 'Cash' ? 'cash' : 
                   payment.status === 'pending' ? 'pending' : 'digital';
        breakdown[key] = (breakdown[key] || 0) + payment.amount;
      });
    } else {
      const key = trip.paymentMode === 'Cash' ? 'cash' : 
                 trip.status === 'pending' ? 'pending' : 'digital';
      breakdown[key] = (breakdown[key] || 0) + total;
    }
    
    return breakdown;
  }, { cash: 0, digital: 0, pending: 0 } as PaymentBreakdown);

  // Calculate trip mode stats
  const modeStats: { [mode: string]: { count: number; earnings: number } } = {};
  trips.forEach(trip => {
    if (!modeStats[trip.mode]) {
      modeStats[trip.mode] = { count: 0, earnings: 0 };
    }
    modeStats[trip.mode].count += 1;
    modeStats[trip.mode].earnings += trip.amount + trip.tip;
  });

  const tripModeStats: TripModeStats[] = Object.entries(modeStats).map(([mode, stats]) => ({
    mode: mode as any,
    count: stats.count,
    earnings: stats.earnings,
    percentage: (stats.count / totalTrips) * 100,
  }));

  // Calculate efficiency metrics
  const shiftDuration = shiftData.endTime 
    ? (shiftData.endTime.getTime() - shiftData.startTime.getTime()) / (1000 * 60 * 60)
    : (new Date().getTime() - shiftData.startTime.getTime()) / (1000 * 60 * 60);
  
  const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
  
  const efficiency: EfficiencyMetrics = {
    tripsPerHour: totalTrips / Math.max(shiftDuration, 1),
    earningsPerHour: totalEarnings / Math.max(shiftDuration, 1),
    earningsPerKm: totalDistance > 0 ? totalEarnings / totalDistance : 0,
    utilizationRate: Math.min((totalTrips / Math.max(shiftData.totalTripsPlanned, 1)) * 100, 100),
  };

  return {
    totalEarnings,
    totalTrips,
    averageTrip,
    highestTrip,
    hourlyEarnings,
    paymentBreakdown,
    tripModeStats,
    efficiency,
  };
}

function tripDetailsReducer(state: TripDetailsState, action: TripDetailsAction): TripDetailsState {
  switch (action.type) {
    case 'SET_EMPLOYEE_ID':
      const updatedStateWithEmployee = {
        ...state,
        employeeId: action.payload,
        currentStep: 'start-shift' as const,
      };
      
      // Save employee ID to persistent session
      localStorage.setItem('driverSession', JSON.stringify({
        employeeId: action.payload,
        lastLogin: new Date().toISOString(),
      }));
      
      return updatedStateWithEmployee;

    case 'START_SHIFT':
      const newState = {
        ...state,
        shiftData: { ...action.payload, startTime: new Date() },
        currentStep: 'active-shift' as const,
        isShiftStarted: true,
      };
      return newState;

    case 'END_SHIFT':
      const endedState = {
        ...state,
        shiftData: {
          ...state.shiftData,
          endTime: action.payload.endTime,
          odometerEnd: action.payload.odometerEnd,
          batteryLevel: action.payload.batteryLevel,
        },
        currentStep: 'analytics' as const,
        isShiftEnded: true,
      };
      return {
        ...endedState,
        analytics: calculateAnalytics(endedState.trips, endedState.shiftData),
      };

    case 'ADD_TRIP':
      const stateWithNewTrip = {
        ...state,
        trips: [...state.trips, action.payload],
      };
      return {
        ...stateWithNewTrip,
        analytics: calculateAnalytics(stateWithNewTrip.trips, stateWithNewTrip.shiftData),
      };

    case 'UPDATE_TRIP':
      const stateWithUpdatedTrip = {
        ...state,
        trips: state.trips.map(trip => 
          trip.id === action.payload.id 
            ? { ...trip, ...action.payload.trip }
            : trip
        ),
      };
      return {
        ...stateWithUpdatedTrip,
        analytics: calculateAnalytics(stateWithUpdatedTrip.trips, stateWithUpdatedTrip.shiftData),
      };

    case 'DELETE_TRIP':
      const stateWithDeletedTrip = {
        ...state,
        trips: state.trips.filter(trip => trip.id !== action.payload),
      };
      return {
        ...stateWithDeletedTrip,
        analytics: calculateAnalytics(stateWithDeletedTrip.trips, stateWithDeletedTrip.shiftData),
      };

    case 'SET_VIEW':
      return {
        ...state,
        view: action.payload,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {},
      };

    case 'SET_OFFLINE_STATUS':
      return {
        ...state,
        isOffline: action.payload,
      };

    case 'SYNC_DATA':
      const syncedState = {
        ...state,
        trips: action.payload.trips,
        lastSync: action.payload.lastSync,
        isOffline: false,
      };
      return {
        ...syncedState,
        analytics: calculateAnalytics(syncedState.trips, syncedState.shiftData),
      };

    case 'NAVIGATE_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface TripDetailsContextType {
  state: TripDetailsState;
  dispatch: React.Dispatch<TripDetailsAction>;
  setEmployeeId: (id: string) => void;
  startShift: (shiftData: ShiftData) => void;
  endShift: (data: { endTime: Date; odometerEnd?: number; batteryLevel?: number }) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, trip: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setView: (view: TripDetailsState['view']) => void;
  setFilters: (filters: Partial<typeof initialState.filters>) => void;
  clearFilters: () => void;
  navigateToStep: (step: TripDetailsState['currentStep']) => void;
  resetState: () => void;
  clearEmployeeSession: () => void;
}

const TripDetailsContext = createContext<TripDetailsContextType | undefined>(undefined);

export const TripDetailsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tripDetailsReducer, initialState);

  // Auto-save session state to localStorage
  useEffect(() => {
    // Save complete session state for restoration
    localStorage.setItem('tripDetailsSession', JSON.stringify(state));
  }, [state]);

  // Context methods
  const setEmployeeId = (id: string) => {
    dispatch({ type: 'SET_EMPLOYEE_ID', payload: id });
  };

  const startShift = (shiftData: ShiftData) => {
    dispatch({ type: 'START_SHIFT', payload: shiftData });
  };

  const endShift = (data: { endTime: Date; odometerEnd?: number; batteryLevel?: number }) => {
    dispatch({ type: 'END_SHIFT', payload: data });
  };

  const addTrip = (trip: Trip) => {
    dispatch({ type: 'ADD_TRIP', payload: trip });
  };

  const updateTrip = (id: string, trip: Partial<Trip>) => {
    dispatch({ type: 'UPDATE_TRIP', payload: { id, trip } });
  };

  const deleteTrip = (id: string) => {
    dispatch({ type: 'DELETE_TRIP', payload: id });
  };

  const setView = (view: TripDetailsState['view']) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const setFilters = (filters: Partial<typeof initialState.filters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const navigateToStep = (step: TripDetailsState['currentStep']) => {
    dispatch({ type: 'NAVIGATE_STEP', payload: step });
  };

  const resetState = () => {
    // Clear session data but keep employee ID for convenience
    localStorage.removeItem('tripDetailsSession');
    dispatch({ type: 'RESET' });
  };

  const clearEmployeeSession = () => {
    // Completely clear everything including employee ID
    localStorage.removeItem('tripDetailsSession');
    localStorage.removeItem('driverSession');
    dispatch({ type: 'RESET' });
  };

  return (
    <TripDetailsContext.Provider value={{
      state,
      dispatch,
      setEmployeeId,
      startShift,
      endShift,
      addTrip,
      updateTrip,
      deleteTrip,
      setView,
      setFilters,
      clearFilters,
      navigateToStep,
      resetState,
      clearEmployeeSession,
    }}>
      {children}
    </TripDetailsContext.Provider>
  );
};

export const useTripDetails = () => {
  const context = useContext(TripDetailsContext);
  if (context === undefined) {
    throw new Error('useTripDetails must be used within a TripDetailsProvider');
  }
  return context;
};
