"use client";

import { useState, useEffect } from "react";
import {
  Save,
  RotateCcw,
  Settings,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { HardwareConfig } from "@/lib/hardware-telemetry";
import {
  createDefaultConfig,
  saveHardwareConfig,
  loadHardwareConfig,
} from "@/lib/hardware-telemetry";

interface HardwareConfigProps {
  plateNumber: string;
  onSave?: (config: HardwareConfig) => void;
}

export function HardwareConfigComponent({
  plateNumber,
  onSave,
}: HardwareConfigProps) {
  const [config, setConfig] = useState<HardwareConfig | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load existing config or create default
    const existingConfig = loadHardwareConfig(plateNumber);
    if (existingConfig) {
      setConfig(existingConfig);
    } else {
      const defaultConfig = createDefaultConfig(plateNumber, "ESP32_" + plateNumber);
      setConfig(defaultConfig);
    }
  }, [plateNumber]);

  const handleReset = () => {
    const defaultConfig = createDefaultConfig(plateNumber, "ESP32_" + plateNumber);
    setConfig(defaultConfig);
    setError(null);
  };

  const handleSave = () => {
    if (!config) return;

    try {
      // Validate configuration
      if (config.tireDiameter <= 0) {
        setError("Tire diameter must be greater than 0");
        return;
      }
      if (config.pulsesPerRotation <= 0) {
        setError("Pulses per rotation must be greater than 0");
        return;
      }
      if (config.speedLimit <= 0) {
        setError("Speed limit must be greater than 0");
        return;
      }
      if (config.governorActivationThreshold >= config.speedLimit) {
        setError("Governor threshold must be less than speed limit");
        return;
      }

      saveHardwareConfig(config);
      setError(null);
      setIsSaved(true);

      setTimeout(() => setIsSaved(false), 3000);

      if (onSave) {
        onSave(config);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save config");
    }
  };

  if (!config) {
    return <div className="text-muted-foreground">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Hardware Configuration</h3>
          <p className="text-sm text-muted-foreground">ESP32 Vehicle Parameters</p>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="glass-card rounded-lg border border-border p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Vehicle Information</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              License Plate
            </label>
            <input
              type="text"
              value={config.plateNumber}
              disabled
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-muted-foreground text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Device ID
            </label>
            <input
              type="text"
              value={config.deviceId}
              onChange={(e) => setConfig({ ...config, deviceId: e.target.value })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Tire Configuration */}
      <div className="glass-card rounded-lg border border-border p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Tire & Hall Sensor</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tire Diameter (mm)
            </label>
            <input
              type="number"
              value={config.tireDiameter}
              onChange={(e) =>
                setConfig({
                  ...config,
                  tireDiameter: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="700"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Typical car tire: 600-750mm
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Pulses Per Rotation
            </label>
            <input
              type="number"
              value={config.pulsesPerRotation}
              onChange={(e) =>
                setConfig({
                  ...config,
                  pulsesPerRotation: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Hall sensor pulses per wheel rotation
            </p>
          </div>
        </div>
      </div>

      {/* Speed & Governor */}
      <div className="glass-card rounded-lg border border-border p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Speed & Governor Control</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Speed Limit (km/h)
            </label>
            <input
              type="number"
              value={config.speedLimit}
              onChange={(e) =>
                setConfig({ ...config, speedLimit: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="80"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Governor Threshold (km/h)
            </label>
            <input
              type="number"
              value={config.governorActivationThreshold}
              onChange={(e) =>
                setConfig({
                  ...config,
                  governorActivationThreshold: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="75"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Speed at which governor activates
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Max Power Reduction (%)
          </label>
          <input
            type="number"
            value={config.governorMaxReduction}
            onChange={(e) =>
              setConfig({
                ...config,
                governorMaxReduction: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="30"
          />
          <p className="text-xs text-muted-foreground mt-1">
            How much to reduce engine power when governor is active
          </p>
        </div>
      </div>

      {/* Hardware Features */}
      <div className="glass-card rounded-lg border border-border p-6 space-y-4">
        <h4 className="font-semibold text-foreground">Hardware Features</h4>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.buzzerEnabled}
              onChange={(e) => setConfig({ ...config, buzzerEnabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-foreground">Enable Buzzer Alert</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.lcdEnabled}
              onChange={(e) => setConfig({ ...config, lcdEnabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-foreground">Enable LCD Display</span>
          </label>
        </div>
      </div>

      {/* GPIO Configuration */}
      <div className="glass-card rounded-lg border border-border p-6 space-y-4">
        <h4 className="font-semibold text-foreground">GPIO Configuration</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Relay GPIO Pin
            </label>
            <input
              type="number"
              value={config.relayGpio}
              onChange={(e) =>
                setConfig({ ...config, relayGpio: parseInt(e.target.value) || 0 })
              }
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Buzzer GPIO Pin
            </label>
            <input
              type="number"
              value={config.buzzerGpio}
              onChange={(e) =>
                setConfig({ ...config, buzzerGpio: parseInt(e.target.value) || 0 })
              }
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="4"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/50 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {isSaved && (
        <div className="flex items-start gap-3 bg-success/10 border border-success/50 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">Configuration saved successfully</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Info Box */}
      <div className="glass-card rounded-lg border border-border/50 bg-background/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          These settings configure how the ESP32 microcontroller calculates real speed from
          Hall sensor data. Accurate tire diameter and pulses-per-rotation values are critical
          for precise speed measurement. Governor threshold controls when power reduction begins.
        </p>
      </div>
    </div>
  );
}
