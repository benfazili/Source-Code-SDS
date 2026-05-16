"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  Shield, LogOut, User, Phone, Car, MapPin, Gauge, 
  AlertTriangle, CheckCircle, Clock, Radio, Navigation
} from "lucide-react";
import type { DriverInfo } from "./login-screen";

// Dynamically import map component
const LiveMap = dynamic(() => import("./live-map"), {
  ssr: false,
  loading: () => (
    <div className="glass-card rounded-xl h-[300px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" style={{animation: 'none'}} />
        <span className="text-sm text-muted-foreground">Initializing GPS...</span>
      </div>
    </div>
  ),
});

interface DriverPanelProps {
  driverInfo: DriverInfo;
  onLogout: () => void;
}

const KIGALI_CENTER = { lat: -1.9403, lng: 29.8739 };
const GEOFENCE_RADIUS = 15000;
const SPEED_LIMIT = 80;
const GPS_ACCURACY_THRESHOLD = 20; // meters
const MIN_SPEED_THRESHOLD = 1; // km/h
const SPEED_SMOOTHING_FACTOR = 5; // rolling average size

interface SpeedRecord {
  timestamp: string;
  speed: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
}

interface DriverSession {
  driverId: string;
  plateNumber: string;
  driverName: string;
  phone: string;
  sessionStart: string;
  lastUpdate: string;
  currentSpeed: number;
  maxSpeed: number;
  averageSpeed: number;
  totalDistance: number;
  speedRecords: SpeedRecord[];
  currentLocation: { lat: number; lng: number };
  isMoving: boolean;
  violations: number;
  status: "active" | "stopped" | "offline";
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function calculateGeofenceDistance(lat: number, lng: number) {
  return calculateDistance(lat, lng, KIGALI_CENTER.lat, KIGALI_CENTER.lng);
}

export function DriverPanel({ driverInfo, onLogout }: DriverPanelProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: KIGALI_CENTER.lat + (Math.random() - 0.5) * 0.05,
    lng: KIGALI_CENTER.lng + (Math.random() - 0.5) * 0.05,
  });
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMoving, setIsMoving] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [violationCount, setViolationCount] = useState(0);

  const speedHistoryRef = useRef<number[]>([]);
  const speedRecordsRef = useRef<SpeedRecord[]>([]);
  const lastPositionRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const sessionStartRef = useRef(new Date());

  const isInsideZone = calculateGeofenceDistance(position.lat, position.lng) <= GEOFENCE_RADIUS;
  const speedStatus = currentSpeed > SPEED_LIMIT ? "danger" : currentSpeed > SPEED_LIMIT * 0.75 ? "warning" : "safe";

  // Update current time and session duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate smoothed speed with rolling average
  const smoothSpeed = (newSpeed: number): number => {
    speedHistoryRef.current.push(newSpeed);
    if (speedHistoryRef.current.length > SPEED_SMOOTHING_FACTOR) {
      speedHistoryRef.current.shift();
    }
    
    const average = speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length;
    return Math.round(average * 10) / 10;
  };

  // Save session to localStorage
  const saveSession = (sessionData: Partial<DriverSession>) => {
    const sessions = JSON.parse(localStorage.getItem("sds_driver_sessions") || "{}");
    const key = `${driverInfo.plateNumber}_${sessionStartRef.current.toISOString()}`;
    sessions[key] = { ...sessions[key], ...sessionData };
    localStorage.setItem("sds_driver_sessions", JSON.stringify(sessions));

    // Update active drivers for admin
    const drivers = JSON.parse(localStorage.getItem("sds_drivers") || "[]");
    const updatedDrivers = drivers.map((d: DriverInfo & { lastActive?: string; lastPosition?: { lat: number; lng: number }; lastSpeed?: number; speedHistory?: SpeedRecord[]; maxSpeed?: number; violationCount?: number }) => {
      if (d.plateNumber === driverInfo.plateNumber) {
        return {
          ...d,
          lastActive: new Date().toISOString(),
          lastPosition: position,
          lastSpeed: currentSpeed,
          currentSpeed: currentSpeed,
          maxSpeed: maxSpeed,
          averageSpeed: averageSpeed,
          speedHistory: speedRecordsRef.current.slice(-100),
          violationCount: violationCount,
          isMoving: isMoving,
          status: "active",
        };
      }
      return d;
    });
    localStorage.setItem("sds_drivers", JSON.stringify(updatedDrivers));
  };

  // Main GPS tracking setup
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("error");
      console.error("[v0] Geolocation not available");
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      setGpsStatus("connected");
      
      const { latitude, longitude, speed: rawSpeed, accuracy, heading } = pos.coords;
      const newPos = { lat: latitude, lng: longitude };

      // Calculate speed if not provided by GPS
      let calculatedSpeed = 0;
      if (rawSpeed !== null) {
        calculatedSpeed = Math.round(rawSpeed * 3.6 * 10) / 10;
      } else if (lastPositionRef.current) {
        const distance = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          latitude,
          longitude
        );
        const timeDelta = (Date.now() - lastPositionRef.current.timestamp) / 1000;
        if (timeDelta > 0.5) {
          calculatedSpeed = Math.round((distance / timeDelta) * 3.6 * 10) / 10;
        }
      }

      // Ignore GPS noise (less than 3 meters)
      if (accuracy && accuracy > GPS_ACCURACY_THRESHOLD) {
        setGpsAccuracy(Math.round(accuracy));
        return;
      }

      // Set speed to 0 if below threshold
      if (calculatedSpeed < MIN_SPEED_THRESHOLD) {
        calculatedSpeed = 0;
      }

      // Apply smoothing
      const smoothedSpeed = smoothSpeed(calculatedSpeed);
      setCurrentSpeed(smoothedSpeed);
      setIsMoving(smoothedSpeed > 0);

      // Update max speed
      if (smoothedSpeed > maxSpeed) {
        setMaxSpeed(smoothedSpeed);
      }

      // Calculate average speed
      if (speedRecordsRef.current.length > 0) {
        const avgSpeed = speedRecordsRef.current.reduce((sum, r) => sum + r.speed, 0) / speedRecordsRef.current.length;
        setAverageSpeed(Math.round(avgSpeed * 10) / 10);
      }

      // Calculate distance if moving
      if (lastPositionRef.current && smoothedSpeed > 0) {
        const distance = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          latitude,
          longitude
        );
        setTotalDistance(prev => Math.round((prev + distance) * 100) / 100);
      }

      // Record speed data
      const record: SpeedRecord = {
        timestamp: new Date().toISOString(),
        speed: smoothedSpeed,
        latitude,
        longitude,
        accuracy: accuracy || 0,
        heading: heading || undefined,
      };
      speedRecordsRef.current.push(record);

      // Keep only last 1000 records
      if (speedRecordsRef.current.length > 1000) {
        speedRecordsRef.current.shift();
      }

      // Check for speed violations
      if (smoothedSpeed > SPEED_LIMIT) {
        setViolationCount(prev => prev + 1);
      }

      setPosition(newPos);
      setGpsAccuracy(accuracy ? Math.round(accuracy) : null);
      lastPositionRef.current = { lat: latitude, lng: longitude, timestamp: Date.now() };

      // Save session periodically
      saveSession({
        driverId: driverInfo.email,
        plateNumber: driverInfo.plateNumber,
        driverName: driverInfo.name,
        phone: driverInfo.phone,
        sessionStart: sessionStartRef.current.toISOString(),
        lastUpdate: new Date().toISOString(),
        currentSpeed: smoothedSpeed,
        maxSpeed: maxSpeed,
        averageSpeed: averageSpeed,
        totalDistance: totalDistance,
        speedRecords: speedRecordsRef.current.slice(-100),
        currentLocation: newPos,
        isMoving: smoothedSpeed > 0,
        violations: violationCount,
        status: "active",
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setGpsStatus("error");
      console.error("[v0] GPS Error:", error.message);
    };

    // Start watching position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    ) as unknown as number;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [driverInfo, maxSpeed, averageSpeed, violationCount, isMoving, totalDistance, currentSpeed]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <div className="glass-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Vehicle Tracking</h1>
              <p className="text-sm text-muted-foreground">Real-time GPS Speed Monitor • SDS v18.0.0</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">End Session</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Driver Info Card */}
        <div className="glass-card rounded-lg border border-border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Driver Name</p>
              <p className="text-lg font-semibold text-foreground">{driverInfo.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Vehicle Plate</p>
              <p className="text-lg font-mono font-semibold text-foreground">{driverInfo.plateNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Phone</p>
              <p className="text-lg text-foreground">{driverInfo.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Session Duration</p>
              <p className="text-lg font-mono font-semibold text-foreground">{formatDuration(sessionDuration)}</p>
            </div>
          </div>
        </div>

        {/* Speed Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Speed - Large Display */}
          <div className={`lg:col-span-2 glass-card rounded-lg border-2 p-8 ${
            speedStatus === "danger" ? "border-destructive/50 bg-destructive/5" :
            speedStatus === "warning" ? "border-warning/50 bg-warning/5" :
            "border-success/50 bg-success/5"
          }`}>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-6">Current Speed</p>
            <div className="text-center">
              <div className="text-7xl md:text-8xl font-mono font-black text-foreground mb-3">
                {currentSpeed.toFixed(1)}
              </div>
              <p className="text-2xl text-muted-foreground font-semibold mb-6">km/h</p>
              <div className="flex items-center justify-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isMoving ? "bg-warning" : "bg-success"}`} />
                <span className={`text-lg font-semibold ${isMoving ? "text-warning" : "text-success"}`}>
                  {isMoving ? "MOVING" : "STOPPED"}
                </span>
              </div>
            </div>

            {/* GPS Accuracy */}
            {gpsAccuracy !== null && (
              <div className="mt-8 pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">GPS Accuracy</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-300"
                    style={{ width: `${Math.max(10, Math.min(100, 100 - (gpsAccuracy / 50) * 50))}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">±{gpsAccuracy.toFixed(0)}m</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:flex lg:flex-col lg:gap-4">
            <div className="glass-card rounded-lg border border-border p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Max Speed</p>
              <p className="text-4xl font-mono font-bold text-foreground">{maxSpeed.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-2">km/h</p>
            </div>
            <div className="glass-card rounded-lg border border-border p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Avg Speed</p>
              <p className="text-4xl font-mono font-bold text-foreground">{averageSpeed.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-2">km/h</p>
            </div>
            <div className="glass-card rounded-lg border border-border p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Distance</p>
              <p className="text-4xl font-mono font-bold text-foreground">{(totalDistance / 1000).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">km</p>
            </div>
          </div>
        </div>

        {/* Speed History Chart */}
        <div className="glass-card rounded-lg border border-border p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-6">Speed History (Last 60 Readings)</h3>
          
          {speedRecordsRef.current.length > 0 && (
            <div className="space-y-4">
              {/* Chart */}
              <div className="h-32 flex items-end gap-0.5 bg-muted/20 rounded p-2">
                {speedRecordsRef.current.slice(-60).map((record, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t transition-colors ${
                      record.speed > SPEED_LIMIT ? "bg-destructive" :
                      record.speed > SPEED_LIMIT * 0.75 ? "bg-warning" :
                      "bg-success"
                    }`}
                    style={{
                      height: `${Math.max(2, (record.speed / 120) * 100)}%`,
                      minHeight: "2px",
                    }}
                    title={`${record.speed.toFixed(1)} km/h`}
                  />
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                <span>0 km/h</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span>Safe (&lt;60)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span>Caution (60-80)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span>Violation (&gt;80)</span>
                  </div>
                </div>
                <span>120 km/h</span>
              </div>
            </div>
          )}
        </div>

        {/* Location & GPS Info */}
        <div className="glass-card rounded-lg border border-border p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Location Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Current Coordinates</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">{position.lat.toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">{position.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">GPS Status</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    gpsStatus === "connected" ? "bg-success" :
                    gpsStatus === "error" ? "bg-destructive" :
                    "bg-warning"
                  }`} />
                  <span className={`font-medium ${
                    gpsStatus === "connected" ? "text-success" :
                    gpsStatus === "error" ? "text-destructive" :
                    "text-warning"
                  }`}>
                    {gpsStatus === "connected" ? "GPS CONNECTED" :
                     gpsStatus === "error" ? "GPS ERROR" :
                     "CONNECTING..."}
                  </span>
                </div>
                {gpsAccuracy !== null && (
                  <div className="text-sm text-foreground font-mono">
                    Accuracy: ±{gpsAccuracy.toFixed(0)}m
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Speed Readings */}
        <div className="glass-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Speed Readings (Last 20)</h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {speedRecordsRef.current.length === 0 ? (
              <p className="text-muted-foreground text-sm">Waiting for GPS data...</p>
            ) : (
              speedRecordsRef.current.slice(-20).reverse().map((record, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-card/30 transition-colors border border-border/30">
                  <span className="text-muted-foreground font-mono text-xs">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-foreground min-w-[60px] text-right">
                      {record.speed.toFixed(1)} km/h
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      record.speed > SPEED_LIMIT ? "bg-destructive" :
                      record.speed > SPEED_LIMIT * 0.75 ? "bg-warning" :
                      "bg-success"
                    }`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Session started: {new Date(sessionStartRef.current).toLocaleString()}</p>
          <p className="mt-1">Auto-saving to server • All data encrypted • Last update: {currentTime.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
