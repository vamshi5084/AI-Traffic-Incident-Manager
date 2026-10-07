"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

type TrafficArea = {
  name: string;
  vehicles: number;
  incidents: number;
  highSeverity: number;
  traffic: string;
};

type Props = {
  areas: TrafficArea[];
};

// Hyderabad camera locations
const cameras = [
  {
    id: "camera01",
    name: "CAMERA 01",
    location: "Hitech City",
    position: [17.4483, 78.3915] as [number, number],
  },
  {
    id: "camera02",
    name: "CAMERA 02",
    location: "Madhapur",
    position: [17.4483, 78.401] as [number, number],
  },
  {
    id: "camera03",
    name: "CAMERA 03",
    location: "Gachibowli",
    position: [17.4401, 78.3489] as [number, number],
  },
  {
    id: "camera04",
    name: "CAMERA 04",
    location: "Secunderabad",
    position: [17.4399, 78.4983] as [number, number],
  },
  {
    id: "camera05",
    name: "CAMERA 05",
    location: "Banjara Hills",
    position: [17.4156, 78.4347] as [number, number],
  },
];

// Illustrative traffic routes
const routes = [
  {
    name: "Hitech City - Madhapur",
    area: "Hitech City",
    positions: [
      [17.4483, 78.3915],
      [17.4483, 78.396],
      [17.4483, 78.401],
    ] as [number, number][],
  },
  {
    name: "Hitech City - Gachibowli",
    area: "Hitech City",
    positions: [
      [17.4483, 78.3915],
      [17.445, 78.375],
      [17.4401, 78.3489],
    ] as [number, number][],
  },
  {
    name: "Madhapur - Jubilee Hills",
    area: "Madhapur",
    positions: [
      [17.4483, 78.401],
      [17.435, 78.415],
      [17.423, 78.425],
    ] as [number, number][],
  },
  {
    name: "Banjara Hills",
    area: "Banjara Hills",
    positions: [
      [17.4156, 78.4347],
      [17.420, 78.438],
      [17.425, 78.440],
    ] as [number, number][],
  },
  {
    name: "Secunderabad Main Road",
    area: "Secunderabad",
    positions: [
      [17.4399, 78.4983],
      [17.445, 78.490],
      [17.455, 78.480],
    ] as [number, number][],
  },
  {
    name: "Central Hyderabad",
    area: "Central Hyderabad",
    positions: [
      [17.423, 78.440],
      [17.425, 78.455],
      [17.430, 78.470],
    ] as [number, number][],
  },
];

function getTrafficColor(traffic: string) {
  switch (traffic.toUpperCase()) {
    case "HIGH":
      return "#ff3158";

    case "MEDIUM":
      return "#f59e0b";

    case "LOW":
      return "#22c55e";

    default:
      return "#22d3ee";
  }
}

function getTrafficWidth(traffic: string) {
  switch (traffic.toUpperCase()) {
    case "HIGH":
      return 9;

    case "MEDIUM":
      return 7;

    case "LOW":
      return 5;

    default:
      return 5;
  }
}

function createCameraIcon(traffic: string) {
  const color = getTrafficColor(traffic);

  return L.divIcon({
    className: "camera-marker",
    html: `
      <div
        style="
          width: 18px;
          height: 18px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 15px ${color};
        "
      ></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function TrafficMap({ areas }: Props) {
  return (
    <div
      className="traffic-map"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "650px",
      }}
    >
      <MapContainer
        center={[17.43, 78.42]}
        zoom={12}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "650px",
          background: "#02070a",
        }}
      >
        {/* FREE OpenStreetMap tiles - NO API KEY */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Traffic routes */}
        {routes.map((route) => {
          const area = areas.find(
            (item) =>
              item.name.toLowerCase() === route.area.toLowerCase()
          );

          const traffic = area?.traffic || "LOW";

          return (
            <Polyline
              key={route.name}
              positions={route.positions}
              pathOptions={{
                color: getTrafficColor(traffic),
                weight: getTrafficWidth(traffic),
                opacity: traffic === "HIGH" ? 1 : 0.75,
              }}
            >
              <Popup>
                <div>
                  <strong>{route.name}</strong>
                  <br />
                  Traffic: <strong>{traffic}</strong>
                  <br />
                  Vehicles: {area?.vehicles ?? 0}
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* CCTV camera markers */}
        {cameras.map((camera) => {
          const area = areas.find(
            (item) =>
              item.name.toLowerCase() ===
              camera.location.toLowerCase()
          );

          const traffic = area?.traffic || "LOW";

          return (
            <Marker
              key={camera.id}
              position={camera.position}
              icon={createCameraIcon(traffic)}
            >
              <Popup>
                <div>
                  <strong>{camera.name}</strong>
                  <br />
                  Location: {camera.location}
                  <br />
                  Vehicles: {area?.vehicles ?? 0}
                  <br />
                  Traffic: <strong>{traffic}</strong>
                  <br />
                  Incident:{" "}
                  {area?.incidents && area.incidents > 0
                    ? "Detected"
                    : "None"}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}