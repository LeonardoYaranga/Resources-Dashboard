import { RAMChart } from '@/components/RAMChart';
import React, { useState } from 'react'

export const RAMmonitor = () => {
    const [monitoring, setMonitoring] = useState(false);
    
  return (
      <div className='py-20'>
            <RAMChart monitoring={monitoring} />  
          
        {/* Botones de control de monitoreo */}
        
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
