"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const CPUChart = ({ monitoring }: { monitoring: boolean }) => {
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [tempCPU, setTempCPU] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null); // Guardamos la referencia del WebSocket

  useEffect(() => {
    if (monitoring) {
      wsRef.current = new WebSocket("ws://localhost:8000/ws/cpu");

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setCpuData((prevData) => [...prevData.slice(-49), data.usage]); // Últimos 50 valores
        setTempCPU(data.temp);
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
    <div>
      <div className="w-full max-w-7xl mx-auto bg-white p-6 shadow-lg rounded-lg">
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
      <h2>
        Temperatura: { tempCPU }
      </h2>

    </div>
  );
};

export default CPUChart;
