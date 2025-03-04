import { Cpu, MemoryStick, Network, Activity, Disc, Cog, LogOut, ClipboardMinus } from "lucide-react";
import { logout } from "@/utils/auth";
import { useRouter } from "next/navigation";

interface SidebarProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

const Sidebar = ({ selectedTab, setSelectedTab }: SidebarProps) => {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login"); // Redirigir al login después de cerrar sesión
  };

  return (
    <aside className="w-64 bg-black shadow-lg p-4 flex flex-col">
      <div className="flex items-center justify-center mb-6 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold text-center py-4">COMPONENTES</h2>
      </div>

      <button
        className={`flex items-center p-2 rounded-md mb-2 transition ${
          selectedTab === "cpu" ? "bg-blue-500 text-white" : "hover:bg-gray-800"
        }`}
        onClick={() => setSelectedTab("cpu")}
      >
        <Cpu className="w-5 h-5 mr-2" /> CPU
      </button>

      <button
        className={`flex items-center p-2 rounded-md mb-2 transition ${
          selectedTab === "ram" ? "bg-blue-500 text-white" : "hover:bg-gray-800"
        }`}
        onClick={() => setSelectedTab("ram")}
      >
        <MemoryStick className="w-5 h-5 mr-2" /> RAM
      </button>

      <button
        className={`flex items-center p-2 rounded-md mb-2 transition ${
          selectedTab === "network"
            ? "bg-blue-500 text-white"
            : "hover:bg-gray-800"
        }`}
        onClick={() => setSelectedTab("network")}
      >
        <Network className="w-5 h-5 mr-2" /> Red
      </button>

      <button
        className={`flex items-center p-2 rounded-md mb-2 transition ${
          selectedTab === "process"
            ? "bg-blue-500 text-white"
            : "hover:bg-gray-800"
        }`}
        onClick={() => setSelectedTab("process")}
      >
        <Activity className="w-5 h-5 mr-2" /> Procesos
      </button>
      <button
        className={`flex items-center p-2 rounded-md mb-2 transition ${
          selectedTab === "disk"
            ? "bg-blue-500 text-white"
            : "hover:bg-gray-800"
        }`}
        onClick={() => setSelectedTab("disk")}
      >
        <Disc className="w-5 h-5 mr-2" /> Disco
      </button>
      {/* Boton para ir a la pagina de configuraciones */}
      <button
        className={`flex items-center p-2 rounded-md mb-2 transition ${
          selectedTab === "config"
            ? "bg-blue-500 text-white"
            : "hover:bg-gray-800"
        }`}
        onClick={() => setSelectedTab("config")}
      >
        <Cog className="w-5 h-5 mr-2" /> Configuracion
      </button>
        {/* Boton para ir a la pagina de reportes*/}
      <button
        className={`flex items-center p-2 rounded-md mb-2 transition ${
          selectedTab === "reports"
            ? "bg-blue-500 text-white"
            : "hover:bg-gray-800"
        }`}
        onClick={() => setSelectedTab("reports")}
      >
        <ClipboardMinus className="w-5 h-5 mr-2" /> Reportes
      </button>

      {/* Botón de Logout */}
      <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 p-3 text-center">
      <LogOut />Cerrar Sesión
      </button>
    </aside>
  );
};

export default Sidebar;
