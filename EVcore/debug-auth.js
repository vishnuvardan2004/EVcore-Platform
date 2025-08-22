// JWT Authentication Debug Script
// Run this in the browser console after login to debug JWT issues

function debugAuthentication() {
  console.log('🔍 JWT Authentication Debugging');
  console.log('================================');
  
  // 1. Check if token exists in localStorage
  const token = localStorage.getItem('authToken');
  console.log('1. Token in localStorage:', token ? 'EXISTS' : 'NOT FOUND');
  
  if (token) {
    console.log('   Token value:', token);
    console.log('   Token length:', token.length);
    
    // 2. Try to decode the token (if it's a valid JWT)
    try {
      const parts = token.split('.');
      console.log('2. Token structure check:');
      console.log('   Parts count:', parts.length, parts.length === 3 ? '✅ Valid JWT structure' : '❌ Invalid JWT structure');
      
      if (parts.length === 3) {
        // Decode header
        const header = JSON.parse(atob(parts[0]));
        console.log('   Header:', header);
        
        // Decode payload
        const payload = JSON.parse(atob(parts[1]));
        console.log('   Payload:', payload);
        console.log('   Expires at:', new Date(payload.exp * 1000));
        console.log('   Is expired:', Date.now() > payload.exp * 1000);
      }
    } catch (e) {
      console.log('2. ❌ Token decode failed:', e.message);
      console.log('   This might be a mock token, checking mock format...');
      
      try {
        // Check if it's a base64 encoded mock token
        const decoded = JSON.parse(atob(token));
        console.log('   Mock token payload:', decoded);
        console.log('   Mock token expires at:', new Date(decoded.exp));
        console.log('   Mock token is expired:', Date.now() > decoded.exp);
      } catch (mockError) {
        console.log('   ❌ Not a valid mock token either:', mockError.message);
      }
    }
  }
  
  // 3. Test API request headers
  console.log('3. Testing Authorization header format:');
  if (token) {
    console.log('   Authorization header would be:', `Bearer ${token}`);
    console.log('   Header length:', `Bearer ${token}`.length);
  }
  
  // 4. Check refresh token
  const refreshToken = localStorage.getItem('refreshToken');
  console.log('4. Refresh token:', refreshToken ? 'EXISTS' : 'NOT FOUND');
  
  // 5. Check cookies (for httpOnly tokens)
  console.log('5. Cookies check:');
  console.log('   Document cookies:', document.cookie);
  console.log('   Has accessToken cookie:', document.cookie.includes('accessToken'));
  console.log('   Has refreshToken cookie:', document.cookie.includes('refreshToken'));
  
  // 6. Test a simple API call to see the actual error
  console.log('6. Testing API call...');
  fetch('http://localhost:3002/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  .then(response => {
    console.log('   API Response status:', response.status);
    console.log('   API Response ok:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('   API Response data:', data);
  })
  .catch(error => {
    console.log('   API Error:', error);
  });
  
  console.log('================================');
  console.log('🔍 Debug complete. Check the results above.');
}

// Auto-run the debug function
debugAuthentication();
