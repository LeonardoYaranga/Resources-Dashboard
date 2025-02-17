"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const DiskChart = ({ monitoring }: { monitoring: boolean }) => {
  const [readSpeed, setReadSpeed] = useState<number[]>([]);
  const [writeSpeed, setWriteSpeed] = useState<number[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [used, setUsed] = useState<number>(0);
  const [free, setFree] = useState<number>(0);
  const [readCount, setReadCount] = useState<number>(0);
  const [writeCount, setWriteCount] = useState<number>(0);

  const [labels, setLabels] = useState<string[]>([]);

  const wsref = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (monitoring) {
      wsref.current = new WebSocket("ws://localhost:8000/ws/disk");

      wsref.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setReadSpeed((prev) => [...prev.slice(-99), data.read_speed / 1024]); // Convertir a KB/s
        setWriteSpeed((prev) => [...prev.slice(-99), data.write_speed / 1024]); // Convertir a KB/s

        setTotal(data.total / 1e9); // Convertir a GB
        setUsed(data.used / 1e9);
        setFree(data.free / 1e9);
        setReadCount(data.read_count);
        setWriteCount(data.write_count);

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
    <div className="w-full max-w-lg mx-auto bg-white p-4 shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold text-center mb-4 text-black">
        Monitoreo del Disco
      </h2>
      {/* Gráfico de Velocidad */}
        {/* <h2 className="text-xl font-semibold text-center mb-4">
          Velocidad de Disco
        </h2> */}
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
      {/*Cuadros de Información */}
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
      </div>
    </div>
  );
};

export default DiskChart;
