import DiskChart from '@/components/DiskChart';
import React from 'react';

interface DiskData {
  percent: number;
  total: number;
  used: number;
  free?: number;
  read_speed?: number;
  write_speed?: number;
  read_count?: number;
  write_count?: number;
}

interface DiskmonitorProps {
  data: DiskData;
}

export const Diskmonitor: React.FC<DiskmonitorProps> = ({ data }) => {
  return (
    <div className="py-20">
      <DiskChart data={data} />
    </div>
  );
};