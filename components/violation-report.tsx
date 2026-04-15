"use client";

import { AlertOctagon, Clock, Gauge, User, ChevronRight, Trash2, Phone, Car, MapPin } from "lucide-react";

export interface Violation {
  id: string;
  timestamp: string;
  speed: number;
  status: "warning" | "danger";
  email: string;
  driverName: string;
  phone: string;
  plateNumber: string;
  location?: { lat: number; lng: number };
}

interface ViolationReportProps {
  violations: Violation[];
  onClearAll?: () => void;
}

export function ViolationReport({ violations, onClearAll }: ViolationReportProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Violation Reports</h3>
            <p className="text-xs text-muted-foreground">
              {violations.length} violation{violations.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
        {violations.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 transition-colors group"
            title="Clear all violations"
          >
            <Trash2 className="w-4 h-4 text-destructive group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Violations List - Large scrollable area for extensive records */}
      <div className="flex-1 overflow-y-auto max-h-[600px]">
        {violations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <AlertOctagon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No violations recorded</p>
            <p className="text-xs text-muted-foreground mt-1">Drive safely!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {violations.map((violation, index) => (
              <div
                key={violation.id}
                className={`p-4 hover:bg-secondary/50 transition-colors ${
                  index === 0 ? "animate-slide-in-left" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      violation.status === "danger" 
                        ? "bg-neon-red/20" 
                        : "bg-neon-yellow/20"
                    }`}>
                      <Gauge className={`w-4 h-4 ${
                        violation.status === "danger" 
                          ? "text-neon-red" 
                          : "text-neon-yellow"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold font-mono ${
                          violation.status === "danger" 
                            ? "text-neon-red" 
                            : "text-neon-yellow"
                        }`}>
                          {violation.speed} km/h
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                          violation.status === "danger"
                            ? "bg-neon-red/20 text-neon-red"
                            : "bg-neon-yellow/20 text-neon-yellow"
                        }`}>
                          {violation.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(violation.timestamp)}</span>
                        </div>
                        <span className="text-border">|</span>
                        <span>{formatDate(violation.timestamp)}</span>
                      </div>
                      {/* Driver Info */}
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3 text-primary" />
                          <span className="font-medium text-foreground">{violation.driverName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 text-neon-cyan" />
                          <span>{violation.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Car className="w-3 h-3 text-neon-yellow" />
                          <span className="font-mono font-medium text-foreground">{violation.plateNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 text-neon-green" />
                          <span>
                            {violation.location 
                              ? `${violation.location.lat.toFixed(4)}, ${violation.location.lng.toFixed(4)}`
                              : "Location unavailable"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {violations.length > 0 && (
        <div className="p-3 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Latest violations shown first</span>
            <span className="font-mono">
              {violations.filter(v => v.status === "danger").length} critical
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
