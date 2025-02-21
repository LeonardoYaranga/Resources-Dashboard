import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';

export const RAMChart = ({ monitoring }: { monitoring: boolean }) => {
    
    const [ramData, setRamData] = useState<number[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const [totalRAM, setTotalRAM] = useState<number>(0);
    const [usedRAM, setUsedRAM] = useState<number>(0);
    const [freeRAM, setFreeRAM] = useState<number>(0);
    const [buffersRAM, setBuffersRAM] = useState<string | number>("No disponible");
    const [cacheRAM, setCacheRAM] = useState<string | number>("No disponible");
    const [ramUsage, setRamUsage] = useState<number>(0);
    const wsRef = useRef<WebSocket | null>(null); 

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return "0 B";
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

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

                // Actualizamos los valores de memoria en tiempo real
                setTotalRAM(data.total);
                setUsedRAM(data.used);
                setFreeRAM(data.free);
                setBuffersRAM(data.buffers);
                setCacheRAM(data.cache);
                setRamUsage(data.usage);
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
        <div className="flex w-full max-w-8xl mx-auto gap-6 p-10 py-5">
            {/* Gráfico de RAM - Ocupa 2/3 del ancho */}
            <div className="w-3/4 bg-white p-6 shadow-lg rounded-lg">
                <h2 className="text-xl font-semibold text-center mb-4 text-black">
                    Uso de RAM en Tiempo Real
                </h2>
                <Line
                    data={{
                        labels,
                        datasets: [
                            {
                                label: "RAM Usage (%)",
                                data: ramData,
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

            {/* Información de RAM - Ocupa 1/3 del ancho */}
            <div className="w-1/4 h-[310px] bg-white p-6 shadow-lg rounded-lg">
                <h2 className="text-xl font-semibold text-center mb-4 text-black">
                Uso de RAM en Tiempo Real
                </h2>
                <h2 className="text-l font-semibold text-left mb-4 text-black">
                    Memoria Total: {formatBytes(totalRAM)}
                </h2>
                <h2 className="text-l font-semibold text-left mb-4 text-black">
                    Memoria Usada: {formatBytes(usedRAM)}
                </h2>
                <h2 className="text-l font-semibold text-left mb-4 text-black">
                    Memoria Libre: {formatBytes(freeRAM)}
                </h2>
                <h2 className="text-l font-semibold text-left mb-4 text-black">
                    Buffers: {buffersRAM !== "No disponible" ? formatBytes(Number(buffersRAM)) : "No disponible"}
                </h2>
                <h2 className="text-l font-semibold text-left mb-4 text-black">
                    Caché: {cacheRAM !== "No disponible" ? formatBytes(Number(cacheRAM)) : "No disponible"}
                </h2>
                <h2 className="text-l font-semibold text-left mb-4 text-black">
                    Uso de RAM: {ramUsage.toFixed(2)}%
                </h2>
            </div>
        </div>

    );
};
