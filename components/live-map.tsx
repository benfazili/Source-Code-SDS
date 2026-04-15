"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveMapProps {
  position: { lat: number; lng: number } | null;
  isInsideZone: boolean;
  speed: number;
}

function LiveMap({ position, isInsideZone, speed }: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const pulseRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Kigali center coordinates
  const KIGALI_CENTER = { lat: -1.9403, lng: 29.8739 };
  const GEOFENCE_RADIUS = 15000; // 15km radius

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [KIGALI_CENTER.lat, KIGALI_CENTER.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Add dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Add geofence circle
    const geofenceCircle = L.circle([KIGALI_CENTER.lat, KIGALI_CENTER.lng], {
      color: "rgba(100, 150, 255, 0.5)",
      fillColor: "rgba(100, 150, 255, 0.1)",
      fillOpacity: 0.3,
      radius: GEOFENCE_RADIUS,
      weight: 2,
      dashArray: "10, 10",
    }).addTo(map);

    circleRef.current = geofenceCircle;
    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const currentPos = position || KIGALI_CENTER;

    // Create custom marker icon
    const markerColor = speed > 80 ? "#ff5555" : speed > 60 ? "#ffdc32" : "#32ff96";
    
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div style="position: relative;">
          <div style="
            width: 24px;
            height: 24px;
            background: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 15px ${markerColor}, 0 0 30px ${markerColor}50;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            border: 2px solid ${markerColor}80;
            border-radius: 50%;
            animation: radar-pulse 2s ease-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            border: 2px solid ${markerColor}60;
            border-radius: 50%;
            animation: radar-pulse 2s ease-out infinite 0.5s;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
      markerRef.current.setIcon(customIcon);
    } else {
      markerRef.current = L.marker([currentPos.lat, currentPos.lng], { icon: customIcon }).addTo(mapRef.current);
    }

    // Update geofence circle color based on zone status
    if (circleRef.current) {
      circleRef.current.setStyle({
        color: isInsideZone ? "rgba(50, 255, 150, 0.5)" : "rgba(255, 80, 80, 0.5)",
        fillColor: isInsideZone ? "rgba(50, 255, 150, 0.1)" : "rgba(255, 80, 80, 0.1)",
      });
    }

    // Pan to new position smoothly
    mapRef.current.panTo([currentPos.lat, currentPos.lng], { animate: true, duration: 0.5 });
  }, [position, isMapReady, isInsideZone, speed]);

  const centerOnLocation = () => {
    if (mapRef.current && position) {
      mapRef.current.flyTo([position.lat, position.lng], 14, { duration: 1 });
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col">
      {/* Map Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Live Tracking Map</h3>
            <p className="text-xs text-muted-foreground">Kigali, Rwanda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={centerOnLocation}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            title="Center on location"
          >
            <Crosshair className="w-4 h-4 text-foreground" />
          </button>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isInsideZone 
              ? "bg-neon-green/20 text-neon-green border border-neon-green/30" 
              : "bg-neon-red/20 text-neon-red border border-neon-red/30 blink-danger"
          }`}>
            {isInsideZone ? "Inside Zone" : "Outside Zone"}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative min-h-[300px]">
        <div ref={mapContainerRef} className="absolute inset-0" />
        
        {/* Coordinates Overlay */}
        {position && (
          <div className="absolute bottom-4 left-4 glass rounded-lg px-3 py-2 text-xs font-mono z-[1000]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Navigation className="w-3 h-3 text-primary" />
              <span>LAT: {position.lat.toFixed(6)}</span>
              <span className="text-border">|</span>
              <span>LNG: {position.lng.toFixed(6)}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1000]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading map...</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="p-3 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-neon-green" />
            <span className="text-muted-foreground">Safe Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-neon-red" />
            <span className="text-muted-foreground">Danger Zone</span>
          </div>
        </div>
        <span className="text-muted-foreground font-mono">15km Radius</span>
      </div>
    </div>
  );
}

export default LiveMap;
export { LiveMap };
