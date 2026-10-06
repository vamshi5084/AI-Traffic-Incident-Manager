"use client";

import { useEffect, useRef } from "react";

export default function TrafficMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    let cancelled = false;

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current || mapInstanceRef.current) {
        return;
      }

      const map = L.map(mapRef.current, {
        center: [17.385, 78.4867],
        zoom: 11,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      /*
       * Dark map without API key
       */
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
        }
      ).addTo(map);

      /*
       * Zoom control
       */
      L.control.zoom({
        position: "bottomright",
      }).addTo(map);

      /*
       * Create glowing traffic marker
       */
      const createIcon = (color: string) =>
        L.divIcon({
          className: "",
          html: `
            <div style="
              width:18px;
              height:18px;
              background:${color};
              border:3px solid white;
              border-radius:50%;
              box-shadow:
                0 0 10px ${color},
                0 0 25px ${color},
                0 0 40px ${color};
            "></div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

      /*
       * CCTV locations
       */

      L.marker(
        [17.4483, 78.3915],
        {
          icon: createIcon("#00e5ff"),
        }
      )
        .addTo(map)
        .bindPopup(`
          <b>Hitech City CCTV</b>
          <br/>
          Status: ONLINE
        `);

      L.marker(
        [17.4486, 78.3908],
        {
          icon: createIcon("#00e5ff"),
        }
      )
        .addTo(map)
        .bindPopup(`
          <b>Madhapur CCTV</b>
          <br/>
          Status: ONLINE
        `);

      L.marker(
        [17.4399, 78.4983],
        {
          icon: createIcon("#00e5ff"),
        }
      )
        .addTo(map)
        .bindPopup(`
          <b>Secunderabad CCTV</b>
          <br/>
          Status: ONLINE
        `);

      /*
       * Accident marker
       */

      L.marker(
        [17.4474, 78.3762],
        {
          icon: createIcon("#ff1744"),
        }
      )
        .addTo(map)
        .bindPopup(`
          <b>ACCIDENT DETECTED</b>
          <br/>
          Severity: HIGH
          <br/>
          Hitech City
        `);

      /*
       * Congestion marker
       */

      L.marker(
        [17.4435, 78.3772],
        {
          icon: createIcon("#ffb300"),
        }
      )
        .addTo(map)
        .bindPopup(`
          <b>HEAVY CONGESTION</b>
          <br/>
          Severity: MEDIUM
          <br/>
          Madhapur
        `);
    };

    loadMap();

    return () => {
      cancelled = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="traffic-map"
      style={{
        height: "100%",
        width: "100%",
      }}
    />
  );
}