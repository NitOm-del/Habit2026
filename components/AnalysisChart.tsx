import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalysisChartProps {
  data: any[];
  dataKeys: { key: string; color: string; fill: string }[];
  height?: number;
}

export const AnalysisChart: React.FC<AnalysisChartProps> = ({ data, dataKeys, height = 150 }) => {
  return (
    <div className="w-full bg-white border border-gray-300 rounded-sm p-2" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 0,
            left: -20,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip 
            contentStyle={{ fontSize: '12px', borderRadius: '4px' }}
            itemStyle={{ padding: 0 }}
          />
          {dataKeys.map((dk) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              stroke={dk.color}
              fill={dk.fill}
              strokeWidth={2}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};