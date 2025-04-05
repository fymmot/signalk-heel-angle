#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install @signalk/client i2c-bus mathjs

# Make the test script executable
echo "Setting up test script..."
chmod +x src/test-local.js

echo "Setup complete! You can now run the test with: npm run test:local" 