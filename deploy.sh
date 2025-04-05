#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create a directory for the application if it doesn't exist
echo "Creating deployment directory..."
mkdir -p ~/signalk-heel-angle

# Copy the built files to the deployment directory
echo "Copying files to deployment directory..."
cp -r dist/* ~/signalk-heel-angle/

echo "Deployment complete!"
echo "You can now access the application at http://your-raspberry-pi-ip/signalk-heel-angle/"
echo "To embed in Kip, use the URL: http://your-raspberry-pi-ip/signalk-heel-angle/index.html" 