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
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-up">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-card neon-blue mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-glow-blue">
            SDS CORPORATION
          </h1>
          <p className="text-primary font-mono text-sm tracking-wider">V18.0.0</p>
          <p className="text-muted-foreground text-sm mt-2">
            Smart Digital Security System
          </p>
        </div>

        {/* Role Selection or Login Form */}
        {!loginMode ? (
          <div className="glass-card rounded-xl p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-foreground text-center mb-6">Select Access Type</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Admin Login Button */}
              <button
                onClick={() => setLoginMode("admin")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card/50 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <UserCog className="w-7 h-7 text-primary" />
                </div>
                <span className="font-semibold text-foreground">Admin</span>
                <span className="text-xs text-muted-foreground text-center">Control Center Access</span>
              </button>

              {/* Driver Login Button */}
              <button
                onClick={() => setLoginMode("driver")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card/50 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-full bg-neon-cyan/20 flex items-center justify-center group-hover:bg-neon-cyan/30 transition-colors">
                  <Truck className="w-7 h-7 text-neon-cyan" />
                </div>
                <span className="font-semibold text-foreground">Driver</span>
                <span className="text-xs text-muted-foreground text-center">Vehicle Tracking</span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-muted-foreground text-xs">
                Select your role to continue. All access is monitored.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 lg:p-8">
            {/* Back Button */}
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to role selection
            </button>

            {/* Role Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {loginMode === "admin" ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                  <UserCog className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Admin Login</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/20 border border-neon-cyan/30">
                  <Truck className="w-4 h-4 text-neon-cyan" />
                  <span className="text-sm font-medium text-neon-cyan">Driver Login</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Driver-specific fields */}
              {loginMode === "driver" && (
                <>
                  {/* Driver Name Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Driver Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan transition-all duration-300"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan transition-all duration-300"
                        placeholder="+250 7XX XXX XXX"
                        required
                      />
                    </div>
                  </div>

                  {/* Vehicle Plate Number Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Vehicle Plate Number
                    </label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        className="w-full bg-input border border-border rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan transition-all duration-300 uppercase"
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
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                        placeholder="Enter admin email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg py-3 pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                        placeholder="Enter admin password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3 animate-fade-in-up">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  loginMode === "admin"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground neon-blue"
                    : "bg-neon-cyan hover:bg-neon-cyan/90 text-background"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    {loginMode === "admin" ? <Shield className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                    <span>{loginMode === "admin" ? "ACCESS CONTROL CENTER" : "START TRACKING"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-muted-foreground text-xs">
                {loginMode === "admin"
                  ? "Admin access is restricted. All actions are logged."
                  : "Your location and speed will be monitored for safety."}
              </p>
            </div>
          </form>
        )}

        {/* System Status */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          <span>System Online</span>
          <span className="text-border">|</span>
          <span className="font-mono">Secure Connection</span>
        </div>
      </div>
    </div>
  );
}
