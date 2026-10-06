"use client";

import dynamic from "next/dynamic";

const TrafficMap = dynamic(
  () => import("./TrafficMap"),
  {
    ssr: false,
  }
);

export default function MapWrapper() {
  return <TrafficMap />;
}