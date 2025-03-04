// import React, { useEffect, useRef, useState } from 'react';
// import { Line } from 'react-chartjs-2';

// export const RAMChart = ({ monitoring }: { monitoring: boolean }) => {
    
//     const [ramData, setRamData] = useState<number[]>([]);
//     const [labels, setLabels] = useState<string[]>([]);
//     const [totalRAM, setTotalRAM] = useState<number>(0);
//     const [usedRAM, setUsedRAM] = useState<number>(0);
//     const [freeRAM, setFreeRAM] = useState<number>(0);
//     const [buffersRAM, setBuffersRAM] = useState<string | number>("No disponible");
//     const [cacheRAM, setCacheRAM] = useState<string | number>("No disponible");
//     const [ramUsage, setRamUsage] = useState<number>(0);
//     const wsRef = useRef<WebSocket | null>(null); 

//     const formatBytes = (bytes: number): string => {
//       if (bytes === 0) return "0 B";
//       const sizes = ["B", "KB", "MB", "GB", "TB"];
//       const i = Math.floor(Math.log(bytes) / Math.log(1024));
//       return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
//     };

//     useEffect(() => {
//         if (monitoring) {
//             wsRef.current = new WebSocket("ws://localhost:8000/monitoring/ws/memoria");
//             wsRef.current.onmessage = (event) => {
//                 const data = JSON.parse(event.data);
                
//                 setRamData((prevData) => [...prevData.slice(-49), data.usage]); 
//                 setLabels((prevLabels) => [
//                     ...prevLabels.slice(-49),
//                     new Date(data.timestamp).toLocaleTimeString(),
//                 ]);

//                 // Actualizamos los valores de memoria en tiempo real
//                 setTotalRAM(data.total);
//                 setUsedRAM(data.used);
//                 setFreeRAM(data.free);
//                 setBuffersRAM(data.buffers);
//                 setCacheRAM(data.cache);
//                 setRamUsage(data.usage);
//             };

//             wsRef.current.onclose = () => {
//                 console.log("Conexión WebSocket cerrada.");
//             };
//         } else {
//             if (wsRef.current) {
//                 wsRef.current.close(); 
//                 wsRef.current = null;  
//             }
//         }

//         return () => {
//             if (wsRef.current) {
//                 wsRef.current.close();
//             }
//         };
//     }, [monitoring]);

//     return (
//         <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">
//             {/* Gráfico de RAM - Ocupa 2/3 del ancho */}
//             <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
//                 <h2 className="text-xl font-semibold text-center mb-4 text-black">
//                     Uso de RAM en Tiempo Real
//                 </h2>
//                 <Line
//                     data={{
//                         labels,
//                         datasets: [
//                             {
//                                 label: "RAM Usage (%)",
//                                 data: ramData,
//                                 borderColor: "rgb(192, 75, 75)",
//                                 backgroundColor: "rgba(192, 75, 75, 0.2)",
//                                 fill: true,
//                             },
//                         ],
//                     }}
//                     options={{
//                         responsive: true,
//                         scales: {
//                             y: { beginAtZero: true, max: 100 },
//                         },
//                     }}
//                 />
//             </div>

//             {/* Información de RAM - Ocupa 1/3 del ancho */}
//             <div className="w-1/4 h-[310px] bg-white p-6 shadow-lg rounded-lg">
//                 <h2 className="text-xl font-semibold text-center mb-4 text-black">
//                 Uso de RAM en Tiempo Real
//                 </h2>
//                 <h2 className="text-l font-semibold text-left mb-4 text-black">
//                     Memoria Total: {formatBytes(totalRAM)}
//                 </h2>
//                 <h2 className="text-l font-semibold text-left mb-4 text-black">
//                     Memoria Usada: {formatBytes(usedRAM)}
//                 </h2>
//                 <h2 className="text-l font-semibold text-left mb-4 text-black">
//                     Memoria Libre: {formatBytes(freeRAM)}
//                 </h2>
//                 <h2 className="text-l font-semibold text-left mb-4 text-black">
//                     Buffers: {buffersRAM !== "No disponible" ? formatBytes(Number(buffersRAM)) : "No disponible"}
//                 </h2>
//                 <h2 className="text-l font-semibold text-left mb-4 text-black">
//                     Caché: {cacheRAM !== "No disponible" ? formatBytes(Number(cacheRAM)) : "No disponible"}
//                 </h2>
//                 <h2 className="text-l font-semibold text-left mb-4 text-black">
//                     Uso de RAM: {ramUsage.toFixed(2)}%
//                 </h2>
//             </div>
//         </div>

//     );
// };


"use client";
import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Chart.register(...registerables);

