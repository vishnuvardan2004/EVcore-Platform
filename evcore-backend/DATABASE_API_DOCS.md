# Database Management Backend API Documentation

## 🎯 **Overview**

The Database Management Backend provides a unified API for managing all sub-platforms (collections) in the EVcore system. This includes dynamic CRUD operations, import/export functionality, and comprehensive audit logging.

## 🔧 **Supported Modules (Sub-Platforms)**

### ✅ **Currently Implemented - ALL MODULES:**

#### **🚗 Vehicle Management:**
1. **Vehicles** - Electric vehicle fleet management with battery tracking
2. **Charging Equipment** - Dedicated charging infrastructure management
3. **Electrical Equipment** - General electrical infrastructure and components

#### **💻 Technology & IT:**
4. **IT Equipment** - Computer systems, network devices, software licenses
5. **Infrastructure & Furniture** - Office furniture, building infrastructure, fixtures

#### **👥 Human Resources:**
6. **Employees** - Staff management with roles and permissions
7. **Pilots** - Driver management with licensing and availability tracking

#### **📊 Operations & Maintenance:**
8. **Charging Stations** - Multi-charger station management
9. **Trips** - Journey tracking and energy consumption analytics
10. **Maintenance** - Equipment and vehicle maintenance records

## 🔐 **Authentication & Authorization**

All endpoints require:
- **JWT Authentication**: Valid Bearer token in Authorization header
- **Role-Based Access**: Different permission levels for different operations

### **Role Hierarchy:**
- `super_admin` - Full access to all operations
- `admin` - Most operations except critical system functions
- `db_manager` - Database operations for assigned modules
- `employee` - Read-only access to assigned data

## 📡 **API Endpoints**

### **Base URL:** `http://localhost:3002/api/database`

---

### **1. Platform Management**

#### **List All Platforms**
```http
GET /api/database/platforms
Authorization: Bearer <jwt-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "name": "employees",
        "displayName": "Employees",
        "documentCount": 25,
        "isActive": true,
        "schema": { ... }
      },
      {
        "name": "pilots",
        "displayName": "Pilots", 
        "documentCount": 15,
        "isActive": true,
        "schema": { ... }
      }
    ],
    "totalPlatforms": 7
  }
}
```

#### **Create New Platform**
```http
POST /api/database/platforms
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "newplatform",
  "displayName": "New Platform",
  "schema": {
    "fields": {
      "name": { "type": "String", "required": true },
      "status": { "type": "String", "enum": ["active", "inactive"] }
    },
    "validation": {
      "required": ["name"]
    }
  }
}
```

---

### **2. Document Operations**

#### **List Documents**
```http
GET /api/database/platforms/{platform}/documents?page=1&limit=20&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <jwt-token>
```

#### **Get Single Document**
```http
GET /api/database/platforms/{platform}/documents/{documentId}
Authorization: Bearer <jwt-token>
```

#### **Search Documents**
```http
POST /api/database/platforms/{platform}/search
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "filters": {
    "status": "active",
    "department": "engineering"
  },
  "searchText": "john",
  "searchFields": ["fullName", "email"],
  "page": 1,
  "limit": 20
}
```

#### **Create Document**
```http
POST /api/database/platforms/{platform}/documents
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john.doe@company.com",
  "department": "Engineering",
  "position": "Senior Developer"
}
```

#### **Update Document**
```http
PUT /api/database/platforms/{platform}/documents/{documentId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "position": "Lead Developer",
  "salary": 85000
}
```

#### **Delete Document**
```http
DELETE /api/database/platforms/{platform}/documents/{documentId}
Authorization: Bearer <jwt-token>
```

---

### **3. Import/Export Operations**

#### **Export Platform Data**
```http
GET /api/database/platforms/{platform}/export?format=json
Authorization: Bearer <jwt-token>
```
**Supported formats:** `json`, `csv`

#### **Import Platform Data**
```http
POST /api/database/platforms/{platform}/import
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

file: <csv or json file>
options: {
  "overwrite": false,
  "validateOnly": false
}
```

#### **Bulk Operations**
```http
POST /api/database/platforms/{platform}/bulk
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "operation": "create|update|delete",
  "documents": [
    { "fullName": "User 1", "email": "user1@company.com" },
    { "fullName": "User 2", "email": "user2@company.com" }
  ]
}
```

---

### **4. Audit & Logging**

#### **Get Audit Logs**
```http
GET /api/database/audit-logs?platform=employees&action=CREATE&page=1&limit=20
Authorization: Bearer <jwt-token>
```

#### **Get Platform Statistics**
```http
GET /api/database/platforms/{platform}/stats
Authorization: Bearer <jwt-token>
```

---

## 📊 **Module-Specific Examples**

### **Employees Module**
```http
# Create Employee
POST /api/database/platforms/employees/documents
{
  "fullName": "Jane Smith",
  "email": "jane.smith@company.com",
  "employeeId": "EMP001",
  "department": "Engineering",
  "position": "Software Engineer",
  "salary": 75000,
  "permissions": ["read", "write"]
}

# Search Employees by Department
POST /api/database/platforms/employees/search
{
  "filters": { "department": "Engineering", "isActive": true },
  "sortBy": "hireDate",
  "sortOrder": "desc"
}
```

