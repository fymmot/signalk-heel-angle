// Matrix operations for Kalman filter
class Matrix {
  constructor(rows, cols, data = null) {
    this.rows = rows;
    this.cols = cols;
    this.data = data || new Array(rows * cols).fill(0);
  }

  static identity(size) {
    const matrix = new Matrix(size, size);
    for (let i = 0; i < size; i++) {
      matrix.set(i, i, 1);
    }
    return matrix;
  }

  get(row, col) {
    return this.data[row * this.cols + col];
  }

  set(row, col, value) {
    this.data[row * this.cols + col] = value;
  }

  multiply(other) {
    if (this.cols !== other.rows) {
      throw new Error("Matrix dimensions do not match for multiplication");
    }

    const result = new Matrix(this.rows, other.cols);

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.get(i, k) * other.get(k, j);
        }
        result.set(i, j, sum);
      }
    }

    return result;
  }

  transpose() {
    const result = new Matrix(this.cols, this.rows);

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(j, i, this.get(i, j));
      }
    }

    return result;
  }

  add(other) {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error("Matrix dimensions do not match for addition");
    }

    const result = new Matrix(this.rows, this.cols);

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(i, j, this.get(i, j) + other.get(i, j));
      }
    }

    return result;
  }

  subtract(other) {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error("Matrix dimensions do not match for subtraction");
    }

    const result = new Matrix(this.rows, this.cols);

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(i, j, this.get(i, j) - other.get(i, j));
      }
    }

    return result;
  }

  scale(factor) {
    const result = new Matrix(this.rows, this.cols);

    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.set(i, j, this.get(i, j) * factor);
      }
    }

    return result;
  }

  inverse() {
    if (this.rows !== this.cols) {
      throw new Error("Matrix must be square for inverse");
    }

    const n = this.rows;
    const augmented = new Matrix(n, 2 * n);

    // Create augmented matrix [A|I]
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        augmented.set(i, j, this.get(i, j));
      }
      augmented.set(i, i + n, 1);
    }

    // Gaussian elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (
          Math.abs(augmented.get(j, i)) > Math.abs(augmented.get(maxRow, i))
        ) {
          maxRow = j;
        }
      }

      // Swap rows
      if (maxRow !== i) {
        for (let j = 0; j < 2 * n; j++) {
          const temp = augmented.get(i, j);
          augmented.set(i, j, augmented.get(maxRow, j));
          augmented.set(maxRow, j, temp);
        }
      }

      // Eliminate column
      for (let j = i + 1; j < n; j++) {
        const factor = augmented.get(j, i) / augmented.get(i, i);
        for (let k = i; k < 2 * n; k++) {
          augmented.set(
            j,
            k,
            augmented.get(j, k) - factor * augmented.get(i, k)
          );
        }
      }
    }

    // Back substitution
    for (let i = n - 1; i >= 0; i--) {
      for (let j = i + 1; j < n; j++) {
        const factor = augmented.get(i, j);
        for (let k = j; k < 2 * n; k++) {
          augmented.set(
            i,
            k,
            augmented.get(i, k) - factor * augmented.get(j, k)
          );
        }
      }

      // Normalize row
      const factor = augmented.get(i, i);
      for (let j = 0; j < 2 * n; j++) {
        augmented.set(i, j, augmented.get(i, j) / factor);
      }
    }

    // Extract inverse
    const inverse = new Matrix(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        inverse.set(i, j, augmented.get(i, j + n));
      }
    }

    return inverse;
  }
}

// Quaternion operations
class Quaternion {
  constructor(w = 1, x = 0, y = 0, z = 0) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
  }

  normalize() {
    const norm = Math.sqrt(
      this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z
    );
    if (norm === 0) return this;

    this.w /= norm;
    this.x /= norm;
    this.y /= norm;
    this.z /= norm;

    return this;
  }

  multiply(other) {
    return new Quaternion(
      this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z,
      this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
      this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
      this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w
    );
  }

  conjugate() {
    return new Quaternion(this.w, -this.x, -this.y, -this.z);
  }

  toEuler() {
    const roll = Math.atan2(
      2 * (this.w * this.x + this.y * this.z),
      1 - 2 * (this.x * this.x + this.y * this.y)
    );
    const pitch = Math.asin(2 * (this.w * this.y - this.z * this.x));
    const yaw = Math.atan2(
      2 * (this.w * this.z + this.x * this.y),
      1 - 2 * (this.y * this.y + this.z * this.z)
    );

    return { roll, pitch, yaw };
  }

  static fromEuler(roll, pitch, yaw) {
    const cr = Math.cos(roll / 2);
    const sr = Math.sin(roll / 2);
    const cp = Math.cos(pitch / 2);
    const sp = Math.sin(pitch / 2);
    const cy = Math.cos(yaw / 2);
    const sy = Math.sin(yaw / 2);

    return new Quaternion(
      cr * cp * cy + sr * sp * sy,
      sr * cp * cy - cr * sp * sy,
      cr * sp * cy + sr * cp * sy,
      cr * cp * sy - sr * sp * cy
    );
  }
}

