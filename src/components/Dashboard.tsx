import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Select,
} from '@chakra-ui/react';
import { EnergyChart } from './EnergyChart';
import { EnergyData } from '../types';
import { energyService, authService } from '../services/supabase';

type TimeRangeType = '1h' | '2h' | '4h' | '6h' | '12h' | '24h' | '7d' | '30d';

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('1h');

  useEffect(() => {
    console.log('Dashboard monté, chargement initial des données...');
    loadData();
    // Rafraîchir les données toutes les 2 minutes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, [timeRange]); // Recharger les données quand la plage change

  const getMillisecondsForTimeRange = (range: TimeRangeType): number => {
    const hour = 3600000; // 1 heure en millisecondes
    const day = hour * 24;
    switch (range) {
      case '1h': return hour;
      case '2h': return hour * 2;
      case '4h': return hour * 4;
      case '6h': return hour * 6;
      case '12h': return hour * 12;
      case '24h': return day;
      case '7d': return day * 7;
      case '30d': return day * 30;
      default: return hour;
    }
  };

  const loadData = async () => {
    console.log('Début du chargement des données...');
    try {
      const duration = getMillisecondsForTimeRange(timeRange);
      const data = await energyService.getEnergyDataForDuration(duration);
      console.log('Données reçues:', data);
      setEnergyData(data);
      setError(null);
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      setError(error.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(event.target.value as TimeRangeType);
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur de déconnexion:', error);
      setError(error.message || 'Erreur de déconnexion');
    }
  };

  if (isLoading) {
    return <Box p={4}>Chargement...</Box>;
  }

  return (
    <Box p={4}>
      <VStack gap={4} align="stretch">
        <HStack justify="space-between">
          <Heading>Dashboard Énergétique</Heading>
          <Button colorScheme="red" onClick={handleSignOut}>
            Se déconnecter
          </Button>
        </HStack>

        {error && (
          <Box p={4} bg="red.100" color="red.900" borderRadius="md">
            <Text>Erreur: {error}</Text>
          </Box>
        )}

        <Box>
          <Select value={timeRange} onChange={handleTimeRangeChange} maxWidth="200px">
            <option value="1h">1 heure</option>
            <option value="2h">2 heures</option>
            <option value="4h">4 heures</option>
            <option value="6h">6 heures</option>
            <option value="12h">12 heures</option>
            <option value="24h">24 heures</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </Select>
        </Box>

        {energyData.length === 0 ? (
          <Box p={4} bg="yellow.100" color="yellow.900" borderRadius="md">
            <Text>Aucune donnée disponible pour la période sélectionnée</Text>
          </Box>
        ) : (
          <Box p={4} borderWidth={1} borderRadius={8} boxShadow="lg">
            <Heading size="md" mb={4}>Consommation et Production</Heading>
            <EnergyChart 
              data={energyData}
              type="bar"
              series={['production', 'consumption']}
            />
          </Box>
        )}
      </VStack>
    </Box>
  );
}; 