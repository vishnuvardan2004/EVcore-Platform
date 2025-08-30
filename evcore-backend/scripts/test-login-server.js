const express = require('express');
const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');
const User = require('../src/models/User');

// Create a simple test server
const app = express();
app.use(express.json());

app.post('/test-login', async (req, res) => {
  try {
    console.log('🔍 Raw request body:', req.body);
    console.log('🔍 Request headers:', req.headers);
    
    const { email, password } = req.body;
    
    console.log('🔍 Extracted email:', `"${email}"`);
    console.log('🔍 Email type:', typeof email);
    console.log('🔍 Email length:', email ? email.length : 'undefined');
    console.log('🔍 Email bytes:', email ? Buffer.from(email, 'utf8') : 'undefined');
    
    // Test with exact same method as API
    const user = await User.findByEmailOrMobile(email).select('+password +active +loginAttempts +lockUntil');
    
    console.log('🔍 User found:', !!user);
    if (user) {
      console.log('🔍 Found user:', {
        email: user.email,
        role: user.role,
        active: user.active
      });
    }
    
    res.json({
      success: true,
      userFound: !!user,
      userEmail: user ? user.email : null
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startTestServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase(mongoose);
    // Connection success logged by helper
    
    const server = app.listen(3002, () => {
      console.log('🚀 Test server running on port 3002');
      console.log('Ready to test login requests');
    });
    
    // Keep server running for 30 seconds
    setTimeout(() => {
      server.close();
      mongoose.disconnect();
      console.log('💤 Test server closed');
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error starting test server:', error);
    process.exit(1);
  }
}

startTestServer();
