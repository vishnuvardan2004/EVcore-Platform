// Enhanced types for the rebuilt trip analytics feature

export interface Trip {
  id: string;
  mode: TripMode;
  amount: number;
  tip: number;
  paymentMode: PaymentMode;
  status: TripStatus;
  startLocation?: string;
  endLocation?: string;
  distance?: number;
  duration?: number;
  timestamp: Date;
  notes?: string;
  partPayment?: PartPayment;
  customer?: CustomerInfo;
  rating?: number;
}

export interface PartPayment {
  enabled: boolean;
  payments: PaymentSplit[];
}

export interface PaymentSplit {
  amount: number;
  mode: PaymentMode;
  status: 'pending' | 'completed' | 'failed';
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  rating?: number;
}

export type TripMode = 
  | 'EVZIP App'
  | 'Rental Package'
  | 'Subscription'
  | 'Airport'
  | 'UBER'
  | 'Rapido'
  | 'Direct Booking'
  | 'Corporate';

export type PaymentMode = 
  | 'Cash'
  | 'UPI - QR'
  | 'Wallet'
  | 'Card'
  | 'Uber'
  | 'Bank Transfer'
  | 'Pending';

export type TripStatus = 
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'disputed';

export interface ShiftData {
  vehicleNumber: string;
  shiftType: ShiftType;
  vehicleCategory: VehicleCategory;
  startTime: Date;
  endTime?: Date;
  totalTripsPlanned: number;
  fuelLevel?: number;
  batteryLevel?: number;
  odometerStart?: number;
  odometerEnd?: number;
  location?: Location;
  weather?: WeatherInfo;
}

export type ShiftType = 'day' | 'night' | 'evening' | 'split' | 'on-demand';
export type VehicleCategory = '2W' | '3W' | '4W' | '6W' | 'heavy' | 'electric';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
}

export interface WeatherInfo {
  condition: string;
  temperature: number;
  humidity: number;
}

export interface Analytics {
  totalEarnings: number;
  totalTrips: number;
  averageTrip: number;
  highestTrip: number;
  hourlyEarnings: HourlyData[];
  paymentBreakdown: PaymentBreakdown;
  tripModeStats: TripModeStats[];
  efficiency: EfficiencyMetrics;
}

export interface HourlyData {
  hour: number;
  earnings: number;
  trips: number;
}

export interface PaymentBreakdown {
  cash: number;
  digital: number;
  pending: number;
  [key: string]: number;
}

export interface TripModeStats {
  mode: TripMode;
  count: number;
  earnings: number;
  percentage: number;
}

export interface EfficiencyMetrics {
  tripsPerHour: number;
  earningsPerHour: number;
  earningsPerKm: number;
  utilizationRate: number;
}

export interface TripDetailsState {
  employeeId: string;
  currentStep: 'employee-id' | 'start-shift' | 'active-shift' | 'end-shift' | 'analytics';
  shiftData: ShiftData;
  trips: Trip[];
  isShiftStarted: boolean;
  isShiftEnded: boolean;
  analytics: Analytics;
  filters: TripFilters;
  view: 'list' | 'analytics' | 'map';
  isOffline: boolean;
  lastSync?: Date;
}

export interface TripFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: TripStatus[];
  paymentMode?: PaymentMode[];
  tripMode?: TripMode[];
  amountRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
}

export type TripDetailsAction = 
  | { type: 'SET_EMPLOYEE_ID'; payload: string }
  | { type: 'START_SHIFT'; payload: ShiftData }
  | { type: 'END_SHIFT'; payload: { endTime: Date; odometerEnd?: number; batteryLevel?: number } }
  | { type: 'ADD_TRIP'; payload: Trip }
  | { type: 'UPDATE_TRIP'; payload: { id: string; trip: Partial<Trip> } }
  | { type: 'DELETE_TRIP'; payload: string }
  | { type: 'SET_VIEW'; payload: TripDetailsState['view'] }
  | { type: 'SET_FILTERS'; payload: Partial<TripFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_OFFLINE_STATUS'; payload: boolean }
  | { type: 'SYNC_DATA'; payload: { trips: Trip[]; lastSync: Date } }
  | { type: 'NAVIGATE_STEP'; payload: TripDetailsState['currentStep'] }
  | { type: 'RESET' };
