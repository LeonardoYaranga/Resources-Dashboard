"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Chart.register(...registerables);

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

interface DiskChartProps {
  data: DiskData;
}

const DiskChart: React.FC<DiskChartProps> = ({ data }) => {
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
  const lastNotificationTime = useRef<number>(0);
  const NOTIFICATION_INTERVAL = 600000; // 10 minutos

  // Obtener configuración
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

  // Actualizar estado con los datos recibidos
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    setReadSpeed((prev) => [...prev.slice(-99), (data.read_speed || 0) / 1024]);
    setWriteSpeed((prev) => [...prev.slice(-99), (data.write_speed || 0) / 1024]);
    setTotal(data.total / 1e9);
    setUsed(data.used / 1e9);
    setFree((data.free || 0) / 1e9);
    setReadCount(data.read_count || 0);
    setWriteCount(data.write_count || 0);
    setDiskPercent(data.percent);
    setLabels((prev) => [...prev.slice(-99), timestamp]);

    const threshold = config.thresholds.disk_usage || 70;
    const nearThreshold = threshold * 0.9;
    const currentTime = Date.now();
    const timeSinceLastNotification = currentTime - lastNotificationTime.current;

    if (data.percent >= threshold) {
      if (!hasAlerted && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
        toast.error(
          `¡Alerta! El uso del disco (${data.percent.toFixed(1)}%) ha superado el umbral de ${threshold}%`
        );
        setHasAlerted(true);
        setHasWarned(false);
        lastNotificationTime.current = currentTime;
      }
    } else if (data.percent >= nearThreshold) {
      if (!hasWarned && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
        toast.warn(
          `Advertencia: El uso del disco (${data.percent.toFixed(1)}%) está cerca del umbral de ${threshold}%`
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
    const threshold = config.thresholds.disk_usage || 70;
    const nearThreshold = threshold * 0.9;
    if (diskPercent >= threshold) return "rgba(255, 99, 132, 1)"; // Rojo
    if (diskPercent >= nearThreshold) return "rgba(255, 165, 0, 1)"; // Naranja
    return "rgba(54, 162, 235, 1)"; // Azul
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
            <p className="text-lg font-bold text-red-500">{used.toFixed(2)} GB</p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Espacio Libre</p>
            <p className="text-lg font-bold text-green-500">{free.toFixed(2)} GB</p>
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
            <p className="text-lg font-bold text-yellow-500">{diskPercent.toFixed(2)}%</p>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default DiskChart;