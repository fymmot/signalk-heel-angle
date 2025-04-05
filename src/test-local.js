const { Client } = require("@signalk/client");
const {
  Quaternion,
  KalmanWaveFilter,
  KalmanWaveAltFilter,
  AranovskiyFilter,
} = require("./plugin/wave-sensor-algorithms");

// Configuration
const SIGNALK_HOST = "192.168.0.31"; // Using the same host as in app.js
const SIGNALK_PORT = 3000; // Change if your port is different
const SAMPLE_RATE = 250; // Hz

// Initialize filters with more conservative parameters
const waveFilter = new KalmanWaveFilter({
  stateVector: [0, 0, 0, 0], // [displacement_integral, heave, vert_speed, accel_bias]
  processNoise: [0.01, 0.01, 0.01, 0.001], // Reduced process noise
  measurementNoise: [0.5], // Increased measurement noise to filter more
});

const waveAltFilter = new KalmanWaveAltFilter({
  stateVector: [0, 0, 0, 0, 0], // [displacement_integral, heave, vert_speed, vert_accel, accel_bias]
  processNoise: [0.01, 0.01, 0.01, 0.01, 0.001], // Reduced process noise
  measurementNoise: [0.5, 0.5], // Increased measurement noise
});

const freqFilter = new AranovskiyFilter({
  scale: 9.81, // Scale to normalize acceleration (m/s²)
  freqGuess: 0.1, // Lower initial frequency guess
  freqLower: 0.05, // Lower frequency limit (Hz)
  freqUpper: 1.0, // Upper frequency limit (Hz)
});

// Add noise threshold for stationary detection
const NOISE_THRESHOLD = 0.001; // radians, about 0.057 degrees
const STATIONARY_COUNT_THRESHOLD = 10; // number of samples to confirm stationary
let stationaryCount = 0;
let lastRoll = 0;
let lastPitch = 0;

// Initialize attitude estimation with all required fields
let lastAttitude = {
  roll: 0,
  pitch: 0,
  yaw: 0,
  verticalDisplacement: 0,
  lastVerticalSpeed: 0,
};
let lastUpdateTime = Date.now();

// Connect to SignalK server
const client = new Client({
  hostname: SIGNALK_HOST,
  port: SIGNALK_PORT,
  useTLS: false,
  reconnect: true,
  autoConnect: true,
  notifications: false,
});

console.log(
  `Connecting to SignalK server at ${SIGNALK_HOST}:${SIGNALK_PORT}...`
);

client.on("connect", () => {
  console.log("Connected to SignalK server");

  // Subscribe only to attitude data
  client.subscribe({
    context: "vessels.self",
    subscribe: [
      {
        path: "navigation.attitude",
        period: 1000 / SAMPLE_RATE,
      },
    ],
  });

  console.log("Subscribed to attitude data");
});

client.on("error", (error) => {
  console.error("SignalK connection error:", error);
});

client.on("disconnect", () => {
  console.log("Disconnected from SignalK server");
});

client.on("delta", (delta) => {
  if (delta.updates) {
    delta.updates.forEach((update) => {
      update.values.forEach((value) => {
        if (value.path === "navigation.attitude") {
          const attitude = value.value;
          console.log("Attitude data:", attitude);

          // Process the attitude data
          processAttitude(attitude);
        }
      });
    });
  }
});

function processAttitude(attitude) {
  // Calculate time delta
  const now = Date.now();
  const deltaT = (now - lastUpdateTime) / 1000; // Convert to seconds
  if (deltaT <= 0) return; // Skip if no time has passed
  lastUpdateTime = now;

  // Check if sensor is stationary
  const rollDiff = Math.abs(attitude.roll - lastRoll);
  const pitchDiff = Math.abs(attitude.pitch - lastPitch);

  if (rollDiff < NOISE_THRESHOLD && pitchDiff < NOISE_THRESHOLD) {
    stationaryCount++;
  } else {
    stationaryCount = 0;
  }

  // Store current angles for next comparison
  lastRoll = attitude.roll;
  lastPitch = attitude.pitch;

  // Convert angles from radians to degrees
  const roll = attitude.roll * (180 / Math.PI);
  const pitch = attitude.pitch * (180 / Math.PI);

  // If stationary, assume zero displacement and acceleration
  if (stationaryCount >= STATIONARY_COUNT_THRESHOLD) {
    lastAttitude = {
      roll,
      pitch,
      yaw: attitude.yaw * (180 / Math.PI),
      verticalDisplacement: 0,
      lastVerticalSpeed: 0,
    };

    // Output results showing stationary state
    console.log(
      `Roll: ${roll.toFixed(1)}°, Pitch: ${pitch.toFixed(1)}°, ` +
        `Heave: 0.000m, Alt Heave: 0.000m, Frequency: 0.000Hz (Stationary)`
    );
    return;
  }

  // Calculate vertical displacement using both roll and pitch
  // Using a more robust formula that considers both angles
  const verticalDisplacement =
    Math.sin(attitude.roll) * Math.cos(attitude.pitch);

  // Apply strong low-pass filter to speed calculation
  const alpha = 0.1; // Low pass filter coefficient (smaller = more filtering)
  const verticalSpeed =
    (alpha * (verticalDisplacement - lastAttitude.verticalDisplacement)) /
      deltaT +
    (1 - alpha) * lastAttitude.lastVerticalSpeed;

  // Calculate vertical acceleration with more filtering
  const verticalAcceleration =
    (alpha * (verticalSpeed - lastAttitude.lastVerticalSpeed)) / deltaT;

  // Scale and bound acceleration
  const scaledAcceleration = verticalAcceleration * 9.81;
  const boundedAcceleration = Math.max(-2.0, Math.min(2.0, scaledAcceleration)); // Reduced bounds

  // Update wave filters with bounded acceleration
  const heave = waveFilter.update(boundedAcceleration, deltaT) || 0;
  const heaveAlt =
    waveAltFilter.update(boundedAcceleration, freqFilter.frequency, deltaT) ||
    0;

  // Update frequency estimation
  const frequency = freqFilter.update(boundedAcceleration, deltaT) || 0;

  // Store current values for next iteration
  lastAttitude = {
    roll,
    pitch,
    yaw: attitude.yaw * (180 / Math.PI),
    verticalDisplacement,
    lastVerticalSpeed: verticalSpeed,
  };

  // Output results with bounds checking
  console.log(
    `Roll: ${roll.toFixed(1)}°, Pitch: ${pitch.toFixed(1)}°, ` +
      `Heave: ${isFinite(heave) ? heave.toFixed(3) : 0}m, ` +
      `Alt Heave: ${isFinite(heaveAlt) ? heaveAlt.toFixed(3) : 0}m, ` +
      `Frequency: ${isFinite(frequency) ? frequency.toFixed(3) : 0}Hz`
  );
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("Disconnecting from SignalK server...");
  client.disconnect();
  process.exit();
});
