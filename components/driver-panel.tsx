"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  Shield, LogOut, User, Phone, Car, MapPin, Gauge, 
  AlertTriangle, CheckCircle, Clock, Radio
} from "lucide-react";
import type { DriverInfo } from "./login-screen";

// Dynamically import map component to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import("./live-map"), {
  ssr: false,
  loading: () => (
    <div className="glass-card rounded-xl h-[300px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    </div>
  ),
});

interface DriverPanelProps {
  driverInfo: DriverInfo;
  onLogout: () => void;
}

// Kigali center coordinates
const KIGALI_CENTER = { lat: -1.9403, lng: 29.8739 };
const GEOFENCE_RADIUS = 15000; // 15km in meters
const SPEED_LIMIT = 80; // km/h

// Calculate distance from Kigali center
function calculateDistance(lat: number, lng: number) {
  const R = 6371e3;
  const φ1 = (KIGALI_CENTER.lat * Math.PI) / 180;
  const φ2 = (lat * Math.PI) / 180;
  const Δφ = ((lat - KIGALI_CENTER.lat) * Math.PI) / 180;
  const Δλ = ((lng - KIGALI_CENTER.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function DriverPanel({ driverInfo, onLogout }: DriverPanelProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: KIGALI_CENTER.lat + (Math.random() - 0.5) * 0.1,
    lng: KIGALI_CENTER.lng + (Math.random() - 0.5) * 0.1,
  });
  const [speed, setSpeed] = useState(45);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const positionRef = useRef(position);
  const mountedRef = useRef(false);

  const isInsideZone = calculateDistance(position.lat, position.lng) <= GEOFENCE_RADIUS;
  const speedStatus = speed > SPEED_LIMIT ? "danger" : speed > SPEED_LIMIT * 0.75 ? "warning" : "safe";

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate GPS movement
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const interval = setInterval(() => {
      const newPos = {
        lat: positionRef.current.lat + (Math.random() - 0.5) * 0.002,
        lng: positionRef.current.lng + (Math.random() - 0.5) * 0.002,
      };
      positionRef.current = newPos;
      setPosition(newPos);

      // Simulate speed
      const baseSpeed = 40 + Math.random() * 30;
      const spike = Math.random() > 0.9 ? Math.random() * 50 : 0;
      setSpeed(Math.round(baseSpeed + spike));

      // Update driver activity in localStorage
      const drivers = JSON.parse(localStorage.getItem("sds_drivers") || "[]");
      const updatedDrivers = drivers.map((d: DriverInfo & { lastActive?: string; lastPosition?: { lat: number; lng: number }; lastSpeed?: number }) => {
        if (d.plateNumber === driverInfo.plateNumber) {
          return { 
            ...d, 
            lastActive: new Date().toISOString(),
            lastPosition: newPos,
            lastSpeed: Math.round(baseSpeed + spike),
          };
        }
        return d;
      });
      localStorage.setItem("sds_drivers", JSON.stringify(updatedDrivers));
    }, 2000);

    return () => clearInterval(interval);
  }, [driverInfo.plateNumber]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="glass-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Driver Tracking</h1>
                <p className="text-xs text-muted-foreground font-mono">SDS CORPORATION V18.0.0</p>
              </div>
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
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Driver Info Card */}
        <div className="glass-card rounded-xl p-6 neon-cyan">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neon-cyan/20 flex items-center justify-center">
              <User className="w-8 h-8 text-neon-cyan" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold text-foreground">{driverInfo.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Car className="w-4 h-4 text-neon-yellow" />
                  <span className="font-mono font-semibold text-foreground">{driverInfo.plateNumber}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-neon-cyan" />
                  <span>{driverInfo.phone}</span>
                </div>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-2xl font-bold font-mono text-foreground">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Speed */}
          <div className={`glass-card rounded-xl p-4 ${
            speedStatus === "danger" ? "neon-red animate-pulse" : 
            speedStatus === "warning" ? "neon-yellow" : "neon-green"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className={`w-5 h-5 ${
                speedStatus === "danger" ? "text-neon-red" : 
                speedStatus === "warning" ? "text-neon-yellow" : "text-neon-green"
              }`} />
              <span className="text-xs text-muted-foreground uppercase">Speed</span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">{speed}</p>
            <p className="text-xs text-muted-foreground">km/h</p>
          </div>

          {/* Zone Status */}
          <div className={`glass-card rounded-xl p-4 ${isInsideZone ? "neon-green" : "neon-red animate-pulse"}`}>
            <div className="flex items-center gap-2 mb-2">
              {isInsideZone ? (
                <CheckCircle className="w-5 h-5 text-neon-green" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-neon-red" />
              )}
              <span className="text-xs text-muted-foreground uppercase">Zone</span>
            </div>
            <p className="text-lg font-bold text-foreground">{isInsideZone ? "INSIDE" : "OUTSIDE"}</p>
            <p className="text-xs text-muted-foreground">Kigali Zone</p>
          </div>

          {/* Session Duration */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">Session</span>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{formatDuration(sessionDuration)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>

          {/* Tracking Status */}
          <div className="glass-card rounded-xl p-4 neon-blue">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase">Status</span>
            </div>
            <p className="text-lg font-bold text-foreground">ACTIVE</p>
            <p className="text-xs text-muted-foreground">Tracking On</p>
          </div>
        </div>

        {/* Map */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Live Location</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </div>
          </div>
          <LiveMap position={position} isInsideZone={isInsideZone} speed={speed} />
        </div>

        {/* Warning Message */}
        {(speedStatus !== "safe" || !isInsideZone) && (
          <div className={`glass-card rounded-xl p-4 ${speedStatus === "danger" || !isInsideZone ? "neon-red" : "neon-yellow"} animate-fade-in-up`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${speedStatus === "danger" || !isInsideZone ? "text-neon-red" : "text-neon-yellow"}`} />
              <div>
                <p className="font-semibold text-foreground">
                  {speedStatus === "danger" ? "SPEED VIOLATION DETECTED" : 
                   !isInsideZone ? "OUTSIDE AUTHORIZED ZONE" : "APPROACHING SPEED LIMIT"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {speedStatus === "danger" ? `Current speed ${speed} km/h exceeds limit of ${SPEED_LIMIT} km/h` :
                   !isInsideZone ? "Please return to the authorized zone immediately" :
                   "Please reduce your speed for safety"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>Your driving data is being monitored and recorded by SDS Corporation for safety compliance.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
