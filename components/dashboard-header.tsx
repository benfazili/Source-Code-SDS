"use client";

import { useState, useEffect } from "react";
import { Shield, LogOut, User, Menu, X, Bell, Settings, Phone, Car, UserCog } from "lucide-react";
import type { DriverInfo } from "./login-screen";

interface DashboardHeaderProps {
  driverInfo: DriverInfo;
  onLogout: () => void;
  hasAlerts?: boolean;
}

export function DashboardHeader({ driverInfo, onLogout, hasAlerts }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <header className="glass border-b border-border sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/20 flex items-center justify-center neon-blue pulse-glow">
              <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-foreground text-glow-blue">
                SDS CORPORATION
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs lg:text-sm text-primary font-mono">V18.0.0</span>
                <span className="hidden sm:inline text-border">|</span>
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  Smart Digital Security System
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Time Display */}
            <div className="text-right">
              <div className="text-xl font-mono text-foreground tracking-wider">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(currentTime)}
              </div>
            </div>

            <div className="h-10 w-px bg-border" />

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">System Online</span>
            </div>

            <div className="h-10 w-px bg-border" />

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {hasAlerts && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-neon-red rounded-full animate-pulse" />
              )}
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="h-10 w-px bg-border" />

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                  {driverInfo.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Shield className="w-3 h-3" />
                  <span className="font-semibold uppercase">Admin</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all duration-300 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in-up">
            <div className="space-y-4">
              {/* Time */}
              <div className="text-center">
                <div className="text-2xl font-mono text-foreground">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* User Info */}
              <div className="flex flex-col items-center gap-3 py-4 border-y border-border">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCog className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-semibold text-foreground">{driverInfo.name}</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-primary">
                    <Shield className="w-3 h-3" />
                    <span className="font-semibold uppercase">Administrator</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{driverInfo.email}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">System Online</span>
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
