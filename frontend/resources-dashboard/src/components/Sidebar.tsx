import { Cpu, MemoryStick, Network, Activity } from "lucide-react";

interface SidebarProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

const Sidebar = ({ selectedTab, setSelectedTab }: SidebarProps) => {
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
            selectedTab === "network" ? "bg-blue-500 text-white" : "hover:bg-gray-800"
            }`}
            onClick={() => setSelectedTab("network")}
        >
            <Network className="w-5 h-5 mr-2" /> Red
          </button>
        
        <button
            className={`flex items-center p-2 rounded-md mb-2 transition ${
            selectedTab === "process" ? "bg-blue-500 text-white" : "hover:bg-gray-800"
            }`}
            onClick={() => setSelectedTab("process")}
        >
            <Activity className="w-5 h-5 mr-2" /> Procesos
        </button>
    </aside>
  );
};

export default Sidebar;
