"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export interface TrendPoint {
  label: string;
  total: number;
  [subject: string]: string | number;
}

const COLORS = ["#4f46e5", "#0ea5e9", "#16a34a", "#ea580c", "#db2777", "#9333ea"];

export function NetTrendChart({
  data,
  subjects,
}: {
  data: TrendPoint[];
  subjects: string[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Toplam Net"
            stroke="#0f172a"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
          {subjects.map((s, i) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
