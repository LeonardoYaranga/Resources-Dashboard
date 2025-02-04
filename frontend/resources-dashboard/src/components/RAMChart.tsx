import React, { useEffect, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2';

export const RAMChart = ({ monitoring }: { monitoring: boolean }) => {
    
    const [RamData, setRamData] = useState<number[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null); 

    useEffect(() => {
        if (monitoring) {
            wsRef.current = new WebSocket("ws://localhost:8000/ws/memoria");

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setRamData((prevData) => [...prevData.slice(-49), data.usage]); 
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
                wsRef.current.close(); 
                wsRef.current = null;  
            }
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [monitoring]);


    return (
        <div className="w-full max-w-7xl mx-auto bg-white p-6 shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold text-center mb-4 text-black">
                Uso de RAM en Tiempo Real
              </h2>
              <Line
                data={{
                  labels,
                  datasets: [
                    {
                      label: "RAM Usage (%)",
                      data: RamData,
                      borderColor: "rgb(192, 75, 75)",
                      backgroundColor: "rgba(192, 75, 75, 0.2)",
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
    )
}
