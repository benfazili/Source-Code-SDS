"use client";

import { TrendingUp, AlertTriangle, Shield, Activity, Clock, MapPin } from "lucide-react";
import type { Violation } from "./violation-report";

interface AnalyticsPanelProps {
  violations: Violation[];
  isInsideZone: boolean;
  currentSpeed: number;
  maxSpeed: number;
  sessionDuration: number;
}

export function AnalyticsPanel({ 
  violations, 
  isInsideZone, 
  currentSpeed, 
  maxSpeed,
  sessionDuration 
}: AnalyticsPanelProps) {
  const totalViolations = violations.length;
  const criticalViolations = violations.filter(v => v.status === "danger").length;
  const warningViolations = violations.filter(v => v.status === "warning").length;
  const averageSpeed = violations.length > 0 
    ? Math.round(violations.reduce((sum, v) => sum + v.speed, 0) / violations.length)
    : 0;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const stats = [
    {
      label: "Total Violations",
      value: totalViolations,
      icon: AlertTriangle,
      color: totalViolations > 0 ? "neon-red" : "neon-green",
      description: "All time",
    },
    {
      label: "Critical Alerts",
      value: criticalViolations,
      icon: Shield,
      color: criticalViolations > 0 ? "neon-red" : "neon-cyan",
      description: `>${maxSpeed} km/h`,
    },
    {
      label: "Warnings",
      value: warningViolations,
      icon: TrendingUp,
      color: warningViolations > 0 ? "neon-yellow" : "neon-cyan",
      description: `>${maxSpeed * 0.75} km/h`,
    },
    {
      label: "Avg. Violation Speed",
      value: averageSpeed,
      icon: Activity,
      color: "primary",
      description: "km/h",
      suffix: " km/h",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="glass-card rounded-xl p-4 animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}/20 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              {stat.value > 0 && stat.label.includes("Violation") && (
                <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
              )}
            </div>
            <div className={`text-3xl font-bold font-mono text-${stat.color} mb-1`}>
              {stat.value}
              {stat.suffix && <span className="text-sm text-muted-foreground ml-1">{stat.suffix.trim()}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Speed Status */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Current Speed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold font-mono ${
              currentSpeed > maxSpeed 
                ? "text-neon-red" 
                : currentSpeed > maxSpeed * 0.75 
                  ? "text-neon-yellow"
                  : "text-neon-green"
            }`}>
              {currentSpeed}
            </span>
            <span className="text-muted-foreground">km/h</span>
          </div>
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                currentSpeed > maxSpeed 
                  ? "bg-neon-red" 
                  : currentSpeed > maxSpeed * 0.75 
                    ? "bg-neon-yellow"
                    : "bg-neon-green"
              }`}
              style={{ width: `${Math.min((currentSpeed / maxSpeed) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Zone Status */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Zone Status</span>
          </div>
          <div className={`flex items-center gap-2 ${
            isInsideZone ? "text-neon-green" : "text-neon-red"
          }`}>
            <span className={`w-3 h-3 rounded-full ${
              isInsideZone ? "bg-neon-green" : "bg-neon-red animate-pulse"
            }`} />
            <span className="text-xl font-bold">
              {isInsideZone ? "INSIDE ZONE" : "OUTSIDE ZONE"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Kigali geofence (15km radius)
          </p>
        </div>

        {/* Session Duration */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Session Duration</span>
          </div>
          <div className="text-4xl font-bold font-mono text-primary">
            {formatDuration(sessionDuration)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Active monitoring time
          </p>
        </div>
      </div>
    </div>
  );
}
