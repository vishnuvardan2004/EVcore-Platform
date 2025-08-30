const mongoose = require('mongoose');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const { connectToDatabase } = require('./database-helper');

async function checkAllUserSources() {
  try {
    console.log('🔍 Checking all user sources...');
    
    // Connect to the same MongoDB Atlas database as the API
    await connectToDatabase(mongoose);

    const userEmail = 'vishhnuvardan2004@gmail.com';
    
    // Check User collection
    console.log('\n📋 Checking User collection...');
    const user = await User.findOne({ email: userEmail });
    if (user) {
      console.log('✅ Found in User collection:', {
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isActive: user.active !== false
      });
    } else {
      console.log('❌ Not found in User collection');
    }
    
    // Check Employee collection
    console.log('\n📋 Checking Employee collection...');
    const employee = await Employee.findOne({ email: userEmail });
    if (employee) {
      console.log('✅ Found in Employee collection:', {
        email: employee.email,
        role: employee.role || 'Not specified',
        name: employee.name || employee.fullName,
        isActive: employee.isActive !== false,
        department: employee.department,
        designation: employee.designation
      });
    } else {
      console.log('❌ Not found in Employee collection');
    }

    // List all users to see what's available
    console.log('\n📋 All Users in User collection:');
    const allUsers = await User.find({}, 'email role fullName').limit(10);
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role}) - ${u.fullName}`);
    });

    console.log('\n📋 All Employees in Employee collection:');
    const allEmployees = await Employee.find({}, 'email role name fullName').limit(10);
    allEmployees.forEach(e => {
      console.log(`   - ${e.email} (${e.role || 'no role'}) - ${e.name || e.fullName}`);
    });

  } catch (error) {
    console.error('❌ Error checking user sources:', error);
  } finally {
    console.log('💤 Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

// Run the script
checkAllUserSources();
