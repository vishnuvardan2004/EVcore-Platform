#!/usr/bin/env node

/**
 * Script to fix MongoDB URI encoding issue
 * Run this script to properly encode the password in your .env file
 */

const fs = require('fs');
const path = require('path');

// Function to encode special characters in MongoDB URI
function encodeMongoUri(uri) {
  // Find the password part between : and @
  const passwordMatch = uri.match(/:\/\/[^:]+:([^@]+)@/);
  if (passwordMatch) {
    const originalPassword = passwordMatch[1];
    const encodedPassword = encodeURIComponent(originalPassword);
    return uri.replace(originalPassword, encodedPassword);
  }
  return uri;
}

// Read the .env file
const envPath = path.join(__dirname, '.env');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Find the MONGO_URI line
  const lines = envContent.split('\n');
  const mongoUriIndex = lines.findIndex(line => line.startsWith('MONGO_URI='));
  
  if (mongoUriIndex !== -1) {
    const originalLine = lines[mongoUriIndex];
    const originalUri = originalLine.split('=')[1];
    
    // Encode the URI
    const encodedUri = encodeMongoUri(originalUri);
    const newLine = `MONGO_URI=${encodedUri}`;
    
    // Replace the line
    lines[mongoUriIndex] = newLine;
    
    // Write back to file
    fs.writeFileSync(envPath, lines.join('\n'));
    
    console.log('✅ MongoDB URI fixed successfully!');
    console.log('Original:', originalUri);
    console.log('Fixed:', encodedUri);
    console.log('\nYou can now restart your backend server.');
  } else {
    console.log('❌ MONGO_URI not found in .env file');
  }
} catch (error) {
  console.error('❌ Error reading or writing .env file:', error.message);
  console.log('\nManual fix required:');
  console.log('1. Open your .env file');
  console.log('2. Find the MONGO_URI line');
  console.log('3. Replace the password part with URL-encoded version');
  console.log('4. Example: <Jaya.988> becomes %3CJaya.988%3E');
}
