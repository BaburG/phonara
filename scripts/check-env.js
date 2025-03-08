#!/usr/bin/env node

/**
 * This script checks if the required environment variables are set
 * and provides guidance on how to set them.
 */

const fs = require('fs');
const path = require('path');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

// Function to read API key from .env.local file
function getApiKeyFromEnvFile() {
  if (!envExists) return null;
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_AI_API_KEY=([^\s]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error reading .env.local file:', error.message);
    return null;
  }
}

// Check if GOOGLE_AI_API_KEY is set
const apiKey = process.env.GOOGLE_AI_API_KEY || getApiKeyFromEnvFile();

console.log('\n🔍 Checking environment variables...\n');

if (!envExists) {
  console.log('❌ .env.local file not found');
  console.log('   Create a .env.local file in the root directory with the following content:');
  console.log('   GOOGLE_AI_API_KEY=your_api_key_here');
} else {
  console.log('✅ .env.local file found');
}

if (!apiKey) {
  console.log('❌ GOOGLE_AI_API_KEY is not set');
  console.log('   Set GOOGLE_AI_API_KEY in your .env.local file');
  console.log('   Get an API key from https://ai.google.dev/');
} else {
  console.log('✅ GOOGLE_AI_API_KEY is set');
}

console.log('\n📝 Instructions:');
console.log('1. Create a .env.local file in the root directory');
console.log('2. Add GOOGLE_AI_API_KEY=your_api_key_here to the file');
console.log('3. Restart the development server');
console.log('\n');

// Exit with error code if any check failed
if (!envExists || !apiKey) {
  process.exit(1);
}

process.exit(0); 