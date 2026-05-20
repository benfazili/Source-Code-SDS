"use client";

import { useState, useEffect } from "react";
import { getActiveSessions, forceTerminateSession, getAuditLogs, generateComplianceReport, exportAuditLogs } from "@/lib/compliance-utils";
import { Activity, AlertCircle, Clock, Download, Trash2, Eye, EyeOff, Shield, TrendingUp } from "lucide-react";

interface DriverInfo {
  name: string;
  email: string;
  role: "admin" | "driver";
}

interface AdminSessionsProps {
  driverInfo: DriverInfo;
}

export function AdminSessions({ driverInfo }: AdminSessionsProps) {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showForceTerminate, setShowForceTerminate] = useState<string | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "warning">("all");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const sessions = getActiveSessions();
    setActiveSessions(sessions);
    setAuditLogs(getAuditLogs());
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefresh((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleForceTerminate = (plateNumber: string) => {
    if (!terminateReason.trim()) {
      alert("Please provide a reason for termination");
      return;
    }
    forceTerminateSession(plateNumber, driverInfo.name, terminateReason);
    setShowForceTerminate(null);
    setTerminateReason("");
    setRefresh((prev) => prev + 1);
  };

  const handleDownloadCompliance = () => {
    const today = new Date();
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const report = generateComplianceReport(
      lastMonth.toISOString().split("T")[0],
      today.toISOString().split("T")[0]
    );

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compliance_report_${today.toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAuditLogs = () => {
    const logsStr = exportAuditLogs();
    const logsBlob = new Blob([logsStr], { type: "application/json" });
    const url = URL.createObjectURL(logsBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = activeSessions.filter((session) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return session.status === "active" && session.inactivityDuration < 900;
    if (filterStatus === "warning") return session.status === "warning" || session.inactivityDuration >= 900;
    return true;
  });

  const getSessionStatus = (session: any) => {
    if (session.status === "terminated") return "Terminated";
    if (session.inactivityDuration >= 900) return "Warning - Inactive";
    return "Active";
  };

  const getStatusColor = (session: any) => {
    if (session.status === "terminated") return "bg-destructive/10 border-destructive/20 text-destructive";
    if (session.inactivityDuration >= 900) return "bg-warning/10 border-warning/20 text-warning";
    return "bg-success/10 border-success/20 text-success";
  };

  const totalSessions = activeSessions.length;
  const activeDrivers = activeSessions.filter((s) => s.status === "active" && s.inactivityDuration < 900).length;
  const warningCount = activeSessions.filter((s) => s.inactivityDuration >= 900).length;
  const terminatedCount = activeSessions.filter((s) => s.status === "terminated").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Session Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor active driver sessions and manage vehicle assignments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-4 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">TOTAL SESSIONS</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalSessions}</p>
            </div>
            <Activity className="w-5 h-5 text-primary" />
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">ACTIVE DRIVERS</p>
              <p className="text-2xl font-bold text-success mt-1">{activeDrivers}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">WARNINGS</p>
              <p className="text-2xl font-bold text-warning mt-1">{warningCount}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 border border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">TERMINATED</p>
              <p className="text-2xl font-bold text-destructive mt-1">{terminatedCount}</p>
            </div>
            <Clock className="w-5 h-5 text-destructive" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleDownloadCompliance}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export Compliance Report
        </button>
        <button
          onClick={handleDownloadAuditLogs}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export Audit Logs
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filterStatus === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Sessions ({totalSessions})
        </button>
        <button
          onClick={() => setFilterStatus("active")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filterStatus === "active"
              ? "border-success text-success"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({activeDrivers})
        </button>
        <button
          onClick={() => setFilterStatus("warning")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filterStatus === "warning"
              ? "border-warning text-warning"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Warnings ({warningCount})
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto opacity-20 mb-3" />
            <p>No sessions found</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className="glass-card rounded-lg border border-border p-5 hover:border-border/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-foreground text-lg">{session.driverName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(session)}`}>
                      {getSessionStatus(session)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Plate: <span className="font-mono text-foreground">{session.plateNumber}</span></p>
                </div>
                <button
                  onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  {selectedSession === session.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">PHONE</p>
                  <p className="text-sm font-medium text-foreground">{session.driverPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SESSION START</p>
                  <p className="text-sm font-medium text-foreground">{new Date(session.startTime).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">INACTIVITY</p>
                  <p className={`text-sm font-medium ${session.inactivityDuration >= 900 ? "text-warning" : "text-success"}`}>
                    {Math.round(session.inactivityDuration / 60)}m {session.inactivityDuration % 60}s
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CURRENT SPEED</p>
                  <p className="text-sm font-medium text-foreground">{session.currentSpeed.toFixed(1)} km/h</p>
                </div>
              </div>

              {selectedSession === session.id && (
                <div className="space-y-3 bg-secondary/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">TOTAL DISTANCE</p>
                      <p className="text-sm font-medium text-foreground">{session.totalDistance.toFixed(2)} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AVERAGE SPEED</p>
                      <p className="text-sm font-medium text-foreground">{session.averageSpeed.toFixed(1)} km/h</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">VIOLATIONS</p>
                      <p className="text-sm font-medium text-foreground">{session.violationCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">STATUS</p>
                      <p className="text-sm font-medium text-foreground">{session.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {session.status === "active" && (
                <button
                  onClick={() => setShowForceTerminate(session.plateNumber)}
                  className="flex items-center gap-2 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Force Terminate Session
                </button>
              )}

              {showForceTerminate === session.plateNumber && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-foreground">Reason for termination:</p>
                  <textarea
                    value={terminateReason}
                    onChange={(e) => setTerminateReason(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                    placeholder="Enter reason (e.g., Vehicle reassignment, Driver substitution)"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleForceTerminate(session.plateNumber)}
                      className="flex-1 px-3 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium text-sm transition-colors"
                    >
                      Confirm Termination
                    </button>
                    <button
                      onClick={() => {
                        setShowForceTerminate(null);
                        setTerminateReason("");
                      }}
                      className="flex-1 px-3 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Compliance Info */}
      <div className="glass-card rounded-lg border border-border p-5 bg-primary/5">
        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Government Compliance
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          This system automatically tracks all driver sessions, inactivity periods, and speed violations for government compliance and audit purposes. All sessions are logged with complete audit trails.
        </p>
        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
          <li>Auto-termination after 15 minutes of inactivity</li>
          <li>60-second warning before automatic termination</li>
          <li>Complete audit trail with timestamps and reasons</li>
          <li>Exportable compliance reports for regulatory review</li>
          <li>Manual termination capability for vehicle reassignment</li>
        </ul>
      </div>
    </div>
  );
}
