"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Processes from "@/components/Processes";
import { CPUmonitor } from "./CPUmonitor";
import { RAMmonitor } from "./RAMmonitor";
import { Networkmonitor } from "./Networkmonitor";
import { Diskmonitor } from "./DiskMonitor";
import ConfigPage from "./config";

export default function Home() {
  const [monitoring, setMonitoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState("cpu");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar separado */}
      <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      {/* Contenido Principal */}
      <main className="w-full items-center justify-center">
        {/* Sección dinámica según la pestaña seleccionada */}
        {selectedTab === "cpu" && <CPUmonitor/>}
        {selectedTab === "ram" && <RAMmonitor/>}
        {selectedTab === "network" && <Networkmonitor/>}
        {selectedTab === "process" && <Processes/>}
        {selectedTab === "disk" && <Diskmonitor/>}
        {selectedTab === "config" && <ConfigPage/>}
      </main>
    </div>
  );
}
