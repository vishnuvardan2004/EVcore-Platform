# Smart Bookings API Documentation

## Overview
The Smart Bookings API provides comprehensive booking management functionality for the EVcore platform. It supports full CRUD operations, advanced filtering, analytics, and integrates seamlessly with MongoDB Atlas.

## Base URL
```
/api/smart-bookings
```

## Authentication
All endpoints require JWT authentication and Smart Bookings module access.

**Headers Required:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Endpoints

### 1. Core CRUD Operations

#### Create Booking
```http
POST /api/smart-bookings
```

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "customerEmail": "john@example.com",
  "bookingType": "airport",
  "subType": "pickup",
  "scheduledDate": "2025-09-02",
  "scheduledTime": "10:30",
  "pickupLocation": "Airport Terminal 1, Gate 5",
  "dropLocation": "City Center Hotel, Main Street",
  "estimatedDistance": 25.5,
  "estimatedCost": 450,
  "paymentMode": "UPI",
  "specialRequests": "Please call before arrival",
  "vehicleNumber": "KA05AB1234"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "66d123456789abcdef012345",
    "bookingId": "SB2025090100001",
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "status": "pending",
    "createdAt": "2025-09-01T14:30:00.000Z",
    "createdBy": {
      "_id": "66d123456789abcdef012346",
      "fullName": "Admin User",
      "email": "admin@evcore.com",
      "role": "admin"
    }
  }
}
```

#### Get All Bookings
```http
GET /api/smart-bookings
```

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20, max: 100) - Number of bookings per page
- `status` (string) - Filter by status: pending, confirmed, assigned, in_progress, completed, cancelled
- `bookingType` (string) - Filter by type: airport, rental, subscription  
- `customerPhone` (string) - Filter by customer phone number
- `vehicleNumber` (string) - Filter by vehicle number
- `dateFrom` (date) - Filter bookings from this date
- `dateTo` (date) - Filter bookings to this date
- `search` (string) - Text search across multiple fields
- `sortBy` (string, default: createdAt) - Sort field
- `sortOrder` (string, default: desc) - Sort order: asc, desc

**Example:**
```http
GET /api/smart-bookings?page=1&limit=10&status=pending&bookingType=airport&sortBy=scheduledDate&sortOrder=asc
```

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 89,
    "hasMore": true,
    "limit": 10
  }
}
```

#### Get Active Bookings
```http
GET /api/smart-bookings/active
```
Returns all non-cancelled bookings (pending, confirmed, assigned, in_progress, completed).

#### Get Booking by ID
```http
GET /api/smart-bookings/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "66d123456789abcdef012345",
    "bookingId": "SB2025090100001",
    "customerName": "John Doe",
    "status": "confirmed",
    "createdBy": {...},
    "updatedBy": {...}
  }
}
```

#### Get Booking by Booking ID
```http
GET /api/smart-bookings/booking-id/SB2025090100001
```

#### Update Booking
```http
PUT /api/smart-bookings/:id
```

**Request Body (partial update):**
```json
{
  "status": "confirmed",
  "vehicleNumber": "KA05AB1234",
  "actualCost": 475,
  "rating": 5,
  "feedback": "Excellent service!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {...}
}
```

#### Cancel Booking
```http
DELETE /api/smart-bookings/:id
```

**Request Body:**
```json
{
  "reason": "Customer requested cancellation due to change in plans"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": "SB2025090100001",
    "status": "cancelled",
    "cancelledAt": "2025-09-01T15:30:00.000Z",
    "reason": "Customer requested cancellation due to change in plans"
  }
}
```

### 2. Specialized Queries

#### Get Customer Bookings
```http
GET /api/smart-bookings/customer/9876543210
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

#### Get Vehicle Bookings
```http
GET /api/smart-bookings/vehicle/KA05AB1234
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string) - Filter by status

#### Get Bookings by Status
```http
GET /api/smart-bookings/status/pending
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `dateFrom` (date) - Filter from date
- `dateTo` (date) - Filter to date

### 3. Analytics & Statistics

#### Get Booking Statistics
```http
GET /api/smart-bookings/analytics/stats
```

**Query Parameters:**
- `period` (string) - all, today, week, month, custom
- `dateFrom` (date) - Required if period=custom
- `dateTo` (date) - Required if period=custom

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalBookings": 150,
    "totalRevenue": 67500.00,
    "averageCost": 450.00,
    "statusBreakdown": {
      "pending": 15,
      "confirmed": 25,
      "assigned": 10,
      "in_progress": 5,
      "completed": 85,
      "cancelled": 10
    },
    "typeBreakdown": {
      "airport": 90,
      "rental": 45,
      "subscription": 15
    },
    "paymentBreakdown": {
      "cash": 60,
      "upi": 70,
      "card": 15,
      "partPayment": 5
    },
    "ratingStats": {
      "totalRatings": 85,
      "averageRating": 4.2
    },
    "vehicleUtilization": {
      "uniqueVehicles": 25
    },
    "period": "month",
    "dateRange": {
      "from": "2025-08-01T00:00:00.000Z",
      "to": "2025-09-01T00:00:00.000Z"
    }
  }
}
```

