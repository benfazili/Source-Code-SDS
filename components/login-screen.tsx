"use client";

import { useState } from "react";
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff, User, Phone, Car, UserCog, Truck } from "lucide-react";

// User role types
export type UserRole = "admin" | "driver";

// Driver/User information interface
export interface DriverInfo {
  email: string;
  name: string;
  phone: string;
  plateNumber: string;
  loggedIn: boolean;
  loginTime: string;
  role: UserRole;
}

interface LoginScreenProps {
  onLogin: (driverInfo: DriverInfo) => void;
}

// Admin credentials
const ADMIN_EMAIL = "benfazili919@gmail.com";
const ADMIN_PASSWORD = "1234";

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loginMode, setLoginMode] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (loginMode === "admin") {
      // Admin login - only email and password required
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        setError("Invalid admin credentials. Access denied.");
        return;
      }

      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const adminInfo: DriverInfo = {
        email,
        name: "System Administrator",
        phone: "N/A",
        plateNumber: "N/A",
        loggedIn: true,
        loginTime: new Date().toISOString(),
        role: "admin",
      };
      localStorage.setItem("sds_user", JSON.stringify(adminInfo));
      onLogin(adminInfo);
    } else {
      // Driver login - all fields required
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!phone.trim()) {
        setError("Please enter your phone number.");
        return;
      }
      if (!plateNumber.trim()) {
        setError("Please enter vehicle plate number.");
        return;
      }

      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const driverInfo: DriverInfo = {
        email: email || `driver_${Date.now()}@sds.local`,
        name: name.trim(),
        phone: phone.trim(),
        plateNumber: plateNumber.trim().toUpperCase(),
        loggedIn: true,
        loginTime: new Date().toISOString(),
        role: "driver",
      };
      localStorage.setItem("sds_user", JSON.stringify(driverInfo));
      
      // Also save to drivers list for admin to see
      const existingDrivers = JSON.parse(localStorage.getItem("sds_drivers") || "[]");
      const driverRecord = { ...driverInfo, lastActive: new Date().toISOString() };
      const updatedDrivers = [driverRecord, ...existingDrivers.filter((d: DriverInfo) => d.plateNumber !== driverInfo.plateNumber)];
      localStorage.setItem("sds_drivers", JSON.stringify(updatedDrivers));
      
      onLogin(driverInfo);
    }
  };

  const resetForm = () => {
    setLoginMode(null);
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setPlateNumber("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">SDS CORPORATION</h1>
              <p className="text-xs text-muted-foreground">Smart Digital Security System v18.0.0</p>
            </div>
          </div>
        </div>

        {/* Role Selection or Login Form */}
        {!loginMode ? (
          <div className="glass-card rounded-lg p-8 border border-border">
            <h2 className="text-lg font-semibold text-foreground text-center mb-8">Select Access Type</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Admin Login Button */}
              <button
                onClick={() => setLoginMode("admin")}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserCog className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Administrator</p>
                  <p className="text-xs text-muted-foreground">Control Center Access</p>
                </div>
              </button>

              {/* Driver Login Button */}
              <button
                onClick={() => setLoginMode("driver")}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-accent/20 bg-accent/5 hover:border-accent/50 hover:bg-accent/10 transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Driver</p>
                  <p className="text-xs text-muted-foreground">GPS Vehicle Tracking</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                All access is monitored and logged. Authorized use only.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-lg p-8 border border-border">
            {/* Back Button */}
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to role selection
            </button>

            {/* Role Indicator */}
            <div className="flex items-center justify-center gap-3 mb-8 pb-6 border-b border-border">
              {loginMode === "admin" ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                  <UserCog className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Administrator Login</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
                  <Truck className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Driver Login</span>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {/* Driver-specific fields */}
              {loginMode === "driver" && (
                <>
                  {/* Driver Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Driver Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                        placeholder="+250 7XX XXX XXX"
                        required
                      />
                    </div>
                  </div>

                  {/* Vehicle Plate Number Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Vehicle Plate</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all uppercase"
                        placeholder="RAD 123 A"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Admin-specific fields */}
              {loginMode === "admin" && (
                <>
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="admin@sds.local"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-input border border-border rounded-md py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-medium py-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                  loginMode === "admin"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    {loginMode === "admin" ? <Shield className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    <span>{loginMode === "admin" ? "ADMIN LOGIN" : "DRIVER LOGIN"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {loginMode === "admin"
                  ? "Administrator access. All activities are logged."
                  : "Your vehicle location and speed will be tracked."}
              </p>
            </div>
          </form>
        )}

        {/* System Status */}
        <div className="mt-6 p-4 glass-card rounded-lg border border-border text-center">
          <p className="text-xs text-muted-foreground">System Status: <span className="text-success font-medium">OPERATIONAL</span></p>
        </div>
      </div>
    </div>
  );
}
