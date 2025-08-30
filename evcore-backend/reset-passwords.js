const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB (using the same connection as the backend)
const DB = process.env.MONGO_URI || 'mongodb+srv://vishnuvardan2004:Jaya.988@evcore.gjcfg9u.mongodb.net/evcore';

mongoose.connect(DB).then(() => {
  console.log('✅ DB connection successful!');
}).catch((err) => {
  console.error('❌ DB connection error:', err);
  process.exit(1);
});

// Define schemas (simplified versions)
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  fullName: String,
  mobileNumber: String,
  evzipId: String,
  username: String,
  pilotRef: { type: mongoose.Schema.Types.ObjectId },
  employeeRef: { type: mongoose.Schema.Types.ObjectId }
});

const employeeSchema = new mongoose.Schema({
  email: String,
  fullName: String,
  department: String,
  position: String,
  employeeId: String
});

const pilotSchema = new mongoose.Schema({
  email: String,
  fullName: String,
  pilotId: String,
  licenseNumber: String
});

const User = mongoose.model('User', userSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const Pilot = mongoose.model('Pilot', pilotSchema);

// Function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Function to generate EVZIP ID
const generateEVZIPId = async (role) => {
  const prefixes = {
    super_admin: 'EVSA',
    admin: 'EVAD', 
    employee: 'EVEM',
    pilot: 'EVPI'
  };
  
  const prefix = prefixes[role] || 'EVEM';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  
  let evzipId;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    evzipId = `${prefix}${timestamp}${random}${attempts.toString().padStart(2, '0')}`;
    const existing = await User.findOne({ evzipId });
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);
  
  return evzipId;
};

// Function to generate unique mobile number if not provided
const generateUniqueMobileNumber = async () => {
  let mobileNumber;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    // Generate a random mobile number starting with 9, 8, 7, or 6
    const prefix = [9, 8, 7, 6][Math.floor(Math.random() * 4)];
    const suffix = Math.floor(100000000 + Math.random() * 900000000); // 9 digits
    mobileNumber = `${prefix}${suffix}`;
    
    const existing = await User.findOne({ mobileNumber });
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    // Fallback to timestamp-based number
    return `9${Date.now().toString().slice(-9)}`;
  }
  
  return mobileNumber;
};
// Function to generate username
const generateUsername = async (fullName, email) => {
  const nameParts = fullName.toLowerCase().split(' ').filter(part => part.length > 0);
  const firstName = nameParts[0] || '';
  const lastName = nameParts[nameParts.length - 1] || '';
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const baseVariations = [
    `${firstName}.${lastName}`,
    `${firstName}${lastName}`,
    emailPrefix,
    `${firstName}${Math.random().toString(36).substr(2, 3)}`
  ].filter(v => v.length >= 3);
  
  for (const base of baseVariations) {
    let username = base;
    let counter = 0;
    
    while (counter < 10) {
      const existing = await User.findOne({ username });
      if (!existing) {
        return username;
      }
      counter++;
      username = `${base}${counter}`;
    }
  }
  
  return `user${Date.now().toString().slice(-8)}`;
};

// Function to create missing user accounts
const createMissingUserAccounts = async () => {
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Welcome123!';
  
  console.log('🔐 Starting automatic account creation for missing users...');

  try {
    // Get all employees without user accounts
    const employees = await Employee.find({});
    console.log(`📊 Found ${employees.length} employees in database`);

    for (const employee of employees) {
      try {
        // Check if user account already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: employee.email },
            { employeeRef: employee._id }
          ]
        });
        
        if (!existingUser && employee.email) {
          console.log(`👤 Creating user account for employee: ${employee.email}`);
          
          const evzipId = await generateEVZIPId('employee');
          const username = await generateUsername(employee.fullName, employee.email);
          const hashedPassword = await hashPassword(defaultPassword);
          const mobileNumber = employee.contactNumber || await generateUniqueMobileNumber();
          
          const newUser = new User({
            evzipId,
            username,
            email: employee.email,
            fullName: employee.fullName,
            password: hashedPassword,
            role: 'employee',
            employeeRef: employee._id,
            mobileNumber,
            isTemporaryPassword: true,
            mustChangePassword: true
          });
          
          await newUser.save();
          console.log(`✅ Created user account for ${employee.email} - EVZIP ID: ${evzipId}`);
        } else {
          console.log(`⏭️ User account already exists for ${employee.email || 'unknown email'}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user account for employee ${employee.email}:`, error.message);
      }
    }

    // Get all pilots without user accounts
    const pilots = await Pilot.find({});
    console.log(`📊 Found ${pilots.length} pilots in database`);

    for (const pilot of pilots) {
      try {
        // Check if user account already exists
        const existingUser = await User.findOne({ 
          $or: [
            { email: pilot.email },
            { pilotRef: pilot._id }
          ]
        });
        
        if (!existingUser && pilot.email) {
          console.log(`👤 Creating user account for pilot: ${pilot.email}`);
          
          const evzipId = await generateEVZIPId('pilot');
          const username = await generateUsername(pilot.fullName, pilot.email);
          const hashedPassword = await hashPassword(defaultPassword);
          const mobileNumber = pilot.contactNumber || await generateUniqueMobileNumber();
          
          const newUser = new User({
            evzipId,
            username,
            email: pilot.email,
            fullName: pilot.fullName,
            password: hashedPassword,
            role: 'pilot',
            pilotRef: pilot._id,
            mobileNumber,
            isTemporaryPassword: true,
            mustChangePassword: true
          });
          
          await newUser.save();
          console.log(`✅ Created user account for ${pilot.email} - EVZIP ID: ${evzipId}`);
        } else {
          console.log(`⏭️ User account already exists for ${pilot.email || 'unknown email'}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user account for pilot ${pilot.email}:`, error.message);
      }
    }

    console.log('🔐 Automatic account creation completed!');
    console.log(`📝 Default password for all new accounts: ${defaultPassword}`);
    
  } catch (error) {
    console.error('❌ Error during account creation process:', error);
  }
  
  // Close the database connection
  mongoose.connection.close();
};

// Run the account creation process
createMissingUserAccounts().catch(console.error);
