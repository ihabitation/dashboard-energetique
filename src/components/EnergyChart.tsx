import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { EnergyData } from '../types';
import { sensorConfig } from '../config/sensors';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EnergyChartProps {
  data: EnergyData[] | { timestamp: number; value: number; entity_id: string }[];
  type: 'line' | 'bar';
  series: string[];
}

export const EnergyChart: React.FC<EnergyChartProps> = ({ data, type, series }) => {
  const isEnergyData = (data: any[]): data is EnergyData[] => {
    return data.length > 0 && 'production' in data[0] && 'consumption' in data[0];
  };

  const getSensorName = (sensorId: string): string => {
    // Chercher dans tous les types de capteurs
    for (const type of ['power', 'temperature', 'humidity', 'co2'] as const) {
      const sensor = sensorConfig[type].find(s => s.id === sensorId);
      if (sensor) return sensor.name;
    }
    return sensorId; // Fallback si le capteur n'est pas trouvé
  };

  const chartData = {
    labels: isEnergyData(data) 
      ? data.map(d => new Date(d.timestamp).toLocaleTimeString())
      : Array.from(new Set(data.map(d => new Date(d.timestamp).toLocaleTimeString()))),
    datasets: isEnergyData(data) 
      ? [
          {
            label: getSensorName(series[0]),
            data: data.map(d => d.consumption || null),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            spanGaps: true,
          },
          {
            label: getSensorName(series[1]),
            data: data.map(d => d.production || null),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            spanGaps: true,
          },
        ]
      : series.map((sensorId, index) => ({
          label: getSensorName(sensorId),
          data: data
            .filter(d => d.entity_id === sensorId)
            .map(d => d.value),
          borderColor: `hsl(${(index * 360) / series.length}, 70%, 50%)`,
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          spanGaps: true,
        })),
  };

  // Calculer les limites dynamiques pour l'axe Y
  const getYAxisLimits = () => {
    if (isEnergyData(data)) {
      return {
        beginAtZero: true,
        min: 0,
        max: undefined
      };
    } else {
      const values = data.map(d => (d as { value: number }).value).filter(v => v !== null);
      if (values.length === 0) return { beginAtZero: true, min: 0, max: undefined };
      
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const range = maxValue - minValue;
      
      return {
        beginAtZero: false,
        min: Math.floor(minValue - range * 0.1), // Ajouter 10% de marge en bas
        max: Math.ceil(maxValue + range * 0.1)   // Ajouter 10% de marge en haut
      };
    }
  };

  const yAxisLimits = getYAxisLimits();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: yAxisLimits.beginAtZero,
        min: yAxisLimits.min,
        max: yAxisLimits.max,
        title: {
          display: true,
          text: isEnergyData(data) ? 'Puissance (W)' : 'Valeur',
        },
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}; 