"use client";
import { useState, useEffect } from "react";

interface Process {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  status: string;
}

interface ProcessesProps {
  data: Process[];
}

const Processes: React.FC<ProcessesProps> = ({ data }) => {
  const [processes, setProcesses] = useState<Process[]>(data);
  const [sortColumn, setSortColumn] = useState<keyof Process>("pid");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Actualizar procesos cuando cambien los datos de entrada
  useEffect(() => {
    setProcesses(data);
  }, [data]);

  // Función para ordenar la tabla cuando se hace clic en un encabezado
  const handleSort = (column: keyof Process) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  // Función para obtener el indicador de orden
  const getSortIndicator = (column: keyof Process) => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? "↑" : "↓";
    }
    return "";
  };

  // Ordenar los procesos según la columna y la dirección seleccionada
  const sortedProcesses = [...processes].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    }
  });

  return (
    <div className="p-4 h-screen w-full flex flex-col">
      <h1 className="text-2xl font-semibold text-center mb-4 text-black">Procesos Activos</h1>

      {/* Contenedor de la tabla con scroll */}
      <div className="flex-1 overflow-y-auto border border-gray-600 rounded-md max-h-[80vh] w-full min-h-[60vh]">
        <table className="w-full border-collapse border border-gray-600">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th
                className="border border-gray-600 px-4 py-2 cursor-pointer"
                onClick={() => handleSort("pid")}
              >
                PID {getSortIndicator("pid")}
              </th>
              <th
                className="border border-gray-600 px-4 py-2 cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Nombre {getSortIndicator("name")}
              </th>
              <th
                className="border border-gray-600 px-4 py-2 cursor-pointer"
                onClick={() => handleSort("cpu_percent")}
              >
                CPU (%) {getSortIndicator("cpu_percent")}
              </th>
              <th
                className="border border-gray-600 px-4 py-2 cursor-pointer"
                onClick={() => handleSort("memory_percent")}
              >
                Memoria (%) {getSortIndicator("memory_percent")}
              </th>
              <th
                className="border border-gray-600 px-4 py-2 cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Estado {getSortIndicator("status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProcesses.map((process) => (
              <tr key={process.pid} className="text-center">
                <td className="border border-gray-600 text-black px-4 py-2">{process.pid}</td>
                <td className="border border-gray-600 text-black px-4 py-2">{process.name}</td>
                <td className="border border-gray-600 text-black px-4 py-2">{process.cpu_percent.toFixed(2)}</td>
                <td className="border border-gray-600 text-black px-4 py-2">{process.memory_percent.toFixed(2)}</td>
                <td className="border border-gray-600 text-black px-4 py-2">{process.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Processes;