"use client";

import { useState, useEffect } from "react";
import { Users, User, Car, Phone, MapPin, Gauge, Clock, Radio, RefreshCw, AlertTriangle } from "lucide-react";
import type { DriverInfo } from "./login-screen";

interface ActiveDriver extends DriverInfo {
  lastActive?: string;
  lastPosition?: { lat: number; lng: number };
  lastSpeed?: number;
}

interface ActiveDriversProps {
  className?: string;
}

const SPEED_LIMIT = 80;

export function ActiveDrivers({ className }: ActiveDriversProps) {
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load and refresh drivers from localStorage
  const loadDrivers = () => {
    const savedDrivers = localStorage.getItem("sds_drivers");
    if (savedDrivers) {
      try {
        const parsed: ActiveDriver[] = JSON.parse(savedDrivers);
        // Filter only active drivers (active within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const activeDrivers = parsed.filter(d => d.lastActive && d.lastActive > fiveMinutesAgo);
        setDrivers(activeDrivers);
      } catch {
        setDrivers([]);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadDrivers();
    
    // Refresh every 3 seconds
    const interval = setInterval(loadDrivers, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDrivers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getTimeSinceActive = (lastActive?: string) => {
    if (!lastActive) return "Unknown";
    const diff = Date.now() - new Date(lastActive).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const getSpeedStatus = (speed?: number) => {
    if (!speed) return "unknown";
    if (speed > SPEED_LIMIT) return "danger";
    if (speed > SPEED_LIMIT * 0.75) return "warning";
    return "safe";
  };

  return (
    <div className={`glass-card rounded-xl overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Active Drivers</h3>
            <p className="text-xs text-muted-foreground">
              {drivers.length} driver{drivers.length !== 1 ? "s" : ""} currently tracked
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-card hover:bg-card/80 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Drivers List */}
      <div className="max-h-[400px] overflow-y-auto">
        {drivers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No Active Drivers</p>
            <p className="text-sm text-muted-foreground mt-1">
              Drivers will appear here when they log in
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {drivers.map((driver, index) => {
              const speedStatus = getSpeedStatus(driver.lastSpeed);
              return (
                <div 
                  key={`${driver.plateNumber}-${index}`} 
                  className={`p-4 hover:bg-card/50 transition-colors ${
                    speedStatus === "danger" ? "bg-neon-red/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Driver Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      speedStatus === "danger" ? "bg-neon-red/20" :
                      speedStatus === "warning" ? "bg-neon-yellow/20" : "bg-neon-green/20"
                    }`}>
                      <User className={`w-6 h-6 ${
                        speedStatus === "danger" ? "text-neon-red" :
                        speedStatus === "warning" ? "text-neon-yellow" : "text-neon-green"
                      }`} />
                    </div>

                    {/* Driver Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">{driver.name}</h4>
                        {speedStatus === "danger" && (
                          <AlertTriangle className="w-4 h-4 text-neon-red animate-pulse" />
                        )}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Car className="w-3 h-3 text-neon-yellow" />
                          <span className="font-mono font-semibold text-foreground">{driver.plateNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3 text-neon-cyan" />
                          <span className="truncate">{driver.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Gauge className={`w-3 h-3 ${
                            speedStatus === "danger" ? "text-neon-red" :
                            speedStatus === "warning" ? "text-neon-yellow" : "text-neon-green"
                          }`} />
                          <span className={`font-mono font-semibold ${
                            speedStatus === "danger" ? "text-neon-red" :
                            speedStatus === "warning" ? "text-neon-yellow" : "text-foreground"
                          }`}>
                            {driver.lastSpeed || 0} km/h
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeSinceActive(driver.lastActive)}</span>
                        </div>
                      </div>

                      {/* Location */}
                      {driver.lastPosition && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="font-mono">
                            {driver.lastPosition.lat.toFixed(4)}, {driver.lastPosition.lng.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Indicator */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        speedStatus === "danger" ? "bg-neon-red" :
                        speedStatus === "warning" ? "bg-neon-yellow" : "bg-neon-green"
                      }`} />
                      <Radio className="w-3 h-3 text-primary animate-pulse" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-card/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Auto-refreshing every 3s</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neon-green" />
              <span>Safe</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neon-yellow" />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neon-red" />
              <span>Violation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
