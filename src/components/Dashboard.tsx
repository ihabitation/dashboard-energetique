import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  FormControl,
  FormLabel,
  Container,
  SimpleGrid,
  Checkbox,
  CheckboxGroup,
} from '@chakra-ui/react';
import { EnergyChart } from './EnergyChart';
import { EnergyData } from '../types';
import { energyService, authService } from '../services/supabase';
import { sensorConfig } from '../config/sensors';
import { TimeRangeType } from '../types';
import { SensorType } from '../types/sensors';
import { PowerPieChart } from './PowerPieChart';

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [sensorData, setSensorData] = useState<Record<SensorType, { timestamp: number; value: number; entity_id: string }[]>>({
    power: [],
    temperature: [],
    humidity: [],
    co2: []
  });
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('6h');
  const [visibleCharts, setVisibleCharts] = useState<SensorType[]>(['power']);
  const [selectedSensors, setSelectedSensors] = useState<Record<SensorType, string[]>>({
    power: [],
    temperature: [],
    humidity: [],
    co2: []
  });
  const [period, setPeriod] = useState<number>(6); // 6 heures par défaut
  const [currentValues, setCurrentValues] = useState({ production: 0, consumption: 0 });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    console.log('Dashboard monté, chargement initial des données...');
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // Initialiser les capteurs sélectionnés pour chaque type
        const initialSensors: Record<SensorType, string[]> = {
          power: sensorConfig.power.map(s => s.id),
          temperature: sensorConfig.temperature.map(s => s.id),
          humidity: sensorConfig.humidity.map(s => s.id),
          co2: sensorConfig.co2.map(s => s.id)
        };
        setSelectedSensors(initialSensors);
        
        // Charger les données initiales
        await loadData();
      } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (Object.values(selectedSensors).some(sensors => sensors.length > 0)) {
      console.log('Chargement des données avec les capteurs:', selectedSensors);
      loadData();
    }
  }, [timeRange, selectedSensors]);

  // Ajouter un intervalle de rafraîchissement pour les valeurs actuelles
  useEffect(() => {
    if (selectedSensors.power.length >= 2) {
      const updateCurrentValues = async () => {
        try {
          const latestData = await energyService.getLatestEnergyData(
            selectedSensors.power[0],
            selectedSensors.power[1]
          );
          if (latestData) {
            setCurrentValues({
              production: latestData.production,
              consumption: latestData.consumption
            });
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour des valeurs actuelles:', error);
        }
      };

      // Mise à jour immédiate
      updateCurrentValues();

      // Mise à jour toutes les 2 minutes
      const interval = setInterval(updateCurrentValues, 120000);
      return () => clearInterval(interval);
    }
  }, [selectedSensors.power]);

  const getMillisecondsForTimeRange = (range: TimeRangeType): number => {
    const hour = 3600000;
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
      setIsLoading(true);
      const duration = getMillisecondsForTimeRange(timeRange);

      // Charger les données de puissance si des capteurs sont sélectionnés
      if (selectedSensors.power.length >= 2) {
        const powerData = await energyService.getEnergyDataForDuration(
          duration,
          selectedSensors.power[0],
          selectedSensors.power[1]
        );
        setEnergyData(powerData);
      }

      // Charger les données des autres types de capteurs
      const newSensorData = { ...sensorData };
      for (const type of ['temperature', 'humidity', 'co2'] as SensorType[]) {
        if (selectedSensors[type].length > 0) {
          // Charger les données pour chaque capteur sélectionné
          const allData = await Promise.all(
            selectedSensors[type].map(sensorId =>
              energyService.getSensorDataForDuration(duration, sensorId)
            )
          );

          // Combiner les données de tous les capteurs
          const combinedData = allData.flat().sort((a, b) => a.timestamp - b.timestamp);
          newSensorData[type] = combinedData;
        }
      }
      setSensorData(newSensorData);

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

  const handleSensorSelection = (type: SensorType, sensorId: string, isSelected: boolean) => {
    setSelectedSensors(prev => ({
      ...prev,
      [type]: isSelected 
        ? [...prev[type], sensorId]
        : prev[type].filter(id => id !== sensorId)
    }));
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

  const calculateStats = () => {
    if (energyData.length === 0) return { currentProduction: 0, currentConsumption: 0, totalProduction: 0, totalConsumption: 0 };

    // Calculer les totaux en kWh (puissance en W * intervalle de 2 minutes en heures)
    const intervalInHours = 2 / 60; // 2 minutes en heures
    const totalProduction = energyData.reduce((sum, data) => sum + (data.production * intervalInHours), 0);
    const totalConsumption = energyData.reduce((sum, data) => sum + (data.consumption * intervalInHours), 0);

    return {
      currentProduction: currentValues.production,
      currentConsumption: currentValues.consumption,
      totalProduction,
      totalConsumption,
    };
  };

  const stats = calculateStats();

  const handleChartVisibilityChange = (value: SensorType[]) => {
    setVisibleCharts(value);
  };

  const renderChart = (type: SensorType) => {
    if (!visibleCharts.includes(type)) return null;

    const sensors = sensorConfig[type];
    if (sensors.length === 0) return null;

    return (
      <Card bg={bgColor} borderWidth={1} borderColor={borderColor} mb={4} width="100%">
        <CardBody>
          <VStack spacing={4} align="stretch" width="100%">
            <Heading size="md">
              {type === 'power' ? 'Consommation et Production' :
               type === 'temperature' ? 'Températures' :
               type === 'humidity' ? 'Humidité' : 'CO2'}
            </Heading>
            
            <CheckboxGroup value={selectedSensors[type]}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {sensors.map(sensor => (
                  <Checkbox
                    key={sensor.id}
                    value={sensor.id}
                    onChange={(e) => handleSensorSelection(type, sensor.id, e.target.checked)}
                  >
                    {sensor.name}
                  </Checkbox>
                ))}
              </SimpleGrid>
            </CheckboxGroup>

            {selectedSensors[type].length > 0 && (
              <Box height="300px" width="100%">
                <EnergyChart 
                  data={type === 'power' ? energyData : sensorData[type]}
                  type="line"
                  series={selectedSensors[type]}
                />
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  if (isLoading) {
    return <Box p={4}>Chargement...</Box>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch" width="100%">
        <HStack justify="space-between">
          <Heading>Tableau de Bord Énergétique</Heading>
          <Button colorScheme="red" onClick={handleSignOut}>
            Se déconnecter
          </Button>
        </HStack>

        {error && (
          <Box p={4} bg="red.100" color="red.900" borderRadius="md">
            <Text>Erreur: {error}</Text>
          </Box>
        )}

        <Card>
          <CardBody>
            <VStack spacing={6} width="100%">
              <Grid templateColumns="repeat(4, 1fr)" gap={4} width="100%">
                <GridItem>
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Production Actuelle</StatLabel>
                        <StatNumber>{stats.currentConsumption.toFixed(1)} W</StatNumber>
                        <StatHelpText>En temps réel</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </GridItem>
                <GridItem>
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Consommation Actuelle</StatLabel>
                        <StatNumber>{stats.currentProduction.toFixed(1)} W</StatNumber>
                        <StatHelpText>En temps réel</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </GridItem>
                <GridItem>
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Production Totale</StatLabel>
                        <StatNumber>{(stats.totalConsumption / 1000).toFixed(2)} kWh</StatNumber>
                        <StatHelpText>Sur la période</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </GridItem>
                <GridItem>
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Consommation Totale</StatLabel>
                        <StatNumber>{(stats.totalProduction / 1000).toFixed(2)} kWh</StatNumber>
                        <StatHelpText>Sur la période</StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </GridItem>
              </Grid>

              {/* Graphiques en camembert */}
              <Box mt={4}>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                      <CardBody>
                        <PowerPieChart 
                          production={stats.currentProduction} 
                          consumption={stats.currentConsumption}
                          title="Répartition Production/Consommation Actuelle"
                          unit="W"
                        />
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem>
                    <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                      <CardBody>
                        <PowerPieChart 
                          production={stats.totalProduction} 
                          consumption={stats.totalConsumption}
                          title="Répartition Production/Consommation Totale"
                          unit="kWh"
                        />
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              </Box>

              <FormControl>
                <FormLabel>Période</FormLabel>
                <Select value={timeRange} onChange={handleTimeRangeChange}>
                  <option value="1h">1 heure</option>
                  <option value="2h">2 heures</option>
                  <option value="4h">4 heures</option>
                  <option value="6h">6 heures</option>
                  <option value="12h">12 heures</option>
                  <option value="24h">24 heures</option>
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                </Select>
              </FormControl>

              <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                <CardBody>
                  <FormLabel>Types de graphes à afficher</FormLabel>
                  <CheckboxGroup value={visibleCharts} onChange={handleChartVisibilityChange}>
                    <HStack spacing={4}>
                      <Checkbox value="power">Consommation/Production</Checkbox>
                      <Checkbox value="temperature">Températures</Checkbox>
                      <Checkbox value="humidity">Humidité</Checkbox>
                      <Checkbox value="co2">CO2</Checkbox>
                    </HStack>
                  </CheckboxGroup>
                </CardBody>
              </Card>

              {energyData.length === 0 ? (
                <Box p={4} bg="yellow.100" color="yellow.900" borderRadius="md">
                  <Text>Aucune donnée disponible pour la période sélectionnée</Text>
                </Box>
              ) : (
                <VStack spacing={4} width="100%">
                  {renderChart('power')}
                  {renderChart('temperature')}
                  {renderChart('humidity')}
                  {renderChart('co2')}
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}; 