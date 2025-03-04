// "use client";
// import { useEffect, useState, useRef } from "react";
// import Cookies from "js-cookie";
// import { Line } from "react-chartjs-2";
// import { Chart, registerables } from "chart.js";

// Chart.register(...registerables);

// const CPUChart = ({ monitoring }: { monitoring: boolean }) => {
//   const [cpuData, setCpuData] = useState<number[]>([]);
//   const [cpuUsage, setCpuUsage] = useState<number>(0);
//   const [cpuFrec, setCpuFrec] = useState<number>(0);
//   const [tempCPU, setTempCPU] = useState<number[]>([]);
//   const [labels, setLabels] = useState<string[]>([]);
//   const wsRef = useRef<WebSocket | null>(null); // Guardamos la referencia del WebSocket

//   useEffect(() => {
//     if (monitoring) {
//       const token = Cookies.get('token'); // Deberías obtenerlo dinámicamente, probablemente del estado o cookies

//       wsRef.current = new WebSocket(`ws://localhost:8000/monitoring/ws/cpu?token=${token}`);

//       //wsRef.current = new WebSocket("ws://localhost:8000/ws/cpu");

//       wsRef.current.onmessage = (event) => {
//         const data = JSON.parse(event.data);
//         setCpuData((prevData) => [...prevData.slice(-49), data.usage]); // Últimos 50 valores
//         setCpuUsage(data.usage);
//         setTempCPU(data.temp);
//         setCpuFrec(data.frequency);
//         console.log(data);
//         setLabels((prevLabels) => [
//           ...prevLabels.slice(-49),
//           new Date(data.timestamp).toLocaleTimeString(),
//         ]);
//       };

//       wsRef.current.onclose = () => {
//         console.log("Conexión WebSocket cerrada.");
//       };
//     } else {
//       if (wsRef.current) {
//         wsRef.current.close(); // Cerrar conexión si el monitoreo se detiene
//         wsRef.current = null;  
//       }
//     }

//     return () => {
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, [monitoring]); // Se ejecuta cada vez que monitoring cambia

//   return (
//     <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">

//       <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
//         <h2 className="text-xl font-semibold text-center mb-4 text-black">
//             Uso de CPU en Tiempo Real
//         </h2>
//         <Line
//           data={{
//             labels,
//             datasets: [
//               {
//                 label: "CPU Usage (%)",
//                 data: cpuData,
//                 borderColor: "rgba(75, 192, 192, 1)",
//                 backgroundColor: "rgba(75, 192, 192, 0.2)",
//                 fill: true,
//               },
//             ],
//           }}
//           options={{
//             responsive: true,
//             scales: {
//               y: { beginAtZero: true, max: 100 },
//             },
//           }}
//           />
//         </div>
    
//       <div className="w-1/4 h-[220px] bg-white p-6 shadow-lg rounded-lg">
//         <h2 className="text-xl font-semibold text-center mb-4 text-black">
//           Uso de CPU en Tiempo Real
//         </h2>
//         <h2 className="text-xl font-semibold text-left mb-4 text-black">
//           Temperatura: { tempCPU }°C
//         </h2>
//         <h2 className="text-xl font-semibold text-left mb-4 text-black">
//           Porcentaje de uso: { cpuUsage }%
//         </h2>
//         <h2 className="text-xl font-semibold text-left mb-4 text-black">
//           Frecuencia: {cpuFrec ? `${cpuFrec.toFixed(2)} MHz` : "0"}
//         </h2>

//       </div>
//     </div>
//   );
// };

// export default CPUChart;

"use client";
import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Chart.register(...registerables);

const CPUChart = ({ monitoring }: { monitoring: boolean }) => {
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [cpuFrec, setCpuFrec] = useState<number>(0);
  const [tempCPU, setTempCPU] = useState<number | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [config, setConfig] = useState({
    save_interval: 60,
    thresholds: { cpu_usage: 80 },
    update_frequency: 1,
  });
  const [hasWarned, setHasWarned] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
const lastNotificationTime = useRef<number>(0); // Timestamp de la última notificación
  const NOTIFICATION_INTERVAL = 5000; // 5 seg

  // Obtener configuración del usuario al montar el componente
  useEffect(() => {
    const fetchConfig = async () => {
      const token = Cookies.get("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:8000/config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          console.log("Token no válido, redirigiendo...");
          // Podrías redirigir al login aquí si tienes un router
          return;
        }
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

  // Manejar el WebSocket
  useEffect(() => {
    if (monitoring) {
      const token = Cookies.get("token");
      if (!token) {
        console.log("No hay token para WebSocket");
        return;
      }

      wsRef.current = new WebSocket(`ws://localhost:8000/monitoring/ws/cpu?token=${token}`);

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setCpuData((prevData) => [...prevData.slice(-49), data.usage]);
        setCpuUsage(data.usage);
        setTempCPU(data.temp);
        setCpuFrec(data.frequency);
        setLabels((prevLabels) => [
          ...prevLabels.slice(-49),
          new Date(data.timestamp).toLocaleTimeString(),
        ]);

        // Verificar el umbral
        const threshold = config.thresholds.cpu_usage || 80;
        const nearThreshold = threshold * 0.9;
        const currentTime = Date.now();
        const timeSinceLastNotification = currentTime - lastNotificationTime.current;

        if (data.usage >= threshold) {
          if (!hasAlerted && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            toast.error(
              `¡Alerta! El uso de CPU (${data.usage.toFixed(1)}%) ha superado el umbral de ${threshold}%`
            );
            setHasAlerted(true);
            setHasWarned(false);
            lastNotificationTime.current = currentTime;
          }
        } else if (data.usage >= nearThreshold) {
          if (!hasWarned && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            toast.warn(
              `Advertencia: El uso de CPU (${data.usage.toFixed(1)}%) está cerca del umbral de ${threshold}%`
            );
            setHasWarned(true);
            setHasAlerted(false);
            lastNotificationTime.current = currentTime;
          }
        } else {
          setHasWarned(false);
          setHasAlerted(false);
        }
      };

      wsRef.current.onclose = () => console.log("Conexión WebSocket cerrada.");
      wsRef.current.onerror = (error) => console.error("Error en WebSocket:", error);
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
    const threshold = config.thresholds.cpu_usage || 80;
    const nearThreshold = threshold * 0.9;

    if (cpuUsage >= threshold) {
      return "rgba(255, 99, 132, 1)"; // Rojo
    } else if (cpuUsage >= nearThreshold) {
      return "rgba(255, 165, 0, 1)"; // Naranja
    } else {
      return "rgba(75, 192, 192, 1)"; // Teal
    }
  };

  return (
    <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">
      <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Uso de CPU en Tiempo Real
        </h2>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "CPU Usage (%)",
                data: cpuData,
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

      <div className="w-1/4 h-[220px] bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Uso de CPU en Tiempo Real
        </h2>
        <h2 className="text-xl font-semibold text-left mb-4 text-black">
          Temperatura: {tempCPU !== null ? `${tempCPU}°C` : "No disponible"}
        </h2>
        <h2 className="text-xl font-semibold text-left mb-4 text-black">
          Porcentaje de uso: {cpuUsage}%
        </h2>
        <h2 className="text-xl font-semibold text-left mb-4 text-black">
          Frecuencia: {cpuFrec ? `${cpuFrec.toFixed(2)} MHz` : "0"}
        </h2>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default CPUChart;