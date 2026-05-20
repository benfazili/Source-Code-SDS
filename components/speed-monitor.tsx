"use client";

import { useState, useEffect } from "react";
import { Gauge, AlertTriangle, TrendingUp, Zap } from "lucide-react";

interface SpeedMonitorProps {
  currentSpeed: number;
  maxSpeed: number;
  isMoving: boolean;
  gpsStatus: "searching" | "connected" | "error";
  gpsAccuracy: number | null;
}

export function SpeedMonitor({
  currentSpeed,
  maxSpeed,
  isMoving,
  gpsStatus,
  gpsAccuracy,
}: SpeedMonitorProps) {
  const [speedTrend, setSpeedTrend] = useState<"stable" | "accelerating" | "decelerating">("stable");
  const [previousSpeed, setPreviousSpeed] = useState(currentSpeed);

  // Detect acceleration/deceleration
  useEffect(() => {
    if (currentSpeed > previousSpeed + 2) {
      setSpeedTrend("accelerating");
    } else if (currentSpeed < previousSpeed - 2) {
      setSpeedTrend("decelerating");
    } else {
      setSpeedTrend("stable");
    }
    setPreviousSpeed(currentSpeed);
  }, [currentSpeed, previousSpeed]);

  // Determine color based on speed
  const getSpeedColor = () => {
    if (currentSpeed < 60) return "text-success";
    if (currentSpeed < 80) return "text-warning";
    return "text-destructive";
  };

  const getSpeedBgColor = () => {
    if (currentSpeed < 60) return "bg-success/10";
    if (currentSpeed < 80) return "bg-warning/10";
    return "bg-destructive/10";
  };

  const getSpeedBorderColor = () => {
    if (currentSpeed < 60) return "border-success/30";
    if (currentSpeed < 80) return "border-warning/30";
    return "border-destructive/30";
  };

  return (
    <div className="space-y-6">
      {/* Main Speed Display */}
      <div
        className={`rounded-2xl border-2 p-8 transition-all duration-500 ${getSpeedBgColor()} ${getSpeedBorderColor()}`}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Speedometer Gauge */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full border-4 border-border/30" />

            {/* Colored speed arc (visual speedometer) */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Green zone (0-60) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-success/40"
                strokeDasharray={`${(60 / 160) * 251.2} 251.2`}
              />
              {/* Yellow zone (60-80) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-warning/40"
                strokeDasharray={`${((80 - 60) / 160) * 251.2} 251.2`}
                strokeDashoffset={`${-(60 / 160) * 251.2}`}
              />
              {/* Red zone (80-160) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-destructive/40"
                strokeDasharray={`${((160 - 80) / 160) * 251.2} 251.2`}
                strokeDashoffset={`${-((60 + 20) / 160) * 251.2}`}
              />

              {/* Current speed indicator */}
              <g
                style={{
                  transform: `rotate(${(currentSpeed / 160) * 180}deg)`,
                  transformOrigin: "50% 50%",
                  transition: "transform 0.3s ease-out",
                }}
              >
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="15"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={getSpeedColor()}
                />
                <circle cx="50" cy="50" r="3" fill="currentColor" className={getSpeedColor()} />
              </g>
            </svg>

            {/* Speed Display in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl font-black ${getSpeedColor()}`}>
                {Math.round(currentSpeed)}
              </div>
              <div className="text-sm font-semibold text-muted-foreground">km/h</div>
            </div>
          </div>

          {/* Speed Status */}
          <div className="flex items-center justify-center gap-4 w-full">
            {/* Acceleration Indicator */}
            <div className="flex items-center gap-2">
              {speedTrend === "accelerating" && (
                <div className="flex items-center gap-1 text-warning animate-pulse">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs font-semibold">ACCELERATING</span>
                </div>
              )}
              {speedTrend === "decelerating" && (
                <div className="flex items-center gap-1 text-info">
                  <TrendingUp className="w-5 h-5 transform rotate-180" />
                  <span className="text-xs font-semibold">DECELERATING</span>
                </div>
              )}
              {speedTrend === "stable" && (
                <div className="flex items-center gap-1 text-success">
                  <Zap className="w-5 h-5" />
                  <span className="text-xs font-semibold">STABLE</span>
                </div>
              )}
            </div>

            {/* Speed Violation Warning */}
            {currentSpeed > 80 && (
              <div className="flex items-center gap-1 text-destructive animate-pulse">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-xs font-semibold">EXCEEDING LIMIT</span>
              </div>
            )}
          </div>
        </div>

        {/* Speed Limit Reference */}
        <div className="mt-6 pt-6 border-t border-border/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SPEED LIMIT</p>
              <p className="text-lg font-bold text-foreground">80</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">MAX RECORDED</p>
              <p className="text-lg font-bold text-foreground">{Math.round(maxSpeed)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">STATUS</p>
              <p
                className={`text-lg font-bold ${currentSpeed > 80 ? "text-destructive" : "text-success"}`}
              >
                {currentSpeed > 80 ? "VIOLATION" : "OK"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GPS & Accuracy Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                gpsStatus === "connected"
                  ? "bg-success animate-pulse"
                  : gpsStatus === "error"
                    ? "bg-destructive"
                    : "bg-warning animate-pulse"
              }`}
            />
            <div>
              <p className="text-xs text-muted-foreground">GPS Status</p>
              <p className="font-semibold text-foreground capitalize">{gpsStatus}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg border border-border p-4">
          <div>
            <p className="text-xs text-muted-foreground">GPS Accuracy</p>
            <p className="font-semibold text-foreground">
              {gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : "Calculating..."}
            </p>
          </div>
        </div>
      </div>

      {/* Speed Zones Legend */}
      <div className="glass-card rounded-lg border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Speed Zones</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>Safe Zone</span>
            </div>
            <span className="text-muted-foreground">0 - 60 km/h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>Caution Zone</span>
            </div>
            <span className="text-muted-foreground">60 - 80 km/h</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>Violation Zone</span>
            </div>
            <span className="text-muted-foreground">&gt; 80 km/h</span>
          </div>
        </div>
      </div>

      {/* Moving Status */}
      <div className="glass-card rounded-lg border border-border p-4 text-center">
        <p className="text-xs text-muted-foreground mb-2">VEHICLE STATUS</p>
        <p className={`text-xl font-bold ${isMoving ? "text-warning animate-pulse" : "text-success"}`}>
          {isMoving ? "MOVING" : "STATIONARY"}
        </p>
      </div>
    </div>
  );
}
