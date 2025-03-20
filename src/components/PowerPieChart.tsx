import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PowerPieChartProps {
  production: number;
  consumption: number;
  title: string;
  unit?: string;
}

export const PowerPieChart: React.FC<PowerPieChartProps> = ({ production, consumption, title, unit = 'W' }) => {
  const data: ChartData<'pie'> = {
    labels: ['Production', 'Consommation'],
    datasets: [
      {
        data: [consumption, production],
        backgroundColor: [
          'rgb(255, 205, 86)', // Jaune pour la production
          'rgb(54, 162, 235)', // Bleu pour la consommation
        ],
        borderColor: [
          'rgb(255, 205, 86)',
          'rgb(54, 162, 235)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Pie data={data} options={options} />
    </div>
  );
}; 