#### Get Booking Trends
```http
GET /api/smart-bookings/analytics/trends
```

**Query Parameters:**
- `days` (number, default: 30, max: 365) - Number of days to analyze

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-08-01T00:00:00.000Z",
      "bookingsCount": 12,
      "revenue": 5400.00,
      "completedBookings": 10,
      "cancelledBookings": 1,
      "successRate": 91.67
    },
    ...
  ]
}
```

## Status Transitions

Valid booking status transitions:

```
pending → confirmed, cancelled
confirmed → assigned, cancelled
assigned → in_progress, cancelled
in_progress → completed, cancelled
completed → (no transitions allowed)
cancelled → (no transitions allowed)
```

## Validation Rules

### Required Fields
- `customerName` (2-100 characters)
- `customerPhone` (10-digit Indian mobile number: 6-9xxxxxxxxx)
- `bookingType` (airport, rental, subscription)
- `scheduledDate` (current date or future)
- `scheduledTime` (HH:MM format, 6:00 AM - 11:00 PM)
- `pickupLocation` (5-200 characters)
- `estimatedCost` (₹50 - ₹50,000)

### Optional Fields
- `customerEmail` (valid email format)
- `subType` (pickup, drop, package, monthly, quarterly, yearly)
- `dropLocation` (5-200 characters, required for airport drop bookings)
- `estimatedDistance` (0.1 - 2000 km)
- `paymentMode` (Cash, UPI, Card, Part Payment)
- `specialRequests` (max 500 characters)
- `vehicleNumber` (format: AB12CD3456)

### Business Rules
- Booking date cannot be more than 90 days in the future
- Scheduled time must be during operating hours (6 AM - 11 PM)
- Pickup and drop locations must be different
- Vehicle number required when status is 'assigned'
- Actual cost required when status is 'completed'
- Cancellation reason required (min 10 characters)

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "customerPhone",
      "message": "Invalid phone number format",
      "value": "123456789",
      "location": "body"
    }
  ],
  "errorsByField": {
    "customerPhone": ["Invalid phone number format"]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Smart Bookings module permission required.",
  "requiredModule": "smart_bookings",
  "requiredPermission": "create"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Booking not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Analytics endpoints**: 50 requests per minute
- **Heavy operations** (stats, trends): 10 requests per minute

## Integration Notes

### Frontend Integration
The API is designed to work seamlessly with the existing EVcore frontend components:

- Use `/api/smart-bookings` for the main booking list component
- Use `/api/smart-bookings/active` for dashboard displays
- Use analytics endpoints for reporting dashboards
- All responses include pagination for efficient data handling

### Vehicle Deployment Integration
The API integrates with Vehicle Deployment module:

- Vehicle availability can be checked via Vehicle Deployment APIs
- Booking assignments trigger Vehicle Deployment updates
- Status changes sync with vehicle tracking system

### Data Hub Integration
Smart Bookings data feeds into the Data Hub:

- All booking events are logged for analytics
- Customer journey tracking across modules
- Revenue and utilization reporting

## Database Indexes

The following MongoDB indexes are optimized for performance:

```javascript
// Compound indexes for common queries
{ bookingId: 1, isActive: 1 }
{ customerPhone: 1, isActive: 1, createdAt: -1 }
{ vehicleNumber: 1, status: 1, scheduledDate: -1 }
{ status: 1, scheduledDate: -1, isActive: 1 }
{ scheduledDate: 1, status: 1 }
{ createdAt: -1, isActive: 1 }
{ bookingType: 1, status: 1, createdAt: -1 }

// Text search index
{ customerName: 'text', pickupLocation: 'text', dropLocation: 'text' }
```

## Security Features

- JWT-based authentication
- Role-based access control
- Module-specific permissions
- Input validation and sanitization
- MongoDB injection prevention
- Rate limiting protection
- Request logging and audit trail

---

**API Version**: 1.0
**Last Updated**: September 1, 2025
**Compatibility**: EVcore Backend v1.0+
