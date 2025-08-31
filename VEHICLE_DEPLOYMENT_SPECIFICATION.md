# 🚗 Vehicle Deployment Tracker Module - Technical Specification

## 📋 **Module Overview**
The Vehicle Deployment Tracker is a comprehensive module for managing electric vehicle fleet deployment, real-time tracking, pilot assignments, and deployment history within the EVCORE platform.

---

## 🗄️ **1. DATABASE SCHEMA & MODELS**

### **1.1 Vehicle Model** (`Vehicle.js`)
```javascript
const vehicleSchema = {
  // Basic Information
  vehicleId: { type: String, required: true, unique: true }, // EVZ_VEH_001
  registrationNumber: { type: String, required: true, unique: true },
  make: { type: String, required: true }, // Tata, Mahindra
  model: { type: String, required: true }, // Nexon EV, e2o
  year: { type: Number, required: true },
  color: { type: String, required: true },
  
  // Technical Specifications
  batteryCapacity: { type: Number }, // kWh
  range: { type: Number }, // km per charge
  chargingType: { type: String, enum: ['AC', 'DC', 'Both'] },
  seatingCapacity: { type: Number },
  
  // Status & Availability
  status: { 
    type: String, 
    enum: ['available', 'deployed', 'maintenance', 'charging', 'out_of_service'],
    default: 'available'
  },
  isActive: { type: Boolean, default: true },
  
  // Location & Hub
  currentHub: { type: String, required: true }, // Main Office, Branch A
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Maintenance & Health
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  mileage: { type: Number, default: 0 }, // Total km
  batteryHealth: { type: Number, min: 0, max: 100 }, // Percentage
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### **1.2 Deployment Model** (`Deployment.js`)
```javascript
const deploymentSchema = {
  // Deployment Identity
  deploymentId: { type: String, required: true, unique: true }, // DEP_001_240830
  
  // Vehicle & Pilot Assignment
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  pilotId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Deployment Details
  startTime: { type: Date, required: true },
  estimatedEndTime: Date,
  actualEndTime: Date,
  
  // Route Information
  startLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true }
  },
  endLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Trip Details
  purpose: { 
    type: String, 
    enum: ['passenger_trip', 'delivery', 'maintenance', 'testing', 'relocation'],
    required: true 
  },
  tripDistance: Number, // km
  passengerCount: { type: Number, default: 0 },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'emergency_stop'],
    default: 'scheduled'
  },
  
  // Real-time Data
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  },
  currentSpeed: Number, // km/h
  batteryLevel: Number, // Percentage
  
  // Completion Details
  endReason: {
    type: String,
    enum: ['completed_normally', 'emergency', 'breakdown', 'cancelled_by_admin', 'pilot_request']
  },
  notes: String,
  
  // Financial
  estimatedCost: Number,
  actualCost: Number,
  fuelSavings: Number, // Compared to petrol vehicle
  
  // Approval & Management
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### **1.3 DeploymentHistory Model** (`DeploymentHistory.js`)
```javascript
const deploymentHistorySchema = {
  deploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment', required: true },
  
  // Status Change Log
  statusChanges: [{
    previousStatus: String,
    newStatus: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: String
  }],
  
  // Location Tracking History
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    address: String,
    timestamp: Date,
    batteryLevel: Number,
    speed: Number
  }],
  
  // Performance Metrics
  metrics: {
    totalDistance: Number,
    averageSpeed: Number,
    maxSpeed: Number,
    batteryUsed: Number, // Percentage consumed
    energyEfficiency: Number, // km per kWh
    carbonFootprintSaved: Number // kg CO2
  },
  
  createdAt: { type: Date, default: Date.now }
}
```

### **1.4 VehicleMaintenanceLog Model** (`VehicleMaintenanceLog.js`)
```javascript
const maintenanceLogSchema = {
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  
  maintenanceType: {
    type: String,
    enum: ['routine_service', 'battery_check', 'tire_replacement', 'brake_service', 'emergency_repair'],
    required: true
  },
  
  description: { type: String, required: true },
  cost: Number,
  performedBy: String, // Service center or mechanic name
  
  // Maintenance Window
  scheduledDate: Date,
  completedDate: Date,
  
  // Impact on Availability
  vehicleUnavailableFrom: Date,
  vehicleUnavailableTo: Date,
  
  // Parts & Service
  partsReplaced: [String],
  serviceNotes: String,
  warrantyInfo: String,
  
  // Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  createdAt: { type: Date, default: Date.now }
}
```

