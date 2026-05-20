"use client";

/**
 * Compliance Utilities for Government Fleet Management
 * Handles session validation, audit logging, and compliance reporting
 */

export interface SessionAuditLog {
  id: string;
  timestamp: string;
  eventType: "session_start" | "session_end" | "inactivity_warning" | "force_terminate" | "vehicle_change";
  driverName: string;
  driverPhone: string;
  plateNumber: string;
  reason?: string;
  duration?: number; // in seconds
  lastLocation?: {
    lat: number;
    lng: number;
  };
  compliance: {
    violations: number;
    averageSpeed: number;
    maxSpeed: number;
    totalDistance: number;
  };
}

export interface ActiveSession {
  id: string;
  driverName: string;
  driverPhone: string;
  plateNumber: string;
  email: string;
  startTime: string;
  lastActivityTime: string;
  inactivityDuration: number; // in seconds
  isWarned: boolean;
  status: "active" | "warning" | "terminated";
  currentSpeed: number;
  totalDistance: number;
  violationCount: number;
  averageSpeed: number;
}

/**
 * Create a session start audit log
 */
export function createSessionStartLog(
  driverName: string,
  driverPhone: string,
  plateNumber: string
): SessionAuditLog {
  return {
    id: `session_start_${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: "session_start",
    driverName,
    driverPhone,
    plateNumber,
    compliance: {
      violations: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      totalDistance: 0,
    },
  };
}

/**
 * Create a session end audit log
 */
export function createSessionEndLog(
  driverName: string,
  driverPhone: string,
  plateNumber: string,
  reason: string,
  duration: number,
  compliance: {
    violations: number;
    averageSpeed: number;
    maxSpeed: number;
    totalDistance: number;
  }
): SessionAuditLog {
  return {
    id: `session_end_${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: "session_end",
    driverName,
    driverPhone,
    plateNumber,
    reason,
    duration,
    compliance,
  };
}

/**
 * Create inactivity warning log
 */
export function createInactivityWarningLog(
  driverName: string,
  driverPhone: string,
  plateNumber: string,
  inactiveDuration: number
): SessionAuditLog {
  return {
    id: `warning_${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: "inactivity_warning",
    driverName,
    driverPhone,
    plateNumber,
    reason: `Driver inactive for ${inactiveDuration} seconds`,
    compliance: {
      violations: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      totalDistance: 0,
    },
  };
}

/**
 * Create force terminate log
 */
export function createForceTerminateLog(
  driverName: string,
  driverPhone: string,
  plateNumber: string,
  reason: string,
  duration: number,
  compliance: {
    violations: number;
    averageSpeed: number;
    maxSpeed: number;
    totalDistance: number;
  }
): SessionAuditLog {
  return {
    id: `force_terminate_${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType: "force_terminate",
    driverName,
    driverPhone,
    plateNumber,
    reason,
    duration,
    compliance,
  };
}

/**
 * Save audit log to localStorage
 */
export function saveAuditLog(log: SessionAuditLog): void {
  const logs = JSON.parse(localStorage.getItem("sds_audit_logs") || "[]");
  logs.push(log);
  // Keep only last 10,000 logs
  if (logs.length > 10000) {
    logs.shift();
  }
  localStorage.setItem("sds_audit_logs", JSON.stringify(logs));
}

/**
 * Get all audit logs
 */
export function getAuditLogs(): SessionAuditLog[] {
  return JSON.parse(localStorage.getItem("sds_audit_logs") || "[]");
}

/**
 * Get audit logs for specific driver
 */
export function getDriverAuditLogs(plateNumber: string): SessionAuditLog[] {
  const logs = getAuditLogs();
  return logs.filter((log) => log.plateNumber === plateNumber);
}

/**
 * Get audit logs for date range
 */
export function getAuditLogsByDateRange(
  startDate: string,
  endDate: string
): SessionAuditLog[] {
  const logs = getAuditLogs();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return logs.filter((log) => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start && logTime <= end;
  });
}

/**
 * Get active sessions
 */
export function getActiveSessions(): ActiveSession[] {
  const sessions = JSON.parse(localStorage.getItem("sds_active_sessions") || "[]");
  const now = Date.now();

  return sessions
    .map((session: ActiveSession) => ({
      ...session,
      inactivityDuration: Math.round(
        (now - new Date(session.lastActivityTime).getTime()) / 1000
      ),
    }))
    .filter((session: ActiveSession) => session.status !== "terminated");
}

/**
 * Save active session
 */
export function saveActiveSession(session: Omit<ActiveSession, "id" | "inactivityDuration">): void {
  const sessions = getActiveSessions();
  const existingIndex = sessions.findIndex((s) => s.plateNumber === session.plateNumber);

  const newSession: ActiveSession = {
    ...session,
    id: `session_${Date.now()}`,
    inactivityDuration: 0,
  };

  if (existingIndex >= 0) {
    sessions[existingIndex] = newSession;
  } else {
    sessions.push(newSession);
  }

  localStorage.setItem("sds_active_sessions", JSON.stringify(sessions));
}

/**
 * Update active session activity time
 */
export function updateSessionActivity(plateNumber: string): void {
  const sessions = JSON.parse(localStorage.getItem("sds_active_sessions") || "[]");
  const session = sessions.find((s: ActiveSession) => s.plateNumber === plateNumber);

  if (session) {
    session.lastActivityTime = new Date().toISOString();
    localStorage.setItem("sds_active_sessions", JSON.stringify(sessions));
  }
}

/**
 * Terminate session
 */
export function terminateSession(
  plateNumber: string,
  reason: string = "Auto-terminated due to inactivity"
): void {
  const sessions = JSON.parse(localStorage.getItem("sds_active_sessions") || "[]");
  const session = sessions.find((s: ActiveSession) => s.plateNumber === plateNumber);

  if (session) {
    session.status = "terminated";

    const startTime = new Date(session.startTime).getTime();
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Create audit log
    const auditLog = createSessionEndLog(
      session.driverName,
      session.driverPhone,
      session.plateNumber,
      reason,
      duration,
      {
        violations: session.violationCount,
        averageSpeed: session.averageSpeed,
        maxSpeed: session.currentSpeed,
        totalDistance: session.totalDistance,
      }
    );
    saveAuditLog(auditLog);

    localStorage.setItem("sds_active_sessions", JSON.stringify(sessions));
  }
}

/**
 * Force terminate session (admin action)
 */
export function forceTerminateSession(
  plateNumber: string,
  adminName: string,
  reason: string
): void {
  const sessions = JSON.parse(localStorage.getItem("sds_active_sessions") || "[]");
  const session = sessions.find((s: ActiveSession) => s.plateNumber === plateNumber);

  if (session) {
    session.status = "terminated";

    const startTime = new Date(session.startTime).getTime();
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Create audit log
    const auditLog = createForceTerminateLog(
      session.driverName,
      session.driverPhone,
      session.plateNumber,
      `Force terminated by admin ${adminName}: ${reason}`,
      duration,
      {
        violations: session.violationCount,
        averageSpeed: session.averageSpeed,
        maxSpeed: session.currentSpeed,
        totalDistance: session.totalDistance,
      }
    );
    saveAuditLog(auditLog);

    localStorage.setItem("sds_active_sessions", JSON.stringify(sessions));
  }
}

/**
 * Set session warning status
 */
export function setSessionWarning(plateNumber: string, isWarned: boolean): void {
  const sessions = JSON.parse(localStorage.getItem("sds_active_sessions") || "[]");
  const session = sessions.find((s: ActiveSession) => s.plateNumber === plateNumber);

  if (session) {
    session.isWarned = isWarned;
    localStorage.setItem("sds_active_sessions", JSON.stringify(sessions));
  }
}

/**
 * Generate compliance report
 */
export function generateComplianceReport(startDate: string, endDate: string) {
  const logs = getAuditLogsByDateRange(startDate, endDate);

  const report = {
    generatedAt: new Date().toISOString(),
    period: { startDate, endDate },
    totalSessions: logs.filter((l) => l.eventType === "session_start").length,
    autoTerminations: logs.filter((l) => l.eventType === "session_end" && l.reason?.includes("inactivity")).length,
    forceTerminations: logs.filter((l) => l.eventType === "force_terminate").length,
    inactivityWarnings: logs.filter((l) => l.eventType === "inactivity_warning").length,
    totalViolations: logs.reduce((sum, l) => sum + (l.compliance?.violations || 0), 0),
    averageSpeedAcrossSessions: logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.compliance?.averageSpeed || 0), 0) / logs.length)
      : 0,
    logs,
  };

  return report;
}

/**
 * Export audit logs as JSON
 */
export function exportAuditLogs(): string {
  const logs = getAuditLogs();
  return JSON.stringify(logs, null, 2);
}
