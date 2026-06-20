/**
 * Hardware Telemetry Utilities for ESP32 Integration
 * Handles Hall sensor speed calculation, governor activation, and real-time monitoring
 */

export interface HardwareConfig {
  deviceId: string;
  plateNumber: string;
  tireDiameter: number; // in mm
  pulsesPerRotation: number; // Hall sensor pulses per wheel rotation
  speedLimit: number; // km/h
  governorActivationThreshold: number; // km/h (when to start reducing power)
  governorMaxReduction: number; // 0-100%, how much power reduction
  buzzerEnabled: boolean;
  lcdEnabled: boolean;
  relayGpio: number;
  buzzerGpio: number;
}

export interface HardwareTelemetry {
  deviceId: string;
  plateNumber: string;
  timestamp: string;
  hallPulses: number; // Pulses per second
  gpsSpeed: number; // Speed from GPS
  realSpeed: number; // Calculated from Hall sensor
  speedDifference: number; // |realSpeed - gpsSpeed|
  isSpeedViolation: boolean;
  governorActivated: boolean;
  governorLevel: number; // 0-100%, power percentage
  alerts: string[];
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy: number;
}

export interface GovernorStatus {
  isActive: boolean;
  powerLevel: number; // 0-100%
  reason: string;
  timestamp: string;
}

/**
 * Calculate real speed from Hall sensor pulses
 * Formula: (pulses/sec * 60) * tire_circumference / 1000000 = km/h
 * Tire circumference = π * diameter (mm)
 */
export function calculateRealSpeed(
  hallPulses: number,
  tireDiameter: number,
  pulsesPerRotation: number
): number {
  if (hallPulses === 0 || pulsesPerRotation === 0) return 0;

  // Tire circumference in mm
  const tireCircumference = Math.PI * tireDiameter;

  // Distance traveled in one second (mm)
  const distancePerSecond = (hallPulses / pulsesPerRotation) * tireCircumference;

  // Convert to km/h: (mm/s * 3.6) / 1000000 = km/h
  const speedKmh = (distancePerSecond * 3.6) / 1000000;

  return Math.max(0, Math.min(speedKmh, 200)); // Cap at 200 km/h max
}

/**
 * Calculate governor power reduction level
 * Gradually reduces power as speed increases above threshold
 */
export function calculateGovernorLevel(
  realSpeed: number,
  speedLimit: number,
  governorThreshold: number,
  maxReduction: number
): { level: number; isActive: boolean; reason: string } {
  // Governor not active yet
  if (realSpeed < governorThreshold) {
    return {
      level: 100,
      isActive: false,
      reason: "Speed below governor threshold",
    };
  }

  // Calculate reduction percentage linearly
  const speedAboveThreshold = realSpeed - governorThreshold;
  const speedRangeForReduction = speedLimit - governorThreshold;

  if (speedRangeForReduction <= 0) {
    return {
      level: 100 - maxReduction,
      isActive: true,
      reason: "Governor threshold activated",
    };
  }

  const reductionPercent =
    (speedAboveThreshold / speedRangeForReduction) * maxReduction;
  const powerLevel = Math.max(100 - reductionPercent, 100 - maxReduction);

  return {
    level: Math.round(powerLevel),
    isActive: true,
    reason: `Governor active: speed ${realSpeed.toFixed(1)} km/h above threshold`,
  };
}

/**
 * Generate telemetry record from hardware and GPS data
 */