---

## 🔗 **2. API ENDPOINTS**

### **2.1 Vehicle Management**
```
GET    /api/vehicle-deployment/vehicles              # Get all vehicles with filters
GET    /api/vehicle-deployment/vehicles/:id          # Get vehicle details
POST   /api/vehicle-deployment/vehicles              # Create new vehicle
PUT    /api/vehicle-deployment/vehicles/:id          # Update vehicle
DELETE /api/vehicle-deployment/vehicles/:id          # Delete vehicle (soft delete)
PATCH  /api/vehicle-deployment/vehicles/:id/status   # Update vehicle status
GET    /api/vehicle-deployment/vehicles/available    # Get available vehicles
GET    /api/vehicle-deployment/vehicles/statistics   # Get vehicle statistics
```

### **2.2 Deployment Management**
```
GET    /api/vehicle-deployment/deployments              # Get all deployments with filters
GET    /api/vehicle-deployment/deployments/:id          # Get deployment details
POST   /api/vehicle-deployment/deployments              # Create new deployment
PUT    /api/vehicle-deployment/deployments/:id          # Update deployment
DELETE /api/vehicle-deployment/deployments/:id          # Cancel deployment
PATCH  /api/vehicle-deployment/deployments/:id/status   # Update deployment status
GET    /api/vehicle-deployment/deployments/active       # Get active deployments
GET    /api/vehicle-deployment/deployments/by-pilot/:pilotId # Get pilot deployments
```

### **2.3 Real-time Tracking**
```
GET    /api/vehicle-deployment/tracking/live              # Get all live deployments
GET    /api/vehicle-deployment/tracking/:deploymentId     # Get specific deployment tracking
POST   /api/vehicle-deployment/tracking/:deploymentId/update # Update deployment location
GET    /api/vehicle-deployment/tracking/vehicle/:vehicleId   # Track specific vehicle
```

### **2.4 History & Analytics**
```
GET    /api/vehicle-deployment/history                    # Get deployment history
GET    /api/vehicle-deployment/history/:deploymentId      # Get specific deployment history
GET    /api/vehicle-deployment/analytics/summary          # Get deployment analytics
GET    /api/vehicle-deployment/analytics/vehicle/:id      # Get vehicle-specific analytics
GET    /api/vehicle-deployment/analytics/pilot/:id        # Get pilot-specific analytics
GET    /api/vehicle-deployment/reports/daily              # Daily deployment reports
GET    /api/vehicle-deployment/reports/monthly            # Monthly deployment reports
```

### **2.5 Maintenance Management**
```
GET    /api/vehicle-deployment/maintenance                # Get maintenance logs
GET    /api/vehicle-deployment/maintenance/vehicle/:id    # Get vehicle maintenance history
POST   /api/vehicle-deployment/maintenance                # Schedule maintenance
PUT    /api/vehicle-deployment/maintenance/:id            # Update maintenance record
GET    /api/vehicle-deployment/maintenance/due            # Get vehicles due for maintenance
```

---

## 🔒 **3. BUSINESS LOGIC & VALIDATION RULES**

### **3.1 Vehicle Availability Rules**
- Vehicle must be `available` status to be deployed
- Vehicle cannot be assigned to multiple deployments simultaneously
- Vehicle in `maintenance` or `charging` status cannot be deployed
- Vehicle must have minimum 20% battery to start deployment
- Vehicle must be at the same hub as the requesting pilot (unless admin override)

### **3.2 Pilot Assignment Rules**
- Pilot must have `active` status in User model
- Pilot cannot have more than 1 active deployment at a time
- Pilot must have valid license (if tracked in system)
- Pilot role must be either `pilot`, `admin`, or `super_admin`

