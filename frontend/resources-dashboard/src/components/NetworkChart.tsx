"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Chart.register(...registerables);

const NetworkChart = ({ monitoring }: { monitoring: boolean }) => {
  // Variables al inicio del componente
  const NOTIFICATION_INTERVAL = 5000; // 5 segundos
  const lastNotificationTime = useRef<number>(0); // Timestamp de la última notificación

  const [speedSent, setSpeedSent] = useState<number[]>([]);
  const [speedRecv, setSpeedRecv] = useState<number[]>([]);
  const [errorsIn, setErrorsIn] = useState<number>(0);
  const [errorsOut, setErrorsOut] = useState<number>(0);
  const [packetsSent, setPacketsSent] = useState<number>(0);
  const [packetsRecv, setPacketsRecv] = useState<number>(0);
  const [currentSpeedSent, setCurrentSpeedSent] = useState<number>(0);
  const [currentSpeedRecv, setCurrentSpeedRecv] = useState<number>(0);
  const [labels, setLabels] = useState<string[]>([]);
  const [config, setConfig] = useState({
    thresholds: { network_usage: 70 }, // Umbral por defecto
  });
  const [hasWarned, setHasWarned] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

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

      wsRef.current = new WebSocket(`ws://localhost:8000/monitoring/ws/network?token=${token}`);

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const uploadSpeed = data.speed_sent / 1024; // Bytes to KB/s
        const downloadSpeed = data.speed_recv / 1024; // Bytes to KB/s
        setSpeedSent((prev) => [...prev.slice(-99), uploadSpeed]);
        setSpeedRecv((prev) => [...prev.slice(-99), downloadSpeed]);
        setCurrentSpeedSent(uploadSpeed);
        setCurrentSpeedRecv(downloadSpeed);
        setErrorsIn(data.errors_in);
        setErrorsOut(data.errors_out);
        setPacketsSent(data.packets_sent);
        setPacketsRecv(data.packets_recv);
        setLabels((prev) => [
          ...prev.slice(-99),
          new Date(data.timestamp).toLocaleTimeString(),
        ]);

        // Verificar el umbral para la velocidad de red (descarga y subida)
        const threshold = config.thresholds.network_usage || 70; // En KB/s
        const nearThreshold = threshold * 0.9;
        const currentTime = Date.now();
        const timeSinceLastNotification = currentTime - lastNotificationTime.current;

        // Para velocidad de descarga
        if (downloadSpeed >= threshold) {
          if (!hasAlerted && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            toast.error(
              `¡Alerta! La velocidad de descarga (${downloadSpeed.toFixed(1)} KB/s) ha superado el umbral de ${threshold} KB/s`
            );
            setHasAlerted(true);
            setHasWarned(false);
            lastNotificationTime.current = currentTime;
          }
        } else if (downloadSpeed >= nearThreshold) {
          if (!hasWarned && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            toast.warn(
              `Advertencia: La velocidad de descarga (${downloadSpeed.toFixed(1)} KB/s) está cerca del umbral de ${threshold} KB/s`
            );
            setHasWarned(true);
            setHasAlerted(false);
            lastNotificationTime.current = currentTime;
          }
        } else {
          setHasWarned(false);
          setHasAlerted(false);
        }

        // Para velocidad de subida
        if (uploadSpeed >= threshold) {
          if (!hasAlerted && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            toast.error(
              `¡Alerta! La velocidad de subida (${uploadSpeed.toFixed(1)} KB/s) ha superado el umbral de ${threshold} KB/s`
            );
            setHasAlerted(true);
            setHasWarned(false);
            lastNotificationTime.current = currentTime;
          }
        } else if (uploadSpeed >= nearThreshold) {
          if (!hasWarned && timeSinceLastNotification >= NOTIFICATION_INTERVAL) {
            toast.warn(
              `Advertencia: La velocidad de subida (${uploadSpeed.toFixed(1)} KB/s) está cerca del umbral de ${threshold} KB/s`
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

  // Cambiar color según el umbral (aplicado a velocidad de descarga y subida)
  const getBorderColorRecv = () => {
    const threshold = config.thresholds.network_usage || 70;
    const nearThreshold = threshold * 0.9;
    if (currentSpeedRecv >= threshold || currentSpeedSent >= threshold) return "rgba(255, 99, 132, 1)"; // Rojo
    if (currentSpeedRecv >= nearThreshold || currentSpeedSent >= nearThreshold) return "rgba(255, 165, 0, 1)"; // Naranja
    return "rgba(54, 162, 235, 1)"; // Azul original
  };

  const getBorderColorSent = () => {
    return "rgba(255, 99, 132, 1)"; // Color original para subida
  };

  return (
    <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">
      <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Monitoreo de Red en Tiempo Real
        </h2>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Subida (KB/s)",
                data: speedSent,
                borderColor: getBorderColorSent(),
                backgroundColor: getBorderColorSent().replace("1)", "0.2)"),
                fill: true,
              },
              {
                label: "Descarga (KB/s)",
                data: speedRecv,
                borderColor: getBorderColorRecv(),
                backgroundColor: getBorderColorRecv().replace("1)", "0.2)"),
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
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Información de Red
        </h2>
        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Velocidad Subida</p>
            <p className="text-lg font-bold text-red-500">
              {currentSpeedSent.toFixed(2)} KB/s
            </p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Velocidad Bajada</p>
            <p className="text-lg font-bold text-red-500">
              {currentSpeedRecv.toFixed(2)} KB/s
            </p>
          </div>
          <div className="bg-gray-800 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Paquetes Enviados</p>
            <p className="text-lg font-bold text-blue-500">{packetsSent}</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Paquetes Recibidos</p>
            <p className="text-lg font-bold text-blue-500">{packetsRecv}</p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Errores Entrada</p>
            <p className="text-lg font-bold text-red-500">{errorsIn}</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Errores Salida</p>
            <p className="text-lg font-bold text-red-500">{errorsOut}</p>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default NetworkChart;