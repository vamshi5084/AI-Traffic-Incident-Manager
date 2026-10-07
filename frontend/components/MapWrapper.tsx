"use client";

import dynamic from "next/dynamic";

type TrafficArea = {
  name: string;
  vehicles: number;
  incidents: number;
  highSeverity: number;
  traffic: string;
};

const TrafficMap = dynamic(
  () => import("./TrafficMap"),
  {
    ssr: false,
  }
);

export default function MapWrapper({
  areas,
}: {
  areas: TrafficArea[];
}) {
  return (
    <TrafficMap
      areas={areas}
    />
  );
}