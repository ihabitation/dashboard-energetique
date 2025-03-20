# Dashboard Énergétique

Une application web React pour visualiser les données de consommation et de production d'énergie en temps réel.

## Fonctionnalités actuelles

- Authentification avec Supabase
- Visualisation des données en temps réel
- Graphique en barres pour la consommation et la production
- Plages horaires configurables (1h à 30 jours)
- Actualisation automatique toutes les 2 minutes
- Interface utilisateur responsive avec Chakra UI

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Un compte Supabase avec une base de données configurée

## Configuration

1. Créez un fichier `.env` à la racine du projet avec les variables suivantes :
```
REACT_APP_SUPABASE_URL=votre_url_supabase
REACT_APP_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez l'application en mode développement :
```bash
npm start
```

## Structure de la base de données

### Table `home_assistant_data`
- `timestamp` (timestamp)
- `entity_id` (string)
- `state` (string)
- `unit_of_measurement` (string)

### Capteurs utilisés
- Consommation : `sensor.ecu_current_power`
- Production : `sensor.shellyproem50_08f9e0e6d6c8_em0_power`

## Technologies utilisées

- React 18
- TypeScript
- Chakra UI
- Chart.js
- Supabase
- React Router

## État actuel du développement

- ✅ Authentification de base
- ✅ Visualisation des données en temps réel
- ✅ Graphique en barres
- ✅ Sélection de plage horaire
- ✅ Actualisation automatique
- ⏳ Sauvegarde des préférences utilisateur
- ⏳ Personnalisation du dashboard
- ⏳ Export des données
- ⏳ Notifications

## Prochaines étapes

1. Implémentation de la sauvegarde des préférences utilisateur
2. Ajout de graphiques supplémentaires (ligne, camembert)
3. Personnalisation du dashboard
4. Export des données
5. Système de notifications
6. Tests unitaires et d'intégration
7. Optimisation des performances

## Licence

MIT
