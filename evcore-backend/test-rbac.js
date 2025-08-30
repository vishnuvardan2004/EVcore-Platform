/**
 * RBAC System Test Script
 * Tests the new 6-module role-based access control system
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test users with different roles
const testUsers = {
  superadmin: { email: 'admin@evzip.com', password: 'Welcome123!' },
  admin: { email: 'manager@evzip.com', password: 'Welcome123!' },
  employee: { email: 'employee@evzip.com', password: 'Welcome123!' },
  pilot: { email: 'teju@gmail.com', password: 'Welcome123!' }
};

// API endpoints for the 6 core modules
const moduleEndpoints = {
  vehicle_deployment: [
    '/api/vehicle-deployment/vehicles',
    '/api/vehicle-deployment/deploy',
    '/api/vehicle-deployment/history'
  ],
  smart_bookings: [
    '/api/smart-bookings/active',
    '/api/smart-bookings/create',
    '/api/smart-bookings/offline'
  ],
  data_hub: [
    '/api/data-hub/analytics',
    '/api/data-hub/reports',
    '/api/data-hub/export'
  ],
  driver_onboarding: [
    '/api/driver-onboarding/pending',
    '/api/driver-onboarding/initiate'
  ],
  trip_analytics: [
    '/api/trip-analytics/dashboard',
    '/api/trip-analytics/performance'
  ],
  energy_management: [
    '/api/energy-management/dashboard',
    '/api/energy-management/charging-status'
  ],
  audit_logs: [
    '/api/audit-logs/system',
    '/api/audit-logs/user-activity'
  ]
};

// Expected access matrix
const expectedAccess = {
  super_admin: {
    vehicle_deployment: true,
    smart_bookings: true,
    data_hub: true,
    driver_onboarding: true,
    trip_analytics: true,
    energy_management: true,
    audit_logs: true
  },
  admin: {
    vehicle_deployment: true,
    smart_bookings: true,
    data_hub: true,
    driver_onboarding: true,
    trip_analytics: true,
    energy_management: true,
    audit_logs: false // Admin cannot access audit logs
  },
  employee: {
    vehicle_deployment: true,
    smart_bookings: true,
    data_hub: false, // Employee cannot access data hub
    driver_onboarding: true,
    trip_analytics: true,
    energy_management: true,
    audit_logs: false
  },
  pilot: {
    vehicle_deployment: false, // Pilot cannot access vehicle deployment
    smart_bookings: false,     // Pilot cannot access smart bookings
    data_hub: false,          // Pilot cannot access data hub
    driver_onboarding: false,  // Pilot cannot access driver onboarding
    trip_analytics: true,      // Pilot CAN access trip analytics
    energy_management: true,   // Pilot CAN access energy management
    audit_logs: false
  }
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

const login = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error('Login failed');
  } catch (error) {
    throw new Error(`Login failed for ${email}: ${error.message}`);
  }
};

const testEndpointAccess = async (token, endpoint, shouldHaveAccess, userRole, moduleName) => {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    const hasAccess = response.status === 200;
    const testPassed = hasAccess === shouldHaveAccess;
    
    testResults.total++;
    if (testPassed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    testResults.details.push({
      userRole,
      module: moduleName,
      endpoint,
      expected: shouldHaveAccess ? 'ALLOW' : 'DENY',
      actual: hasAccess ? 'ALLOW' : 'DENY',
      status: testPassed ? '✅ PASS' : '❌ FAIL',
      response: response.data?.message || 'Success'
    });
    
    return testPassed;
  } catch (error) {
    const hasAccess = error.response?.status !== 403;
    const testPassed = hasAccess === shouldHaveAccess;
    
    testResults.total++;
    if (testPassed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    testResults.details.push({
      userRole,
      module: moduleName,
      endpoint,
      expected: shouldHaveAccess ? 'ALLOW' : 'DENY',
      actual: hasAccess ? 'ALLOW' : 'DENY',
      status: testPassed ? '✅ PASS' : '❌ FAIL',
      response: error.response?.data?.message || error.message
    });
    
    return testPassed;
  }
};

const runRBACTests = async () => {
  console.log('🚀 Starting RBAC System Tests...\n');
  console.log('📋 Testing the new 6-module access control system:');
  console.log('   1. Vehicle Deployment');
  console.log('   2. Smart Bookings');
  console.log('   3. Data Hub');
  console.log('   4. Driver Onboarding');
  console.log('   5. Trip Analytics');
  console.log('   6. Energy Management');
  console.log('   7. Audit Logs\n');

  // Test each user role
  for (const [roleKey, credentials] of Object.entries(testUsers)) {
    console.log(`\n🔐 Testing role: ${roleKey.toUpperCase()}`);
    
    try {
      // Login to get token
      const token = await login(credentials.email, credentials.password);
      console.log(`   ✅ Login successful for ${credentials.email}`);
      
      // Test each module
      for (const [moduleName, endpoints] of Object.entries(moduleEndpoints)) {
        const shouldHaveAccess = expectedAccess[roleKey]?.[moduleName] || false;
        const accessIndicator = shouldHaveAccess ? '🟢' : '🔴';
        
        console.log(`   ${accessIndicator} Testing ${moduleName} module (Expected: ${shouldHaveAccess ? 'ALLOW' : 'DENY'})`);
        
        // Test first endpoint of each module
        const testEndpoint = endpoints[0];
        await testEndpointAccess(token, testEndpoint, shouldHaveAccess, roleKey, moduleName);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to test role ${roleKey}: ${error.message}`);
    }
  }

  // Print comprehensive results
  console.log('\n' + '='.repeat(80));
  console.log('📊 RBAC SYSTEM TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 DETAILED TEST RESULTS:');
  console.log('-'.repeat(120));
  console.log('ROLE'.padEnd(12) + 'MODULE'.padEnd(20) + 'EXPECTED'.padEnd(10) + 'ACTUAL'.padEnd(10) + 'STATUS'.padEnd(10) + 'RESPONSE');
  console.log('-'.repeat(120));
  
  testResults.details.forEach(detail => {
    console.log(
      detail.userRole.padEnd(12) + 
      detail.module.padEnd(20) + 
      detail.expected.padEnd(10) + 
      detail.actual.padEnd(10) + 
      detail.status.padEnd(10) + 
      detail.response.substring(0, 50)
    );
  });
  
  console.log('\n🎯 ACCESS CONTROL SUMMARY:');
  console.log('   🔴 Super Admin → Full access to all modules including Audit Logs');
  console.log('   🟠 Admin → All modules except Audit Logs');
  console.log('   🟡 Employee → 5/6 modules (no Data Hub access)');
  console.log('   🟢 Pilot → 2/6 modules (Trip Analytics & Energy Management only)');
  
  if (testResults.failed > 0) {
    console.log('\n⚠️  Some tests failed. Please check the RBAC configuration.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! RBAC system is working correctly.');
    process.exit(0);
  }
};

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n⏹️  Test interrupted by user');
  process.exit(0);
});

// Run the tests
runRBACTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});

console.log('⏳ Starting RBAC tests in 3 seconds...');
setTimeout(() => {}, 3000);
