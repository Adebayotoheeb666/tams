"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerJourneyChartProps {
  chartData: Array<{
    stage: string;
    customers: number;
  }>;
}

export function CustomerJourneyChart({ chartData }: CustomerJourneyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Distribution by Stage</CardTitle>
        <CardDescription>How many customers are at each stage of the journey</CardDescription>
      </CardHeader>
      <CardContent className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="customers" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
