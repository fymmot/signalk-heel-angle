# Testing the Wave Heave Sensor Plugin Locally

This guide explains how to test the Wave Heave Sensor plugin locally using existing IMU data from your SignalK server.

## Prerequisites

- Node.js installed on your computer
- A running SignalK server with IMU data available
- The following SignalK data paths available:
  - `sensors.imu.acceleration`
  - `sensors.imu.angularVelocity`
  - `navigation.attitude`

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/signalk-wave-heave-sensor.git
   cd signalk-wave-heave-sensor
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

Edit the `src/test-local.js` file to configure the connection to your SignalK server:

```javascript
// Configuration
const SIGNALK_HOST = 'localhost'; // Change to your SignalK server address
const SIGNALK_PORT = 3000;        // Change to your SignalK server port
const SAMPLE_RATE = 250;          // Hz
```

Make sure to set the correct host and port for your SignalK server.

## Running the Test

Run the test script:

```
npm run test:local
```

The script will:
1. Connect to your SignalK server
2. Subscribe to IMU data
3. Process the data using the wave/heave algorithms
4. Output the results to the console

## Expected Output

You should see output similar to:

```
Connecting to SignalK server at localhost:3000...
Connected to SignalK server
Subscribed to IMU data
Heave: 0.123m, Alt Heave: 0.125m, Frequency: 0.250Hz
Heave: 0.145m, Alt Heave: 0.147m, Frequency: 0.251Hz
...
```

## Troubleshooting

- **Connection issues**: Make sure your SignalK server is running and accessible at the specified host and port.
- **No data**: Check that your SignalK server is providing IMU data at the expected paths.
- **Incorrect readings**: You may need to adjust the filter parameters in the test script.

## Next Steps

Once you've verified that the algorithms work correctly with your IMU data, you can proceed with installing the plugin in OpenPlotter. 