# Vehicle Deployment API Documentation

## Overview
The Vehicle Deployment API provides comprehensive management of electric vehicles, deployments, maintenance, and real-time tracking for the EVZip platform.

## Base URL
```
https://api.evzip.com/api/vehicle-deployment
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Error Handling
All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "message": "Operation completed successfully",
  "pagination": {  // Only for paginated endpoints
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": <additional_error_details>
  }
}
```

## Endpoints

### Vehicle Management

#### Get All Vehicles
```http
GET /vehicles
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `status` (string, optional): Filter by status (available, deployed, maintenance, out_of_service)
- `make` (string, optional): Filter by vehicle make
- `currentHub` (string, optional): Filter by current hub
- `batteryLevel` (number, optional): Minimum battery level filter
- `search` (string, optional): Search in registration number or vehicle ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "648f9b2c1234567890abcdef",
      "vehicleId": "EVZ_VEH_001",
      "registrationNumber": "TS09EZ1234",
      "make": "Tata",
      "model": "Nexon EV",
      "year": 2024,
      "color": "White",
      "batteryCapacity": 40.5,
      "range": 312,
      "chargingType": "Both",
      "seatingCapacity": 5,
      "currentHub": "Hyderabad Hub",
      "status": "available",
      "batteryStatus": {
        "currentLevel": 85,
        "lastCharged": "2024-01-15T10:30:00.000Z",
        "estimatedRange": 265
      },
      "lastDeployment": "2024-01-14T16:45:00.000Z",
      "totalKilometers": 1250,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Available Vehicles
```http
GET /vehicles/available
```

Returns only vehicles with status 'available' and battery level > 20%.

#### Get Single Vehicle
```http
GET /vehicles/:id
```

**Parameters:**
- `id` (string): Vehicle MongoDB ObjectId

#### Create Vehicle
```http
POST /vehicles
```

**Required Role:** Admin, Super Admin

**Request Body:**
```json
{
  "vehicleId": "EVZ_VEH_001", // Optional, auto-generated if not provided
  "registrationNumber": "TS09EZ1234",
  "make": "Tata", // Must be one of: Tata, Mahindra, Hyundai, MG, BMW, Mercedes, Audi, Jaguar
  "model": "Nexon EV",
  "year": 2024, // Between 2020 and current year + 1
  "color": "White",
  "batteryCapacity": 40.5, // Between 20-200 kWh
  "range": 312, // Between 100-1000 km
  "chargingType": "Both", // AC, DC, or Both
  "seatingCapacity": 5, // Between 2-8
  "currentHub": "Hyderabad Hub"
}
```

#### Update Vehicle
```http
PUT /vehicles/:id
```

**Required Role:** Admin, Super Admin

**Request Body:** (All fields optional for update)
```json
{
  "status": "available", // available, deployed, maintenance, out_of_service
  "currentHub": "Bangalore Hub",
  "batteryStatus": {
    "currentLevel": 90
  },
  "maintenanceNotes": "Recent service completed"
}
```

#### Delete Vehicle
```http
DELETE /vehicles/:id
```

**Required Role:** Super Admin

Sets vehicle status to 'out_of_service' (soft delete).

### Deployment Management

#### Get All Deployments
```http
GET /deployments
```

**Query Parameters:**
- `page`, `limit` (pagination)
- `status` (string): scheduled, in_progress, completed, cancelled
- `vehicleId` (string): Filter by vehicle ID
- `pilotId` (string): Filter by pilot ID
- `startDate`, `endDate` (ISO date strings): Date range filter

#### Get Single Deployment
```http
GET /deployments/:id
```

#### Create Deployment
```http
POST /deployments
```

**Required Role:** Admin, Super Admin, Pilot

**Request Body:**
```json
{
  "deploymentId": "DEP_001_240115", // Optional, auto-generated
  "vehicleId": "648f9b2c1234567890abcdef",
  "pilotId": "648f9b2c1234567890abcdef",
  "startTime": "2024-01-15T14:00:00.000Z",
  "estimatedEndTime": "2024-01-15T18:00:00.000Z",
  "startLocation": {
    "latitude": 17.4065,
    "longitude": 78.4772,
    "address": "HITEC City, Hyderabad, Telangana, India"
  },
  "endLocation": { // Optional
    "latitude": 17.3850,
    "longitude": 78.4867,
    "address": "Gachibowli, Hyderabad, Telangana, India"
  },
  "purpose": "Client demonstration and test drive",
  "specialInstructions": "Handle with care, VIP client",
  "estimatedDistance": 25 // Optional, in kilometers
}
```

#### Update Deployment
```http
PUT /deployments/:id
```

**Required Role:** Admin, Super Admin, Assigned Pilot

#### Cancel Deployment
```http
POST /deployments/:id/cancel
```

**Required Role:** Admin, Super Admin, Assigned Pilot

**Request Body:**
```json
{
  "reason": "Vehicle breakdown requires immediate maintenance",
  "notifyStakeholders": true
}
```

### Maintenance Management

#### Get Maintenance Logs
```http
GET /maintenance
```

**Query Parameters:**
- `page`, `limit` (pagination)
- `vehicleId` (string): Filter by vehicle
- `status` (string): scheduled, in_progress, completed, cancelled
- `maintenanceType` (string): routine_service, battery_check, tire_replacement, brake_service, emergency_repair, software_update
- `startDate`, `endDate` (ISO date strings): Date range filter

#### Create Maintenance Log
```http
POST /maintenance
```

**Required Role:** Admin, Super Admin

**Request Body:**
```json
{
  "maintenanceId": "MAINT_240115_001", // Optional, auto-generated
  "vehicleId": "648f9b2c1234567890abcdef",
  "maintenanceType": "routine_service",
  "description": "Monthly routine service and battery health check",
  "scheduledDate": "2024-01-20T09:00:00.000Z",
  "estimatedDuration": 4, // Hours
  "serviceProvider": {
    "name": "EV Service Center",
    "contactInfo": "+91-9876543210",
    "location": "Madhapur, Hyderabad"
  },
  "estimatedCost": 2500, // Optional
  "priority": "medium" // low, medium, high, critical
}
```

#### Get Vehicles Due for Maintenance
```http
GET /maintenance/due
```

Returns vehicles that are due for maintenance based on kilometers driven, last service date, or battery health.

#### Auto-schedule Maintenance
```http
POST /maintenance/auto-schedule
```

**Required Role:** Admin, Super Admin

**Request Body:**
```json
{
  "vehicleId": "648f9b2c1234567890abcdef",
  "maintenanceType": "routine_service",
  "preferredDate": "2024-01-25T09:00:00.000Z" // Optional
}
```

### Dashboard & Analytics

#### Get Dashboard Statistics
```http
GET /dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVehicles": 50,
    "availableVehicles": 35,
    "deployedVehicles": 12,
    "maintenanceVehicles": 3,
    "activeDeployments": 12,
    "completedDeployments": 145,
    "pendingMaintenance": 8,
    "criticalAlerts": 2,
    "fleetUtilization": 68.5,
    "averageBatteryLevel": 76.3,
    "totalDistanceToday": 1250,
    "recentActivity": [
      {
        "type": "deployment_completed",
        "message": "Deployment DEP_001_240115 completed successfully",
        "timestamp": "2024-01-15T16:30:00.000Z"
      }
    ]
  }
}
```

#### Get Available Pilots
```http
GET /pilots/available
```

Returns pilots available for deployment assignments.

### Advanced Analytics

#### Get Optimal Vehicle Recommendations
```http
POST /vehicles/optimal
```

**Request Body:**
```json
{
  "location": {
    "latitude": 17.4065,
    "longitude": 78.4772
  },
  "minBatteryLevel": 50, // Optional, default: 30
  "maxDistanceKm": 20, // Optional, default: 50
  "preferredMake": "Tata", // Optional
  "requiresSpecialEquipment": false, // Optional
  "seatingRequired": 5 // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "vehicle": {
        "_id": "648f9b2c1234567890abcdef",
        "vehicleId": "EVZ_VEH_001",
        "registrationNumber": "TS09EZ1234",
        "make": "Tata",
        "model": "Nexon EV"
      },
      "score": 95.5,
      "factors": {
        "distance": 2.3, // km from requested location
        "batteryLevel": 85,
        "lastMaintenance": "2024-01-10T00:00:00.000Z",
        "utilizationRate": 68.2
      },
      "estimatedArrivalTime": "15 minutes"
    }
  ]
}
```

#### Get Deployment Analytics
```http
GET /analytics/deployments
```

**Query Parameters:**
- `startDate`, `endDate` (ISO date strings): Date range for analytics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDeployments": 145,
    "completedDeployments": 138,
    "cancelledDeployments": 7,
    "completionRate": 95.2,
    "averageDuration": 185, // minutes
    "totalDistance": 12450, // km
    "averageDistance": 85.9, // km per deployment
    "peakHours": [
      { "hour": 14, "deployments": 25 },
      { "hour": 15, "deployments": 22 }
    ],
    "topVehicles": [
      {
        "vehicleId": "EVZ_VEH_001",
        "deployments": 28,
        "totalDistance": 1250
      }
    ],
    "hubAnalysis": [
      {
        "hub": "Hyderabad Hub",
        "deployments": 85,
        "utilizationRate": 72.3
      }
    ]
  }
}
```

