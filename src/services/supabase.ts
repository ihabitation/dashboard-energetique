import { createClient } from '@supabase/supabase-js';
import { EnergyData, DashboardConfig, User } from '../types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authService = {
  async signIn(email: string, password: string) {
    console.log('Tentative de connexion avec:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Erreur de connexion:', error.message);
      throw error;
    }
    console.log('Connexion réussie:', data);
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
};

interface HomeAssistantData {
  timestamp: string;
  entity_id: string;
  state: string;
  unit_of_measurement: string;
}

export const energyService = {
  async getAvailableSensors() {
    const { data, error } = await supabase
      .from('home_assistant_data')
      .select('*')
      .order('entity_id')
      .limit(100000);

    if (error) {
      console.error('Erreur lors de la récupération des capteurs:', error);
      throw error;
    }

    // Afficher les données brutes pour le débogage
    console.log('Données brutes de la table:', data);
    console.log('Nombre total d\'enregistrements:', data.length);
    console.log('Unités de mesure uniques:', Array.from(new Set(data.map(row => row.unit_of_measurement))));
    console.log('Capteurs uniques:', Array.from(new Set(data.map(row => row.entity_id))));

    // Filtrer les capteurs de puissance
    const powerSensors = Array.from(new Set(
      data
        .filter(row => row.unit_of_measurement === 'W')
        .map(row => row.entity_id)
    )).sort();

    console.log('Tous les capteurs disponibles:', powerSensors);
    console.log('Nombre total de capteurs de puissance:', powerSensors.length);
    
    // Afficher les détails de chaque capteur de puissance
    powerSensors.forEach(sensor => {
      const sensorData = data.filter(row => row.entity_id === sensor);
      console.log(`Détails du capteur ${sensor}:`, {
        nombreEnregistrements: sensorData.length,
        premierEnregistrement: sensorData[0],
        dernierEnregistrement: sensorData[sensorData.length - 1]
      });
    });

    return powerSensors;
  },

  async getEnergyDataForDuration(
    duration: number,
    productionSensor: string,
    consumptionSensor: string
  ): Promise<EnergyData[]> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - duration);

      console.log('Récupération des données avec les capteurs:', {
        productionSensor,
        consumptionSensor
      });

      // Récupérer les données de production
      const { data: productionData, error: productionError } = await supabase
        .from('home_assistant_data')
        .select('*')
        .eq('entity_id', productionSensor)
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: true });

      if (productionError) throw productionError;

      // Récupérer les données de consommation
      const { data: consumptionData, error: consumptionError } = await supabase
        .from('home_assistant_data')
        .select('*')
        .eq('entity_id', consumptionSensor)
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: true });

      if (consumptionError) throw consumptionError;

      // Créer un Map pour stocker les données par timestamp
      const dataMap = new Map<string, EnergyData>();

      // Traiter les données de production
      productionData?.forEach(data => {
        const timestamp = new Date(data.timestamp).getTime();
        const existingData = dataMap.get(timestamp.toString()) || {
          timestamp,
          production: 0,
          consumption: 0,
          unit: 'W'
        };
        existingData.consumption = Math.abs(parseFloat(data.state));
        dataMap.set(timestamp.toString(), existingData);
      });

      // Traiter les données de consommation
      consumptionData?.forEach(data => {
        const timestamp = new Date(data.timestamp).getTime();
        const existingData = dataMap.get(timestamp.toString()) || {
          timestamp,
          production: 0,
          consumption: 0,
          unit: 'W'
        };
        existingData.production = Math.abs(parseFloat(data.state));
        dataMap.set(timestamp.toString(), existingData);
      });

      // Convertir le Map en tableau et trier par timestamp
      const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

      console.log('Données brutes reçues:', {
        production: productionData?.length || 0,
        consumption: consumptionData?.length || 0
      });

      console.log('Données transformées:', {
        nombrePoints: result.length,
        premierPoint: result[0],
        dernierPoint: result[result.length - 1]
      });

      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  },

  async getSensorDataForDuration(duration: number, sensorId: string): Promise<{ timestamp: number; value: number; entity_id: string }[]> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - duration);

      const { data, error } = await supabase
        .from('home_assistant_data')
        .select('*')
        .eq('entity_id', sensorId)
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data.map(record => ({
        timestamp: new Date(record.timestamp).getTime(),
        value: parseFloat(record.state),
        entity_id: record.entity_id
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des données du capteur:', error);
      return [];
    }
  },

  async getLatestEnergyData(productionSensor: string, consumptionSensor: string): Promise<EnergyData | null> {
    try {
      const { data, error } = await supabase
        .from('home_assistant_data')
        .select('*')
        .or(`entity_id.eq.${productionSensor},entity_id.eq.${consumptionSensor}`)
        .order('timestamp', { ascending: false })
        .limit(2);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      // Créer un objet EnergyData avec les dernières valeurs
      const latestData: EnergyData = {
        timestamp: Date.now(),
        production: 0,
        consumption: 0,
        unit: 'W'
      };

      data.forEach(record => {
        if (record.entity_id === productionSensor) {
          latestData.consumption = Math.abs(parseFloat(record.state));
        } else if (record.entity_id === consumptionSensor) {
          latestData.production = Math.abs(parseFloat(record.state));
        }
      });

      return latestData;
    } catch (error) {
      console.error('Erreur lors de la récupération des dernières valeurs:', error);
      return null;
    }
  },
};

export const dashboardService = {
  async saveDashboard(config: DashboardConfig) {
    const { data, error } = await supabase
      .from('dashboards')
      .upsert(config)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getDashboard(userId: string) {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data as DashboardConfig;
  },
}; 