"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function ConfigPage() {
  const [config, setConfig] = useState({
    save_interval: 60,
    thresholds: { cpu_usage: 80, ram_usage: 75, disk_usage: 90, network_usage: 1000000 },
    update_frequency: 1,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConfig = async () => {
      const token = Cookies.get("token");
      console.log("Token en el frontend:", token); // Depuración
      if (!token) {
        console.log("No hay token, redirigiendo a /login");
        router.push("/login");
        return;
      }
      const res = await fetch("http://localhost:8000/config/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Respuesta del backend:", res.status, res.statusText); // Depuración
      if (res.status === 401) {
        console.log("Token no válido, redirigiendo a /login");
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        console.log("Datos recibidos:", data); // Depuración
        setConfig(data);
      } else {
        console.error("Error al obtener configuración:", res.status, res.statusText);
      }
      setLoading(false);
    };
    fetchConfig();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes("thresholds.")) {
      const key = name.split(".")[1];
      setConfig((prev) => ({
        ...prev,
        thresholds: { ...prev.thresholds, [key]: parseInt(value) || 0 },
      }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("token");
    console.log("Token en el submit:", token); // Depuración
    if (!token) {
      router.push("/login");
      return;
    }
    const res = await fetch("http://localhost:8000/config/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(config),
    });
    console.log("Respuesta del POST:", res.status, res.statusText); // Depuración
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      alert("Configuración guardada con éxito");
      router.push("/main/home");
    } else {
      console.error("Error al guardar configuración:", res.status, res.statusText);
      alert("Error al guardar la configuración");
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="flex h-screen bg-gray-100 justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Configuración</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Intervalo de guardado (segundos)</label>
            <input
              type="number"
              name="save_interval"
              value={config.save_interval}
              onChange={handleChange}
              className="w-full p-2 border rounded text-gray-900"
              min="10"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Frecuencia de actualización (segundos)</label>
            <input
              type="number"
              name="update_frequency"
              value={config.update_frequency}
              onChange={handleChange}
              className="w-full p-2 border rounded text-gray-900"
              min="1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Umbral CPU (%)</label>
            <input
              type="number"
              name="thresholds.cpu_usage"
              value={config.thresholds.cpu_usage}
              onChange={handleChange}
              className="w-full p-2 border rounded text-gray-900"
              min="0"
              max="100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Umbral RAM (%)</label>
            <input
              type="number"
              name="thresholds.ram_usage"
              value={config.thresholds.ram_usage}
              onChange={handleChange}
              className="w-full p-2 border rounded text-gray-900"
              min="0"
              max="100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Umbral Disco (%)</label>
            <input
              type="number"
              name="thresholds.disk_usage"
              value={config.thresholds.disk_usage}
              onChange={handleChange}
              className="w-full p-2 border rounded text-gray-900"
              min="0"
              max="100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Umbral Red (KB/s)</label>
            <input
              type="number"
              name="thresholds.network_usage"
              value={config.thresholds.network_usage}
              onChange={handleChange}
              className="w-full p-2 border rounded text-gray-900"
              min="0"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Guardar Configuración
          </button>
        </form>
      </div>
    </div>
  );
}