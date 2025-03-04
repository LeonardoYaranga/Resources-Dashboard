// "use client";
// import { useEffect, useState, useRef } from "react";
// import { Line } from "react-chartjs-2";
// import { Chart, registerables } from "chart.js";

// Chart.register(...registerables);

// const DiskChart = ({ monitoring }: { monitoring: boolean }) => {
//   const [readSpeed, setReadSpeed] = useState<number[]>([]);
//   const [writeSpeed, setWriteSpeed] = useState<number[]>([]);
//   const [total, setTotal] = useState<number>(0);
//   const [used, setUsed] = useState<number>(0);
//   const [free, setFree] = useState<number>(0);
//   const [readCount, setReadCount] = useState<number>(0);
//   const [writeCount, setWriteCount] = useState<number>(0);

//   const [labels, setLabels] = useState<string[]>([]);

//   const wsref = useRef<WebSocket | null>(null);

//   useEffect(() => {
//     if (monitoring) {
//       wsref.current = new WebSocket("ws://localhost:8000/monitoring/ws/disk");

//       wsref.current.onmessage = (event) => {
//         const data = JSON.parse(event.data);
//         setReadSpeed((prev) => [...prev.slice(-99), data.read_speed / 1024]); // Convertir a KB/s
//         setWriteSpeed((prev) => [...prev.slice(-99), data.write_speed / 1024]); // Convertir a KB/s

//         setTotal(data.total / 1e9); // Convertir a GB
//         setUsed(data.used / 1e9);
//         setFree(data.free / 1e9);
//         setReadCount(data.read_count);
//         setWriteCount(data.write_count);

//         setLabels((prev) => [
//           ...prev.slice(-99),
//           new Date(data.timestamp).toLocaleTimeString(),
//         ]);
//       };

//       wsref.current.onclose = () => {
//         console.log("Conexión WebSocket cerrada.");
//       };
//     } else {
//       if (wsref.current) {
//         wsref.current.close();
//         wsref.current = null;
//       }
//     }
//     return () => {
//       if (wsref.current) {
//         wsref.current.close();
//       }
//     };
//   }, [monitoring]);

//   return (
//     <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">
//       <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
//       <h2 className="text-xl font-semibold text-center mb-4 text-black">
//         Monitoreo del Disco
//       </h2>
//       {/* Gráfico de Velocidad */}
//         {/* <h2 className="text-xl font-semibold text-center mb-4">
//           Velocidad de Disco
//         </h2> */}
//         <Line
//           data={{
//             labels,
//             datasets: [
//               {
//                 label: "Lectura (KB/s)",
//                 data: readSpeed,
//                 borderColor: "rgba(255, 99, 132, 1)",
//                 backgroundColor: "rgba(255, 99, 132, 0.2)",
//                 fill: true,
//               },
//               {
//                 label: "Escritura (KB/s)",
//                 data: writeSpeed,
//                 borderColor: "rgba(54, 162, 235, 1)",
//                 backgroundColor: "rgba(54, 162, 235, 0.2)",
//                 fill: true,
//               },
//             ],
//           }}
//           options={{
//             responsive: true,
//             scales: {
//               y: { beginAtZero: true },
//             },
//           }}
//         />
//       </div>
//       {/*Cuadros de Información */}
//       <div className="w-1/4 h-[330px] bg-white p-6 shadow-lg rounded-lg">
//           <div className="grid grid-cols-2 gap-4 mt-4 text-center">
//             <div className="bg-gray-900 p-2 rounded-md shadow">
//               <p className="text-sm font-semibold">Espacio Total</p>
//               <p className="text-lg font-bold">{total.toFixed(2)} GB</p>
//             </div>
//             <div className="bg-gray-900 p-2 rounded-md shadow">
//               <p className="text-sm font-semibold">Espacio Usado</p>
//               <p className="text-lg font-bold text-red-500">{used.toFixed(2)} GB</p>
//             </div>
//             <div className="bg-gray-900 p-2 rounded-md shadow">
//               <p className="text-sm font-semibold">Espacio Libre</p>
//               <p className="text-lg font-bold text-green-500">
//                 {free.toFixed(2)} GB
//               </p>
//             </div>
//             <div className="bg-gray-900 p-2 rounded-md shadow">
//               <p className="text-sm font-semibold">Lecturas</p>
//               <p className="text-lg font-bold">{readCount}</p>
//             </div>
//             <div className="bg-gray-900 p-2 rounded-md shadow">
//               <p className="text-sm font-semibold">Escrituras</p>
//               <p className="text-lg font-bold">{writeCount}</p>
//             </div>
//           </div>
//       </div>
//     </div>
//   );
// };

// export default DiskChart;

"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Chart.register(...registerables);