### **3.3 Deployment Validation**
- Start time cannot be in the past (except for immediate deployments)
- Estimated end time must be after start time
- Vehicle and pilot must be available at deployment time
- Maximum deployment duration: 12 hours (configurable)
- Minimum advance notice: 30 minutes (configurable by admin)

### **3.4 Location & Distance Rules**
- Start location must be within 5km of vehicle's current location
- Real-time updates must not exceed 30 seconds old for active tracking
- Location coordinates must be valid (lat: -90 to 90, lng: -180 to 180)

### **3.5 Status Transition Rules**
```
Vehicle Status Transitions:
available → deployed → available
available → charging → available
available → maintenance → available
deployed → emergency → available/maintenance

Deployment Status Transitions:
scheduled → in_progress → completed
scheduled → cancelled
in_progress → emergency_stop → completed/cancelled
```

---

## 👥 **4. ROLE-BASED ACCESS CONTROL (RBAC)**

### **4.1 Super Admin** 
- **Full Access**: All CRUD operations on vehicles, deployments, maintenance
- **System Management**: Configure business rules, deployment limits
- **Analytics**: Access to all reports, analytics, and historical data
- **Override Powers**: Cancel any deployment, override pilot restrictions
- **Real-time Control**: Emergency stop any deployment

### **4.2 Admin**
- **Vehicle Management**: Create, update, delete vehicles
- **Deployment Management**: Create, update, cancel deployments
- **Pilot Assignment**: Assign any pilot to any vehicle
- **Maintenance Scheduling**: Schedule and manage maintenance
- **Reports**: Access to all reports and analytics
- **Hub Management**: Manage vehicles within their hub

### **4.3 Employee**
- **View Access**: View vehicles, deployments (read-only)
- **Limited Deployment**: Create deployments for pilots (with approval)
- **Basic Reports**: Access to basic deployment reports
- **No Maintenance**: Cannot schedule maintenance
- **Hub Restricted**: Can only view their hub's data

### **4.4 Pilot**
- **Personal Deployments**: View own deployment history
- **Vehicle Status**: Check available vehicles at their hub
- **Active Tracking**: Update location during their active deployments
- **Trip Completion**: Mark their deployments as completed
- **No Vehicle Management**: Cannot create/update vehicles
- **No Other Pilots**: Cannot see other pilots' deployments

### **RBAC Implementation Matrix:**
```
Operation                    | Super Admin | Admin | Employee | Pilot
----------------------------|-------------|-------|----------|-------
Create Vehicle              |      ✅     |   ✅   |    ❌    |   ❌
Update Vehicle              |      ✅     |   ✅   |    ❌    |   ❌
Delete Vehicle              |      ✅     |   ✅   |    ❌    |   ❌
View All Vehicles           |      ✅     |   ✅   |    ✅    |   ❌
View Hub Vehicles           |      ✅     |   ✅   |    ✅    |   ✅
Create Deployment           |      ✅     |   ✅   |    ✅*   |   ❌
Update Any Deployment       |      ✅     |   ✅   |    ❌    |   ❌
Update Own Deployment       |      ✅     |   ✅   |    ✅    |   ✅
Cancel Any Deployment       |      ✅     |   ✅   |    ❌    |   ❌
View All Deployments        |      ✅     |   ✅   |    ✅    |   ❌
View Own Deployments        |      ✅     |   ✅   |    ✅    |   ✅
Real-time Tracking          |      ✅     |   ✅   |    ✅    |   ✅*
Schedule Maintenance        |      ✅     |   ✅   |    ❌    |   ❌
View Analytics              |      ✅     |   ✅   |    ✅*   |   ❌
Export Reports              |      ✅     |   ✅   |    ❌    |   ❌
Emergency Controls          |      ✅     |   ✅   |    ❌    |   ❌
```
*Limited access or with approval required

---

## 📁 **5. FOLDER STRUCTURE & MODULARIZATION**

