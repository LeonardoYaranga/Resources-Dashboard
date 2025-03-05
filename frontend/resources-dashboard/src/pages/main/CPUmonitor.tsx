import CPUChart from '@/components/CPUChart';
import React from 'react';

interface CPUData {
  usage: number;
  temp: number | null;
  frequency: number;
}

interface CPUmonitorProps {
  data: CPUData;
}

export const CPUmonitor: React.FC<CPUmonitorProps> = ({ data }) => {
  return (
    <div className="py-20">
      <CPUChart data={data} />
    </div>
  );
};