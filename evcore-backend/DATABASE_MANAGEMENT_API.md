# Database Management API Documentation

## Overview
The Database Management module provides a comprehensive, scalable backend system for managing multiple sub-platforms (collections) within a unified system. Each sub-platform (Employee, Pilot, Vehicle, etc.) is treated as a dynamic collection with its own schema, CRUD operations, validation rules, and logging.

## Base URL
```
http://localhost:3002/api/database-mgmt
```

## Authentication
All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control
- **Database Access**: `super_admin`, `admin`, `db_manager`
- **Administrative Access**: `super_admin`, `admin`

## Endpoints

### 1. Get All Sub-Platforms
**GET** `/platforms`

**Access**: Database Access Required

**Response**:
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "name": "Employee",
        "collectionName": "employee",
        "fields": ["fullName", "email", "employeeId", "department"],
        "validation": {
          "required": ["fullName", "email", "employeeId"],
          "unique": ["email", "employeeId"]
        },
        "indexes": [...]
      }
    ],
    "totalPlatforms": 3
  }
}
```

### 2. Create New Sub-Platform
**POST** `/platforms`

**Access**: Admin Required

**Request Body**:
```json
{
  "schemaDefinition": {
    "name": "CustomPlatform",
    "fields": {
      "title": { "type": "String", "required": true },
      "description": { "type": "String" },
      "priority": { "type": "Number", "min": 1, "max": 5 },
      "isActive": { "type": "Boolean", "default": true }
    },
    "indexes": [
      { "fields": { "title": 1 }, "options": { "unique": true } }
    ],
    "validation": {
      "required": ["title"],
      "unique": ["title"]
    }
  }
}
```

### 3. Get Documents from Sub-Platform
**GET** `/platforms/{platform}/documents`

**Access**: Database Access Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `sortBy` (optional): Field to sort by (default: 'createdAt')
- `sortOrder` (optional): 'asc' or 'desc' (default: 'desc')
- `filter` (optional): JSON filter object
- `populate` (optional): Comma-separated fields to populate

**Example**:
```
GET /platforms/employee/documents?page=1&limit=20&sortBy=fullName&sortOrder=asc&filter={"isActive":true}
```

### 4. Create Document
**POST** `/platforms/{platform}/documents`

**Access**: Database Access Required

**Request Body**:
```json
{
  "document": {
    "fullName": "John Doe",
    "email": "john.doe@company.com",
    "employeeId": "EMP001",
    "department": "Engineering",
    "position": "Senior Developer",
    "salary": 75000
  }
}
```

### 5. Update Document
**PUT** `/platforms/{platform}/documents/{documentId}`

**Access**: Database Access Required

**Request Body**:
```json
{
  "updates": {
    "position": "Lead Developer",
    "salary": 85000
  }
}
```

### 6. Delete Document
**DELETE** `/platforms/{platform}/documents/{documentId}`

**Access**: Database Access Required

### 7. Search Documents
**POST** `/platforms/{platform}/search`

**Access**: Database Access Required

**Request Body**:
```json
{
  "searchCriteria": {
    "department": "Engineering",
    "salary": {
      "type": "range",
      "min": 50000,
      "max": 100000
    },
    "fullName": {
      "type": "regex",
      "value": "John"
    }
  },
  "options": {
    "page": 1,
    "limit": 20,
    "sortBy": "salary",
    "sortOrder": "desc"
  }
}
```

**Search Types**:
- `exact`: Exact match
- `regex`: Regular expression match
- `range`: Numeric range (min/max)
- `in`: Value in array

### 8. Export Platform Data
**GET** `/platforms/{platform}/export`

**Access**: Database Access Required

**Query Parameters**:
- `format`: 'json' or 'csv' (default: 'json')
- `filter`: JSON filter object (optional)

**Examples**:
```
GET /platforms/employee/export?format=csv&filter={"isActive":true}
GET /platforms/pilot/export?format=json
```

### 9. Import Platform Data
**POST** `/platforms/{platform}/import`

**Access**: Database Access Required

**Request Body**:
```json
{
  "data": [
    {
      "fullName": "Jane Smith",
      "email": "jane@company.com",
      "employeeId": "EMP002"
    }
  ],
  "options": {
    "overwrite": false,
    "validateOnly": false
  }
}
```

### 10. Get Platform Statistics
**GET** `/platforms/{platform}/stats`

**Access**: Database Access Required

**Response**:
```json
{
  "success": true,
  "data": {
    "platform": "employee",
    "totalDocuments": 150,
    "activeDocuments": 142,
    "recentDocuments": 12,
    "lastUpdated": "2025-08-15T12:30:00Z"
  }
}
```

### 11. Get Audit Logs
**GET** `/audit-logs`

**Access**: Admin Required

**Query Parameters**:
- `page`, `limit`: Pagination
- `userId`: Filter by user ID
- `action`: Filter by action type
- `platform`: Filter by platform
- `success`: Filter by success status (true/false)
- `dateFrom`, `dateTo`: Date range filter

### 12. Get Audit Statistics
**GET** `/audit-stats`

**Access**: Admin Required

**Query Parameters**:
- `dateFrom`, `dateTo`: Date range filter

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "statusCode": 400
}
```