#### Get Fleet Utilization Analytics
```http
GET /analytics/fleet-utilization
```

#### Generate Deployment Report
```http
POST /reports/deployments
```

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.000Z",
  "format": "pdf", // pdf, excel, csv
  "includeCharts": true,
  "groupBy": "vehicle", // vehicle, pilot, hub, date
  "filters": {
    "status": ["completed"],
    "vehicleIds": ["648f9b2c1234567890abcdef"]
  }
}
```

### Real-time Tracking

#### Update Deployment Tracking
```http
PUT /deployments/:id/tracking
```

**Required Role:** Admin, Super Admin, Assigned Pilot

**Request Body:**
```json
{
  "currentLocation": {
    "latitude": 17.4165,
    "longitude": 78.4872
  },
  "batteryLevel": 78, // 0-100
  "speed": 45, // km/h
  "status": "in_progress",
  "odometer": 1275.5, // total km
  "timestamp": "2024-01-15T15:30:00.000Z" // Optional, defaults to now
}
```

#### Get Deployment History
```http
GET /deployments/:id/history
```

Returns complete tracking history for a deployment.

### Notifications

#### Get Notifications
```http
GET /notifications
```

**Query Parameters:**
- `type` (string): maintenance_due, low_battery, deployment_overdue, vehicle_breakdown
- `unreadOnly` (boolean): Return only unread notifications
- `limit` (number): Number of notifications to return

## Error Codes

### Vehicle-specific Errors
- `VEHICLE_NOT_FOUND`: Vehicle with given ID not found
- `VEHICLE_UNAVAILABLE`: Vehicle is not available for deployment
- `VEHICLE_IN_MAINTENANCE`: Vehicle is currently under maintenance
- `INSUFFICIENT_BATTERY`: Vehicle battery level too low for deployment
- `DISTANCE_TOO_FAR`: Vehicle is too far from requested location

### Deployment-specific Errors
- `DEPLOYMENT_CONFLICT`: Time conflict with existing deployment
- `PILOT_UNAVAILABLE`: Assigned pilot is not available
- `DEPLOYMENT_NOT_FOUND`: Deployment with given ID not found
- `DEPLOYMENT_ALREADY_COMPLETED`: Cannot modify completed deployment
- `INVALID_TIME_RANGE`: Invalid start/end time combination

### Authorization Errors
- `INSUFFICIENT_PERMISSIONS`: User doesn't have required permissions
- `MODULE_ACCESS_DENIED`: User doesn't have access to vehicle deployment module
- `DEPLOYMENT_AUTHORIZATION_ERROR`: Cannot perform action on this deployment

### Validation Errors
- `VALIDATION_ERROR`: Request body validation failed
- `INVALID_COORDINATES`: Invalid latitude/longitude values
- `DUPLICATE_KEY_ERROR`: Duplicate value for unique field

## Rate Limits
- Standard endpoints: 100 requests per minute per user
- Analytics endpoints: 20 requests per minute per user
- Report generation: 5 requests per minute per user

## SDKs and Integration

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

const evzipAPI = axios.create({
  baseURL: 'https://api.evzip.com/api/vehicle-deployment',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get available vehicles
const availableVehicles = await evzipAPI.get('/vehicles/available');

// Create deployment
const newDeployment = await evzipAPI.post('/deployments', {
  vehicleId: '648f9b2c1234567890abcdef',
  pilotId: '648f9b2c1234567890abcdef',
  startTime: '2024-01-15T14:00:00.000Z',
  estimatedEndTime: '2024-01-15T18:00:00.000Z',
  startLocation: {
    latitude: 17.4065,
    longitude: 78.4772,
    address: 'HITEC City, Hyderabad'
  },
  purpose: 'Client demonstration'
});
```

## Webhooks
The API supports webhooks for real-time notifications:

- `deployment.created`
- `deployment.started` 
- `deployment.completed`
- `deployment.cancelled`
- `vehicle.maintenance_due`
- `vehicle.low_battery`
- `vehicle.breakdown`

Configure webhooks in your account settings at `https://console.evzip.com/webhooks`.

## Support
For API support, contact: api-support@evzip.com
Documentation updates: https://docs.evzip.com/api/vehicle-deployment
