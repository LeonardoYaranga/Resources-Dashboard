import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Processes from "@/components/Processes";
import { CPUmonitor } from "./CPUmonitor";
import { RAMmonitor } from "./RAMmonitor";

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
        {selectedTab === "network" && <p className="text-xl">Aquí irá el monitoreo de Red</p>}
        {selectedTab === "process" && <Processes/>}
      </main>
    </div>
  );
}
