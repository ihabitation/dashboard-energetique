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
  async getEnergyData(timeRange: 'hour' | 'day' | 'month') {
    console.log('Récupération des données pour la période:', timeRange);
    
    const now = new Date();
    const startTime = new Date(now.getTime() - (timeRange === 'hour' ? 3600000 : timeRange === 'day' ? 86400000 : 2592000000));
    
    console.log('Période de recherche:', {
      début: startTime.toISOString(),
      fin: now.toISOString()
    });

    // Définition des identifiants exacts des capteurs
    const CONSUMPTION_SENSOR = 'sensor.ecu_current_power';
    const PRODUCTION_SENSOR = 'sensor.shellyproem50_08f9e0e6d6c8_em0_power';

    let query = supabase
      .from('home_assistant_data')
      .select('*')
      .in('entity_id', [CONSUMPTION_SENSOR, PRODUCTION_SENSOR])
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true });

    console.log('Exécution de la requête...');
    const { data, error } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }

    console.log('Données brutes reçues:', {
      nombreEnregistrements: data?.length || 0,
      premierEnregistrement: data?.[0],
      dernierEnregistrement: data?.[data.length - 1]
    });

    // Transformer les données pour correspondre à notre format
    const transformedData: EnergyData[] = [];
    let lastConsumption: string | null = null;
    let lastProduction: string | null = null;
    let lastTimestamp: string | null = null;

    (data as HomeAssistantData[]).forEach((row) => {
      const timestamp = row.timestamp;
      if (row.entity_id === CONSUMPTION_SENSOR) {
        lastConsumption = row.state;
        console.log('Nouvelle consommation:', { timestamp, valeur: row.state });
      } else if (row.entity_id === PRODUCTION_SENSOR) {
        lastProduction = row.state;
        console.log('Nouvelle production:', { timestamp, valeur: row.state });
      }

      if (lastConsumption !== null && lastProduction !== null && timestamp !== lastTimestamp) {
        transformedData.push({
          timestamp,
          consumption: Math.abs(parseFloat(lastConsumption)),
          production: Math.abs(parseFloat(lastProduction)),
          unit: 'W'
        });
        lastTimestamp = timestamp;
      }
    });

    console.log('Données transformées:', {
      nombrePoints: transformedData.length,
      premierPoint: transformedData[0],
      dernierPoint: transformedData[transformedData.length - 1]
    });

    return transformedData;
  },

  async getEnergyDataForDuration(durationMs: number): Promise<EnergyData[]> {
    const now = new Date();
    const startTime = new Date(now.getTime() - durationMs);
    
    // Définition des identifiants exacts des capteurs
    const CONSUMPTION_SENSOR = 'sensor.ecu_current_power';
    const PRODUCTION_SENSOR = 'sensor.shellyproem50_08f9e0e6d6c8_em0_power';

    const { data, error } = await supabase
      .from('home_assistant_data')
      .select('*')
      .in('entity_id', [CONSUMPTION_SENSOR, PRODUCTION_SENSOR])
      .gte('timestamp', startTime.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw new Error('Impossible de récupérer les données énergétiques');
    }

    // Transformer les données pour correspondre à notre format
    const transformedData: EnergyData[] = [];
    let lastConsumption: string | null = null;
    let lastProduction: string | null = null;
    let lastTimestamp: string | null = null;

    (data as HomeAssistantData[]).forEach((row) => {
      const timestamp = row.timestamp;
      if (row.entity_id === CONSUMPTION_SENSOR) {
        lastConsumption = row.state;
      } else if (row.entity_id === PRODUCTION_SENSOR) {
        lastProduction = row.state;
      }

      if (lastConsumption !== null && lastProduction !== null && timestamp !== lastTimestamp) {
        transformedData.push({
          timestamp,
          consumption: Math.abs(parseFloat(lastConsumption)),
          production: Math.abs(parseFloat(lastProduction)),
          unit: 'W'
        });
        lastTimestamp = timestamp;
      }
    });

    return transformedData;
  }
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