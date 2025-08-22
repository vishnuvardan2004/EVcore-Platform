// Authentication Flow Test Script
// Paste this into browser console to test the authentication flow

console.log('🧪 Authentication Flow Test Starting...');

// Test 1: Clear all authentication data
function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('refreshToken');
  console.log('✅ Cleared all authentication data');
}

// Test 2: Create mock token
function createMockToken() {
  const mockToken = btoa(JSON.stringify({
    email: 'admin@example.com',
    role: 'admin',
    exp: Date.now() + 86400000 // 24 hours
  }));
  localStorage.setItem('authToken', mockToken);
  console.log('✅ Created mock token:', mockToken);
  return mockToken;
}

// Test 3: Validate token detection
function testTokenDetection() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ No token found');
    return false;
  }
  
  const isJWT = token.split('.').length === 3;
  console.log('Token type:', isJWT ? 'JWT' : 'Mock');
  
  if (!isJWT) {
    try {
      const decoded = JSON.parse(atob(token));
      console.log('✅ Mock token decoded:', decoded);
      console.log('Valid until:', new Date(decoded.exp));
      console.log('Currently valid:', Date.now() < decoded.exp);
      return Date.now() < decoded.exp;
    } catch (e) {
      console.log('❌ Failed to decode token:', e);
      return false;
    }
  }
  
  return true;
}

// Test 4: Test complete flow
function testAuthFlow() {
  console.log('\n🔍 Testing Complete Authentication Flow:');
  
  // Step 1: Clear everything
  clearAuth();
  console.log('1. ✅ Authentication cleared');
  
  // Step 2: Reload should go to login
  console.log('2. 🔄 Reload page - should show login (no auto-login)');
  
  // Step 3: Create token and test detection
  createMockToken();
  const isValid = testTokenDetection();
  console.log('3. ✅ Token created and', isValid ? 'valid' : 'invalid');
  
  // Step 4: Reload should authenticate
  console.log('4. 🔄 Reload page - should authenticate and show dashboard');
  
  console.log('\n📋 Expected Behavior:');
  console.log('- No token → Login page');
  console.log('- Valid token → Dashboard');
  console.log('- Invalid/expired token → Login page');
  console.log('- After logout → Login page (forced navigation)');
}

// Run the test
testAuthFlow();

console.log('\n🎯 Manual Test Steps:');
console.log('1. Run clearAuth() and reload → Should show login');
console.log('2. Login with admin@example.com/admin123 → Should go to dashboard');
console.log('3. Reload page → Should stay on dashboard');
console.log('4. Click logout → Should go to login');
console.log('5. Try to login again → Should work normally (no blank page)');

// Expose functions globally for manual testing
window.clearAuth = clearAuth;
window.createMockToken = createMockToken;
window.testTokenDetection = testTokenDetection;
window.testAuthFlow = testAuthFlow;
