"use client";

import { useState } from "react";
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff, User, Phone, Car, UserCog, Truck, ArrowRight } from "lucide-react";

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
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  };

  const validatePlate = (plate: string) => {
    return plate.trim().length >= 3 && plate.trim().length <= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (loginMode === "admin") {
      // Admin login validation
      const errors: { [key: string]: string } = {};
      
      if (!email.trim()) {
        errors.email = "Email is required";
      } else if (!validateEmail(email)) {
        errors.email = "Invalid email format";
      }
      
      if (!password.trim()) {
        errors.password = "Password is required";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

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
      // Driver login validation
      const errors: { [key: string]: string } = {};
      
      if (!name.trim()) {
        errors.name = "Full name is required";
      } else if (name.trim().length < 3) {
        errors.name = "Name must be at least 3 characters";
      }
      
      if (!phone.trim()) {
        errors.phone = "Phone number is required";
      } else if (!validatePhone(phone)) {
        errors.phone = "Invalid phone number format";
      }
      
      if (!plateNumber.trim()) {
        errors.plate = "Vehicle plate number is required";
      } else if (!validatePlate(plateNumber)) {
        errors.plate = "Invalid plate format (3-10 characters)";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
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
    setValidationErrors({});
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {!loginMode ? (
          <div>
            {/* Logo/Branding */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-black text-foreground">SDS</h1>
                  <p className="text-xs text-muted-foreground font-mono">Smart Digital Security</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Fleet Management System</h2>
              <p className="text-muted-foreground">Real-time GPS tracking and driver monitoring</p>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin Card */}
              <button
                onClick={() => setLoginMode("admin")}
                className="group relative glass-card rounded-xl p-8 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <UserCog className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Administrator</h3>
                  <p className="text-sm text-muted-foreground mb-6">Control Center Access</p>
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                    <span>Login as Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Driver Card */}
              <button
                onClick={() => setLoginMode("driver")}
                className="group relative glass-card rounded-xl p-8 border-2 border-accent/20 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <Truck className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Driver</h3>
                  <p className="text-sm text-muted-foreground mb-6">GPS Vehicle Tracking</p>
                  <div className="flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
                    <span>Login as Driver</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>

            {/* Footer Info */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">Real-time Monitoring</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">100%</p>
                  <p className="text-sm text-muted-foreground">GPS Accurate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">Secure</p>
                  <p className="text-sm text-muted-foreground">Encrypted Data</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-8 border border-border">
            {/* Back Button */}
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to role selection
            </button>

            {/* Role Header */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
              {loginMode === "admin" ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Administrator Login</h3>
                    <p className="text-xs text-muted-foreground">Control Center Access</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Driver Login</h3>
                    <p className="text-xs text-muted-foreground">Vehicle Tracking</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Admin Form */}
              {loginMode === "admin" && (
                <>
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Admin Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-input border rounded-lg py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                          validationErrors.email ? "border-destructive/50" : "border-border"
                        }`}
                        placeholder="admin@sds.local"
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-input border rounded-lg py-2.5 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                          validationErrors.password ? "border-destructive/50" : "border-border"
                        }`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.password}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Driver Form */}
              {loginMode === "driver" && (
                <>
                  {/* Driver Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full bg-input border rounded-lg py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all ${
                          validationErrors.name ? "border-destructive/50" : "border-border"
                        }`}
                        placeholder="Your full name"
                      />
                    </div>
                    {validationErrors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone Number Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full bg-input border rounded-lg py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all ${
                          validationErrors.phone ? "border-destructive/50" : "border-border"
                        }`}
                        placeholder="+250 798 123 456"
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Plate Number Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Vehicle Plate</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        className={`w-full bg-input border rounded-lg py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all uppercase font-mono ${
                          validationErrors.plate ? "border-destructive/50" : "border-border"
                        }`}
                        placeholder="RAD 123 A"
                      />
                    </div>
                    {validationErrors.plate && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.plate}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
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
                    <span>{loginMode === "admin" ? "ADMIN LOGIN" : "START TRACKING"}</span>
                  </>
                )}
              </button>

              {/* Info Footer */}
              <div className="pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  {loginMode === "admin"
                    ? "Administrator access. All activities are monitored and logged."
                    : "Your vehicle location and speed will be tracked for compliance and safety."}
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
