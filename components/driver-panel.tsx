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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Driver Tracking System</h1>
                <p className="text-xs text-muted-foreground font-mono">SDS CORPORATION V18.0.0</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono ${
                gpsStatus === "connected" ? "bg-neon-green/20 text-neon-green" :
                gpsStatus === "error" ? "bg-neon-red/20 text-neon-red" :
                "bg-primary/20 text-primary"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  gpsStatus === "connected" ? "bg-neon-green" :
                  gpsStatus === "error" ? "bg-neon-red" :
                  "bg-primary"
                }`} />
                {gpsStatus === "connected" ? "GPS Active" : gpsStatus === "error" ? "GPS Error" : "Connecting..."}
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">End Session</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Driver Info */}
        <div className="glass-card rounded-xl p-6 border border-neon-cyan/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Driver Name</p>
              <p className="text-lg font-semibold text-foreground">{driverInfo.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Vehicle Plate</p>
              <p className="text-lg font-mono font-semibold text-foreground">{driverInfo.plateNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Phone</p>
              <p className="text-lg font-semibold text-foreground">{driverInfo.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1">Session Time</p>
              <p className="text-lg font-mono font-semibold text-foreground">{formatDuration(sessionDuration)}</p>
            </div>
          </div>
        </div>

        {/* Main Speed Display */}
        <div className={`glass-card rounded-xl p-8 border-2 ${
          speedStatus === "danger" ? "border-neon-red bg-neon-red/5" :
          speedStatus === "warning" ? "border-neon-yellow bg-neon-yellow/5" :
          "border-neon-green bg-neon-green/5"
        }`}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-end gap-2">
              <div className="text-6xl font-bold font-mono text-foreground">{currentSpeed.toFixed(1)}</div>
              <div className="text-2xl text-muted-foreground mb-2">km/h</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Speed Limit: {SPEED_LIMIT} km/h
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              speedStatus === "danger" ? "bg-neon-red/20 text-neon-red" :
              speedStatus === "warning" ? "bg-neon-yellow/20 text-neon-yellow" :
              "bg-neon-green/20 text-neon-green"
            }`}>
              {speedStatus === "danger" ? "OVER LIMIT" : 
               speedStatus === "warning" ? "APPROACHING LIMIT" :
               "SAFE SPEED"}
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase mb-2">Max Speed</p>
            <p className="text-3xl font-bold font-mono text-foreground">{maxSpeed.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">km/h</p>
          </div>

          <div className="glass-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase mb-2">Average Speed</p>
            <p className="text-3xl font-bold font-mono text-foreground">{averageSpeed.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">km/h</p>
          </div>

          <div className="glass-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase mb-2">Total Distance</p>
            <p className="text-3xl font-bold font-mono text-foreground">{(totalDistance / 1000).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">km</p>
          </div>

          <div className={`glass-card rounded-xl p-4 border-2 ${
            isInsideZone ? "border-neon-green" : "border-neon-red"
          }`}>
            <p className="text-xs text-muted-foreground uppercase mb-2">Zone Status</p>
            <p className={`text-3xl font-bold ${isInsideZone ? "text-neon-green" : "text-neon-red"}`}>
              {isInsideZone ? "INSIDE" : "OUTSIDE"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Kigali</p>
          </div>
        </div>

        {/* Location & GPS Info */}
        <div className="glass-card rounded-xl p-4 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-2">Current Location</p>
              <p className="text-sm font-mono text-foreground">{position.lat.toFixed(6)}</p>
              <p className="text-sm font-mono text-foreground">{position.lng.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-2">GPS Accuracy</p>
              <p className={`text-lg font-mono font-semibold ${
                gpsAccuracy && gpsAccuracy < 10 ? "text-neon-green" :
                gpsAccuracy && gpsAccuracy < 20 ? "text-neon-yellow" :
                "text-neon-red"
              }`}>
                {gpsAccuracy ? `±${gpsAccuracy}m` : "Calculating..."}
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="glass-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Live Location Map</h3>
          <LiveMap position={position} isInsideZone={isInsideZone} speed={currentSpeed} />
        </div>

        {/* Alert Section */}
        {(speedStatus !== "safe" || !isInsideZone) && (
          <div className={`glass-card rounded-xl p-4 border-2 ${
            speedStatus === "danger" || !isInsideZone ? "border-neon-red bg-neon-red/5" : "border-neon-yellow bg-neon-yellow/5"
          }`}>
            <div className="flex items-start gap-4">
              <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                speedStatus === "danger" || !isInsideZone ? "text-neon-red" : "text-neon-yellow"
              }`} />
              <div>
                <p className="font-semibold text-foreground">
                  {speedStatus === "danger" ? "SPEED LIMIT EXCEEDED" : 
                   !isInsideZone ? "OUTSIDE AUTHORIZED ZONE" :
                   "APPROACHING SPEED LIMIT"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {speedStatus === "danger" ? `Current speed ${currentSpeed.toFixed(1)} km/h exceeds the ${SPEED_LIMIT} km/h limit.` :
                   !isInsideZone ? "Your vehicle has moved outside the authorized Kigali zone." :
                   `Your current speed is approaching the speed limit of ${SPEED_LIMIT} km/h.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="glass-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            All driving data is continuously monitored and recorded by SDS Corporation for compliance and safety. Data sync: {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </main>
    </div>
  );
}
