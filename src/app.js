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
    // Initialize pointers at 0° before setting up SignalK
    this.initializePointers();

    // Enable transitions after initial positioning
    requestAnimationFrame(() => {
      this.finePointer.classList.add("ready");
      this.coarsePointer.classList.add("ready");
    });

    this.setupSignalK();
  }

  initializePointers() {
    // Place both pointers at the 0° position without animation
    this.updateAngle(0, false);
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="container">
        <div class="inclinometer">
          <!-- Fine scale (-5 to +5) -->
          <svg class="scale fine-scale" viewBox="0 0 400 120">
            <!-- Define gradients and filters -->
            <defs>
              <linearGradient id="tubeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(255,255,255,0.25);stop-opacity:1" />
                <stop offset="45%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
              </linearGradient>
              <linearGradient id="tubeGradientDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(255,255,255,0.12);stop-opacity:1" />
                <stop offset="45%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
              </linearGradient>
              <filter id="tubeEffect">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                <feSpecularLighting in="blur" surfaceScale="5" specularConstant=".9" 
                                  specularExponent="35" lighting-color="#white" result="specular">
                  <fePointLight x="200" y="-50" z="200" />
                  <fePointLight x="200" y="150" z="100" />
                </feSpecularLighting>
                <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular" />
                <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" 
                            k1="0" k2="1" k3="1" k4="0" />
              </filter>
              <filter id="tubeEffectDark">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                <feSpecularLighting in="blur" surfaceScale="4" specularConstant=".6" 
                                  specularExponent="30" lighting-color="#white" result="specular">
                  <fePointLight x="200" y="-50" z="150" />
                  <fePointLight x="200" y="150" z="80" />
                </feSpecularLighting>
                <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular" />
                <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" 
                            k1="0" k2="1" k3="0.7" k4="0" />
              </filter>
            </defs>

            <!-- Inner tick marks will be added by JavaScript -->
            <g class="inner-tick-marks"></g>
            
            <!-- Glass tube background with rounded ends -->
            <path class="tube-background" d="
              M 60,70 
              A 2400,2400 0 0,0 340,70
              A 10,10 0 0,1 340,90
              A 2400,2400 0 0,1 60,90
              A 10,10 0 0,1 60,70
              Z" />
            
            <!-- Highlight overlay -->
            <path class="tube-highlight" d="
              M 60,71
              A 2400,2400 0 0,0 340,71
              A 8,8 0 0,1 340,77
              A 2400,2400 0 0,1 60,77
              A 8,8 0 0,1 60,71
              Z" />
            
            <!-- Secondary highlight for cylindrical effect -->
            <path class="tube-highlight-secondary" d="
              M 60,83
              A 2400,2400 0 0,0 340,83
              A 8,8 0 0,1 340,86
              A 2400,2400 0 0,1 60,86
              A 8,8 0 0,1 60,83
              Z" />

            <!-- Scale line (bottom of tube) -->
            <path class="scale-line" d="M 60,90 A 2400,2400 0 0,0 340,90" />

            <!-- Outer tick marks and numbers will be added by JavaScript -->
            <g class="tick-marks"></g>
            <g class="scale-values"></g>

            <!-- Pointer centered at 0° position -->
            <g class="pointer" transform="translate(200, 80)">
              <ellipse rx="7" ry="10" />
            </g>
          </svg>

          <div class="brand heel-angle-text">
            HEEL
          </div>

          <!-- Coarse scale (-30 to +30) -->
          <svg class="scale coarse-scale" viewBox="0 0 400 160">
            <!-- Define gradients and filters -->
            <defs>
              <linearGradient id="tubeGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(255,255,255,0.25);stop-opacity:1" />
                <stop offset="45%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
              </linearGradient>
              <linearGradient id="tubeGradient2Dark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(255,255,255,0.12);stop-opacity:1" />
                <stop offset="45%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
              </linearGradient>
              <filter id="tubeEffect2">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                <feSpecularLighting in="blur" surfaceScale="5" specularConstant=".9" 
                                  specularExponent="35" lighting-color="#white" result="specular">
                  <fePointLight x="200" y="-50" z="200" />
                  <fePointLight x="200" y="150" z="100" />
                </feSpecularLighting>
                <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular" />
                <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" 
                            k1="0" k2="1" k3="1" k4="0" />
              </filter>
              <filter id="tubeEffect2Dark">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                <feSpecularLighting in="blur" surfaceScale="4" specularConstant=".6" 
                                  specularExponent="30" lighting-color="#white" result="specular">
                  <fePointLight x="200" y="-50" z="150" />
                  <fePointLight x="200" y="150" z="80" />
                </feSpecularLighting>
                <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular" />
                <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" 
                            k1="0" k2="1" k3="0.7" k4="0" />
              </filter>
            </defs>

            <!-- Inner tick marks will be added by JavaScript -->
            <g class="inner-tick-marks"></g>
            
            <!-- Glass tube background with rounded ends -->
            <path class="tube-background" d="
              M 40,90 
              A 400,400 0 0,0 360,90
              A 10,10 0 0,1 360,110
              A 400,400 0 0,1 40,110
              A 10,10 0 0,1 40,90
              Z" />
            
            <!-- Highlight overlay -->
            <path class="tube-highlight" d="
              M 40,92
              A 400,400 0 0,0 360,92
              A 8,8 0 0,1 360,96
              A 400,400 0 0,1 40,96
              A 8,8 0 0,1 40,92
              Z" />

            <!-- Secondary highlight for cylindrical effect -->
            <path class="tube-highlight-secondary" d="
              M 40,103
              A 400,400 0 0,0 360,103
              A 8,8 0 0,1 360,106
              A 400,400 0 0,1 40,106
              A 8,8 0 0,1 40,103
              Z" />

            <!-- Scale line (bottom of tube) -->
            <path class="scale-line" d="M 40,110 A 400,400 0 0,0 360,110" />

            <!-- Outer tick marks and numbers will be added by JavaScript -->
            <g class="tick-marks"></g>
            <g class="scale-values"></g>

            <!-- Pointer centered at 0° position -->
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
    const innerTickMarksGroup = scale.querySelector(".inner-tick-marks");
    const valuesGroup = scale.querySelector(".scale-values");
    const path = scale.querySelector(".scale-line");
    const pathLength = path.getTotalLength();

    // Clear existing elements
    tickMarksGroup.innerHTML = "";
    innerTickMarksGroup.innerHTML = "";
    valuesGroup.innerHTML = "";

    // Calculate positions for all ticks and numbers
    for (let value = min; value <= max; value += minorStep) {
      const isMajor = value % majorStep === 0;
      const range = max - min;
      const normalized = (value - min) / range;
      const distance = normalized * pathLength;
      const point = path.getPointAtLength(distance);
      const angle = this.getAngleAtPoint(path, point, pathLength);

      // Create outer tick mark
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
      tick.setAttribute("stroke", "var(--text-color)");
      tick.setAttribute("stroke-width", isMajor ? 1.5 : 1);
      tickMarksGroup.appendChild(tick);

      // Create inner tick mark (shorter and more subtle)
      const innerTick = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      const innerTickLength = isMajor ? 6 : 3; // Slightly shorter than outer ticks

      // Position inner tick mark upward from the line
      const innerTickStart = this.getPointFromAngle(point, angle - 90, 0);
      const innerTickEnd = this.getPointFromAngle(
        point,
        angle - 90,
        innerTickLength
      );

      innerTick.setAttribute("x1", innerTickStart.x);
      innerTick.setAttribute("y1", innerTickStart.y);
      innerTick.setAttribute("x2", innerTickEnd.x);
      innerTick.setAttribute("y2", innerTickEnd.y);
      innerTick.setAttribute("stroke", "var(--text-color)");
      innerTick.setAttribute("stroke-width", isMajor ? 1.2 : 0.8);
      innerTick.setAttribute("opacity", "0.6"); // Increased from 0.4 to make inner ticks more visible
      innerTickMarksGroup.appendChild(innerTick);

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
        text.setAttribute("dominant-baseline", "hanging");
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