// Kalman filter implementation
class KalmanFilter {
  constructor(options) {
    this.state = options.stateVector || [];
    this.processNoise = options.processNoise || [];
    this.measurementNoise = options.measurementNoise || [];

    // Initialize covariance matrix
    this.covariance = Matrix.identity(this.state.length);
    for (let i = 0; i < this.state.length; i++) {
      this.covariance.set(i, i, 1000); // High initial uncertainty
    }
  }

  update(measurement, deltaT) {
    // Predict step
    this.predict(deltaT);

    // Update step
    this.updateStep(measurement);

    return this.state[0]; // Return first state variable
  }

  predict(deltaT) {
    // Update state based on process model
    // This is a simplified version - in the actual implementation,
    // you would use the specific process model for your application

    // Update covariance
    for (let i = 0; i < this.state.length; i++) {
      this.covariance.set(
        i,
        i,
        this.covariance.get(i, i) + this.processNoise[i] * deltaT
      );
    }
  }

  updateStep(measurement) {
    // Simplified measurement update
    // In a real implementation, you would use the specific measurement model

    // Calculate Kalman gain
    const innovationCovariance =
      this.covariance.get(0, 0) + this.measurementNoise[0];
    const kalmanGain = this.covariance.get(0, 0) / innovationCovariance;

    // Update state
    const innovation = measurement - this.state[0];
    this.state[0] += kalmanGain * innovation;

    // Update covariance
    this.covariance.set(0, 0, (1 - kalmanGain) * this.covariance.get(0, 0));
  }
}

// Aranovskiy filter for frequency estimation
class AranovskiyFilter {
  constructor(options) {
    this.scale = options.scale || 1.0;
    this.freqGuess = options.freqGuess || 0.25;
    this.freqLower = options.freqLower || 0.05;
    this.freqUpper = options.freqUpper || 1.0;

    this.frequency = this.freqGuess;
    this.phase = 0;
    this.amplitude = 0;

    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }

  update(measurement, deltaT) {
    // Normalize measurement
    const x = measurement / this.scale;

    // Update filter
    const omega = 2 * Math.PI * this.frequency;
    const omega2 = omega * omega;

    // Calculate filter coefficients
    const a = 1 / (1 + omega2 * deltaT * deltaT);
    const b = omega2 * deltaT * deltaT;

    // Update filter state
    const y = a * (x + 2 * this.x1 + this.x2 - b * (this.y1 + this.y2));

    // Shift state
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;

    // Update frequency estimate
    const dx = (x - this.x1) / deltaT;
    const dy = (y - this.y1) / deltaT;

    // Aranovskiy frequency update
    const gamma = 0.01; // Learning rate
    const freqUpdate = (gamma * (x * dy - y * dx)) / (x * x + y * y);

    this.frequency += freqUpdate * deltaT;

    // Clamp frequency
    this.frequency = Math.max(
      this.freqLower,
      Math.min(this.freqUpper, this.frequency)
    );

    // Update amplitude and phase
    this.amplitude = Math.sqrt(x * x + y * y);
    this.phase = Math.atan2(y, x);

    return this.frequency;
  }
}

// Kalman filter for wave estimation
class KalmanWaveFilter extends KalmanFilter {
  constructor(options) {
    super(options);
  }

  update(acceleration, deltaT) {
    // Process model for wave estimation
    // State vector: [displacement_integral, heave, vert_speed, accel_bias]

    // Predict step
    this.predict(acceleration, deltaT);

    // Update step
    this.updateStep(acceleration);

    return this.state[1]; // Return heave
  }

  predict(acceleration, deltaT) {
    // Process model for wave estimation
    const T = deltaT;
    const T2 = T * T;
    const T3 = T2 * T;

    // Process matrix
    const F = new Matrix(4, 4);
    F.set(0, 0, 1);
    F.set(0, 1, T);
    F.set(0, 2, 0.5 * T2);
    F.set(0, 3, -T3 / 6);
    F.set(1, 1, 1);
    F.set(1, 2, T);
    F.set(1, 3, -0.5 * T2);
    F.set(2, 2, 1);
    F.set(2, 3, -T);
    F.set(3, 3, 1);

    // Transition matrix
    const B = new Matrix(4, 1);
    B.set(0, 0, T3 / 6);
    B.set(1, 0, 0.5 * T2);
    B.set(2, 0, T);
    B.set(3, 0, 0);

    // Update state
    const newState = F.multiply(new Matrix(4, 1, this.state)).add(
      B.scale(acceleration)
    );
    this.state = newState.data;

    // Update covariance
    const Q = Matrix.identity(4);
    for (let i = 0; i < 4; i++) {
      Q.set(i, i, this.processNoise[i] * deltaT);
    }

    this.covariance = F.multiply(this.covariance)
      .multiply(F.transpose())
      .add(Q);
  }