### **Pilots Module**
```http
# Create Pilot
POST /api/database/platforms/pilots/documents
{
  "fullName": "Mike Johnson",
  "email": "mike.johnson@company.com",
  "pilotId": "PLT001",
  "licenseNumber": "DL123456789",
  "licenseExpiry": "2025-12-31",
  "experience": 5,
  "vehicleTypes": ["sedan", "suv"],
  "currentStatus": "available"
}

# Find Available Pilots
POST /api/database/platforms/pilots/search
{
  "filters": { "currentStatus": "available", "isActive": true },
  "sortBy": "experience",
  "sortOrder": "desc"
}
```

### **Charging Equipment Module**
```http
# Create Charging Equipment
POST /api/database/platforms/chargingequipment/documents
{
  "chargingEquipmentId": "CHG001",
  "name": "Tesla Supercharger V3",
  "type": "dc_fast_charger",
  "brand": "Tesla",
  "model": "Supercharger V3",
  "serialNumber": "TSC123456",
  "powerRating": 250,
  "connectorTypes": ["Tesla", "CCS"],
  "numberOfPorts": 2,
  "specifications": {
    "inputVoltage": 480,
    "outputVoltage": 400,
    "maxCurrent": 625,
    "efficiency": 96
  },
  "status": "available",
  "location": {
    "facility": "Downtown Charging Hub",
    "zone": "A1"
  },
  "pricing": {
    "pricePerKwh": 0.35
  },
  "paymentMethods": ["credit_card", "mobile_app"]
}
```

### **IT Equipment Module**
```http
# Create IT Equipment
POST /api/database/platforms/itequipment/documents
{
  "itEquipmentId": "IT001",
  "name": "Dell OptiPlex 7090",
  "category": "computer",
  "type": "Desktop",
  "brand": "Dell",
  "model": "OptiPlex 7090",
  "serialNumber": "DL123456789",
  "assetTag": "COMP001",
  "specifications": {
    "processor": "Intel i7-11700",
    "memory": "16GB DDR4",
    "storage": "512GB SSD",
    "operatingSystem": "Windows 11 Pro"
  },
  "status": "active",
  "location": {
    "building": "Main Office",
    "floor": "2",
    "room": "Engineering",
    "desk": "E-12"
  },
  "assignedTo": {
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "department": "Engineering"
  },
  "purchaseInfo": {
    "purchaseDate": "2024-01-15",
    "purchasePrice": 1200,
    "vendor": "Dell Technologies"
  }
}
```

### **Infrastructure & Furniture Module**
```http
# Create Infrastructure/Furniture Item
POST /api/database/platforms/infrastructurefurniture/documents
{
  "assetId": "FURN001",
  "name": "Executive Office Desk",
  "category": "furniture",
  "subcategory": "desk",
  "type": "Executive Desk",
  "brand": "Herman Miller",
  "model": "Sense 72x36",
  "assetTag": "DESK001",
  "specifications": {
    "dimensions": "72\" x 36\" x 29\"",
    "material": "Wood with Metal Frame",
    "color": "Walnut"
  },
  "status": "active",
  "condition": "excellent",
  "location": {
    "building": "Main Office",
    "floor": "3",
    "room": "CEO Office",
    "area": "Executive Suite"
  },
  "assignedTo": {
    "department": "Executive",
    "employeeId": "EMP002",
    "employeeName": "Jane Smith"
  },
  "purchaseInfo": {
    "purchaseDate": "2024-02-01",
    "purchasePrice": 2500,
    "vendor": "Herman Miller"
  }
}
```

### **Charging Stations Module**
```http
# Create Charging Station
POST /api/database/platforms/chargingstations/documents
{
  "stationId": "STN001",
  "name": "Downtown Charging Hub",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St",
    "city": "New York",
    "state": "NY"
  },
  "chargers": [
    {
      "chargerId": "CHG001",
      "type": "Fast_DC",
      "power": 150,
      "connectorType": "CCS",
      "pricePerKwh": 0.35
    }
  ],
  "isPublic": true
}
```

### **Vehicles Module**
```http
# Create Vehicle
POST /api/database/platforms/vehicles/documents
{
  "vehicleId": "VEH001",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2023,
  "licensePlate": "EV123456",
  "batteryCapacity": 75,
  "range": 358,
  "status": "available"
}

# Find Vehicles by Status
POST /api/database/platforms/vehicles/search
{
  "filters": { "status": "available", "currentBatteryLevel": { "$gte": 80 } }
}
```

---

## 🔒 **Security Features**

1. **JWT Authentication** - All requests require valid tokens
2. **Role-Based Access Control** - Different permissions per role
3. **Input Validation** - Comprehensive validation on all inputs
4. **Audit Logging** - Complete tracking of all operations
5. **Rate Limiting** - Protection against abuse
6. **Data Sanitization** - XSS and injection protection

## 📈 **Response Format**

All API responses follow this standard format:

### **Success Response**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-08-15T12:00:00.000Z"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2025-08-15T12:00:00.000Z"
}
```

---

## 🚀 **Getting Started**

1. **Start the Backend Server:**
   ```bash
   cd evcore-backend
   npm start
   ```
   Server runs on: `http://localhost:3002`

2. **Authenticate:**
   - Get JWT token from `/api/auth/login`
   - Include in Authorization header: `Bearer <token>`

3. **Test Endpoints:**
   - Use tools like Postman or curl
   - Start with `/api/database/platforms` to see available modules

4. **Frontend Integration:**
   - All endpoints support CORS for localhost development
   - Use the standardized response format for error handling

---

## 📋 **Next Steps**

- ✅ All 7 core modules implemented
- ✅ Full CRUD operations available
- ✅ Import/Export functionality ready
- ✅ Audit logging in place
- ✅ Role-based security implemented

Ready for frontend integration! 🎉
