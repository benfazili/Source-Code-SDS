"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { DashboardHeader } from "./dashboard-header";
import { SpeedTracker } from "./speed-tracker";
import { ViolationReport, type Violation } from "./violation-report";
import { AnalyticsPanel } from "./analytics-panel";
import { ActiveDrivers } from "./active-drivers";
import type { DriverInfo } from "./login-screen";

// Dynamically import map component to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import("./live-map"), {
  ssr: false,
  loading: () => (
    <div className="glass-card rounded-xl h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    </div>
  ),
});

interface DashboardProps {
  driverInfo: DriverInfo;
  onLogout: () => void;
}

// Kigali center coordinates
const KIGALI_CENTER = { lat: -1.9403, lng: 29.8739 };
const GEOFENCE_RADIUS = 15000; // 15km in meters
const SPEED_LIMIT = 80; // km/h

// Calculate distance from Kigali center - pure function outside component
function calculateDistance(lat: number, lng: number) {
  const R = 6371e3; // Earth's radius in meters
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

export function Dashboard({ driverInfo, onLogout }: DashboardProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = useState(0);
  const [isInsideZone, setIsInsideZone] = useState(true);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use refs to avoid dependency issues in effects and to persist across renders
  const lastViolationTimeRef = useRef<number>(0);
  const positionRef = useRef<{ lat: number; lng: number } | null>(null);
  const driverInfoRef = useRef(driverInfo);
  const mountedRef = useRef(false);

  // Keep driver info ref in sync
  useEffect(() => {
    driverInfoRef.current = driverInfo;
  }, [driverInfo]);

  // Load violations from localStorage
  useEffect(() => {
    const savedViolations = localStorage.getItem("sds_violations");
    if (savedViolations) {
      try {
        setViolations(JSON.parse(savedViolations));
      } catch {
        // Invalid JSON, ignore
      }
    }
    setIsLoading(false);
  }, []);

  // Save violations to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("sds_violations", JSON.stringify(violations));
    }
  }, [violations, isLoading]);

  // Session duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Combined initialization and simulation effect - runs once on mount
  useEffect(() => {
    // Prevent double-running in React Strict Mode
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Initialize with a position near Kigali
    const initialOffset = {
      lat: (Math.random() - 0.5) * 0.1,
      lng: (Math.random() - 0.5) * 0.1,
    };
    
    let currentPos = {
      lat: KIGALI_CENTER.lat + initialOffset.lat,
      lng: KIGALI_CENTER.lng + initialOffset.lng,
    };
    
    positionRef.current = currentPos;
    setPosition(currentPos);

    // Start simulation interval
    const simulationInterval = setInterval(() => {
      // Simulate movement
      const movement = {
        lat: (Math.random() - 0.5) * 0.002,
        lng: (Math.random() - 0.5) * 0.002,
      };

      currentPos = {
        lat: currentPos.lat + movement.lat,
        lng: currentPos.lng + movement.lng,
      };

      positionRef.current = currentPos;
      setPosition({ lat: currentPos.lat, lng: currentPos.lng });

      // Calculate if inside geofence
      const distance = calculateDistance(currentPos.lat, currentPos.lng);
      setIsInsideZone(distance <= GEOFENCE_RADIUS);

      // Simulate speed changes (more realistic pattern)
      const baseSpeed = 40 + Math.random() * 30;
      const spike = Math.random() > 0.85 ? Math.random() * 60 : 0;
      const newSpeed = Math.round(baseSpeed + spike);
      setSpeed(newSpeed);

      // Check for violations
      if (newSpeed > SPEED_LIMIT * 0.75) {
        const now = Date.now();
        if (now - lastViolationTimeRef.current >= 5000) {
          const driver = driverInfoRef.current;
          const violation: Violation = {
            id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            speed: newSpeed,
            status: newSpeed > SPEED_LIMIT ? "danger" : "warning",
            email: driver.email,
            driverName: driver.name,
            phone: driver.phone,
            plateNumber: driver.plateNumber,
            location: positionRef.current || undefined,
          };
          setViolations(prev => [violation, ...prev]);
          lastViolationTimeRef.current = now;
        }
      }
    }, 2000);

    return () => {
      clearInterval(simulationInterval);
    };
  }, []);

  // Try to get real GPS location
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        positionRef.current = newPos;
        setPosition(newPos);

        // Calculate real speed if available
        if (pos.coords.speed !== null) {
          const speedKmh = Math.round(pos.coords.speed * 3.6);
          setSpeed(speedKmh);
          
          if (speedKmh > SPEED_LIMIT * 0.75) {
            const now = Date.now();
            if (now - lastViolationTimeRef.current >= 5000) {
              const driver = driverInfoRef.current;
              const violation: Violation = {
                id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                speed: speedKmh,
                status: speedKmh > SPEED_LIMIT ? "danger" : "warning",
                email: driver.email,
                driverName: driver.name,
                phone: driver.phone,
                plateNumber: driver.plateNumber,
                location: positionRef.current || undefined,
              };
              setViolations(prev => [violation, ...prev]);
              lastViolationTimeRef.current = now;
            }
          }
        }

        // Check geofence
        const distance = calculateDistance(pos.coords.latitude, pos.coords.longitude);
        setIsInsideZone(distance <= GEOFENCE_RADIUS);
      },
      () => {
        // Geolocation error - continue with simulation
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const clearViolations = () => {
    setViolations([]);
    localStorage.removeItem("sds_violations");
  };

  const hasAlerts = speed > SPEED_LIMIT || !isInsideZone;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <DashboardHeader driverInfo={driverInfo} onLogout={onLogout} hasAlerts={hasAlerts} />

      <main className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Alert Banner */}
        {hasAlerts && (
          <div className={`rounded-xl p-4 flex items-center gap-4 animate-fade-in-up ${
            speed > SPEED_LIMIT 
              ? "bg-neon-red/20 border border-neon-red/30 blink-danger" 
              : "bg-neon-yellow/20 border border-neon-yellow/30"
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              speed > SPEED_LIMIT ? "bg-neon-red/30" : "bg-neon-yellow/30"
            }`}>
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <p className={`font-bold text-lg ${
                speed > SPEED_LIMIT ? "text-neon-red" : "text-neon-yellow"
              }`}>
                {speed > SPEED_LIMIT ? "SPEED VIOLATION ALERT!" : "WARNING: OUTSIDE SAFE ZONE"}
              </p>
              <p className="text-sm text-muted-foreground">
                {speed > SPEED_LIMIT 
                  ? `Current speed ${speed} km/h exceeds limit of ${SPEED_LIMIT} km/h`
                  : "Vehicle has left the designated geofence area"
                }
              </p>
            </div>
          </div>
        )}

        {/* Analytics Panel */}
        <AnalyticsPanel
          violations={violations}
          isInsideZone={isInsideZone}
          currentSpeed={speed}
          maxSpeed={SPEED_LIMIT}
          sessionDuration={sessionDuration}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="h-[400px] lg:h-[500px]">
            <LiveMap 
              position={position} 
              isInsideZone={isInsideZone}
              speed={speed}
            />
          </div>

          {/* Speed Tracker */}
          <div>
            <SpeedTracker 
              speed={speed} 
              maxSpeed={SPEED_LIMIT}
            />
          </div>
        </div>

        {/* Active Drivers and Violation Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Drivers Panel */}
          <ActiveDrivers />
          
          {/* Violation Reports */}
          <ViolationReport 
            violations={violations}
            onClearAll={clearViolations}
          />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            SDS CORPORATION V18.0.0 • Smart Digital Security System
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © {new Date().getFullYear()} All rights reserved. Authorized use only.
          </p>
        </footer>
      </main>
    </div>
  );
}
