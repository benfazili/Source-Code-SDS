"use client";

import { useState, useEffect } from "react";
import { LoginScreen, type DriverInfo } from "@/components/login-screen";
import { Dashboard } from "@/components/dashboard";
import { DriverPanel } from "@/components/driver-panel";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("sds_user");
    if (savedUser) {
      try {
        const user: DriverInfo = JSON.parse(savedUser);
        if (user.loggedIn && user.email) {
          setIsAuthenticated(true);
          setDriverInfo(user);
        }
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem("sds_user");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (info: DriverInfo) => {
    setIsAuthenticated(true);
    setDriverInfo(info);
  };

  const handleLogout = () => {
    localStorage.removeItem("sds_user");
    setIsAuthenticated(false);
    setDriverInfo(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full glass-card neon-blue flex items-center justify-center pulse-glow">
            <svg
              className="w-8 h-8 text-primary animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground text-glow-blue">
              SDS CORPORATION
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Initializing security system...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show login or dashboard/driver panel based on auth state and role
  if (!isAuthenticated || !driverInfo) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Route based on user role
  if (driverInfo.role === "admin") {
    return <Dashboard driverInfo={driverInfo} onLogout={handleLogout} />;
  }

  // Driver gets limited panel - no dashboard access
  return <DriverPanel driverInfo={driverInfo} onLogout={handleLogout} />;
}
