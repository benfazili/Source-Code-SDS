import { NextRequest, NextResponse } from "next/server";

interface TelemetryData {
  deviceId: string;
  plateNumber: string;
  timestamp: string;
  hallPulses: number; // Pulses per second from Hall sensor
  gpsSpeed: number; // Speed from GPS in km/h
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy: number;
  tireDiameter: number; // in mm
  pulsesPerRotation: number;
  realSpeed: number; // Calculated from Hall sensor
  speedLimit: number;
  isSpeedViolation: boolean;
  governorActivated: boolean;
  governorLevel: number; // 0-100%, 100 = full power, 0 = no power
}

interface StoredTelemetry extends TelemetryData {
  id: string;
}

// Store telemetry in memory (in production, use a database)
const telemetryStore = new Map<string, StoredTelemetry[]>();

export async function POST(request: NextRequest) {
  try {
    const data: TelemetryData = await request.json();

    // Validate required fields
    if (
      !data.deviceId ||
      !data.plateNumber ||
      data.hallPulses === undefined ||
      data.gpsSpeed === undefined
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["deviceId", "plateNumber", "hallPulses", "gpsSpeed"],
        },
        { status: 400 }
      );
    }

    // Create telemetry record
    const telemetryRecord: StoredTelemetry = {
      ...data,
      id: `${data.plateNumber}_${Date.now()}`,
    };

    // Store in memory
    if (!telemetryStore.has(data.plateNumber)) {
      telemetryStore.set(data.plateNumber, []);
    }

    const records = telemetryStore.get(data.plateNumber)!;
    records.push(telemetryRecord);

    // Keep only last 1000 records per vehicle
    if (records.length > 1000) {
      records.shift();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Telemetry received successfully",
        telemetry: telemetryRecord,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Telemetry error:", error);
    return NextResponse.json(
      {
        error: "Failed to process telemetry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const plateNumber = request.nextUrl.searchParams.get("plateNumber");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100");

    if (!plateNumber) {
      return NextResponse.json(
        { error: "plateNumber parameter required" },
        { status: 400 }
      );
    }

    const records = telemetryStore.get(plateNumber) || [];
    const limitedRecords = records.slice(-limit);

    return NextResponse.json(
      {
        success: true,
        plateNumber,
        count: limitedRecords.length,
        telemetry: limitedRecords,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Telemetry GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve telemetry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
