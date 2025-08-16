# EVcore - Electric Vehicle Fleet Management Platform

## Overview
EVcore is a comprehensive electric vehicle fleet management platform built with React, TypeScript, and modern web technologies. It provides end-to-end management for EV fleets including driver induction, vehicle deployment, charging tracking, and database management.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser

### Installation & Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd EVcore
npm install
```

2. **Environment Configuration**
Create a `.env` file at the project root based on `.env.example`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_UPLOAD_URL=http://localhost:3001/upload

# Feature Flags
VITE_ENABLE_REALTIME=true
VITE_ENABLE_UPLOAD=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false

# Development
VITE_DEBUG=true
```

These environment variables are consumed in `src/config/environment.ts` and used by the centralized `apiService` for base URL, WebSocket connections, and file uploads.

3. **Start Development Server**
```bash
npm run dev
```
The application will start on `http://localhost:5173` (or next available port).

4. **Build for Production**
```bash
npm run build
```

## Architecture

### Feature API Service Patterns

EVcore follows a standardized API pattern for all features. Each feature has its own `api.ts` file that:

1. **Imports the centralized API service**
```typescript
import apiService, { APIResponse, APIError } from '../../../services/api';
```

2. **Defines typed DTOs for requests and responses**
```typescript
export interface FeatureCreateDTO {
  name: string;
  description: string;
}

export interface FeatureResponseDTO {
  id: string;
  name: string;
  createdAt: string;
}
```

