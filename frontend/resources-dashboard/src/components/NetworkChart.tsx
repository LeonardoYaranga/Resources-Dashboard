"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const NetworkChart = ({ monitoring }: { monitoring: boolean }) => {
  const [speedSent, setSpeedSent] = useState<number[]>([]);
  const [speedRecv, setSpeedRecv] = useState<number[]>([]);
  const [errorsIn, setErrorsIn] = useState<number>(0);
  const [errorsOut, setErrorsOut] = useState<number>(0);
  const [packetsSent, setPacketsSent] = useState<number>(0);
  const [packetsRecv, setPacketsRecv] = useState<number>(0);
  //Se podria agregar los paquetes descartados ...

  const [currentSpeedSent, setCurrentSpeedSent] = useState<number>(0);
  const [currentSpeedRecv, setCurrentSpeedRecv] = useState<number>(0);

  const [labels, setLabels] = useState<string[]>([]);

  const wsref = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (monitoring) {
      wsref.current = new WebSocket("ws://localhost:8000/monitoring/ws/network");

      wsref.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const uploadSpeed = data.speed_sent / 1024; // Bytes to KB/s
        const downloadSpeed = data.speed_recv / 1024;
        //For the graphic
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
      };

      wsref.current.onclose = () => {
        console.log("Conexión WebSocket cerrada.");
      };
    } else {
      if (wsref.current) {
        wsref.current.close();
        wsref.current = null;
      }
    }
    return () => {
      if (wsref.current) {
        wsref.current.close();
      }
    };
  }, [monitoring]);

  return (
    <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">

      <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold text-center mb-4 text-black">
        Monitoreo de Red en Tiempo Real
      </h2>

      {/*Gráfico de Velocidad */}
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Subida (KB/s)",
              data: speedSent,
              borderColor: "rgba(255, 99, 132, 1)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              fill: true,
            },
            {
              label: "Descarga (KB/s)",
              data: speedRecv,
              borderColor: "rgba(54, 162, 235, 1)",
              backgroundColor: "rgba(54, 162, 235, 0.2)",
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

      {/*Cuadros de Información */}
      <div className="w-1/4 h-[330px] bg-white p-6 shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">
          Información de Red
        </h2>
          <div className="grid grid-cols-2 gap-4 mt-4 text-center">
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Velocidad Subida</p>
            <p className="text-lg font-bold text-red-500">
              {currentSpeedSent.toFixed(2)} KB
            </p>
          </div>
          <div className="bg-gray-900 p-2 rounded-md shadow">
            <p className="text-sm font-semibold">Velocidad Bajada</p>
            <p className="text-lg font-bold text-red-500">
              {currentSpeedRecv.toFixed(2)} KB
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
    </div>
  );
};

export default NetworkChart;
