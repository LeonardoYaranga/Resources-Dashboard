"use client";
import { useEffect, useState, useRef } from "react"; // Añadimos useRef
import Cookies from "js-cookie"; // Import explícito
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Chart.register(...registerables);

interface CPUData {
  usage: number;
  temp: number | null;
  frequency: number;
}

const CPUChart = ({ data }: { data: CPUData }) => {
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [config, setConfig] = useState({
    save_interval: 60,
    thresholds: { cpu_usage: 80 },
    update_frequency: 1,
  });
  const [hasWarned, setHasWarned] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);
  const lastNotificationTime = useRef<number>(0); // Ahora useRef está importado
  const NOTIFICATION_INTERVAL = 5000; // 5 segundos

  useEffect(() => {
    const fetchConfig = async () => {
      const token = Cookies.get("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:8000/config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) return;
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
    const timestamp = new Date().toLocaleTimeString();
    setCpuData((prev) => [...prev.slice(-49), data.usage]);
    setLabels((prev) => [...prev.slice(-49), timestamp]);

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
  }, [data, config]);

  const getBorderColor = () => {
    const threshold = config.thresholds.cpu_usage || 80;
    const nearThreshold = threshold * 0.9;
    if (data.usage >= threshold) return "rgba(255, 99, 132, 1)"; // Rojo
    if (data.usage >= nearThreshold) return "rgba(255, 165, 0, 1)"; // Naranja
    return "rgba(75, 192, 192, 1)"; // Teal
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
          Temperatura: {data.temp !== null ? `${data.temp}°C` : "No disponible"}
        </h2>
        <h2 className="text-xl font-semibold text-left mb-4 text-black">
          Porcentaje de uso: {data.usage}%
        </h2>
        <h2 className="text-xl font-semibold text-left mb-4 text-black">
          Frecuencia: {data.frequency ? `${data.frequency.toFixed(2)} MHz` : "0"}
        </h2>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default CPUChart;