3. **Implements feature-specific API methods**
```typescript
export const featureApi = {
  // Create
  create: (data: FeatureCreateDTO): Promise<APIResponse<FeatureResponseDTO>> =>
    apiService.request<FeatureResponseDTO>('/api/feature', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Read (list with pagination)
  getAll: (params?: { page?: number; limit?: number }): Promise<APIResponse<FeatureListDTO>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `/api/feature${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.request<FeatureListDTO>(endpoint);
  },

  // Read (single item)
  getById: (id: string): Promise<APIResponse<FeatureResponseDTO>> =>
    apiService.request<FeatureResponseDTO>(`/api/feature/${id}`),

  // Update
  update: (id: string, data: Partial<FeatureCreateDTO>): Promise<APIResponse<FeatureResponseDTO>> =>
    apiService.request<FeatureResponseDTO>(`/api/feature/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Delete
  delete: (id: string): Promise<APIResponse<void>> =>
    apiService.request<void>(`/api/feature/${id}`, {
      method: 'DELETE',
    }),
};
```

### Key Benefits:
- **Automatic token management**: Bearer token attached automatically
- **401 handling**: Automatic token refresh on authentication failures
- **Consistent error handling**: Standardized `APIError` interface
- **Type safety**: Full TypeScript support with DTOs
- **Request/Response logging**: Built-in debugging support

### Current Feature API Services:
- `databaseManagement/services/api.ts` - Asset and personnel management
- `driverInduction/services/api.ts` - Driver onboarding and pilot management
- `driverTripDetails/services/api.ts` - Trip capture and management  
- `offlineBookings/services/api.ts` - Booking management
- `vehicleChargingTracker/services/chargingApi.ts` - Charging session tracking
- `vehicleDeployment/services/api.ts` - Vehicle deployment and tracking

## Mock Data & Development Features

### Development Mode Detection
The application uses `config.IS_DEVELOPMENT` (from `src/config/environment.ts`) to detect development mode and enable special features:

```typescript
import { config } from '@/config/environment';

// Check if running in development
if (config.IS_DEVELOPMENT) {
  // Development-only code
  console.log('Running in development mode');
  // Inject sample data, enable debug features, etc.
}
```

### Mock Data Injection
Several features include development-only sample data injection:

1. **Database Management - Employees**
   - **File**: `src/features/databaseManagement/components/EmployeeManagement.tsx`
   - **Injection**: Lines 227, 304, 310, 560, 632
   - **Behavior**: Injects sample employee data when no real data is available
   - **Gating**: All mock data is gated behind `config.IS_DEVELOPMENT` checks

2. **Driver Induction**
   - **File**: `src/features/driverInduction/services/driverInductionService.ts`
   - **Behavior**: Returns mock pilot IDs and responses in development
   - **Fallback**: Graceful degradation when backend is unavailable

3. **Vehicle Management**
   - **Files**: Various vehicle-related components
   - **Behavior**: Sample vehicle data for testing UI components
   - **Purpose**: Allows frontend development without backend dependency

### Sample Data Files
Sample data is typically embedded directly in components or services and activated via:
```typescript
if (config.IS_DEVELOPMENT) {
  // Use sample/mock data
  const sampleData = [/* mock data */];
  setData(sampleData);
}
```

## Development Workflow

### 1. Starting Development
```bash
# Ensure you're in the EVcore directory
cd EVcore

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### 2. Navigation & Testing
- **Login**: Use any credentials (auth is mocked in development)
- **Sidebar Navigation**: Access all 6 main features:
  - Database → Employees, Vehicles, Equipment
  - Driver Induction → Pilot registration
  - Trip Details → Driver trip capture  
  - Smart Bookings → Offline booking management
  - Charging → Tracker, History, Summary
  - Vehicle Deployment → Tracker, Live Status, Reports

### 3. Feature Development
1. **Create feature directory**: `src/features/yourFeature/`
2. **Add API service**: `src/features/yourFeature/services/api.ts`
3. **Define types**: `src/features/yourFeature/types/index.ts`
4. **Build components**: `src/features/yourFeature/components/`
5. **Create pages**: `src/features/yourFeature/pages/`
6. **Export in index**: `src/features/yourFeature/index.ts`

### 4. Adding Routes
Update `src/App.tsx` to add new routes:
```typescript
<Route path="/your-feature" element={<YourFeature />} />
```

Update `src/components/NavigationSidebar.tsx` to add navigation items.

### 5. Environment Variables
Required environment variables for development:
- `VITE_API_URL`: Backend API base URL
- `VITE_WS_URL`: WebSocket URL for real-time features
- `VITE_UPLOAD_URL`: File upload endpoint

Optional feature flags:
- `VITE_ENABLE_REALTIME`: Enable/disable WebSocket features
- `VITE_ENABLE_UPLOAD`: Enable/disable file upload features
- `VITE_ENABLE_NOTIFICATIONS`: Enable/disable push notifications
- `VITE_ENABLE_ANALYTICS`: Enable/disable analytics tracking

### 6. Testing Features
- **Mock Data**: Automatically injected in development mode
- **API Calls**: Will fail gracefully when backend is unavailable
- **Error Handling**: Check browser console for detailed error logs
- **Network Tab**: Monitor API calls and responses

## Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure `VITE_API_URL` to point to production backend
3. Set `VITE_DEBUG=false` for production builds

### Build & Deploy
```bash
# Production build
npm run build

# Output will be in ./dist directory
# Deploy dist/ contents to your web server
```

### Post-Deployment Verification
- Verify all features load without errors
- Check API connectivity
- Test authentication flow
- Validate file upload functionality (if enabled)

## Project Structure

```
src/
├── components/          # Shared UI components
├── config/             # Environment and configuration
├── contexts/           # React contexts (Auth, etc.)
├── features/           # Feature-specific modules
│   ├── databaseManagement/
│   ├── driverInduction/
│   ├── driverTripDetails/
│   ├── offlineBookings/
│   ├── vehicleChargingTracker/
│   └── vehicleDeployment/
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Top-level pages
├── services/           # API services and utilities
├── types/              # Global TypeScript types
└── utils/              # Helper functions
```

## Backend Integration

### API Service Usage
- Use `src/services/api.ts` for all HTTP calls
- Automatically handles auth token attachment and 401 refresh
- Each feature should implement its own typed service under `features/<feature>/services/api.ts`
- Use DTOs for request/response typing to ensure type safety

### Authentication
- Token stored in localStorage as `authToken`
- Automatic refresh on 401 responses
- Logout clears all stored tokens

### Error Handling
- API errors follow the `APIError` interface
- Network errors are caught and transformed
- User-friendly error messages in UI components

## Contributing

1. Follow the established feature API pattern
2. Add proper TypeScript types for all data structures
3. Gate development-only code with `config.IS_DEVELOPMENT`
4. Update this README when adding new features or changing workflows
5. Test both development and production builds before committing

## Troubleshooting

### Common Issues
1. **Port conflicts**: Dev server will automatically try alternative ports
2. **Environment variables**: Ensure `.env` file exists and contains required variables
3. **Build errors**: Check TypeScript errors and fix type issues
4. **API connection**: Verify `VITE_API_URL` points to running backend
5. **Mock data not showing**: Ensure `VITE_DEBUG=true` in development environment
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e41f6cdf-f165-412f-b37b-5263c24829fb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e41f6cdf-f165-412f-b37b-5263c24829fb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e41f6cdf-f165-412f-b37b-5263c24829fb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
#   F o r c e   V e r c e l   r e b u i l d 
 
 