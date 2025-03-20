export interface SensorConfig {
  id: string;
  name: string;
  description?: string;
}

export interface SensorTypeConfig {
  power: SensorConfig[];
  temperature: SensorConfig[];
  humidity: SensorConfig[];
  co2: SensorConfig[];
}

export type SensorType = keyof SensorTypeConfig; 