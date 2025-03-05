"use client";
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Processes from "@/components/Processes";
import { CPUmonitor } from "./CPUmonitor";
import { RAMmonitor } from "./RAMmonitor";
import { Networkmonitor } from "./Networkmonitor";
import { Diskmonitor } from "./DiskMonitor";
import ConfigPage from "./config";
import Reports from "./reports";
import Cookies from "js-cookie";
import { Cpu, MemoryStick, Network, Disc, Activity } from "lucide-react"; // Importamos íconos

// Definimos tipos para los datos de cada recurso
interface CPUData {
  usage: number;
  temp: number | null;
  frequency: number;
}

interface RAMData {
  usage: number;
  total: number;
  used: number;
  free: number;
  buffers?: number;
  cache?: number;
}

interface NetworkData {
  speed_sent: number;
  speed_recv: number;
  packets_sent?: number;
  packets_recv?: number;
  errors_in?: number;
  errors_out?: number;
}

interface DiskData {
  percent: number;
  total: number;
  used: number;
  free?: number;
  read_speed?: number;
  write_speed?: number;
  read_count?: number;
  write_count?: number;
}

interface ProcessData {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
}

type ResourceData = {
  cpu: CPUData;
  ram: RAMData;
  network: NetworkData;
  disk: DiskData;
  processes: ProcessData[];
};

interface MonitorProps<T> {
  data: T;
}

const Home = () => {
  const [selectedTab, setSelectedTab] = useState<string>("home");
  const [focusedResource, setFocusedResource] = useState<keyof ResourceData | null>(null);
  const wsRefs = useRef<{ [key: string]: WebSocket }>({});
  const [resourcesData, setResourcesData] = useState<ResourceData>({
    cpu: { usage: 0, temp: null, frequency: 0 },
    ram: { usage: 0, total: 0, used: 0, free: 0 },
    network: { speed_sent: 0, speed_recv: 0 },
    disk: { percent: 0, total: 0, used: 0 },
    processes: [],
  });

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    const endpoints = [
      { name: "cpu", url: `ws://localhost:8000/monitoring/ws/cpu?token=${token}` },
      { name: "ram", url: `ws://localhost:8000/monitoring/ws/memoria?token=${token}` },
      { name: "network", url: `ws://localhost:8000/monitoring/ws/network?token=${token}` },
      { name: "disk", url: `ws://localhost:8000/monitoring/ws/disk?token=${token}` },
      { name: "processes", url: `ws://localhost:8000/monitoring/ws/procesos?token=${token}` },
    ];

    endpoints.forEach(({ name, url }) => {
      const ws = new WebSocket(url);
      wsRefs.current[name] = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setResourcesData((prev) => ({
          ...prev,
          [name]: name === "processes" ? data.procesos : data,
        }));
      };

      ws.onclose = () => console.log(`${name} WebSocket cerrado`);
      ws.onerror = (error) => console.error(`${name} WebSocket error:`, error);
    });

    return () => {
      Object.values(wsRefs.current).forEach((ws) => ws.close());
    };
  }, []);

  const renderResourceCard = (resource: keyof ResourceData) => {
    const data = resourcesData[resource];
    const icons: { [key in keyof ResourceData]: React.ReactElement } = {
      cpu: <Cpu className="w-6 h-6 text-blue-500" />,
      ram: <MemoryStick className="w-6 h-6 text-green-500" />,
      network: <Network className="w-6 h-6 text-purple-500" />,
      disk: <Disc className="w-6 h-6 text-yellow-500" />,
      processes: <Activity className="w-6 h-6 text-red-500" />,
    };

    const getProgressBarColor = (value: number) => {
      if (value >= 75) return "bg-red-500";
      if (value >= 50) return "bg-orange-500";
      return "bg-green-500";
    };

    return (
      <div
        className="bg-white p-4 shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-shadow duration-200 text-black mb-4 flex items-center"
        onClick={() => setFocusedResource(resource)}
      >
        <div className="mr-4">{icons[resource]}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{resource.toUpperCase()}</h3>
          {resource === "cpu" && (
            <>
              <p className="text-sm">Uso: {(data as CPUData).usage.toFixed(2)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor((data as CPUData).usage)}`}
                  style={{ width: `${(data as CPUData).usage}%` }}
                ></div>
              </div>
              <p className="text-sm mt-1">
                Temperatura: {(data as CPUData).temp ? `${(data as CPUData).temp}°C` : "N/A"}
              </p>
            </>
          )}
          {resource === "ram" && (
            <>
              <p className="text-sm">Uso: {(data as RAMData).usage.toFixed(2)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor((data as RAMData).usage)}`}
                  style={{ width: `${(data as RAMData).usage}%` }}
                ></div>
              </div>
              <p className="text-sm mt-1">Usado: {((data as RAMData).used / 1e9).toFixed(2)} GB</p>
            </>
          )}
          {resource === "network" && (
            <>
              <p className="text-sm">
                Descarga: {((data as NetworkData).speed_recv / 1024).toFixed(2)} KB/s
              </p>
              <p className="text-sm mt-1">
                Subida: {((data as NetworkData).speed_sent / 1024).toFixed(2)} KB/s
              </p>
            </>
          )}
          {resource === "disk" && (
            <>
              <p className="text-sm">Uso: {(data as DiskData).percent.toFixed(2)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div
                  className={`h-2.5 rounded-full ${getProgressBarColor((data as DiskData).percent)}`}
                  style={{ width: `${(data as DiskData).percent}%` }}
                ></div>
              </div>
              <p className="text-sm mt-1">Usado: {((data as DiskData).used / 1e9).toFixed(2)} GB</p>
            </>
          )}
          {resource === "processes" && (
            <>
              <p className="text-sm">Procesos activos: {(data as ProcessData[]).length}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderFocusedComponent = () => {
    if (!focusedResource) return null;
    const components: { [key in keyof ResourceData]: React.ReactElement } = {
      cpu: <CPUmonitor data={resourcesData.cpu} />,
      ram: <RAMmonitor data={resourcesData.ram} />,
      network: <Networkmonitor data={resourcesData.network} />,
      disk: <Diskmonitor data={resourcesData.disk} />,
      processes: <Processes data={resourcesData.processes} />,
    };
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg w-11/12 h-5/6 overflow-auto relative">
          <button
            className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            onClick={() => setFocusedResource(null)}
          >
            Cerrar
          </button>
          <div className="mt-8">{components[focusedResource]}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      <main className="w-full p-6">
        {selectedTab === "home" && (
          <>
            <h1 className="text-2xl font-bold text-black mb-6">Estado de Recursos</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(["cpu", "ram", "network", "disk", "processes"] as const).map((resource) =>
                renderResourceCard(resource)
              )}
            </div>
          </>
        )}
        {selectedTab === "cpu" && <CPUmonitor data={resourcesData.cpu} />}
        {selectedTab === "ram" && <RAMmonitor data={resourcesData.ram} />}
        {selectedTab === "network" && <Networkmonitor data={resourcesData.network} />}
        {selectedTab === "process" && <Processes data={resourcesData.processes} />}
        {selectedTab === "disk" && <Diskmonitor data={resourcesData.disk} />}
        {selectedTab === "config" && <ConfigPage />}
        {selectedTab === "reports" && <Reports />}
        {focusedResource && renderFocusedComponent()}
      </main>
    </div>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export default Home;