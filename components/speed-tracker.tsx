"use client";

import { useEffect, useState } from "react";
import { Gauge, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface SpeedTrackerProps {
  speed: number;
  maxSpeed: number;
  onSpeedChange?: (speed: number) => void;
}

export function SpeedTracker({ speed, maxSpeed }: SpeedTrackerProps) {
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [prevSpeed, setPrevSpeed] = useState(0);

  // Animate speed counter
  useEffect(() => {
    const diff = speed - prevSpeed;
    const step = diff > 0 ? 1 : -1;
    const steps = Math.abs(diff);
    
    if (steps === 0) return;

    let current = prevSpeed;
    const interval = setInterval(() => {
      current += step;
      setDisplaySpeed(current);
      if (current === speed) {
        clearInterval(interval);
        setPrevSpeed(speed);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [speed, prevSpeed]);

  const getSpeedStatus = () => {
    if (speed > maxSpeed) return { status: "DANGEROUS", color: "neon-red", icon: AlertTriangle };
    if (speed > maxSpeed * 0.75) return { status: "WARNING", color: "neon-yellow", icon: TrendingUp };
    return { status: "SAFE", color: "neon-green", icon: CheckCircle };
  };

  const { status, color, icon: StatusIcon } = getSpeedStatus();
  const percentage = Math.min((speed / maxSpeed) * 100, 100);
  const isDangerous = speed > maxSpeed;

  return (
    <div className={`glass-card rounded-xl p-6 ${isDangerous ? "blink-danger border-neon-red/50" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center`}>
            <Gauge className={`w-5 h-5 text-${color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Speed Monitor</h3>
            <p className="text-xs text-muted-foreground">Real-time tracking</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDangerous 
            ? "bg-neon-red/20 text-neon-red border border-neon-red/30" 
            : speed > maxSpeed * 0.75
              ? "bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30"
              : "bg-neon-green/20 text-neon-green border border-neon-green/30"
        }`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{status}</span>
        </div>
      </div>

      {/* Speed Display */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <span className={`text-7xl md:text-8xl font-bold font-mono tracking-tighter ${
            isDangerous 
              ? "text-neon-red text-glow-red" 
              : speed > maxSpeed * 0.75 
                ? "text-neon-yellow text-glow-yellow"
                : "text-neon-green text-glow-green"
          } animate-count`}>
            {displaySpeed}
          </span>
          <span className="text-2xl md:text-3xl text-muted-foreground ml-2">km/h</span>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          Speed Limit: <span className="text-foreground font-medium">{maxSpeed} km/h</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-secondary rounded-full overflow-hidden mb-4">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full ${
            isDangerous 
              ? "bg-gradient-to-r from-neon-red/80 to-neon-red neon-red" 
              : speed > maxSpeed * 0.75
                ? "bg-gradient-to-r from-neon-yellow/80 to-neon-yellow"
                : "bg-gradient-to-r from-neon-green/80 to-neon-green"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {/* Limit marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
          style={{ left: "100%" }}
        />
      </div>

      {/* Speed Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="text-neon-yellow">{maxSpeed * 0.75}</span>
        <span className="text-neon-red">{maxSpeed}</span>
        <span>{maxSpeed * 1.5}</span>
      </div>

      {/* Warning Message */}
      {isDangerous && (
        <div className="mt-4 p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg flex items-center gap-2 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-neon-red flex-shrink-0" />
          <div>
            <p className="text-neon-red font-medium text-sm">SPEED VIOLATION DETECTED</p>
            <p className="text-neon-red/70 text-xs">Exceeding limit by {speed - maxSpeed} km/h</p>
          </div>
        </div>
      )}
    </div>
  );
}
