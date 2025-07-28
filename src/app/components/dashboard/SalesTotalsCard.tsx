'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ChevronDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import {
  salesAnalyticsService,
  SalesInterval,
  SalesIntervalEnum,
} from '@/services/firebase/salesAnalyticsService';
import { PRIVATE_ROUTES } from '@/constants/routes';

const SalesTotalsCard = () => {
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesInterval>({
    total: 0,
    orders: 0,
    period: 'Hoy',
  });
  const [selectedInterval, setSelectedInterval] = useState<SalesIntervalEnum>(
    SalesIntervalEnum.TODAY,
  );
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const intervals = [
    { value: SalesIntervalEnum.TODAY, label: 'Hoy' },
    { value: SalesIntervalEnum.CURRENT_MONTH, label: 'Mes Actual' },
    { value: SalesIntervalEnum.PREVIOUS_MONTH, label: 'Mes Anterior' },
  ];

  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        const data =
          await salesAnalyticsService.getSalesDataByInterval(selectedInterval);
        setSalesData(data);
      } catch {
        setSalesData({
          total: 0,
          orders: 0,
          period: 'Error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [selectedInterval]);

  const handleIntervalChange = (interval: SalesIntervalEnum) => {
    setSelectedInterval(interval);
    setShowDropdown(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const currentIntervalLabel = intervals.find(
    (interval) => interval.value === selectedInterval,
  )?.label;

  return (
    <Card
      className="hover:scale-105 transition-transform duration-300 cursor-pointer relative"
      onClick={() => router.push(PRIVATE_ROUTES.ORDERS)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-600">
            Ventas Totales
          </CardTitle>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            {/* Interval Selector */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-600 bg-cyan-50 rounded-md hover:bg-cyan-100 transition-colors"
              >
                {currentIntervalLabel}
                <ChevronDown className="h-3 w-3" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-32">
                  {intervals.map((interval) => (
                    <button
                      key={interval.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIntervalChange(interval.value);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                        selectedInterval === interval.value
                          ? 'bg-cyan-50 text-cyan-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {interval.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-cyan-900">
              {formatCurrency(salesData.total)}
            </div>
            <Badge variant="success" className="mt-2">
              {salesData.orders} órdenes
            </Badge>
            <p className="text-xs text-cyan-600 mt-1">{salesData.period}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesTotalsCard;
