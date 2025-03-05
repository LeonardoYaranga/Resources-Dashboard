import NetworkChart from '@/components/NetworkChart';
import React from 'react';

interface NetworkData {
  speed_sent: number;
  speed_recv: number;
  packets_sent?: number;
  packets_recv?: number;
  errors_in?: number;
  errors_out?: number;
}

interface NetworkmonitorProps {
  data: NetworkData;
}

export const Networkmonitor: React.FC<NetworkmonitorProps> = ({ data }) => {
  return (
    <div className="py-20">
      <NetworkChart data={data} />
    </div>
  );
};