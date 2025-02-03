"use client";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const CPUChart = () => {
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/cpu");
  
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCpuData((prevData) => [...prevData.slice(-49), data.usage]); // Últimos 50 valores
      setLabels((prevLabels) => [
        ...prevLabels.slice(-49),
        new Date(data.timestamp).toLocaleTimeString(),
      ]);
    };
  
    return () => ws.close();
  }, []);
  

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-4 shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold text-center mb-4">Uso de CPU en Tiempo Real</h2>
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
  );
};

export default CPUChart;
