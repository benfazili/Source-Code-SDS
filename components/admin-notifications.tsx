"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, WifiOff, X, Trash2, Clock } from "lucide-react";

export interface Notification {
  id: string;
  type: "speed_violation" | "driver_disconnect";
  driverName: string;
  driverPhone: string;
  plateNumber: string;
  message: string;
  timestamp: string;
  data?: {
    speed?: number;
    speedLimit?: number;
    inactiveFor?: number;
  };
}

interface AdminNotificationsProps {
  notifications?: Notification[];
}

export function AdminNotifications({ notifications: initialNotifications }: AdminNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications || []);
  const [filter, setFilter] = useState<"all" | "speed" | "disconnect">("all");

  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem("sds_notifications");
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (error) {
        console.error("[v0] Failed to parse notifications:", error);
      }
    }

    // Set up listener for new notifications
    const interval = setInterval(() => {
      const stored = localStorage.getItem("sds_notifications");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotifications(parsed);
        } catch (error) {
          console.error("[v0] Failed to parse notifications:", error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "speed") return n.type === "speed_violation";
    if (filter === "disconnect") return n.type === "driver_disconnect";
    return true;
  });

  const removeNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("sds_notifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem("sds_notifications", JSON.stringify([]));
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit",
        hour12: true 
      });
    } catch {
      return timestamp;
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifications & Alerts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time alerts about speed violations and driver disconnections
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-input rounded-lg p-1 w-fit">
        {[
          { value: "all" as const, label: `All (${notifications.length})` },
          { value: "speed" as const, label: `Speed Violations (${notifications.filter(n => n.type === "speed_violation").length})` },
          { value: "disconnect" as const, label: `Disconnections (${notifications.filter(n => n.type === "driver_disconnect").length})` },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              filter === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="glass-card rounded-xl p-12 border border-border text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">All Clear!</h3>
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "No alerts or violations detected"
                : filter === "speed"
                ? "No speed violations recorded"
                : "All drivers are connected"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-card rounded-xl p-4 border-l-4 transition-all hover:shadow-lg ${
                notification.type === "speed_violation"
                  ? "border-l-destructive bg-destructive/5 border border-destructive/20"
                  : "border-l-warning bg-warning/5 border border-warning/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      notification.type === "speed_violation"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {notification.type === "speed_violation" ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <WifiOff className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {notification.type === "speed_violation"
                          ? "Speed Violation Alert"
                          : "Driver Disconnected"}
                      </h3>
                      <span className="text-xs bg-background/50 px-2 py-1 rounded text-muted-foreground whitespace-nowrap">
                        {notification.type === "speed_violation" ? "VIOLATION" : "OFFLINE"}
                      </span>
                    </div>

                    {/* Driver Info */}
                    <div className="bg-background/30 rounded-lg p-3 mb-3 space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Driver Name</p>
                          <p className="font-mono text-foreground font-semibold">
                            {notification.driverName}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">License Plate</p>
                          <p className="font-mono text-foreground font-semibold text-lg">
                            {notification.plateNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Phone Number</p>
                          <p className="font-mono text-foreground">
                            {notification.driverPhone}
                          </p>
                        </div>
                        {notification.type === "speed_violation" && notification.data?.speed && (
                          <div>
                            <p className="text-muted-foreground text-xs">Speed Detected</p>
                            <p className="font-mono text-destructive font-semibold">
                              {notification.data.speed} km/h
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message & Time */}
                    <p className="text-sm text-foreground/80 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(notification.timestamp)}</span>
                      </div>
                      <span>{formatTime(notification.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="p-2 hover:bg-background/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
