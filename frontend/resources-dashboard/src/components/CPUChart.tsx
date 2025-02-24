"use client";
import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const CPUChart = ({ monitoring }: { monitoring: boolean }) => {
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [cpuFrec, setCpuFrec] = useState<number>(0);
  const [tempCPU, setTempCPU] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null); // Guardamos la referencia del WebSocket

  useEffect(() => {
    if (monitoring) {
      const token = Cookies.get('token'); // Deberías obtenerlo dinámicamente, probablemente del estado o cookies

      wsRef.current = new WebSocket(`ws://localhost:8000/monitoring/ws/cpu?token=${token}`);

      //wsRef.current = new WebSocket("ws://localhost:8000/ws/cpu");

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setCpuData((prevData) => [...prevData.slice(-49), data.usage]); // Últimos 50 valores
        setCpuUsage(data.usage);
        setTempCPU(data.temp);
        setCpuFrec(data.frequency);
        console.log(data);
        setLabels((prevLabels) => [
          ...prevLabels.slice(-49),
          new Date(data.timestamp).toLocaleTimeString(),
        ]);
      };

      wsRef.current.onclose = () => {
        console.log("Conexión WebSocket cerrada.");
      };
    } else {
      if (wsRef.current) {
        wsRef.current.close(); // Cerrar conexión si el monitoreo se detiene
        wsRef.current = null;  
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [monitoring]); // Se ejecuta cada vez que monitoring cambia

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
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
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
          Temperatura: { tempCPU }°C
        </h2>
        <h2 className="text-xl font-semibold text-left mb-4 text-black">
          Porcentaje de uso: { cpuUsage }%
        </h2>
        <h2 className="text-xl font-semibold text-left mb-4 text-black">
          Frecuencia: {cpuFrec ? `${cpuFrec.toFixed(2)} MHz` : "0"}
        </h2>

      </div>
    </div>
  );
};

export default CPUChart;