## Validation Rules

### Platform Names
- Must start with a letter
- Can contain letters, numbers, and underscores only
- 1-50 characters long

### Document Validation
- Maximum size: 1MB per document
- Cannot set system fields: `_id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

### Import Limits
- Maximum 1000 documents per import
- Maximum 10MB total size

### Export Limits
- CSV exports flatten nested objects to JSON strings
- Arrays are converted to comma-separated values

## Audit Logging

All actions are automatically logged with:
- User ID, email, and role
- Action type and platform
- Document ID (when applicable)
- Request details and metadata
- Success/failure status
- Performance timing
- IP address and user agent

## Pre-defined Sub-Platforms

The system comes with three pre-configured sub-platforms:

### Employee
- **Fields**: fullName, email, employeeId, department, position, salary, hireDate, isActive, permissions, lastLogin
- **Required**: fullName, email, employeeId, department, position
- **Unique**: email, employeeId

### Pilot
- **Fields**: fullName, email, pilotId, licenseNumber, licenseExpiry, experience, rating, vehicleTypes, currentStatus, location, isActive
- **Required**: fullName, email, pilotId, licenseNumber, licenseExpiry
- **Unique**: email, pilotId, licenseNumber

### Vehicle
- **Fields**: vehicleId, make, model, year, licensePlate, batteryCapacity, currentBatteryLevel, range, status, location, assignedPilot, isActive
- **Required**: vehicleId, make, model, year, licensePlate, batteryCapacity, range
- **Unique**: vehicleId, licensePlate

## Usage Examples

### Creating a Custom Sub-Platform
```javascript
const response = await fetch('/api/database-mgmt/platforms', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    schemaDefinition: {
      name: 'Booking',
      fields: {
        bookingId: { type: 'String', required: true, unique: true },
        customerId: { type: 'ObjectId', ref: 'Customer', required: true },
        vehicleId: { type: 'ObjectId', ref: 'Vehicle', required: true },
        startTime: { type: 'Date', required: true },
        endTime: { type: 'Date', required: true },
        status: { type: 'String', enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
        totalAmount: { type: 'Number', min: 0 }
      },
      validation: {
        required: ['bookingId', 'customerId', 'vehicleId', 'startTime', 'endTime'],
        unique: ['bookingId']
      }
    }
  })
});
```

### Advanced Search Example
```javascript
const searchResults = await fetch('/api/database-mgmt/platforms/pilot/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    searchCriteria: {
      currentStatus: 'available',
      experience: { type: 'range', min: 2 },
      rating: { type: 'range', min: 4 },
      vehicleTypes: { type: 'in', values: ['sedan', 'suv'] }
    },
    options: {
      page: 1,
      limit: 10,
      sortBy: 'rating',
      sortOrder: 'desc'
    }
  })
});
```

This comprehensive Database Management module provides a scalable foundation for managing multiple sub-platforms with full audit trails, role-based access control, and extensive validation capabilities.