export const RAMChart = ({ monitoring }: { monitoring: boolean }) => {
  const [ramData, setRamData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [totalRAM, setTotalRAM] = useState<number>(0);
  const [usedRAM, setUsedRAM] = useState<number>(0);
  const [freeRAM, setFreeRAM] = useState<number>(0);
  const [buffersRAM, setBuffersRAM] = useState<string | number>("No disponible");
  const [cacheRAM, setCacheRAM] = useState<string | number>("No disponible");
  const [ramUsage, setRamUsage] = useState<number>(0);
  const [config, setConfig] = useState({
    thresholds: { ram_usage: 75 }, // Umbral por defecto
  });
  const [hasWarned, setHasWarned] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Obtener configuración del usuario al montar el componente
  useEffect(() => {
    const fetchConfig = async () => {
      const token = Cookies.get("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        } else {
          console.error("Error al cargar configuración:", res.status);
        }
      } catch (error) {
        console.error("Error en fetchConfig:", error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (monitoring) {
      const token = Cookies.get("token");
      if (!token) {
        console.log("No hay token para WebSocket");
        return;
      }

      wsRef.current = new WebSocket(`ws://localhost:8000/monitoring/ws/memoria?token=${token}`);

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setRamData((prevData) => [...prevData.slice(-49), data.usage]);
        setLabels((prevLabels) => [
          ...prevLabels.slice(-49),
          new Date(data.timestamp).toLocaleTimeString(),
        ]);
        setTotalRAM(data.total);
        setUsedRAM(data.used);
        setFreeRAM(data.free);
        setBuffersRAM(data.buffers !== null ? data.buffers : "No disponible");
        setCacheRAM(data.cache !== null ? data.cache : "No disponible");
        setRamUsage(data.usage);

        // Verificar el umbral
        const threshold = config.thresholds.ram_usage || 75;
        const nearThreshold = threshold * 0.9;

        if (data.usage >= threshold) {
          if (!hasAlerted) {
            toast.error(
              `¡Alerta! El uso de RAM (${data.usage.toFixed(1)}%) ha superado el umbral de ${threshold}%`
            );
            setHasAlerted(true);
            setHasWarned(false);
          }
        } else if (data.usage >= nearThreshold) {
          if (!hasWarned) {
            toast.warn(
              `Advertencia: El uso de RAM (${data.usage.toFixed(1)}%) está cerca del umbral de ${threshold}%`
            );
            setHasWarned(true);
            setHasAlerted(false);
          }
        } else {
          setHasWarned(false);
          setHasAlerted(false);
        }
      };

      wsRef.current.onclose = () => {
        console.log("Conexión WebSocket cerrada.");
      };
      wsRef.current.onerror = (error) => {
        console.error("Error en WebSocket:", error);
      };
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [monitoring, config]);

  // Cambiar color según el umbral
  const getBorderColor = () => {
    const threshold = config.thresholds.ram_usage || 75;
    const nearThreshold = threshold * 0.9;
    if (ramUsage >= threshold) return "rgba(255, 99, 132, 1)"; // Rojo
    if (ramUsage >= nearThreshold) return "rgba(255, 165, 0, 1)"; // Naranja
    return "rgb(192, 75, 75)"; // Color original como base
  };

  return (
    <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">
      {/* Gráfico de RAM - Ocupa 2/3 del ancho */}
      <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Uso de RAM en Tiempo Real
        </h2>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "RAM Usage (%)",
                data: ramData,
                borderColor: getBorderColor(),
                backgroundColor: getBorderColor().replace("1)", "0.2)"),
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            scales: {
              y: { beginAtZero: true, max: 100 },
            },
          }}
        />
      </div>

      {/* Información de RAM - Ocupa 1/3 del ancho */}
      <div className="w-1/4 h-[310px] bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Uso de RAM en Tiempo Real
        </h2>
        <h2 className="text-l font-semibold text-left mb-4 text-black">
          Memoria Total: {formatBytes(totalRAM)}
        </h2>
        <h2 className="text-l font-semibold text-left mb-4 text-black">
          Memoria Usada: {formatBytes(usedRAM)}
        </h2>
        <h2 className="text-l font-semibold text-left mb-4 text-black">
          Memoria Libre: {formatBytes(freeRAM)}
        </h2>
        <h2 className="text-l font-semibold text-left mb-4 text-black">
          Buffers:{" "}
          {buffersRAM !== "No disponible" ? formatBytes(Number(buffersRAM)) : "No disponible"}
        </h2>
        <h2 className="text-l font-semibold text-left mb-4 text-black">
          Caché:{" "}
          {cacheRAM !== "No disponible" ? formatBytes(Number(cacheRAM)) : "No disponible"}
        </h2>
        <h2 className="text-l font-semibold text-left mb-4 text-black">
          Uso de RAM: {ramUsage.toFixed(2)}%
        </h2>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};