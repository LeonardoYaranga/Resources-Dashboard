import RAMChart from '@/components/RAMChart';
import React from 'react';

interface RAMData {
  usage: number;
  total: number;
  used: number;
  free: number;
  buffers?: number;
  cache?: number;
}

interface RAMmonitorProps {
  data: RAMData;
}

export const RAMmonitor: React.FC<RAMmonitorProps> = ({ data }) => {
  return (
    <div className="py-20">
      <RAMChart data={data} />
    </div>
  );
};