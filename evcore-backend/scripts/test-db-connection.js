const express = require('express');
const mongoose = require('mongoose');
const { connectToDatabase } = require('./database-helper');

// Simple test server to diagnose the issue
const app = express();
app.use(express.json());

app.get('/test-db', async (req, res) => {
  try {
    console.log('🔍 Database Connection Test:');
    console.log(`   Connection State: ${mongoose.connection.readyState}`);
    console.log(`   Connection Name: ${mongoose.connection.name}`);
    console.log(`   Connection Host: ${mongoose.connection.host}`);
    
    // Import User model the same way as the main app
    const User = require('../src/models/User');
    console.log(`   User Model: ${User ? 'Loaded' : 'Not Loaded'}`);
    
    // Test direct query
    const users = await User.find({}, 'email role').limit(3);
    console.log(`   Users Found: ${users.length}`);
    users.forEach(u => console.log(`     - ${u.email} (${u.role})`));
    
    // Test findByEmailOrMobile
    const testUser = await User.findByEmailOrMobile('prasadh@gmail.com');
    console.log(`   findByEmailOrMobile Result: ${testUser ? testUser.email : 'Not Found'}`);
    
    res.json({
      success: true,
      connectionState: mongoose.connection.readyState,
      usersFound: users.length,
      findByEmailOrMobileWorks: !!testUser
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Connect to database (same as main app)
connectToDatabase(mongoose)
  .then(() => {
    console.log('✅ Test server connected to MongoDB');
    
    app.listen(3003, () => {
      console.log('🚀 Database test server running on port 3003');
      console.log('Test endpoint: http://localhost:3003/test-db');
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });
