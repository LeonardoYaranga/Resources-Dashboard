
import NetworkChart from "@/components/NetworkChart";
import React, { useState } from 'react'

export const Networkmonitor = () => {
    const [monitoring, setMonitoring] = useState(false);

    return(
        <div className='py-20'>
            <NetworkChart monitoring={monitoring} />

            <div className="flex items-center justify-center space-x-4 py-8">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setMonitoring(true)}
                >
                    Iniciar Monitoreo
                </button>
                <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setMonitoring(false)}
                >
                    Detener Monitoreo
                </button>
            </div>
        </div>
    )
}



