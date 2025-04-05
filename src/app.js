import { Client } from "@signalk/client";
import "./styles.css";
import { initTheme } from "./theme.js";

// Initialize theme before creating the inclinometer
initTheme();

class HeelAngleInclinometer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupHTML();

    // Initialize properties after HTML is set up
    this.fineScale = this.container.querySelector(".fine-scale");
    this.coarseScale = this.container.querySelector(".coarse-scale");
    this.finePointer = this.fineScale.querySelector(".pointer");
    this.coarsePointer = this.coarseScale.querySelector(".pointer");
    this.angleDisplay = this.container.querySelector("#angle-value");
    this.finePath = this.fineScale.querySelector(".scale-line");
    this.coarsePath = this.coarseScale.querySelector(".scale-line");

    this.setupScales();
    this.setupSignalK();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="container">
        <div class="inclinometer">
          <!-- Fine scale (-5 to +5) -->
          <svg class="scale fine-scale" viewBox="0 0 400 120">
            <!-- Glass tube background -->
            <path class="tube-background" d="M 60,70 A 1200,1200 0 0,0 340,70 L 340,90 A 1200,1200 0 0,1 60,90 Z" />
            
            <!-- Scale line (bottom of tube) -->
            <path class="scale-line" d="M 60,90 A 1200,1200 0 0,0 340,90" />

            <!-- Tick marks and numbers will be added by JavaScript -->
            <g class="tick-marks"></g>
            <g class="scale-values"></g>

            <!-- Pointer - moved up to y=75 -->
            <g class="pointer" transform="translate(200, 80)">
              <ellipse rx="7" ry="10" />
            </g>
          </svg>

          <div class="brand silva-logo">
            <svg version="1.1" id="layer" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
              viewBox="0 0 652 652" style="width: 100px; height: auto;" xml:space="preserve">
              <path d="M405.3,353.5v32.9H286.6c-5.1,0-9.3-4.2-9.3-9.3c0,0,0,0,0,0V255.7h49.9l0,88.5c0,5.1,4.2,9.3,9.3,9.3L405.3,353.5
                M621.8,386.4l-60.2-130.7l-58.1,0l-37.7,81.8l-37.6-81.8h-50.1l60.3,130.7h54.9l39.3-85.4l24.2,52.6h-24.2v32.8L621.8,386.4
                L621.8,386.4z M21.8,386.5l0-32.7h78.8c5.1,0,9.3-4.4,9.3-9.5c0-5.2-4.2-9.3-9.3-9.3l0,0l-39.2,0c-21.9,0-39.6-17.7-39.6-39.6
                c0-21.9,17.7-39.6,39.6-39.6l173.8,0c5.1,0,9.3,4.2,9.3,9.3v121.4h-49.9l0-88.5c0-5.1-4.2-9.3-9.3-9.3l-104.4,0
                c-5.2,0-9.3,4.2-9.3,9.3c0,0,0,0,0,0c0,5.1,4.2,9.3,9.3,9.3l39.4,0c21.9,0,39.6,17.8,39.6,39.6c0,21.9-17.5,39.7-39.4,39.7
                L21.8,386.5"/>
            </svg>
          </div>

          <!-- Coarse scale (-30 to +30) -->
          <svg class="scale coarse-scale" viewBox="0 0 400 160">
            <!-- Glass tube background -->
            <path class="tube-background" d="M 40,90 A 400,400 0 0,0 360,90 L 360,110 A 400,400 0 0,1 40,110 Z" />
            
            <!-- Scale line (bottom of tube) -->
            <path class="scale-line" d="M 40,110 A 400,400 0 0,0 360,110" />

            <!-- Tick marks and numbers will be added by JavaScript -->
            <g class="tick-marks"></g>
            <g class="scale-values"></g>

            <!-- Pointer - moved up to y=95 -->
            <g class="pointer" transform="translate(200, 100)">
              <ellipse rx="7" ry="10" />
            </g>
          </svg>

          <div class="value-display">
            <span id="angle-value">0.0°</span>
          </div>
        </div>
      </div>
    `;
  }

  setupScales() {
    this.setupScale(this.fineScale, -5, 5, 1, 0.5); // Major ticks every 1°, minor ticks every 0.5°
    this.setupScale(this.coarseScale, -30, 30, 10, 5); // Major ticks every 10°, minor ticks every 5°
  }

  setupScale(scale, min, max, majorStep, minorStep) {
    const tickMarksGroup = scale.querySelector(".tick-marks");
    const valuesGroup = scale.querySelector(".scale-values");
    const path = scale.querySelector(".scale-line");
    const pathLength = path.getTotalLength();

    // Clear existing elements
    tickMarksGroup.innerHTML = "";
    valuesGroup.innerHTML = "";

    // Calculate positions for all ticks and numbers
    for (let value = min; value <= max; value += minorStep) {
      const isMajor = value % majorStep === 0;
      const range = max - min;
      const normalized = (value - min) / range;
      const distance = normalized * pathLength;
      const point = path.getPointAtLength(distance);
      const angle = this.getAngleAtPoint(path, point, pathLength);

      // Create tick mark
      const tick = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      const tickLength = isMajor ? 8 : 4; // Major ticks are longer

      // Position tick mark downward from the line
      const tickStart = this.getPointFromAngle(point, angle + 90, 0);
      const tickEnd = this.getPointFromAngle(point, angle + 90, tickLength);

      tick.setAttribute("x1", tickStart.x);
      tick.setAttribute("y1", tickStart.y);
      tick.setAttribute("x2", tickEnd.x);
      tick.setAttribute("y2", tickEnd.y);
      tick.setAttribute("stroke", "black");
      tick.setAttribute("stroke-width", isMajor ? 1.5 : 1);
      tickMarksGroup.appendChild(tick);

      // Add number for major ticks
      if (isMajor) {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        // Position number below the tick mark
        const numberPoint = this.getPointFromAngle(
          point,
          angle + 90,
          tickLength + 8
        );

        text.setAttribute("x", numberPoint.x);
        text.setAttribute("y", numberPoint.y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "hanging"); // Changed to align text below the point
        text.setAttribute("font-size", value === 0 ? "14" : "12");
        text.setAttribute("font-family", "Arial, sans-serif");
        text.textContent = Math.abs(value) + (value === 0 ? "°" : "");

        valuesGroup.appendChild(text);
      }
    }
  }

  getPointFromAngle(point, angle, distance) {
    const radians = (angle * Math.PI) / 180;
    return {
      x: point.x + Math.cos(radians) * distance,
      y: point.y + Math.sin(radians) * distance,
    };
  }

  getAngleAtPoint(path, point, pathLength, delta = 1) {
    // Get point slightly before and after to calculate tangent
    const distanceAlongPath = this.getDistanceAlongPath(
      path,
      point,
      pathLength
    );

    // Ensure we have valid points before and after
    const beforeDistance = Math.max(0, distanceAlongPath - delta);
    const afterDistance = Math.min(pathLength, distanceAlongPath + delta);

    const before = path.getPointAtLength(beforeDistance);
    const after = path.getPointAtLength(afterDistance);

    // Calculate angle of tangent line
    return Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);
  }

  // Helper method to find the closest point on path
  getDistanceAlongPath(path, point, pathLength, steps = 100) {
    let closestDistance = Infinity;
    let closestPoint = 0;

    // Sample points along the path to find the closest one
    for (let i = 0; i < steps; i++) {
      const distance = i * (pathLength / steps);
      const pathPoint = path.getPointAtLength(distance);

      const dx = pathPoint.x - point.x;
      const dy = pathPoint.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDistance) {
        closestDistance = dist;
        closestPoint = distance;
      }
    }

    return closestPoint;
  }

  setupSignalK() {
    // Get SignalK server configuration from URL parameters or use defaults
    const urlParams = new URLSearchParams(window.location.search);
    const isDev = import.meta.env.DEV;

    // Default to localhost in production, openplotter.local in development
    const defaultHost = isDev ? "openplotter.local" : window.location.hostname;
    const signalkHost = urlParams.get("signalkHost") || defaultHost;
    const signalkPort = urlParams.get("signalkPort") || "3000";
    const signalkUseTLS = urlParams.get("signalkUseTLS") === "true";

    console.log(
      `Connecting to SignalK server at ${signalkHost}:${signalkPort} (TLS: ${signalkUseTLS})`
    );

    const client = new Client({
      hostname: signalkHost,
      port: signalkPort,
      useTLS: signalkUseTLS,
      reconnect: true,
      autoConnect: true,
      notifications: false,
    });

    client.on("connect", () => {
      console.log("Connected to Signal K server");

      // Subscribe using the correct format
      client.subscribe({
        context: "vessels.self",
        subscribe: [
          {
            path: "*",
            period: 1000,
          },
          {
            path: "navigation.attitude",
            period: 500,
          },
        ],
      });
    });

    client.on("error", (error) => {
      console.error("Signal K connection error:", error);
    });

    client.on("disconnect", () => {
      console.log("Disconnected from Signal K server");
    });

    // Handle incoming deltas
    client.on("delta", (delta) => {
      if (delta.updates) {
        delta.updates.forEach((update) => {
          update.values.forEach((value) => {
            if (
              value.path === "navigation.attitude" &&
              value.value &&
              value.value.roll !== undefined
            ) {
              // Convert radians to degrees
              const degrees = value.value.roll * (180 / Math.PI);
              console.log("Heel angle update:", degrees.toFixed(1) + "°");

              // Update the display and animate the pointers
              this.updateAngle(degrees, false); // false means angle is already in degrees
            }
          });
        });
      }
    });
  }

  handleDelta(update) {
    this.updateAngle(update.value);
  }

  updateAngle(angle, convertFromRadians = true) {
    // Convert radians to degrees if needed
    const degrees = convertFromRadians ? angle * (180 / Math.PI) : angle;

    // Update pointers
    this.movePointerAlongPath(this.finePath, this.finePointer, degrees, -5, 5);
    this.movePointerAlongPath(
      this.coarsePath,
      this.coarsePointer,
      degrees,
      -30,
      30
    );

    // Update digital display
    this.angleDisplay.textContent = `${degrees.toFixed(1)}°`;
  }

  movePointerAlongPath(path, pointer, value, min, max) {
    const pathLength = path.getTotalLength();

    // Calculate position along path (0 to 1)
    const range = max - min;
    const normalized = (value - min) / range;
    const clampedNorm = Math.max(0, Math.min(1, normalized));

    // Get point and angle at position
    const distance = clampedNorm * pathLength;
    const point = path.getPointAtLength(distance);

    // Use a larger delta for angle calculation at the edges
    const delta = distance < 10 || distance > pathLength - 10 ? 5 : 1;
    const angle = this.getAngleAtPoint(path, point, pathLength, delta);

    // Adjust the vertical position to center in the tube (move up 10px from the scale line)
    const isFineScale = min === -5 && max === 5;
    const verticalOffset = isFineScale ? -10 : -10; // Adjust based on the scale

    // Update pointer position and rotation
    pointer.setAttribute(
      "transform",
      `translate(${point.x}, ${point.y + verticalOffset}) rotate(${angle})`
    );
  }
}

// Initialize the inclinometer when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new HeelAngleInclinometer("inclinometer");
});
