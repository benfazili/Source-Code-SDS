"use client";

import { useState, useEffect } from "react";
import { Settings, Building2, Database, Download, Upload, Trash2, CheckCircle } from "lucide-react";

interface AdminSettingsProps {
  onLogoUpload?: (logoUrl: string) => void;
}

export function AdminSettings({ onLogoUpload }: AdminSettingsProps) {
  const [companyName, setCompanyName] = useState("SS Corporation");
  const [companyPhone, setCompanyPhone] = useState("+250 798 123 456");
  const [companyEmail, setCompanyEmail] = useState("admin@sscorp.rw");
  const [companyAddress, setCompanyAddress] = useState("Kigali, Rwanda");
  const [logo, setLogo] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    speedViolationAlert: true,
    disconnectionAlert: true,
    dailyReport: true,
    soundEnabled: true,
  });

  useEffect(() => {
    // Load settings from localStorage
    const storedSettings = localStorage.getItem("sds_company_settings");
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setCompanyName(parsed.companyName || "SS Corporation");
        setCompanyPhone(parsed.companyPhone || "+250 798 123 456");
        setCompanyEmail(parsed.companyEmail || "admin@sscorp.rw");
        setCompanyAddress(parsed.companyAddress || "Kigali, Rwanda");
        setLogo(parsed.logo || null);
      } catch (error) {
        console.error("[v0] Failed to load settings:", error);
      }
    }

    const storedNotifications = localStorage.getItem("sds_notification_settings");
    if (storedNotifications) {
      try {
        setNotificationSettings(JSON.parse(storedNotifications));
      } catch (error) {
        console.error("[v0] Failed to load notification settings:", error);
      }
    }
  }, []);

  const handleSave = () => {
    const settings = {
      companyName,
      companyPhone,
      companyEmail,
      companyAddress,
      logo,
    };
    localStorage.setItem("sds_company_settings", JSON.stringify(settings));
    localStorage.setItem("sds_notification_settings", JSON.stringify(notificationSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogo(result);
        onLogoUpload?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDataExport = () => {
    const drivers = JSON.parse(localStorage.getItem("sds_drivers") || "[]");
    const notifications = JSON.parse(localStorage.getItem("sds_notifications") || "[]");
    const settings = JSON.parse(localStorage.getItem("sds_company_settings") || "{}");

    const data = {
      exportDate: new Date().toISOString(),
      drivers,
      notifications,
      settings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sds_export_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        "Are you sure? This will delete all drivers, notifications, and history. This action cannot be undone."
      )
    ) {
      localStorage.removeItem("sds_drivers");
      localStorage.removeItem("sds_notifications");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" />
          System Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your company information and system preferences
        </p>
      </div>

      {/* Company Logo & Branding */}
      <div className="glass-card rounded-xl p-6 border border-border space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Company Branding</h3>
        </div>

        {/* Logo Upload */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">Company Logo</label>
          <div className="flex items-center gap-4">
            {logo ? (
              <div className="w-24 h-24 rounded-lg border-2 border-primary/30 overflow-hidden bg-background/50 flex items-center justify-center">
                <img src={logo} alt="Company logo" className="w-full h-full object-contain p-2" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-background/50 flex items-center justify-center text-muted-foreground">
                <span className="text-xs text-center">No logo</span>
              </div>
            )}
            <div className="flex-1">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg font-medium transition-colors inline-block">
                  Upload Logo
                </div>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="admin@company.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="+250 798 123 456"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">
              Company Address
            </label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Kigali, Rwanda"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          Notification Preferences
        </h3>

        {[
          {
            key: "speedViolationAlert" as const,
            label: "Speed Violation Alerts",
            description: "Notify when drivers exceed speed limits",
          },
          {
            key: "disconnectionAlert" as const,
            label: "Disconnection Alerts",
            description: "Notify when drivers go offline",
          },
          {
            key: "dailyReport" as const,
            label: "Daily Reports",
            description: "Send daily summary at 6 PM",
          },
          {
            key: "soundEnabled" as const,
            label: "Sound Notifications",
            description: "Play sound for urgent alerts",
          },
        ].map((setting) => (
          <label
            key={setting.key}
            className="flex items-center gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={notificationSettings[setting.key]}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  [setting.key]: e.target.checked,
                })
              }
              className="w-4 h-4 rounded accent-primary"
            />
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{setting.label}</p>
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Data Management */}
      <div className="glass-card rounded-xl p-6 border border-border space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-success" />
          Data Management
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDataExport}
            className="flex items-center gap-2 px-4 py-3 bg-success/10 hover:bg-success/20 text-success rounded-lg font-medium transition-colors border border-success/30"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button
            onClick={handleClearAllData}
            className="flex items-center gap-2 px-4 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-colors border border-destructive/30"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Export your data as JSON for backup. Clear all data will remove all drivers, notifications, and history.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors flex-1 md:flex-none"
        >
          <CheckCircle className="w-4 h-4" />
          Save Settings
        </button>
        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 bg-success/20 text-success rounded-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Settings saved successfully!
          </div>
        )}
      </div>
    </div>
  );
}
