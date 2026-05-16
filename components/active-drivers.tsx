"use client";

import { useState, useEffect } from "react";
import { 
  Truck, AlertTriangle, CheckCircle, Clock, Gauge, MapPin, Phone, TrendingUp
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
    <div className={`glass-card rounded-xl overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-neon-blue/10 to-neon-cyan/10 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-neon-cyan" />
            <div>
              <h3 className="font-semibold text-foreground">Active Drivers ({drivers.length})</h3>
              <p className="text-xs text-muted-foreground">Real-time GPS monitoring</p>
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
              <div key={driver.plateNumber} className="p-4 hover:bg-card/50 transition-colors">
                {/* Main Driver Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{driver.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-mono font-semibold ${
                        isViolating ? "bg-neon-red/20 text-neon-red" :
                        driver.isMoving ? "bg-neon-yellow/20 text-neon-yellow" :
                        "bg-neon-green/20 text-neon-green"
                      }`}>
                        {isViolating ? "VIOLATION" : driver.isMoving ? "MOVING" : "STOPPED"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-mono font-semibold">{driver.plateNumber}</span>
                      <Phone className="w-3 h-3" />
                      <span>{driver.phone}</span>
                    </div>
                  </div>

                  {/* Current Speed Display */}
                  <div className={`text-right px-4 py-2 rounded-lg border-2 ${
                    speedStatus === "danger" ? "border-neon-red/50 bg-neon-red/5" :
                    speedStatus === "warning" ? "border-neon-yellow/50 bg-neon-yellow/5" :
                    "border-neon-green/50 bg-neon-green/5"
                  }`}>
                    <p className={`text-3xl font-mono font-bold ${
                      speedStatus === "danger" ? "text-neon-red" :
                      speedStatus === "warning" ? "text-neon-yellow" :
                      "text-neon-green"
                    }`}>{(driver.lastSpeed || 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
                  <div className="bg-card/50 rounded px-3 py-2">
                    <p className="text-xs text-muted-foreground uppercase">Max</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{(driver.maxSpeed || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-card/50 rounded px-3 py-2">
                    <p className="text-xs text-muted-foreground uppercase">Avg</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{(driver.averageSpeed || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-card/50 rounded px-3 py-2">
                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{driver.status || "ACTIVE"}</p>
                  </div>
                  <div className={`rounded px-3 py-2 ${driver.violationCount ? "bg-neon-red/10" : "bg-card/50"}`}>
                    <p className="text-xs text-muted-foreground uppercase">Violations</p>
                    <p className={`text-sm font-mono font-semibold ${driver.violationCount ? "text-neon-red" : "text-foreground"}`}>
                      {driver.violationCount || 0}
                    </p>
                  </div>
                  <div className="bg-card/50 rounded px-3 py-2">
                    <p className="text-xs text-muted-foreground uppercase">Updated</p>
                    <p className="text-xs font-mono text-foreground">
                      {driver.lastActive ? new Date(driver.lastActive).toLocaleTimeString() : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Location Info */}
                {driver.lastPosition && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 p-2 bg-card/50 rounded">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="font-mono">
                      {driver.lastPosition.lat.toFixed(6)}, {driver.lastPosition.lng.toFixed(6)}
                    </span>
                  </div>
                )}

                {/* Speed History Chart */}
                {driver.speedHistory && driver.speedHistory.length > 0 && (
                  <div className="p-2 bg-card/50 rounded mb-2">
                    <p className="text-xs text-muted-foreground uppercase mb-2 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      Speed History (Last 20 readings)
                    </p>
                    <div className="flex items-end gap-0.5 h-10">
                      {driver.speedHistory.slice(-20).map((record, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 rounded-t text-white text-[8px] flex items-end justify-center ${
                            record.speed > SPEED_LIMIT ? "bg-neon-red" :
                            record.speed > SPEED_LIMIT * 0.75 ? "bg-neon-yellow" :
                            "bg-neon-green"
                          }`}
                          style={{ 
                            height: `${Math.max(5, (record.speed / 120) * 100)}%`,
                            minHeight: '2px'
                          }}
                          title={`${record.speed.toFixed(1)} km/h at ${new Date(record.timestamp).toLocaleTimeString()}`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                      <span>0</span>
                      <span>120 km/h</span>
                    </div>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setSelectedDriver(selectedDriver === driver.plateNumber ? null : driver.plateNumber)}
                  className="w-full text-xs py-2 text-center rounded border border-border hover:bg-card/50 transition-colors text-muted-foreground"
                >
                  {selectedDriver === driver.plateNumber ? "Hide Details" : "View Speed Records"}
                </button>

                {/* Detailed Speed Records */}
                {selectedDriver === driver.plateNumber && driver.speedHistory && driver.speedHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase mb-2">Recent Speed Records (Last 30)</p>
                    <div className="max-h-[250px] overflow-y-auto space-y-1">
                      {driver.speedHistory.slice(-30).reverse().map((record, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1 bg-card/50 rounded hover:bg-card transition-colors">
                          <span className="text-muted-foreground font-mono">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-right min-w-[50px]">{record.speed.toFixed(1)} km/h</span>
                            <div className={`w-1 h-1 rounded-full ${
                              record.speed > SPEED_LIMIT ? "bg-neon-red" :
                              record.speed > SPEED_LIMIT * 0.75 ? "bg-neon-yellow" :
                              "bg-neon-green"
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
        <div className="bg-card/50 border-t border-border px-6 py-3 text-xs text-muted-foreground flex justify-between">
          <span>Total Drivers: {drivers.length}</span>
          <span>Moving: {drivers.filter(d => d.isMoving).length}</span>
          <span>Total Violations: {drivers.reduce((sum, d) => sum + (d.violationCount || 0), 0)}</span>
          <span>Last Sync: {refreshTime.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
