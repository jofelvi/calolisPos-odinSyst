'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  salesAnalyticsService,
  WeeklySalesData,
} from '@/services/firebase/salesAnalyticsService';
import Loader from '@/components/shared/Loader/Loader';

const WeeklySalesChart = () => {
  const [salesData, setSalesData] = useState<WeeklySalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSalesData = async () => {
      try {
        const data = await salesAnalyticsService.getWeeklySalesData();
        setSalesData(data);
      } catch {
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: WeeklySalesData;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-cyan-200 rounded-lg shadow-lg">
          <p className="font-semibold text-cyan-900">{label}</p>
          <p className="text-cyan-700">
            Ventas: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-cyan-600 text-sm">
            {payload[0].payload.orders} órdenes
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader text="Cargando datos de ventas..." />
      </div>
    );
  }

  const hasData = salesData.some((data) => data.sales > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-cyan-600 font-medium mb-2">
            Sin ventas esta semana
          </p>
          <p className="text-cyan-500 text-sm">
            Los datos aparecerán cuando tengas ventas pagadas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={salesData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
          <XAxis
            dataKey="day"
            stroke="#0891b2"
            fontSize={12}
            tick={{ fill: '#0891b2' }}
          />
          <YAxis
            stroke="#0891b2"
            fontSize={12}
            tick={{ fill: '#0891b2' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="sales"
            fill="url(#colorGradient)"
            radius={[4, 4, 0, 0]}
            stroke="#0891b2"
            strokeWidth={1}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.6} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklySalesChart;
