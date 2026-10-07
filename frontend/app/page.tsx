"use client";

import { useEffect, useMemo, useState } from "react";
import MapWrapper from "../components/MapWrapper";

// ======================================================
// TYPES
// ======================================================

type CCTVData = {
  camera: string;
  location: string;
  status: string;

  vehicles: number;
  cars: number;
  motorcycles: number;
  buses: number;
  trucks: number;
  bicycles: number;
  person: number;

  traffic_level: string;

  incident_detected: boolean;
  incident_type: string | null;
  severity: string;

  source: string;
  camera_id: string;
  video_exists: boolean;
};

type Area = {
  name: string;
  vehicles: number;
  incidents: number;
  highSeverity: number;
  traffic: string;
};

// ======================================================
// CONFIGURATION
// ======================================================

const BACKEND_URL = "http://127.0.0.1:8000";

const cctvLocations = [
  {
    id: "camera01",
    name: "CAMERA 01",
    location: "Hitech City",
    stream: "camera01",
  },
  {
    id: "camera02",
    name: "CAMERA 02",
    location: "Madhapur",
    stream: "camera02",
  },
  {
    id: "camera03",
    name: "CAMERA 03",
    location: "Gachibowli",
    stream: "camera03",
  },
  {
    id: "camera04",
    name: "CAMERA 04",
    location: "Secunderabad",
    stream: "camera04",
  },
  {
    id: "camera05",
    name: "CAMERA 05",
    location: "Banjara Hills",
    stream: "camera05",
  },
];

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Home() {
  const [allCCTVData, setAllCCTVData] = useState<CCTVData[]>([]);

  const [selectedCCTV, setSelectedCCTV] =
    useState("camera01");

  const [selectedArea, setSelectedArea] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState("--");

  // ====================================================
  // FETCH BACKEND DATA
  // ====================================================

  useEffect(() => {
    let mounted = true;

    async function fetchCCTVData() {
      try {
        const response = await fetch(
          `${BACKEND_URL}/cctv/cameras`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const data = await response.json();

        if (!mounted) return;

        setAllCCTVData(data.cameras || []);
        setError(false);
        setLoading(false);

        setLastUpdated(
          new Date().toLocaleTimeString()
        );
      } catch (err) {
        console.error("CCTV API error:", err);

        if (!mounted) return;

        setError(true);
        setLoading(false);
      }
    }

    fetchCCTVData();

    const interval = setInterval(
      fetchCCTVData,
      2000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ====================================================
  // SELECTED CAMERA
  // ====================================================

  const selectedCCTVData = useMemo(() => {
    return allCCTVData.find(
      (camera) =>
        camera.camera_id === selectedCCTV
    );
  }, [
    allCCTVData,
    selectedCCTV,
  ]);

  // ====================================================
  // MAP DATA
  // ====================================================

  const liveAreas = useMemo<Area[]>(() => {
    return cctvLocations.map(
      (location) => {
        const camera = allCCTVData.find(
          (item) =>
            item.camera_id ===
            location.id
        );

        return {
          name: location.location,

          vehicles:
            camera?.vehicles ?? 0,

          incidents:
            camera?.incident_detected
              ? 1
              : 0,

          highSeverity:
            camera?.severity === "HIGH"
              ? 1
              : 0,

          traffic:
            camera?.traffic_level ??
            "LOW",
        };
      }
    );
  }, [allCCTVData]);

  // ====================================================
  // STATISTICS
  // ====================================================

  const totalVehicles =
    allCCTVData.reduce(
      (sum, camera) =>
        sum + camera.vehicles,
      0
    );

  const totalIncidents =
    allCCTVData.filter(
      (camera) =>
        camera.incident_detected
    ).length;

  const highSeverity =
    allCCTVData.filter(
      (camera) =>
        camera.severity === "HIGH"
    ).length;

  const onlineCameras =
    allCCTVData.filter(
      (camera) =>
        camera.status === "ONLINE"
    ).length;

  const highTraffic =
    allCCTVData.filter(
      (camera) =>
        camera.traffic_level === "HIGH"
    ).length;

  const mediumTraffic =
    allCCTVData.filter(
      (camera) =>
        camera.traffic_level === "MEDIUM"
    ).length;

  const lowTraffic =
    allCCTVData.filter(
      (camera) =>
        camera.traffic_level === "LOW"
    ).length;

  // ====================================================
  // HELPER FUNCTIONS
  // ====================================================

  function getTrafficColor(
    traffic?: string
  ) {
    switch (
      traffic?.toUpperCase()
    ) {
      case "HIGH":
        return "#ff3158";

      case "MEDIUM":
        return "#f59e0b";

      default:
        return "#22c55e";
    }
  }

  function getSeverityColor(
    severity?: string
  ) {
    switch (
      severity?.toUpperCase()
    ) {
      case "HIGH":
        return "#ff3158";

      case "MEDIUM":
        return "#f59e0b";

      default:
        return "#22c55e";
    }
  }

  // ====================================================
  // CCTV CARD
  // ====================================================

  function renderCameraCard(
    location: typeof cctvLocations[number]
  ) {
    const camera =
      allCCTVData.find(
        (item) =>
          item.camera_id ===
          location.id
      );

    const traffic =
      camera?.traffic_level ??
      "LOW";

    const trafficColor =
      getTrafficColor(traffic);

    const incident =
      camera?.incident_detected ??
      false;

    return (
      <div
        key={location.id}
        onClick={() =>
          setSelectedCCTV(location.id)
        }
        className="cursor-pointer overflow-hidden rounded-xl border transition-all duration-200"
        style={{
          background:
            selectedCCTV === location.id
              ? "#12212a"
              : "#0c171e",

          borderColor:
            selectedCCTV === location.id
              ? "#00e5ff"
              : "#263740",

          boxShadow:
            selectedCCTV === location.id
              ? "0 0 20px rgba(0,229,255,0.12)"
              : "none",
        }}
      >
        {/* CAMERA HEADER */}

        <div
          className="flex items-center justify-between px-3 py-3"
          style={{
            borderBottom:
              "1px solid #263740",
          }}
        >
          <div>
            <div
              className="text-xs font-bold"
              style={{
                color: "#e7f7fb",
              }}
            >
              {location.name}
            </div>

            <div
              className="mt-1 text-[10px]"
              style={{
                color: "#78909c",
              }}
            >
              📍 {location.location}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background:
                  camera?.status ===
                  "ONLINE"
                    ? "#22c55e"
                    : "#ef4444",

                boxShadow:
                  camera?.status ===
                  "ONLINE"
                    ? "0 0 8px #22c55e"
                    : "0 0 8px #ef4444",
              }}
            />

            <span
              className="text-[9px] font-bold"
              style={{
                color:
                  camera?.status ===
                  "ONLINE"
                    ? "#22c55e"
                    : "#ef4444",
              }}
            >
              {camera?.status ??
                "OFFLINE"}
            </span>
          </div>
        </div>

        {/* CCTV VIDEO */}

        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: "16 / 9",
            background: "#030608",
          }}
        >
          {camera?.video_exists ? (
            <img
              src={`${BACKEND_URL}/cctv/${location.stream}/stream`}
              alt={`${location.name} CCTV`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center text-xs"
              style={{
                color: "#657984",
              }}
            >
              CCTV FEED
              UNAVAILABLE
            </div>
          )}

          {/* TRAFFIC BADGE */}

          <div
            className="absolute right-2 top-2 rounded-md px-2 py-1 text-[9px] font-bold"
            style={{
              background:
                `${trafficColor}dd`,
              color: "#ffffff",
            }}
          >
            {traffic}
          </div>

          {/* INCIDENT BADGE */}

          {incident && (
            <div
              className="absolute bottom-2 right-2 rounded-md px-2 py-1 text-[9px] font-bold"
              style={{
                background:
                  "rgba(180,20,40,0.92)",
                color: "#ffffff",
              }}
            >
              ⚠ INCIDENT
            </div>
          )}
        </div>

        {/* AI OVERVIEW */}

        <div className="p-3">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: "#8ea4ae",
              }}
            >
              AI Camera Overview
            </span>

            <span
              className="text-[9px] font-bold"
              style={{
                color: "#00e5ff",
              }}
            >
              LIVE AI
            </span>
          </div>

          {/* TOTAL VEHICLES */}

          <div
            className="mb-3 rounded-lg p-3"
            style={{
              background: "#111d24",
              border:
                "1px solid #263740",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px]"
                style={{
                  color: "#78909c",
                }}
              >
                TOTAL VEHICLES
              </span>

              <span
                className="text-xl font-bold"
                style={{
                  color: "#00e5ff",
                }}
              >
                {camera?.vehicles ?? 0}
              </span>
            </div>
          </div>

          {/* VEHICLE TYPES */}

          <div className="grid grid-cols-2 gap-2">
            <VehicleBox
              label="🚗 CARS"
              value={camera?.cars ?? 0}
            />

            <VehicleBox
              label="🏍 BIKES"
              value={
                camera?.motorcycles ?? 0
              }
            />

            <VehicleBox
              label="🚌 BUSES"
              value={camera?.buses ?? 0}
            />

            <VehicleBox
              label="🚛 TRUCKS"
              value={camera?.trucks ?? 0}
            />

            <VehicleBox
              label="🚲 BICYCLES"
              value={
                camera?.bicycles ?? 0
              }
            />

            <VehicleBox
              label="👤 PERSONS"
              value={camera?.person ?? 0}
            />
          </div>

          {/* TRAFFIC STATUS */}

          <div
            className="mt-3 flex items-center justify-between rounded-lg p-3"
            style={{
              background:
                `${trafficColor}12`,
              border:
                `1px solid ${trafficColor}44`,
            }}
          >
            <span
              className="text-[10px]"
              style={{
                color: "#8ba0aa",
              }}
            >
              TRAFFIC STATUS
            </span>

            <span
              className="text-xs font-bold"
              style={{
                color: trafficColor,
              }}
            >
              {traffic}
            </span>
          </div>

          {/* INCIDENT */}

          <div
            className="mt-2 flex items-center justify-between rounded-lg p-3"
            style={{
              background: incident
                ? "#2a1014"
                : "#102018",

              border: incident
                ? "1px solid #65242e"
                : "1px solid #23472e",
            }}
          >
            <span
              className="text-[10px]"
              style={{
                color: "#8ba0aa",
              }}
            >
              INCIDENT
            </span>

            <span
              className="text-[10px] font-bold"
              style={{
                color: incident
                  ? "#ff526c"
                  : "#22c55e",
              }}
            >
              {incident
                ? camera?.incident_type ??
                  "DETECTED"
                : "NO INCIDENT"}
            </span>
          </div>

          {/* SEVERITY */}

          <div className="mt-2 flex items-center justify-between">
            <span
              className="text-[9px]"
              style={{
                color: "#637782",
              }}
            >
              Severity
            </span>

            <span
              className="text-[9px] font-bold"
              style={{
                color:
                  getSeverityColor(
                    camera?.severity
                  ),
              }}
            >
              {camera?.severity ??
                "LOW"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{
          background: "#071016",
          color: "#00e5ff",
        }}
      >
        <div className="text-center">
          <div className="mb-3 text-2xl">
            AI TRAFFIC
          </div>

          <div className="text-sm">
            Connecting to traffic
            monitoring system...
          </div>
        </div>
      </main>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#071016",
        color: "#e8f5f9",
      }}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <header
        className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
        style={{
          background: "#0b141b",
          borderBottom:
            "1px solid #1c2a34",
        }}
      >
        <div>
          <div
            className="text-xl font-bold tracking-wide"
            style={{
              color: "#00e5ff",
            }}
          >
            AI TRAFFIC
            INCIDENT MANAGER
          </div>

          <div
            className="mt-1 text-xs"
            style={{
              color: "#7f919f",
            }}
          >
            Intelligent Urban
            Traffic Monitoring
            System
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <div
              className="text-[10px]"
              style={{
                color: "#728592",
              }}
            >
              SYSTEM STATUS
            </div>

            <div
              className="flex items-center justify-end gap-2 text-xs font-semibold"
              style={{
                color: error
                  ? "#ef4444"
                  : "#22c55e",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: error
                    ? "#ef4444"
                    : "#22c55e",
                }}
              />

              {error
                ? "OFFLINE"
                : "SYSTEM ONLINE"}
            </div>
          </div>

          <div className="text-right">
            <div
              className="text-[10px]"
              style={{
                color: "#728592",
              }}
            >
              LAST UPDATE
            </div>

            <div
              className="text-xs"
              style={{
                color: "#d6e7ee",
              }}
            >
              {lastUpdated}
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================
          TOP STATISTICS
      ================================================== */}

      <section className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
        <StatCard
          title="Vehicles Detected"
          value={totalVehicles}
          subtitle="Across all cameras"
          color="#00e5ff"
        />

        <StatCard
          title="Active Incidents"
          value={totalIncidents}
          subtitle="AI detected"
          color="#ff3158"
        />

        <StatCard
          title="High Severity"
          value={highSeverity}
          subtitle="Requires attention"
          color="#f97316"
        />

        <StatCard
          title="Cameras Online"
          value={onlineCameras}
          subtitle="Live monitoring"
          color="#22c55e"
          suffix="/5"
        />
      </section>

      {/* ==================================================
          MAIN DASHBOARD
      ================================================== */}

      <section className="grid gap-4 px-5 pb-5 xl:grid-cols-[240px_minmax(0,1fr)_300px]">

        {/* =================================================
            LEFT PANEL
        ================================================= */}

        <aside
          className="rounded-xl border p-4"
          style={{
            background: "#0b151c",
            borderColor: "#1d2b35",
          }}
        >
          <div
            className="mb-4 text-xs font-bold uppercase tracking-wider"
            style={{
              color: "#dcebf0",
            }}
          >
            Area Monitoring
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedArea("ALL")
            }
            className="mb-2 w-full rounded-lg px-3 py-2 text-left text-xs"
            style={{
              background:
                selectedArea === "ALL"
                  ? "#12303a"
                  : "#101a21",

              color:
                selectedArea === "ALL"
                  ? "#00e5ff"
                  : "#a5b7c0",

              border:
                selectedArea === "ALL"
                  ? "1px solid #00e5ff"
                  : "1px solid #1c2a34",
            }}
          >
            <div className="flex justify-between">
              <span>
                All Areas
              </span>

              <span>
                {allCCTVData.length}
              </span>
            </div>
          </button>

          {cctvLocations.map(
            (location) => {
              const camera =
                allCCTVData.find(
                  (item) =>
                    item.camera_id ===
                    location.id
                );

              const traffic =
                camera?.traffic_level ??
                "LOW";

              return (
                <button
                  type="button"
                  key={location.id}
                  onClick={() =>
                    setSelectedArea(
                      location.location
                    )
                  }
                  className="mb-2 w-full rounded-lg px-3 py-3 text-left"
                  style={{
                    background:
                      selectedArea ===
                      location.location
                        ? "#12303a"
                        : "#101a21",

                    border:
                      selectedArea ===
                      location.location
                        ? "1px solid #00e5ff"
                        : "1px solid #1c2a34",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          "#d7e8ed",
                      }}
                    >
                      {
                        location.location
                      }
                    </span>

                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background:
                          getTrafficColor(
                            traffic
                          ),
                      }}
                    />
                  </div>

                  <div
                    className="mt-2 flex justify-between text-[10px]"
                    style={{
                      color: "#748893",
                    }}
                  >
                    <span>
                      Vehicles
                    </span>

                    <span
                      style={{
                        color:
                          "#b9cbd3",
                      }}
                    >
                      {camera?.vehicles ??
                        0}
                    </span>
                  </div>

                  <div
                    className="mt-1 flex justify-between text-[10px]"
                    style={{
                      color: "#748893",
                    }}
                  >
                    <span>
                      Traffic
                    </span>

                    <span
                      style={{
                        color:
                          getTrafficColor(
                            traffic
                          ),
                      }}
                    >
                      {traffic}
                    </span>
                  </div>
                </button>
              );
            }
          )}

          {/* INCIDENT OVERVIEW */}

          <div
            className="mt-5 border-t pt-4"
            style={{
              borderColor:
                "#1d2b35",
            }}
          >
            <div
              className="mb-3 text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: "#8da0aa",
              }}
            >
              Incident Overview
            </div>

            <div className="space-y-2">
              {allCCTVData
                .filter(
                  (camera) =>
                    camera.incident_detected
                )
                .map((camera) => (
                  <button
                    type="button"
                    key={
                      camera.camera_id
                    }
                    onClick={() =>
                      setSelectedCCTV(
                        camera.camera_id
                      )
                    }
                    className="w-full rounded-lg p-2 text-left"
                    style={{
                      background:
                        "#1a1111",
                      border:
                        "1px solid #432020",
                    }}
                  >
                    <div
                      className="text-[10px] font-semibold"
                      style={{
                        color:
                          "#fca5a5",
                      }}
                    >
                      ⚠{" "}
                      {camera.incident_type ??
                        "Traffic Incident"}
                    </div>

                    <div
                      className="mt-1 text-[9px]"
                      style={{
                        color:
                          "#8d9ca4",
                      }}
                    >
                      {
                        camera.location
                      }
                    </div>
                  </button>
                ))}

              {totalIncidents ===
                0 && (
                <div
                  className="rounded-lg p-3 text-center text-[10px]"
                  style={{
                    background:
                      "#101a21",
                    color:
                      "#6f818c",
                  }}
                >
                  No active incidents
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* =================================================
            CENTER MAP
        ================================================= */}

        <section
          className="overflow-hidden rounded-xl border"
          style={{
            background: "#0b151c",
            borderColor: "#1d2b35",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom:
                "1px solid #1d2b35",
            }}
          >
            <div>
              <div
                className="text-sm font-bold"
                style={{
                  color:
                    "#e4f2f6",
                }}
              >
                Hyderabad Traffic Map
              </div>

              <div
                className="mt-1 text-[10px]"
                style={{
                  color:
                    "#71848f",
                }}
              >
                Live AI traffic
                monitoring
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapLegend
                color="#ff3158"
                label="HIGH"
              />

              <MapLegend
                color="#f59e0b"
                label="MEDIUM"
              />

              <MapLegend
                color="#22c55e"
                label="LOW"
              />
            </div>
          </div>

          <div
            style={{
              height: "650px",
            }}
          >
            <MapWrapper
              areas={liveAreas}
            />
          </div>
        </section>

        {/* =================================================
            RIGHT PANEL
        ================================================= */}

        <aside className="space-y-4">

          {/* SELECTED CAMERA */}

          <div
            className="overflow-hidden rounded-xl border"
            style={{
              background:
                "#0b151c",
              borderColor:
                "#1d2b35",
            }}
          >
            <div
              className="px-4 py-3"
              style={{
                borderBottom:
                  "1px solid #1d2b35",
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider"
                style={{
                  color:
                    "#dcebf0",
                }}
              >
                Selected Camera
              </div>
            </div>

            <div
              className="relative"
              style={{
                aspectRatio:
                  "16 / 9",
                background:
                  "#05080b",
              }}
            >
              {selectedCCTVData?.video_exists ? (
                <img
                  src={`${BACKEND_URL}/cctv/${selectedCCTV}/stream`}
                  alt="Selected CCTV"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center text-xs"
                  style={{
                    color:
                      "#71848f",
                  }}
                >
                  CAMERA OFFLINE
                </div>
              )}
            </div>

            <div className="p-4">
              <div
                className="text-sm font-semibold"
                style={{
                  color:
                    "#e3f2f7",
                }}
              >
                {selectedCCTVData?.location ??
                  "No camera selected"}
              </div>

              <div
                className="mt-1 text-[10px]"
                style={{
                  color:
                    "#71848f",
                }}
              >
                {selectedCCTVData?.camera ??
                  selectedCCTV}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat
                  label="VEHICLES"
                  value={
                    selectedCCTVData?.vehicles ??
                    0
                  }
                  color="#00e5ff"
                />

                <MiniStat
                  label="PERSONS"
                  value={
                    selectedCCTVData?.person ??
                    0
                  }
                  color="#dcebf0"
                />
              </div>
            </div>
          </div>

          {/* AI DETECTION */}

          <div
            className="rounded-xl border p-4"
            style={{
              background:
                "#0b151c",
              borderColor:
                "#1d2b35",
            }}
          >
            <div
              className="mb-4 text-xs font-bold uppercase tracking-wider"
              style={{
                color:
                  "#dcebf0",
              }}
            >
              AI Detection
            </div>

            <div className="space-y-3">
              <DetectionRow
                label="Cars"
                value={
                  selectedCCTVData?.cars ??
                  0
                }
              />

              <DetectionRow
                label="Motorcycles"
                value={
                  selectedCCTVData?.motorcycles ??
                  0
                }
              />

              <DetectionRow
                label="Buses"
                value={
                  selectedCCTVData?.buses ??
                  0
                }
              />

              <DetectionRow
                label="Trucks"
                value={
                  selectedCCTVData?.trucks ??
                  0
                }
              />

              <DetectionRow
                label="Bicycles"
                value={
                  selectedCCTVData?.bicycles ??
                  0
                }
              />

              <DetectionRow
                label="Persons"
                value={
                  selectedCCTVData?.person ??
                  0
                }
              />
            </div>
          </div>

          {/* INCIDENT STATUS */}

          <div
            className="rounded-xl border p-4"
            style={{
              background:
                selectedCCTVData?.incident_detected
                  ? "#1b1111"
                  : "#0b1711",

              borderColor:
                selectedCCTVData?.incident_detected
                  ? "#572626"
                  : "#1d3b28",
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-wider"
              style={{
                color:
                  "#dcebf0",
              }}
            >
              Incident Status
            </div>

            <div
              className="mt-3 text-lg font-bold"
              style={{
                color:
                  selectedCCTVData?.incident_detected
                    ? "#ef4444"
                    : "#22c55e",
              }}
            >
              {selectedCCTVData?.incident_detected
                ? "⚠ INCIDENT DETECTED"
                : "✓ NO INCIDENT"}
            </div>

            {selectedCCTVData?.incident_detected && (
              <div className="mt-2">
                <div
                  className="text-xs"
                  style={{
                    color:
                      "#fca5a5",
                  }}
                >
                  {
                    selectedCCTVData.incident_type
                  }
                </div>

                <div
                  className="mt-1 text-[10px]"
                  style={{
                    color:
                      "#9b7b7b",
                  }}
                >
                  Severity:{" "}
                  <strong>
                    {
                      selectedCCTVData.severity
                    }
                  </strong>
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* ==================================================
          CCTV NETWORK
      ================================================== */}

      <section className="px-5 pb-5">
        <div
          className="rounded-xl border p-4"
          style={{
            background:
              "#0b151c",
            borderColor:
              "#1d2b35",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div
                className="text-sm font-bold"
                style={{
                  color:
                    "#e2f1f5",
                }}
              >
                Live CCTV Network
              </div>

              <div
                className="mt-1 text-[10px]"
                style={{
                  color:
                    "#71848f",
                }}
              >
                Real-time AI vehicle
                detection and camera
                overview
              </div>
            </div>

            <div
              className="text-[10px]"
              style={{
                color:
                  "#22c55e",
              }}
            >
              ● {onlineCameras} / 5
              CAMERAS ONLINE
            </div>
          </div>

          {/* EVERY CCTV VIDEO */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cctvLocations
              .filter(
                (location) =>
                  selectedArea ===
                    "ALL" ||
                  location.location ===
                    selectedArea
              )
              .map(
                renderCameraCard
              )}
          </div>
        </div>
      </section>

      {/* ==================================================
          IMPROVED TRAFFIC OVERVIEW
      ================================================== */}

      <section className="px-5 pb-5">
        <div
          className="rounded-xl border p-5"
          style={{
            background:
              "#0b151c",
            borderColor:
              "#1d2b35",
          }}
        >
          {/* HEADER */}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div
                className="text-sm font-bold"
                style={{
                  color:
                    "#e2f1f5",
                }}
              >
                Traffic Overview
              </div>

              <div
                className="mt-1 text-[10px]"
                style={{
                  color:
                    "#71848f",
                }}
              >
                Live traffic conditions
                across monitored areas
              </div>
            </div>

            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[9px] font-bold"
              style={{
                background:
                  "#10231a",
                border:
                  "1px solid #23472e",
                color:
                  "#22c55e",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    "#22c55e",
                  boxShadow:
                    "0 0 8px #22c55e",
                }}
              />

              LIVE MONITORING
            </div>
          </div>

          {/* TRAFFIC SUMMARY */}

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <TrafficOverview
              title="HIGH TRAFFIC"
              count={highTraffic}
              total={allCCTVData.length}
              color="#ff3158"
            />

            <TrafficOverview
              title="MEDIUM TRAFFIC"
              count={mediumTraffic}
              total={allCCTVData.length}
              color="#f59e0b"
            />

            <TrafficOverview
              title="LOW TRAFFIC"
              count={lowTraffic}
              total={allCCTVData.length}
              color="#22c55e"
            />
          </div>

          {/* AREA TRAFFIC */}

          <div
            className="rounded-xl border p-4"
            style={{
              background:
                "#0d171e",
              borderColor:
                "#1d2b35",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className="text-xs font-bold uppercase tracking-wider"
                style={{
                  color:
                    "#dcebf0",
                }}
              >
                Area Traffic
              </div>

              <div
                className="text-[9px]"
                style={{
                  color:
                    "#657984",
                }}
              >
                Vehicles detected
              </div>
            </div>

            <div className="space-y-4">
              {cctvLocations.map(
                (location) => {
                  const camera =
                    allCCTVData.find(
                      (item) =>
                        item.camera_id ===
                        location.id
                    );

                  const vehicles =
                    camera?.vehicles ?? 0;

                  const traffic =
                    camera?.traffic_level ??
                    "LOW";

                  const trafficColor =
                    getTrafficColor(
                      traffic
                    );

                  const maximumVehicles =
                    Math.max(
                      ...allCCTVData.map(
                        (item) =>
                          item.vehicles
                      ),
                      1
                    );

                  const percentage =
                    Math.min(
                      (vehicles /
                        maximumVehicles) *
                        100,
                      100
                    );

                  return (
                    <div
                      key={location.id}
                    >
                      {/* AREA NAME */}

                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background:
                                trafficColor,
                              boxShadow:
                                `0 0 7px ${trafficColor}`,
                            }}
                          />

                          <span
                            className="text-xs font-semibold"
                            style={{
                              color:
                                "#d7e8ed",
                            }}
                          >
                            {
                              location.location
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className="text-[9px]"
                            style={{
                              color:
                                trafficColor,
                            }}
                          >
                            {traffic}
                          </span>

                          <span
                            className="text-xs font-bold"
                            style={{
                              color:
                                "#e3f2f7",
                            }}
                          >
                            {vehicles}
                          </span>
                        </div>
                      </div>

                      {/* TRAFFIC BAR */}

                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{
                          background:
                            "#17232a",
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width:
                              `${percentage}%`,
                            background:
                              trafficColor,
                            boxShadow:
                              `0 0 8px ${trafficColor}66`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* BOTTOM SUMMARY */}

          {allCCTVData.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">

              {/* MOST CONGESTED AREA */}

              <div
                className="rounded-xl border p-4"
                style={{
                  background:
                    "#151015",
                  borderColor:
                    "#43202a",
                }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color:
                      "#8f737c",
                  }}
                >
                  Most Congested Area
                </div>

                {(() => {
                  const busiest =
                    [...allCCTVData].sort(
                      (a, b) =>
                        b.vehicles -
                        a.vehicles
                    )[0];

                  return (
                    <>
                      <div
                        className="mt-2 text-lg font-bold"
                        style={{
                          color:
                            "#ff3158",
                        }}
                      >
                        {
                          busiest.location
                        }
                      </div>

                      <div
                        className="mt-1 text-[10px]"
                        style={{
                          color:
                            "#788992",
                        }}
                      >
                        {
                          busiest.vehicles
                        }{" "}
                        vehicles detected
                        {" • "}
                        {
                          busiest.traffic_level
                        }{" "}
                        traffic
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* NETWORK TRAFFIC STATUS */}

              <div
                className="rounded-xl border p-4"
                style={{
                  background:
                    "#0e171c",
                  borderColor:
                    "#1d2b35",
                }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color:
                      "#8f9fa7",
                  }}
                >
                  Network Traffic Status
                </div>

                <div className="mt-3 flex items-center gap-5">
                  <div>
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color:
                          "#00e5ff",
                      }}
                    >
                      {totalVehicles}
                    </div>

                    <div
                      className="text-[9px]"
                      style={{
                        color:
                          "#687b86",
                      }}
                    >
                      TOTAL VEHICLES
                    </div>
                  </div>

                  <div
                    className="h-8 w-px"
                    style={{
                      background:
                        "#263740",
                    }}
                  />

                  <div>
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color:
                          highTraffic > 0
                            ? "#ff3158"
                            : "#22c55e",
                      }}
                    >
                      {highTraffic}
                    </div>

                    <div
                      className="text-[9px]"
                      style={{
                        color:
                          "#687b86",
                      }}
                    >
                      HIGH TRAFFIC AREAS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer
        className="px-5 py-5 text-center text-[10px]"
        style={{
          borderTop:
            "1px solid #1c2a34",
          color:
            "#596d78",
        }}
      >
        AI Traffic Incident Manager
        • YOLO AI Detection •
        FastAPI • Next.js •
        OpenStreetMap
      </footer>

      {/* ==================================================
          GLOBAL STYLES
      ================================================== */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #071016;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        button {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }

        ::-webkit-scrollbar-track {
          background: #081117;
        }

        ::-webkit-scrollbar-thumb {
          background: #263b47;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #35515f;
        }
      `}</style>
    </main>
  );
}

// ======================================================
// SMALL COMPONENTS
// ======================================================

function StatCard({
  title,
  value,
  subtitle,
  color,
  suffix,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: string;
  suffix?: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background:
          "#0d171e",
        borderColor:
          "#1d2b35",
      }}
    >
      <div
        className="text-[10px] uppercase tracking-wider"
        style={{
          color:
            "#728592",
        }}
      >
        {title}
      </div>

      <div
        className="mt-2 text-3xl font-bold"
        style={{
          color,
        }}
      >
        {value}

        {suffix && (
          <span
            className="text-base"
            style={{
              color:
                "#728592",
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      <div
        className="mt-1 text-[10px]"
        style={{
          color:
            "#71838f",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function VehicleBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="rounded-lg p-2"
      style={{
        background:
          "#111d24",
      }}
    >
      <div
        className="text-[9px]"
        style={{
          color:
            "#71858f",
        }}
      >
        {label}
      </div>

      <div
        className="mt-1 text-sm font-bold"
        style={{
          color:
            "#dcebf0",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-2"
      style={{
        background:
          "#111d24",
      }}
    >
      <div
        className="text-[9px]"
        style={{
          color:
            "#70828d",
        }}
      >
        {label}
      </div>

      <div
        className="mt-1 text-lg font-bold"
        style={{
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetectionRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between">
      <span
        className="text-[10px]"
        style={{
          color:
            "#71848f",
        }}
      >
        {label}
      </span>

      <span
        className="text-xs font-bold"
        style={{
          color:
            "#dcebf0",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MapLegend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 text-[9px]">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          background: color,
        }}
      />

      {label}
    </div>
  );
}

function TrafficOverview({
  title,
  count,
  total,
  color,
}: {
  title: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage =
    total > 0
      ? (count / total) * 100
      : 0;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background:
          `${color}0d`,
        border:
          `1px solid ${color}44`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold"
          style={{
            color,
          }}
        >
          {title}
        </span>

        <span
          className="text-2xl font-bold"
          style={{
            color,
          }}
        >
          {count}
        </span>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full"
        style={{
          background:
            "#18242b",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width:
              `${percentage}%`,
            background: color,
          }}
        />
      </div>

      <div
        className="mt-2 text-[9px]"
        style={{
          color:
            "#6f818c",
        }}
      >
        {percentage.toFixed(0)}%
        of monitored cameras
      </div>
    </div>
  );
}