const DiskChart = ({ monitoring }: { monitoring: boolean }) => {
  const [readSpeed, setReadSpeed] = useState<number[]>([]);
  const [writeSpeed, setWriteSpeed] = useState<number[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [used, setUsed] = useState<number>(0);
  const [free, setFree] = useState<number>(0);
  const [readCount, setReadCount] = useState<number>(0);
  const [writeCount, setWriteCount] = useState<number>(0);
  const [diskPercent, setDiskPercent] = useState<number>(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [config, setConfig] = useState({
    thresholds: { disk_usage: 70 }, // Umbral por defecto
  });
  const [hasWarned, setHasWarned] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const lastNotificationTime = useRef<number>(0); // Timestamp de la última notificación
  const NOTIFICATION_INTERVAL = 600000; // 10 min
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

      wsRef.current = new WebSocket(
        `ws://localhost:8000/monitoring/ws/disk?token=${token}`
      );

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setReadSpeed((prev) => [...prev.slice(-99), data.read_speed / 1024]);
        setWriteSpeed((prev) => [...prev.slice(-99), data.write_speed / 1024]);
        setTotal(data.total / 1e9);
        setUsed(data.used / 1e9);
        setFree(data.free / 1e9);
        setReadCount(data.read_count);
        setWriteCount(data.write_count);
        setDiskPercent(data.percent);

        setLabels((prev) => [
          ...prev.slice(-99),
          new Date(data.timestamp).toLocaleTimeString(),
        ]);

        const threshold = config.thresholds.disk_usage || 70;
        const nearThreshold = threshold * 0.9;
        const currentTime = Date.now();
        const timeSinceLastNotification =
          currentTime - lastNotificationTime.current;

        console.log(
          "Antes de condicionales - Disk Percent:",
          data.percent,
          "Threshold:",
          threshold,
          "Near Threshold:",
          nearThreshold,
          "Has Warned:",
          hasWarned,
          "Has Alerted:",
          hasAlerted,
          "Time Since Last:",
          timeSinceLastNotification
        );

        if (data.percent >= threshold) {
          if (!hasAlerted && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            // 600000 ms = 600 segundos = 10 min
            console.log("Disparando toast.error");
            toast.error(
              `¡Alerta! El uso del disco (${data.percent.toFixed(
                1
              )}%) ha superado el umbral de ${threshold}%`
            );
            setHasAlerted(true);
            setHasWarned(false);
            lastNotificationTime.current = currentTime;
          }
        } else if (data.percent >= nearThreshold) {
          if (!hasWarned && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            console.log("Disparando toast.warn");
            toast.warn(
              `Advertencia: El uso del disco (${data.percent.toFixed(
                1
              )}%) está cerca del umbral de ${threshold}%`
            );
            setHasWarned(true);
            setHasAlerted(false);
            lastNotificationTime.current = currentTime;
          }
        } else {
          setHasWarned(false);
          setHasAlerted(false);
        }

        console.log(
          "Después de condicionales - Disk Percent:",
          data.percent,
          "Threshold:",
          threshold,
          "Has Warned:",
          hasWarned,
          "Has Alerted:",
          hasAlerted
        );
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

  const getBorderColor = () => {
    const threshold = config.thresholds.disk_usage || 70;
    const nearThreshold = threshold * 0.9;
    if (diskPercent >= threshold) return "rgba(255, 99, 132, 1)"; // Rojo
    if (diskPercent >= nearThreshold) return "rgba(255, 165, 0, 1)"; // Naranja
    return "rgba(54, 162, 235, 1)"; // Azul original para escritura como base
  };

  return (
    <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">
      <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Monitoreo del Disco
        </h2>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Lectura (KB/s)",
                data: readSpeed,
                borderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                fill: true,
              },
              {
                label: "Escritura (KB/s)",
                data: writeSpeed,
                borderColor: getBorderColor(),
                backgroundColor: getBorderColor().replace("1)", "0.2)"),
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            scales: {
              y: { beginAtZero: true },
            },
          }}
        />
      </div>
      <div className="w-1/4 h-[330px] bg-white p-6 shadow-lg rounded-lg">
        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Espacio Total</p>
            <p className="text-lg font-bold">{total.toFixed(2)} GB</p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Espacio Usado</p>
            <p className="text-lg font-bold text-red-500">
              {used.toFixed(2)} GB
            </p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Espacio Libre</p>
            <p className="text-lg font-bold text-green-500">
              {free.toFixed(2)} GB
            </p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Lecturas</p>
            <p className="text-lg font-bold">{readCount}</p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Escrituras</p>
            <p className="text-lg font-bold">{writeCount}</p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Uso (%)</p>
            <p className="text-lg font-bold text-yellow-500">
              {diskPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default DiskChart;
