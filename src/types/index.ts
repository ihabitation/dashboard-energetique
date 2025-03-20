export type TimeRangeType = '1h' | '2h' | '4h' | '6h' | '12h' | '24h' | '7d' | '30d';

export interface EnergyData {
  timestamp: number;
  consumption: number;
  production: number;
  unit: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: EnergyData[];
  timeRange: 'hour' | 'day' | 'month';
  series: string[];
}

export interface User {
  id: string;
  email: string;
}

export interface DashboardConfig {
  user_id: string;
  config: {
    productionSensor: string;
    consumptionSensor: string;
  };
} 