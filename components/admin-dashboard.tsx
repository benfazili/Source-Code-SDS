"use client";

import { useState } from "react";
import { LayoutGrid, Bell, Settings, Shield } from "lucide-react";
import { Dashboard } from "./dashboard";
import { AdminNotifications } from "./admin-notifications";
import { AdminSettings } from "./admin-settings";
import { AdminSessions } from "./admin-sessions";
import type { DriverInfo } from "./login-screen";

interface AdminDashboardProps {
  driverInfo: DriverInfo;
  onLogout: () => void;
}

type TabType = "dashboard" | "notifications" | "settings" | "sessions";

export function AdminDashboard({ driverInfo, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const tabs = [
    {
      id: "dashboard" as TabType,
      label: "Dashboard",
      icon: LayoutGrid,
      badge: null,
    },
    {
      id: "notifications" as TabType,
      label: "Notifications",
      icon: Bell,
      badge: "alerts",
    },
    {
      id: "sessions" as TabType,
      label: "Sessions",
      icon: Shield,
      badge: null,
    },
    {
      id: "settings" as TabType,
      label: "Settings",
      icon: Settings,
      badge: null,
    },
  ];

  // Get notification count for badge
  const getNotificationCount = () => {
    const notifs = JSON.parse(localStorage.getItem("sds_notifications") || "[]");
    return notifs.length;
  };

  const notificationCount = getNotificationCount();

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Tab Navigation */}
      <div className="glass-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all relative ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge === "alerts" && notificationCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Logout Button - moved to header if using dashboard component */}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {activeTab === "dashboard" && (
          <Dashboard driverInfo={driverInfo} onLogout={onLogout} />
        )}
        {activeTab === "notifications" && (
          <AdminNotifications />
        )}
        {activeTab === "sessions" && (
          <AdminSessions driverInfo={driverInfo} />
        )}
        {activeTab === "settings" && (
          <AdminSettings />
        )}
      </main>
    </div>
  );
}
