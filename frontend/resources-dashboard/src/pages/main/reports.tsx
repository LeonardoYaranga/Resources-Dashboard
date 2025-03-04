"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

interface Report {
  _id: string;
  user_id: string;
  report_date: string;
  cpu_data?: any[];
  ram_data?: any[];
  network_data?: any[];
  disk_data?: any[];
  processes?: { initial_snapshot: any[]; updates: any[] };
}

const Reports = () => {
  const [selectedResource, setSelectedResource] = useState<string>("cpu");
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      const token = Cookies.get("token");
      if (!token) {
        console.log("No hay token para fetch reports");
        return;
      }

      try {
        const res = await fetch(`http://localhost:8000/reports/${selectedResource}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        } else {
          console.error("Error al cargar reportes:", res.status);
        }
      } catch (error) {
        console.error("Error en fetchReports:", error);
      }
    };
    fetchReports();
  }, [selectedResource]);

  const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedResource(e.target.value);
    setSelectedReport(null);
  };

  const getReportData = (report: Report) => {
    switch (selectedResource) {
      case "cpu":
        return report.cpu_data || [];
      case "memory":
        return report.ram_data || [];
      case "network":
        return report.network_data || [];
      case "disk":
        return report.disk_data || [];
      case "processes":
        return report.processes?.updates || [];
      default:
        return [];
    }
  };

  const getInitialSnapshot = (report: Report) => {
    return selectedResource === "processes" && report.processes?.initial_snapshot
      ? report.processes.initial_snapshot
      : [];
  };

  const renderSummaryCard = (report: Report) => {
    const data = getReportData(report);
    const initialSnapshot = getInitialSnapshot(report);
    const firstData = selectedResource === "processes" ? initialSnapshot[0] || {} : data[0] || {};
    return (
      <div
        key={report._id}
        className="bg-white p-4 shadow-lg rounded-lg mb-4 cursor-pointer hover:bg-gray-100 text-black"
        onClick={() => setSelectedReport(report)}
      >
        <h3 className="text-lg font-semibold">Reporte del {report.report_date}</h3>
        {selectedResource === "cpu" && (
          <>
            <p>Uso inicial: {(firstData.usage || 0).toFixed(2)}%</p>
            <p>Temperatura inicial: {firstData.temp ? `${firstData.temp}°C` : "N/A"}</p>
          </>
        )}
        {selectedResource === "memory" && (
          <>
            <p>Uso inicial: {(firstData.usage || 0).toFixed(2)}%</p>
            <p>Total inicial: {firstData.total ? formatBytes(firstData.total) : "N/A"}</p>
          </>
        )}
        {selectedResource === "network" && (
          <>
            <p>Descarga inicial: {(firstData.speed_recv / 1024 || 0).toFixed(2)} KB/s</p>
            <p>Subida inicial: {(firstData.speed_sent / 1024 || 0).toFixed(2)} KB/s</p>
          </>
        )}
        {selectedResource === "disk" && (
          <>
            <p>Uso inicial: {(firstData.percent || 0).toFixed(2)}%</p>
            <p>Espacio usado inicial: {(firstData.used / 1e9 || 0).toFixed(2)} GB</p>
          </>
        )}
        {selectedResource === "processes" && (
          <p>Procesos iniciales: {initialSnapshot.length}</p>
        )}
      </div>
    );
  };

  const renderDetailedTable = (report: Report) => {
    const data = getReportData(report);
    const initialSnapshot = getInitialSnapshot(report);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        setSelectedReport(null); // Cierra el modal al hacer clic afuera
      }
    };

    return (
      <div
        className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center"
        onClick={handleOverlayClick}
      >
        <div className="bg-white p-6 rounded-lg max-h-[80vh] w-3/4 relative">
          <button
            className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            onClick={() => setSelectedReport(null)}
          >
            Cerrar
          </button>
          <div className="mt-8 overflow-y-auto max-h-[70vh]">
            <h2 className="text-xl font-semibold mb-4 text-black">Reporte detallado - {report.report_date}</h2>
            {selectedResource === "processes" && initialSnapshot.length > 0 && (
              <>
                <h3 className="text-lg font-medium mb-2 text-black">Snapshot Inicial</h3>
                <table className="w-full border-collapse border border-gray-300 mb-4">
                  <thead>
                    <tr className="bg-gray-200 text-black">
                      <th className="border border-gray-300 p-2">Timestamp</th>
                      <th className="border border-gray-300 p-2">PID</th>
                      <th className="border border-gray-300 p-2">Nombre</th>
                      <th className="border border-gray-300 p-2">CPU (%)</th>
                      <th className="border border-gray-300 p-2">Memoria (%)</th>
                      <th className="border border-gray-300 p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialSnapshot.map((proc, index) => (
                      <tr key={index} className="text-center">
                        <td className="border border-gray-300 p-2">{new Date(proc.timestamp).toLocaleString()}</td>
                        <td className="border border-gray-300 p-2">{proc.pid}</td>
                        <td className="border border-gray-300 p-2">{proc.name}</td>
                        <td className="border border-gray-300 p-2">{proc.cpu_percent.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{proc.memory_percent.toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{proc.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200 text-black">
                  <th className="border border-gray-300 p-2">Timestamp</th>
                  {selectedResource === "cpu" && (
                    <>
                      <th className="border border-gray-300 p-2">Uso (%)</th>
                      <th className="border border-gray-300 p-2">Temperatura (°C)</th>
                      <th className="border border-gray-300 p-2">Frecuencia (MHz)</th>
                    </>
                  )}
                  {selectedResource === "memory" && (
                    <>
                      <th className="border border-gray-300 p-2">Uso (%)</th>
                      <th className="border border-gray-300 p-2">Total (GB)</th>
                      <th className="border border-gray-300 p-2">Usado (GB)</th>
                      <th className="border border-gray-300 p-2">Libre (GB)</th>
                      <th className="border border-gray-300 p-2">Buffers (GB)</th>
                      <th className="border border-gray-300 p-2">Caché (GB)</th>
                    </>
                  )}
                  {selectedResource === "network" && (
                    <>
                      <th className="border border-gray-300 p-2">Descarga (KB/s)</th>
                      <th className="border border-gray-300 p-2">Subida (KB/s)</th>
                      <th className="border border-gray-300 p-2">Paquetes Enviados</th>
                      <th className="border border-gray-300 p-2">Paquetes Recibidos</th>
                      <th className="border border-gray-300 p-2">Errores Entrada</th>
                      <th className="border border-gray-300 p-2">Errores Salida</th>
                    </>
                  )}
                  {selectedResource === "disk" && (
                    <>
                      <th className="border border-gray-300 p-2">Uso (%)</th>
                      <th className="border border-gray-300 p-2">Total (GB)</th>
                      <th className="border border-gray-300 p-2">Usado (GB)</th>
                      <th className="border border-gray-300 p-2">Libre (GB)</th>
                      <th className="border border-gray-300 p-2">Lectura (KB/s)</th>
                      <th className="border border-gray-300 p-2">Escritura (KB/s)</th>
                      <th className="border border-gray-300 p-2">Lecturas</th>
                      <th className="border border-gray-300 p-2">Escrituras</th>
                    </>
                  )}
                  {selectedResource === "processes" && (
                    <>
                      <th className="border border-gray-300 p-2">Cambios</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 p-2">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    {selectedResource === "cpu" && (
                      <>
                        <td className="border border-gray-300 p-2">{entry.usage?.toFixed(2) || "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.temp || "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.frequency?.toFixed(2) || "N/A"}</td>
                      </>
                    )}
                    {selectedResource === "memory" && (
                      <>
                        <td className="border border-gray-300 p-2">{entry.usage?.toFixed(2) || "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.total ? (entry.total / 1e9).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.used ? (entry.used / 1e9).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.free ? (entry.free / 1e9).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.buffers ? (entry.buffers / 1e9).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.cache ? (entry.cache / 1e9).toFixed(2) : "N/A"}</td>
                      </>
                    )}
                    {selectedResource === "network" && (
                      <>
                        <td className="border border-gray-300 p-2">{entry.speed_recv ? (entry.speed_recv / 1024).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.speed_sent ? (entry.speed_sent / 1024).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.packets_sent || 0}</td>
                        <td className="border border-gray-300 p-2">{entry.packets_recv || 0}</td>
                        <td className="border border-gray-300 p-2">{entry.errors_in || 0}</td>
                        <td className="border border-gray-300 p-2">{entry.errors_out || 0}</td>
                      </>
                    )}
                    {selectedResource === "disk" && (
                      <>
                        <td className="border border-gray-300 p-2">{entry.percent?.toFixed(2) || "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.total ? (entry.total / 1e9).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.used ? (entry.used / 1e9).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.free ? (entry.free / 1e9).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.read_speed ? (entry.read_speed / 1024).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.write_speed ? (entry.write_speed / 1024).toFixed(2) : "N/A"}</td>
                        <td className="border border-gray-300 p-2">{entry.read_count || 0}</td>
                        <td className="border border-gray-300 p-2">{entry.write_count || 0}</td>
                      </>
                    )}
                    {selectedResource === "processes" && (
                      <td className="border border-gray-300 p-2">
                        <ul className="list-disc list-inside">
                          {entry.changes.map((change: any, idx: number) => (
                            <li key={idx}>
                              {change.action === "added" && `${change.name} (PID: ${change.pid}) añadido: CPU ${change.cpu_percent.toFixed(2)}%, Mem ${change.memory_percent.toFixed(2)}%`}
                              {change.action === "updated" && `${change.name} (PID: ${change.pid}) actualizado: CPU ${change.cpu_percent.toFixed(2)}%, Mem ${change.memory_percent.toFixed(2)}%`}
                              {change.action === "terminated" && `${change.name} (PID: ${change.pid}) terminado`}
                            </li>
                          ))}
                        </ul>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-black">
      <h1 className="text-2xl font-semibold mb-4">Reportes de Recursos</h1>
      <div className="mb-6">
        <label htmlFor="resource" className="mr-2 font-medium">Seleccionar recurso:</label>
        <select
          id="resource"
          value={selectedResource}
          onChange={handleResourceChange}
          className="p-2 border rounded bg-white text-black"
        >
          <option value="cpu">CPU</option>
          <option value="memory">RAM</option>
          <option value="network">Network</option>
          <option value="disk">Disk</option>
          <option value="processes">Processes</option>
        </select>
      </div>
      <div>
        {reports.length > 0 ? (
          reports.map(renderSummaryCard)
        ) : (
          <p>No hay reportes disponibles para este recurso.</p>
        )}
      </div>
      {selectedReport && renderDetailedTable(selectedReport)}
    </div>
  );
};

export default Reports;