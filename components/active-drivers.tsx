"use client";

import { useState, useEffect } from "react";
import { 
  Truck, TrendingUp, MapPin
} from "lucide-react";
import type { DriverInfo } from "./login-screen";

interface DriverSession {
  driverId: string;
  plateNumber: string;
  driverName: string;
  phone: string;
  lastActive: string;
  lastPosition: { lat: number; lng: number };
  lastSpeed: number;
  currentSpeed: number;
  maxSpeed: number;
  averageSpeed: number;
  speedHistory: Array<{ timestamp: string; speed: number; latitude: number; longitude: number }>;
  violationCount: number;
  isMoving: boolean;
  status: "active" | "stopped" | "offline";
}

interface ActiveDriversProps {
  className?: string;
}

const SPEED_LIMIT = 80;

export function ActiveDrivers({ className }: ActiveDriversProps) {
  const [drivers, setDrivers] = useState<(DriverInfo & Partial<DriverSession>)[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  // Poll for driver updates every second
  useEffect(() => {
    const pollInterval = setInterval(() => {
      const driversData = JSON.parse(localStorage.getItem("sds_drivers") || "[]");
      const activeDrivers = driversData.filter((d: DriverInfo & { lastActive?: string }) => {
        if (!d.lastActive) return false;
        const lastActiveTime = new Date(d.lastActive).getTime();
        const now = Date.now();
        return (now - lastActiveTime) < 60000; // Within last 60 seconds
      });
      setDrivers(activeDrivers);
      setRefreshTime(new Date());
    }, 1000);

    return () => clearInterval(pollInterval);
  }, []);

  const getSpeedStatus = (speed?: number) => {
    if (!speed) return "safe";
    if (speed > SPEED_LIMIT) return "danger";
    if (speed > SPEED_LIMIT * 0.75) return "warning";
    return "safe";
  };

  return (
    <div className={`glass-card rounded-lg border border-border overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="bg-muted/30 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-semibold text-foreground">Active Fleet Drivers</h3>
              <p className="text-xs text-muted-foreground">Real-time GPS monitoring • {drivers.length} active</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {refreshTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Drivers List */}
      <div className="max-h-[700px] overflow-y-auto divide-y divide-border">
        {drivers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No active drivers tracking</p>
          </div>
        ) : (
          drivers.map((driver) => {
            const speedStatus = getSpeedStatus(driver.lastSpeed || 0);
            const isViolating = (driver.lastSpeed || 0) > SPEED_LIMIT;

            return (
              <div key={driver.plateNumber} className="p-5 hover:bg-card/50 transition-colors">
                {/* Main Driver Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground text-sm">{driver.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded font-mono font-semibold ${
                        isViolating ? "bg-destructive/10 text-destructive" :
                        driver.isMoving ? "bg-warning/10 text-warning" :
                        "bg-success/10 text-success"
                      }`}>
                        {isViolating ? "VIOLATION" : driver.isMoving ? "MOVING" : "STOPPED"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono font-semibold">{driver.plateNumber}</span>
                      <span>•</span>
                      <span>{driver.phone}</span>
                    </div>
                  </div>

                  {/* Current Speed Display */}
                  <div className={`text-right px-4 py-2 rounded border ${
                    speedStatus === "danger" ? "border-destructive/30 bg-destructive/5" :
                    speedStatus === "warning" ? "border-warning/30 bg-warning/5" :
                    "border-success/30 bg-success/5"
                  }`}>
                    <p className={`text-2xl font-mono font-bold ${
                      speedStatus === "danger" ? "text-destructive" :
                      speedStatus === "warning" ? "text-warning" :
                      "text-success"
                    }`}>{(driver.lastSpeed || 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-5 gap-2 text-xs mb-3">
                  <div className="bg-muted/20 rounded px-3 py-2 text-center">
                    <p className="text-muted-foreground uppercase text-[10px] mb-1">Max</p>
                    <p className="font-mono font-semibold text-foreground">{(driver.maxSpeed || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-muted/20 rounded px-3 py-2 text-center">
                    <p className="text-muted-foreground uppercase text-[10px] mb-1">Avg</p>
                    <p className="font-mono font-semibold text-foreground">{(driver.averageSpeed || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-muted/20 rounded px-3 py-2 text-center">
                    <p className="text-muted-foreground uppercase text-[10px] mb-1">Status</p>
                    <p className="font-mono font-semibold text-foreground text-sm">{driver.status || "ACT"}</p>
                  </div>
                  <div className={`rounded px-3 py-2 text-center ${driver.violationCount ? "bg-destructive/10" : "bg-muted/20"}`}>
                    <p className="text-muted-foreground uppercase text-[10px] mb-1">Violations</p>
                    <p className={`font-mono font-semibold ${driver.violationCount ? "text-destructive" : "text-foreground"}`}>
                      {driver.violationCount || 0}
                    </p>
                  </div>
                  <div className="bg-muted/20 rounded px-3 py-2 text-center">
                    <p className="text-muted-foreground uppercase text-[10px] mb-1">Updated</p>
                    <p className="text-foreground text-xs font-mono">
                      {driver.lastActive ? new Date(driver.lastActive).toLocaleTimeString().split(':').slice(0,2).join(':') : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Location Info */}
                {driver.lastPosition && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 bg-muted/10 rounded">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="font-mono truncate">
                      {driver.lastPosition.lat.toFixed(4)}, {driver.lastPosition.lng.toFixed(4)}
                    </span>
                  </div>
                )}

                {/* Speed History Chart */}
                {driver.speedHistory && driver.speedHistory.length > 0 && (
                  <div className="p-2 bg-muted/10 rounded mb-3">
                    <p className="text-xs text-muted-foreground uppercase mb-2 flex items-center gap-2 font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      Speed History
                    </p>
                    <div className="flex items-end gap-0.5 h-8">
                      {driver.speedHistory.slice(-20).map((record, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 rounded-t text-white text-[8px] flex items-end justify-center ${
                            record.speed > SPEED_LIMIT ? "bg-destructive" :
                            record.speed > SPEED_LIMIT * 0.75 ? "bg-warning" :
                            "bg-success"
                          }`}
                          style={{ 
                            height: `${Math.max(4, (record.speed / 120) * 100)}%`,
                            minHeight: '2px'
                          }}
                          title={`${record.speed.toFixed(1)} km/h`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setSelectedDriver(selectedDriver === driver.plateNumber ? null : driver.plateNumber)}
                  className="w-full text-xs py-2 text-center rounded border border-border hover:bg-card/50 transition-colors text-muted-foreground font-medium"
                >
                  {selectedDriver === driver.plateNumber ? "Hide Details" : "View Speed Records"}
                </button>

                {/* Detailed Speed Records */}
                {selectedDriver === driver.plateNumber && driver.speedHistory && driver.speedHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Recent Speed Records</p>
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {driver.speedHistory.slice(-20).reverse().map((record, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/10 rounded hover:bg-muted/20 transition-colors">
                          <span className="text-muted-foreground font-mono">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-right min-w-[50px]">{record.speed.toFixed(1)}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              record.speed > SPEED_LIMIT ? "bg-destructive" :
                              record.speed > SPEED_LIMIT * 0.75 ? "bg-warning" :
                              "bg-success"
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      {drivers.length > 0 && (
        <div className="bg-muted/30 border-t border-border px-6 py-3 text-xs text-muted-foreground flex justify-between font-semibold">
          <span>Fleet Size: {drivers.length}</span>
          <span>Moving: {drivers.filter(d => d.isMoving).length}</span>
          <span>Violations: {drivers.reduce((sum, d) => sum + (d.violationCount || 0), 0)}</span>
          <span>Last Sync: {refreshTime.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
