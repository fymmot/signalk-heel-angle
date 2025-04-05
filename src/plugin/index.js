const I2C1 = require("@signalk/server-api").I2C1;
const {
  Matrix,
  Quaternion,
  KalmanWaveFilter,
  KalmanWaveAltFilter,
  AranovskiyFilter,
} = require("./wave-sensor-algorithms");

// IMU registers
const MPU6050_ADDR = 0x68;
const ACCEL_XOUT_H = 0x3b;
const GYRO_XOUT_H = 0x43;
const PWR_MGMT_1 = 0x6b;
const ACCEL_CONFIG = 0x1c;
const GYRO_CONFIG = 0x1b;

// Plugin definition
module.exports = {
  id: "signalk-wave-heave-sensor",
  name: "Wave Heave Sensor",
  version: "1.0.0",
  description: "Estimates vessel heave and wave frequency using IMU data",

  start: function (options) {
    this.options = options;

    // Initialize IMU
    this.initIMU();

    // Initialize filters
    this.initFilters();

    // Start data collection loop
    this.startDataCollection();
  },

  stop: function () {
    if (this.dataCollectionInterval) {
      clearInterval(this.dataCollectionInterval);
    }
  },

  initIMU: function () {
    // Wake up MPU6050
    I2C1.writeByte(MPU6050_ADDR, PWR_MGMT_1, 0);

    // Configure accelerometer range to ±2g
    I2C1.writeByte(MPU6050_ADDR, ACCEL_CONFIG, 0x00);

    // Configure gyroscope range to ±250°/s
    I2C1.writeByte(MPU6050_ADDR, GYRO_CONFIG, 0x00);
  },

  initFilters: function () {
    // Initialize Kalman filter for wave estimation
    this.waveFilter = new KalmanWaveFilter({
      stateVector: [0, 0, 0, 0], // [displacement_integral, heave, vert_speed, accel_bias]
      processNoise: [0.1, 0.1, 0.1, 0.01], // Process noise for each state
      measurementNoise: [0.1], // Measurement noise for displacement_integral
    });

    // Initialize alternative Kalman filter for trochoidal wave model
    this.waveAltFilter = new KalmanWaveAltFilter({
      stateVector: [0, 0, 0, 0, 0], // [displacement_integral, heave, vert_speed, vert_accel, accel_bias]
      processNoise: [0.1, 0.1, 0.1, 0.1, 0.01], // Process noise for each state
      measurementNoise: [0.1, 0.1], // Measurement noise for [displacement_integral, acceleration]
    });

    // Initialize Aranovskiy filter for frequency estimation
    this.freqFilter = new AranovskiyFilter({
      scale: 9.81, // Scale to normalize acceleration (m/s²)
      freqGuess: 0.25, // Initial frequency guess (Hz)
      freqLower: 0.05, // Lower frequency limit (Hz)
      freqUpper: 1.0, // Upper frequency limit (Hz)
    });

    // Initialize attitude estimation
    this.attitude = new Quaternion();
    this.lastUpdateTime = Date.now();
  },

  startDataCollection: function () {
    // Collect data at approximately 250Hz
    this.dataCollectionInterval = setInterval(() => {
      this.collectData();
    }, 4); // 4ms = 250Hz
  },

  collectData: function () {
    // Read accelerometer data
    const accelData = this.readAccelerometer();

    // Read gyroscope data
    const gyroData = this.readGyroscope();

    // Calculate time delta
    const now = Date.now();
    const deltaT = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;

    // Update attitude estimation
    this.updateAttitude(gyroData, accelData, deltaT);

    // Get vertical acceleration in earth frame
    const vertAccel = this.getVerticalAcceleration(accelData);

    // Update wave filters
    const heave = this.waveFilter.update(vertAccel, deltaT);
    const heaveAlt = this.waveAltFilter.update(
      vertAccel,
      this.freqFilter.frequency,
      deltaT
    );

    // Update frequency estimation
    const frequency = this.freqFilter.update(vertAccel, deltaT);

    // Publish data to SignalK
    this.publishData(heave, heaveAlt, frequency);
  },

  readAccelerometer: function () {
    // Read 6 bytes starting from ACCEL_XOUT_H
    const data = I2C1.readBytes(MPU6050_ADDR, ACCEL_XOUT_H, 6);

    // Convert to acceleration in m/s²
    const scale = 2.0 / 32768.0; // ±2g range
    return {
      x: this.convertToInt16(data[0], data[1]) * scale * 9.81,
      y: this.convertToInt16(data[2], data[3]) * scale * 9.81,
      z: this.convertToInt16(data[4], data[5]) * scale * 9.81,
    };
  },

  readGyroscope: function () {
    // Read 6 bytes starting from GYRO_XOUT_H
    const data = I2C1.readBytes(MPU6050_ADDR, GYRO_XOUT_H, 6);

    // Convert to angular velocity in rad/s
    const scale = 250.0 / 32768.0; // ±250°/s range
    return {
      x: (this.convertToInt16(data[0], data[1]) * scale * Math.PI) / 180,
      y: (this.convertToInt16(data[2], data[3]) * scale * Math.PI) / 180,
      z: (this.convertToInt16(data[4], data[5]) * scale * Math.PI) / 180,
    };
  },

  convertToInt16: function (high, low) {
    const value = (high << 8) | low;
    return value >= 0x8000 ? value - 0x10000 : value;
  },

  updateAttitude: function (gyro, accel, deltaT) {
    // Simple complementary filter
    const alpha = 0.98;

    // Normalize accelerometer measurement
    const norm = Math.sqrt(
      accel.x * accel.x + accel.y * accel.y + accel.z * accel.z
    );
    if (norm === 0) return;

    // Calculate roll and pitch from accelerometer
    const roll = Math.atan2(accel.y, accel.z);
    const pitch = Math.asin(-accel.x / norm);

    // Convert to quaternion
    const accelQuat = Quaternion.fromEuler(roll, pitch, 0);

    // Integrate gyroscope
    const gyroQuat = new Quaternion(
      1,
      (gyro.x * deltaT) / 2,
      (gyro.y * deltaT) / 2,
      (gyro.z * deltaT) / 2
    );

    // Complementary filter
    this.attitude = accelQuat.multiply(gyroQuat).normalize();
    this.attitude.w = alpha * this.attitude.w + (1 - alpha) * accelQuat.w;
    this.attitude.x = alpha * this.attitude.x + (1 - alpha) * accelQuat.x;
    this.attitude.y = alpha * this.attitude.y + (1 - alpha) * accelQuat.y;
    this.attitude.z = alpha * this.attitude.z + (1 - alpha) * accelQuat.z;
    this.attitude.normalize();
  },

  getVerticalAcceleration: function (accel) {
    // Get attitude angles
    const { roll, pitch } = this.attitude.toEuler();

    // Rotation matrices
    const cosRoll = Math.cos(roll);
    const sinRoll = Math.sin(roll);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    // Rotate acceleration to earth frame
    const ax = accel.x;
    const ay = accel.y * cosRoll + accel.z * sinRoll;
    const az = -accel.y * sinRoll + accel.z * cosRoll;

    // Vertical acceleration is in z direction
    return az;
  },

  publishData: function (heave, heaveAlt, frequency) {
    // Create delta object
    const delta = {
      updates: [
        {
          source: {
            label: "Wave Heave Sensor",
            type: "IMU",
            src: "wave-heave-sensor",
          },
          timestamp: new Date().toISOString(),
          values: [
            {
              path: "environment.waves.height",
              value: heave,
            },
            {
              path: "environment.waves.heightAlternate",
              value: heaveAlt,
            },
            {
              path: "environment.waves.frequency",
              value: frequency,
            },
          ],
        },
      ],
    };

    // Emit delta
    this.emit("delta", delta);
  },
};
