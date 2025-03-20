import { SensorTypeConfig } from '../types/sensors';

export interface SensorConfig {
  id: string;
  name: string;
  description?: string;
}

export const sensorConfig: SensorTypeConfig = {
  power: [
    {
      id: 'sensor.ecu_current_power',
      name: 'Production ECU',
      description: 'Production d\'électricité de l\'ECU'
    },
    {
      id: 'sensor.shellyproem50_08f9e0e6d6c8_em0_power',
      name: 'Consommation Shelly',
      description: 'Consommation électrique mesurée par le Shelly'
    }
  ],
  temperature: [
    {
      id: 'sensor.temperature_salon',
      name: 'Température Salon',
      description: 'Température du salon'
    },
    {
      id: 'sensor.temperature_parents',
      name: 'Température Parents',
      description: 'Température Parents'
    },
    {
      id: 'sensor.temperature_bebe',
      name: 'Température Bebe',
      description: 'Température Bebe'
    }
  ],
  humidity: [
    {
      id: 'sensor.ecu_humidity',
      name: 'Humidité ECU',
      description: 'Humidité mesurée par l\'ECU'
    }
  ],
  co2: [
    {
      id: 'sensor.ecu_co2',
      name: 'CO2 ECU',
      description: 'Niveau de CO2 mesuré par l\'ECU'
    }
  ]
}; 