```
src/modules/vehicleDeployment/
│
├── models/
│   ├── Vehicle.js                    # Vehicle schema & methods
│   ├── Deployment.js                 # Deployment schema & methods
│   ├── DeploymentHistory.js          # Deployment history tracking
│   └── VehicleMaintenanceLog.js      # Maintenance records
│
├── controllers/
│   ├── vehicleController.js          # Vehicle CRUD operations
│   ├── deploymentController.js       # Deployment management
│   ├── trackingController.js         # Real-time tracking
│   ├── analyticsController.js        # Reports & analytics
│   └── maintenanceController.js      # Maintenance management
│
├── routes/
│   ├── vehicles.js                   # Vehicle-related routes
│   ├── deployments.js                # Deployment routes
│   ├── tracking.js                   # Real-time tracking routes
│   ├── analytics.js                  # Analytics & reports routes
│   └── maintenance.js                # Maintenance routes
│
├── services/
│   ├── vehicleService.js             # Business logic for vehicles
│   ├── deploymentService.js          # Deployment business logic
│   ├── trackingService.js            # Real-time tracking service
│   ├── analyticsService.js           # Analytics computation
│   └── notificationService.js        # Deployment notifications
│
├── middleware/
│   ├── vehicleValidation.js          # Vehicle data validation
│   ├── deploymentValidation.js       # Deployment validation
│   ├── trackingValidation.js         # Location data validation
│   └── rbacVehicleDeployment.js      # Role-specific access control
│
├── utils/
│   ├── locationUtils.js              # GPS/location calculations
│   ├── distanceCalculator.js         # Distance & route calculations
│   ├── batteryCalculator.js          # Battery consumption estimates
│   └── reportGenerator.js            # Report generation utilities
│
└── constants/
    ├── vehicleConstants.js           # Vehicle-related constants
    ├── deploymentConstants.js        # Deployment status constants
    └── validationRules.js            # Business validation rules
```

### **Integration Points:**
```
src/
├── modules/
│   ├── auth/ (existing - don't touch)
│   ├── users/ (existing - don't touch)  
│   └── vehicleDeployment/ (new module)
│
├── shared/
│   ├── middleware/
│   │   ├── auth.js (existing - reuse for RBAC)
│   │   └── errorHandler.js (existing - reuse)
│   └── utils/
│       └── responseHelper.js (create for consistent API responses)
```

---

## 🔧 **6. TECHNICAL CONSIDERATIONS**

### **6.1 Database Indexes**
```javascript
// Performance indexes
Vehicle: ['vehicleId', 'status', 'currentHub', 'isActive']
Deployment: ['deploymentId', 'vehicleId', 'pilotId', 'status', 'startTime']
DeploymentHistory: ['deploymentId', 'createdAt']
```

### **6.2 Real-time Features**
- WebSocket integration for live tracking updates
- Location update throttling (max 1 update per 30 seconds)
- Battery level monitoring and alerts
- Emergency alert system

### **6.3 Data Validation**
- Input sanitization for all location data
- Vehicle ID format validation (EVZ_VEH_XXX)
- Deployment ID format validation (DEP_XXX_YYMMDD)
- Location coordinate bounds checking

### **6.4 Error Handling**
- Consistent error responses across all endpoints
- Detailed logging for deployment failures
- Graceful handling of location service failures
- Rollback mechanisms for failed deployments

---

## 🚀 **7. DEVELOPMENT PHASES**

### **Phase 1: Foundation (Week 1)**
- Database models and schemas
- Basic CRUD for vehicles
- User role integration with existing auth

### **Phase 2: Core Deployment (Week 2)** 
- Deployment creation and management
- Basic status tracking
- Simple validation rules

### **Phase 3: Real-time Tracking (Week 3)**
- Location tracking implementation
- WebSocket integration
- Live deployment monitoring

### **Phase 4: Analytics & Reports (Week 4)**
- Historical data analysis
- Report generation
- Performance metrics

### **Phase 5: Advanced Features (Week 5)**
- Maintenance scheduling
- Advanced analytics
- Emergency controls
- System optimization

---

This modular approach ensures the Vehicle Deployment Tracker integrates seamlessly with your existing authentication system while providing comprehensive fleet management capabilities. The design prioritizes scalability, maintainability, and role-based security.
