"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Zap,
  Activity,
  Gauge,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { HardwareTelemetry } from "@/lib/hardware-telemetry";

interface HardwareStatusProps {
  telemetry: HardwareTelemetry | null;
  isConnected: boolean;
}

export function HardwareStatus({ telemetry, isConnected }: HardwareStatusProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setPulseAnimation((prev) => !prev);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  if (!telemetry) {
    return (
      <div className="glass-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          <div>
            <p className="text-xs text-muted-foreground">Hardware Status</p>
            <p className="font-semibold text-foreground">Waiting for ESP32...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div
        className={`glass-card rounded-lg border p-4 transition-all ${
          isConnected
            ? "border-success/50 bg-success/10"
            : "border-destructive/50 bg-destructive/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-success" : "bg-destructive"} ${pulseAnimation ? "animate-pulse" : ""}`}
          />
          <div>
            <p className="text-xs text-muted-foreground">ESP32 Connection</p>
            <p className="font-semibold text-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </p>
          </div>
        </div>
      </div>

      {/* Real Speed vs GPS Speed */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-lg border border-border p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-accent" />
              <p className="text-xs text-muted-foreground font-semibold">
                Real Speed
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {telemetry.realSpeed.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">km/h (Hall Sensor)</p>
          </div>
        </div>

        <div className="glass-card rounded-lg border border-border p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-info" />
              <p className="text-xs text-muted-foreground font-semibold">
                GPS Speed
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {telemetry.gpsSpeed.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">km/h (Satellite)</p>
          </div>
        </div>
      </div>

      {/* Speed Difference */}
      {telemetry.speedDifference > 2 && (
        <div className="glass-card rounded-lg border border-warning/50 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-warning mb-1">
                Speed Deviation Detected
              </p>
              <p className="text-sm text-muted-foreground">
                Real speed differs from GPS by{" "}
                <span className="font-bold text-foreground">
                  {telemetry.speedDifference.toFixed(1)} km/h
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Governor Status */}
      <div
        className={`glass-card rounded-lg border p-4 transition-all ${
          telemetry.governorActivated
            ? "border-destructive/50 bg-destructive/10"
            : "border-success/50 bg-success/10"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap
                className={`w-5 h-5 ${telemetry.governorActivated ? "text-destructive" : "text-success"}`}
              />
              <p className="text-xs text-muted-foreground font-semibold">
                Governor Status
              </p>
            </div>
            <p
              className={`text-sm font-bold ${telemetry.governorActivated ? "text-destructive" : "text-success"}`}
            >
              {telemetry.governorActivated ? "ACTIVE" : "INACTIVE"}
            </p>
          </div>

          {/* Power Level Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Engine Power</p>
              <p className="text-xs font-bold text-foreground">
                {telemetry.governorLevel}%
              </p>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  telemetry.governorLevel >= 75
                    ? "bg-success"
                    : telemetry.governorLevel >= 50
                      ? "bg-warning"
                      : "bg-destructive"
                }`}
                style={{ width: `${telemetry.governorLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hall Sensor Activity */}
      <div className="glass-card rounded-lg border border-border p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <p className="text-xs text-muted-foreground font-semibold">
              Hall Sensor
            </p>
          </div>
          <p className="text-xl font-bold text-foreground">
            {telemetry.hallPulses}
          </p>
          <p className="text-xs text-muted-foreground">pulses/second</p>
        </div>
      </div>

      {/* Alerts */}
      {telemetry.alerts.length > 0 && (
        <div className="space-y-2">
          {telemetry.alerts.map((alert, index) => (
            <div
              key={index}
              className="glass-card rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* No Alerts */}
      {telemetry.alerts.length === 0 && (
        <div className="glass-card rounded-lg border border-success/50 bg-success/10 p-3 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">All systems nominal</p>
        </div>
      )}
    </div>
  );
}