export function generateTelemetry(
  config: HardwareConfig,
  hallPulses: number,
  gpsSpeed: number,
  gpsLat: number,
  gpsLng: number,
  gpsAccuracy: number
): HardwareTelemetry {
  const realSpeed = calculateRealSpeed(
    hallPulses,
    config.tireDiameter,
    config.pulsesPerRotation
  );

  const governor = calculateGovernorLevel(
    realSpeed,
    config.speedLimit,
    config.governorActivationThreshold,
    config.governorMaxReduction
  );

  const speedDifference = Math.abs(realSpeed - gpsSpeed);
  const isSpeedViolation = realSpeed > config.speedLimit;

  const alerts: string[] = [];
  if (isSpeedViolation) {
    alerts.push(`SPEED VIOLATION: ${realSpeed.toFixed(1)} km/h > ${config.speedLimit} km/h`);
  }
  if (governor.isActive) {
    alerts.push(`GOVERNOR ACTIVE: Power at ${governor.level}%`);
  }
  if (speedDifference > 10) {
    alerts.push(
      `GPS DEVIATION: Real speed differs from GPS by ${speedDifference.toFixed(1)} km/h`
    );
  }

  return {
    deviceId: config.deviceId,
    plateNumber: config.plateNumber,
    timestamp: new Date().toISOString(),
    hallPulses,
    gpsSpeed: Math.round(gpsSpeed * 100) / 100,
    realSpeed: Math.round(realSpeed * 100) / 100,
    speedDifference: Math.round(speedDifference * 100) / 100,
    isSpeedViolation,
    governorActivated: governor.isActive,
    governorLevel: governor.level,
    alerts,
    gpsLatitude: gpsLat,
    gpsLongitude: gpsLng,
    gpsAccuracy,
  };
}

/**
 * Send telemetry to server
 */
export async function sendTelemetry(telemetry: HardwareTelemetry): Promise<boolean> {
  try {
    const response = await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(telemetry),
    });

    return response.ok;
  } catch (error) {
    console.error("[v0] Failed to send telemetry:", error);
    return false;
  }
}

/**
 * Save telemetry to localStorage for offline capability
 */
export function saveTelemetryLocally(
  plateNumber: string,
  telemetry: HardwareTelemetry
): void {
  try {
    const key = `sds_hardware_telemetry_${plateNumber}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");

    existing.push(telemetry);

    // Keep only last 500 records
    if (existing.length > 500) {
      existing.shift();
    }

    localStorage.setItem(key, JSON.stringify(existing));
  } catch (error) {
    console.error("[v0] Failed to save telemetry locally:", error);
  }
}

/**
 * Get telemetry history from localStorage
 */
export function getTelemetryHistory(
  plateNumber: string,
  limit: number = 100
): HardwareTelemetry[] {
  try {
    const key = `sds_hardware_telemetry_${plateNumber}`;
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return data.slice(-limit);
  } catch (error) {
    console.error("[v0] Failed to get telemetry history:", error);
    return [];
  }
}

/**
 * Save hardware configuration
 */
export function saveHardwareConfig(config: HardwareConfig): void {
  try {
    localStorage.setItem(
      `sds_hardware_config_${config.plateNumber}`,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error("[v0] Failed to save hardware config:", error);
  }
}

/**
 * Load hardware configuration
 */
export function loadHardwareConfig(plateNumber: string): HardwareConfig | null {
  try {
    const data = localStorage.getItem(`sds_hardware_config_${plateNumber}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("[v0] Failed to load hardware config:", error);
    return null;
  }
}

/**
 * Create default hardware configuration
 */
export function createDefaultConfig(
  plateNumber: string,
  deviceId: string
): HardwareConfig {
  return {
    deviceId,
    plateNumber,
    tireDiameter: 700, // 700mm typical car tire
    pulsesPerRotation: 1, // 1 pulse per wheel rotation (typical Hall sensor)
    speedLimit: 80,
    governorActivationThreshold: 75,
    governorMaxReduction: 30, // Reduce power by max 30%
    buzzerEnabled: true,
    lcdEnabled: true,
    relayGpio: 5, // GPIO5 for relay
    buzzerGpio: 4, // GPIO4 for buzzer
  };
}

/**
 * Export telemetry data as CSV for compliance
 */
export function exportTelemetryAsCSV(
  telemetry: HardwareTelemetry[]
): string {
  if (telemetry.length === 0) return "";

  const headers = [
    "Timestamp",
    "Hall Pulses",
    "GPS Speed (km/h)",
    "Real Speed (km/h)",
    "Difference (km/h)",
    "Violation",
    "Governor Active",
    "Governor Level (%)",
    "Latitude",
    "Longitude",
    "GPS Accuracy (m)",
  ];

  const rows = telemetry.map((t) => [
    t.timestamp,
    t.hallPulses,
    t.gpsSpeed,
    t.realSpeed,
    t.speedDifference,
    t.isSpeedViolation ? "YES" : "NO",
    t.governorActivated ? "YES" : "NO",
    t.governorLevel,
    t.gpsLatitude,
    t.gpsLongitude,
    t.gpsAccuracy,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}
