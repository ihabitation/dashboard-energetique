export interface EnergyData {
  timestamp: string;
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
  id: string;
  userId: string;
  name: string;
  charts: ChartConfig[];
  layout: {
    type: 'grid' | 'flex';
    columns: number;
  };
} 