  updateStep(acceleration) {
    // Measurement model for wave estimation
    // We measure displacement_integral = 0 (zero average displacement)

    // Observation matrix
    const H = new Matrix(1, 4);
    H.set(0, 0, 1);

    // Measurement noise
    const R = new Matrix(1, 1);
    R.set(0, 0, this.measurementNoise[0]);

    // Calculate Kalman gain
    const S = H.multiply(this.covariance).multiply(H.transpose()).add(R);
    const K = this.covariance.multiply(H.transpose()).multiply(S.inverse());

    // Update state
    const innovation = 0 - this.state[0]; // Measurement is 0
    const innovationVector = new Matrix(1, 1, [innovation]);
    const stateUpdate = K.multiply(innovationVector);

    for (let i = 0; i < 4; i++) {
      this.state[i] += stateUpdate.get(i, 0);
    }

    // Update covariance
    const I = Matrix.identity(4);
    this.covariance = I.subtract(K.multiply(H)).multiply(this.covariance);
  }
}

// Kalman filter for trochoidal wave model
class KalmanWaveAltFilter extends KalmanFilter {
  constructor(options) {
    super(options);
  }

  update(acceleration, kHat, deltaT) {
    // Process model for trochoidal wave model
    // State vector: [displacement_integral, heave, vert_speed, vert_accel, accel_bias]

    // Predict step
    this.predict(acceleration, kHat, deltaT);

    // Update step
    this.updateStep(acceleration);

    return this.state[1]; // Return heave
  }

  predict(acceleration, kHat, deltaT) {
    // Process model for trochoidal wave model
    const T = deltaT;
    const T2 = T * T;

    // Process matrix
    const F = new Matrix(5, 5);
    F.set(0, 0, 1);
    F.set(0, 1, T);
    F.set(0, 2, 0.5 * T2);
    F.set(0, 3, (T2 * T) / 6);
    F.set(0, 4, (-T2 * T) / 6);
    F.set(1, 1, 1);
    F.set(1, 2, T);
    F.set(1, 3, 0.5 * T2);
    F.set(1, 4, -0.5 * T2);
    F.set(2, 2, 1);
    F.set(2, 3, T);
    F.set(2, 4, -T);
    F.set(3, 1, kHat);
    F.set(3, 2, kHat * T);
    F.set(3, 3, 1 + 0.5 * kHat * T2);
    F.set(3, 4, -0.5 * kHat * T2);
    F.set(4, 4, 1);

    // Update state
    const newState = F.multiply(new Matrix(5, 1, this.state));
    this.state = newState.data;

    // Update covariance
    const Q = Matrix.identity(5);
    for (let i = 0; i < 5; i++) {
      Q.set(i, i, this.processNoise[i] * deltaT);
    }

    this.covariance = F.multiply(this.covariance)
      .multiply(F.transpose())
      .add(Q);
  }

  updateStep(acceleration) {
    // Measurement model for trochoidal wave model
    // We measure acceleration and displacement_integral = 0

    // Observation matrix
    const H = new Matrix(2, 5);
    H.set(0, 0, 1); // displacement_integral = 0
    H.set(1, 3, 1); // acceleration measurement

    // Measurement noise
    const R = new Matrix(2, 2);
    R.set(0, 0, this.measurementNoise[0]);
    R.set(1, 1, this.measurementNoise[1]);

    // Calculate Kalman gain
    const S = H.multiply(this.covariance).multiply(H.transpose()).add(R);
    const K = this.covariance.multiply(H.transpose()).multiply(S.inverse());

    // Update state
    const innovation = [0 - this.state[0], acceleration - this.state[3]]; // [0 - displacement_integral, acceleration - vert_accel]
    const innovationVector = new Matrix(2, 1, innovation);
    const stateUpdate = K.multiply(innovationVector);

    for (let i = 0; i < 5; i++) {
      this.state[i] += stateUpdate.get(i, 0);
    }

    // Update covariance
    const I = Matrix.identity(5);
    this.covariance = I.subtract(K.multiply(H)).multiply(this.covariance);
  }
}

// Export classes for CommonJS
module.exports = {
  Matrix,
  Quaternion,
  KalmanFilter,
  AranovskiyFilter,
  KalmanWaveFilter,
  KalmanWaveAltFilter,
};
