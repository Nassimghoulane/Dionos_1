// components/MapComponent.tsx - Blue Dot Navigation Améliorée
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface MapComponentProps {
  onLocationSelect?: (location: string) => void;
  selectedDestination?: string;
  onMapMessage?: (message: any) => void;
}

export default function MapComponent({ onLocationSelect, selectedDestination, onMapMessage }: MapComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkingProgress, setWalkingProgress] = useState<string>('');
  const webViewRef = useRef<WebView>(null);

  // HTML amélioré avec Blue Dot Navigation réaliste
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Navigation Blue Dot Réaliste</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            html, body {
                width: 100%;
                height: 100%;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #mappedin-map {
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            .progress-hud {
                position: absolute;
                top: 30px;
                right: 30px;
                background: rgba(76, 175, 80, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 700;
                z-index: 1000;
                display: none;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            
            .walk-button {
                position: absolute;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                border: none;
                padding: 18px 36px;
                border-radius: 35px;
                font-size: 18px;
                font-weight: 700;
                cursor: pointer;
                z-index: 1000;
                display: none;
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
            }
            
            .walk-button.walking {
                background: linear-gradient(135deg, #f44336, #d32f2f);
                box-shadow: 0 8px 25px rgba(244, 67, 54, 0.5);
            }

            .speed-controls {
                position: absolute;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                display: none;
                flex-direction: row;
                gap: 10px;
                z-index: 1000;
            }

            .speed-btn {
                background: rgba(33, 150, 243, 0.9);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .speed-btn.active {
                background: rgba(255, 152, 0, 0.9);
                transform: scale(1.1);
            }
            
            .destination-marker {
                background: linear-gradient(135deg, #FF5722, #E64A19);
                color: white;
                padding: 12px 18px;
                border-radius: 30px;
                box-shadow: 0 8px 20px rgba(255, 87, 34, 0.6);
                font-weight: bold;
                text-align: center;
                font-size: 16px;
                border: 3px solid white;
                animation: destinationPulse 1.5s infinite;
                position: relative;
                z-index: 50;
                white-space: nowrap;
            }
            
            @keyframes destinationPulse {
                0%, 100% { 
                    transform: scale(1); 
                }
                50% { 
                    transform: scale(1.1); 
                }
            }

            .info-panel {
                position: absolute;
                top: 30px;
                left: 30px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 15px;
                font-size: 12px;
                z-index: 1000;
                display: none;
                max-width: 200px;
            }
        </style>
    </head>
    <body>
        <div id="mappedin-map"></div>
        
        <div id="progress-hud" class="progress-hud">0%</div>
        <div id="info-panel" class="info-panel">
            <div>Vitesse: <span id="current-speed">Normale</span></div>
            <div>Distance: <span id="remaining-distance">0m</span></div>
            <div>ETA: <span id="eta">0min</span></div>
        </div>
        
        <div id="speed-controls" class="speed-controls">
            <button class="speed-btn" data-speed="slow">🐌 Lent</button>
            <button class="speed-btn active" data-speed="normal">🚶 Normal</button>
            <button class="speed-btn" data-speed="fast">🏃 Rapide</button>
        </div>
        
        <button id="walk-button" class="walk-button">🚶‍♂️ Commencer</button>

        <script type="module">
            import { getMapData, show3dMap } from 'https://cdn.jsdelivr.net/npm/@mappedin/mappedin-js@beta/lib/esm/index.js';
            
            let mapView;
            let mapData;
            let currentLocation = null;
            let destinationLocation = null;
            let allLocations = [];
            let walkingPath = [];
            let currentWalkIndex = 0;
            let walkingInterval = null;
            let isWalking = false;
            let blueDotEnabled = false;
            let currentSpeed = 'normal';
            let interpolationFactor = 0; // Pour l'interpolation fluide
            let lastUpdateTime = 0;
            
            const progressHud = document.getElementById('progress-hud');
            const walkButton = document.getElementById('walk-button');
            const speedControls = document.getElementById('speed-controls');
            const infoPanel = document.getElementById('info-panel');
            
            // Configuration des vitesses (en millisecondes par étape)
            const SPEED_CONFIGS = {
                slow: { interval: 1200, name: 'Lente', emoji: '🐌' },
                normal: { interval: 600, name: 'Normale', emoji: '🚶' },
                fast: { interval: 300, name: 'Rapide', emoji: '🏃' }
            };

            // Configuration Mappedin
            const options = {
                key: 'mik_yeBk0Vf0nNJtpesfu560e07e5',
                secret: 'mis_2g9ST8ZcSFb5R9fPnsvYhrX3RyRwPtDGbMGweCYKEq385431022',
                mapId: '65c0ff7430b94e3fabd5bb8c',
            };

            // Fonction d'interpolation linéaire
            function lerp(start, end, factor) {
                return start + (end - start) * factor;
            }

            // Calculer la distance entre deux points
            function calculateDistance(point1, point2) {
                const dx = point2.x - point1.x;
                const dy = point2.y - point1.y;
                return Math.sqrt(dx * dx + dy * dy);
            }

            // Calculer la direction entre deux points (en degrés)
            function calculateHeading(point1, point2) {
                const dx = point2.x - point1.x;
                const dy = point2.y - point1.y;
                let heading = Math.atan2(dx, dy) * (180 / Math.PI);
                // Normaliser entre 0 et 360
                if (heading < 0) heading += 360;
                return heading;
            }

            // Interpoler la direction pour éviter les sauts brusques
            function interpolateHeading(currentHeading, targetHeading, factor) {
                const diff = targetHeading - currentHeading;
                let shortestDiff = diff;
                
                // Prendre le chemin le plus court (gérer le wraparound 0-360)
                if (Math.abs(diff) > 180) {
                    if (diff > 0) {
                        shortestDiff = diff - 360;
                    } else {
                        shortestDiff = diff + 360;
                    }
                }
                
                let newHeading = currentHeading + shortestDiff * factor;
                if (newHeading < 0) newHeading += 360;
                if (newHeading >= 360) newHeading -= 360;
                
                return newHeading;
            }

            // Obtenir tous les lieux disponibles
            function getAllLocations() {
                if (!mapData) return [];
                
                const locations = [];
                const spaces = mapData.getByType('space');
                
                spaces.forEach(space => {
                    if (space.name && space.center) {
                        locations.push({
                            id: space.id,
                            name: space.name,
                            type: 'space',
                            mappedinObject: space
                        });
                    }
                });
                
                console.log('📍 Lieux trouvés:', locations.length);
                return locations;
            }

            // Afficher les labels des espaces
            function showSpaceLabels() {
                allLocations.forEach(location => {
                    mapView.Labels.add(location.mappedinObject, location.name, {
                        interactive: true
                    });
                });
            }

            // Activer le Blue Dot avec personnalisation FORCÉE
            function enableBlueDot() {
                if (allLocations.length === 0) return;
                
                const startLocation = allLocations[0];
                currentLocation = startLocation.mappedinObject;
                
                console.log('🔵 FORÇAGE activation du Blue Dot à:', startLocation.name);
                console.log('🔵 Coordonnées de départ:', startLocation.mappedinObject.center);
                console.log('🔵 Floor ID:', startLocation.mappedinObject.floor.id);
                
                try {
                    // MÉTHODE 1: Configuration Blue Dot standard mais avec debug activé
                    mapView.BlueDot.enable({
                        color: '#FF0000',           // ROUGE VIF pour être sûr de le voir
                        size: 50,                   // TRÈS GROS pour être visible
                        debug: true,                // DEBUG ACTIVÉ pour voir les logs
                        accuracyRing: {
                            color: '#FF0000',
                            opacity: 0.6,           // Plus opaque
                        },
                        heading: {
                            color: '#00FF00',       // VERT FLUO pour la direction
                            opacity: 1.0,
                            size: 25,               // Très visible
                        },
                        inactiveColor: '#FFFF00', // Jaune si inactif
                        timeout: 300000,          // 5 minutes avant inactif
                        watch: false                
                    });
                    
                    console.log('✅ Blue Dot enable() appelé');
                    blueDotEnabled = true;
                    
                    // ATTENDRE un peu avant de positionner
                    setTimeout(() => {
                        const startCoord = startLocation.mappedinObject.center;
                        
                        console.log('🔵 Positionnement FORCÉ du Blue Dot...');
                        console.log('🔵 Latitude:', startCoord.y);
                        console.log('🔵 Longitude:', startCoord.x);
                        console.log('🔵 Floor:', startLocation.mappedinObject.floor.id);
                        
                        // FORCER la position avec tous les paramètres
                        mapView.BlueDot.update({
                            latitude: startCoord.y,
                            longitude: startCoord.x,
                            accuracy: 1,              // Précision élevée
                            heading: 45,              // Direction visible (45°)
                            floorOrFloorId: startLocation.mappedinObject.floor.id,
                            timestamp: Date.now()     // Timestamp actuel
                        });
                        
                        console.log('✅ Blue Dot update() appelé avec force');
                        
                        // VÉRIFIER l'état du Blue Dot
                        setTimeout(() => {
                            console.log('🔍 Vérification état Blue Dot...');
                            console.log('🔍 BlueDot enabled:', mapView.BlueDot.isEnabled);
                            console.log('🔍 BlueDot state:', mapView.BlueDot.state);
                        }, 1000);
                        
                    }, 500);
                    
                    // MÉTHODE 2: Ajouter un marqueur de secours si le Blue Dot ne marche pas
                    setTimeout(() => {
                        console.log('🔴 Ajout marqueur de secours...');
                        mapView.Markers.add(startLocation.mappedinObject, \`
                            <div style="
                                background: radial-gradient(circle, #FF0000, #990000);
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                border: 4px solid white;
                                box-shadow: 0 0 20px rgba(255,0,0,0.8);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 20px;
                                animation: blueDotPulse 1s infinite;
                            ">
                                🔴
                            </div>
                            <style>
                                @keyframes blueDotPulse {
                                    0%, 100% { transform: scale(1); }
                                    50% { transform: scale(1.2); }
                                }
                            </style>
                        \`, {
                            rank: 1000  // Priority maximale
                        });
                        console.log('🔴 Marqueur de secours ajouté');
                    }, 2000);
                    
                } catch (error) {
                    console.error('❌ ERREUR Blue Dot enable:', error);
                    
                    // MÉTHODE DE SECOURS: Marqueur simple
                    console.log('🔴 Utilisation marqueur de secours suite à erreur');
                    mapView.Markers.add(startLocation.mappedinObject, \`
                        <div style="
                            background: #FF0000;
                            width: 50px;
                            height: 50px;
                            border-radius: 50%;
                            border: 5px solid white;
                            box-shadow: 0 0 30px rgba(255,0,0,1);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            color: white;
                            font-weight: bold;
                        ">
                            YOU
                        </div>
                    \`, {
                        rank: 1000
                    });
                }
                
                // Événements Blue Dot avec plus de logs
                mapView.on('blue-dot-position-update', (event) => {
                    console.log('📍 Blue Dot position UPDATE:', event);
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'blueDotPositionUpdate',
                        coordinate: event.coordinate,
                        floor: event.floor,
                        accuracy: event.accuracy,
                        heading: event.heading
                    }));
                });
                
                mapView.on('blue-dot-state-change', (event) => {
                    console.log('🔄 Blue Dot STATE CHANGE:', event);
                });
                
                mapView.on('blue-dot-error', (event) => {
                    console.error('💥 Blue Dot ERROR:', event);
                });

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'locationSet',
                    location: startLocation.name
                }));
            }

            // Définir la destination
            function setDestination(destinationNameInput) {
                console.log('🎯 Recherche destination:', destinationNameInput);
                
                const destination = allLocations.find(location => 
                    location.name.toLowerCase().includes(destinationNameInput.toLowerCase())
                );
                
                if (!destination || !currentLocation) {
                    console.log('❌ Destination ou position manquante');
                    return;
                }
                
                destinationLocation = destination.mappedinObject;
                console.log('✅ Destination définie:', destination.name);
                
                // Créer marqueur destination
                mapView.Markers.add(destination.mappedinObject, \`
                    <div class="destination-marker">🎯 \${destination.name}</div>
                \`, {
                    rank: 500
                });
                
                // Démarrer navigation
                setTimeout(() => {
                    startNavigation();
                }, 1000);
            }

            // Démarrer la navigation
            function startNavigation() {
                if (!currentLocation || !destinationLocation) {
                    console.log('❌ Position ou destination manquante');
                    return;
                }
                
                console.log('🧭 Calcul du chemin de', currentLocation.name, 'vers', destinationLocation.name);
                
                try {
                    const directions = mapData.getDirections(currentLocation, destinationLocation);
                    if (!directions || !directions.coordinates || directions.coordinates.length === 0) {
                        console.log('❌ Impossible de calculer le chemin');
                        return;
                    }
                    
                    console.log('✅ Chemin calculé avec', directions.coordinates.length, 'points');
                    
                    // Dessiner le chemin sur la carte
                    mapView.Navigation.draw(directions, {
                        pathOptions: {
                            displayArrowsOnPath: true,
                            animateArrowsOnPath: true,
                            accentColor: '#FF9800',      // Orange pour le chemin
                            thickness: 8,
                            nearRadius: 3.0,
                            farRadius: 3.0
                        }
                    });
                    
                    // Préparer les données de marche
                    walkingPath = directions.coordinates;
                    currentWalkIndex = 0;
                    interpolationFactor = 0;
                    
                    // Calculer la distance totale
                    let totalDistance = 0;
                    for (let i = 0; i < walkingPath.length - 1; i++) {
                        totalDistance += calculateDistance(walkingPath[i], walkingPath[i + 1]);
                    }
                    
                    // Positionner le Blue Dot au début du chemin
                    if (blueDotEnabled) {
                        const startCoord = walkingPath[0];
                        const initialHeading = walkingPath.length > 1 ? 
                            calculateHeading(walkingPath[0], walkingPath[1]) : 0;
                        
                        mapView.BlueDot.update({
                            latitude: startCoord.y,
                            longitude: startCoord.x,
                            accuracy: 0,
                            heading: initialHeading,
                            floorOrFloorId: currentLocation.floor.id
                        });
                    }
                    
                    // Afficher l'interface
                    walkButton.style.display = 'block';
                    speedControls.style.display = 'flex';
                    infoPanel.style.display = 'block';
                    walkButton.textContent = '🚶‍♂️ Commencer la marche';
                    
                    // Mettre à jour les infos
                    updateInfoPanel(totalDistance, walkingPath.length);
                    
                    // Notifier React Native
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'navigationStarted',
                        from: currentLocation.name,
                        to: destinationLocation.name,
                        distance: Math.round(totalDistance * 10), // Conversion approximative en mètres
                        pathLength: walkingPath.length
                    }));
                    
                } catch (error) {
                    console.error('❌ Erreur navigation:', error);
                }
            }

            // Mettre à jour le panneau d'informations
            function updateInfoPanel(remainingDistance, remainingSteps) {
                const speedConfig = SPEED_CONFIGS[currentSpeed];
                document.getElementById('current-speed').textContent = speedConfig.name;
                document.getElementById('remaining-distance').textContent = 
                    Math.round(remainingDistance * 10) + 'm';
                
                const eta = Math.round((remainingSteps * speedConfig.interval) / 1000 / 60);
                document.getElementById('eta').textContent = 
                    eta > 0 ? eta + 'min' : '<1min';
            }

            // Démarrer la marche avec mouvement fluide
            function startBlueDotWalking() {
                if (walkingPath.length === 0 || isWalking) return;
                
                console.log('🚶‍♂️ Début de la marche Blue Dot - Chemin de', walkingPath.length, 'points');
                isWalking = true;
                walkButton.textContent = '⏹️ Arrêter';
                walkButton.classList.add('walking');
                progressHud.style.display = 'block';
                
                // Reset des indices
                currentWalkIndex = 0;
                interpolationFactor = 0;
                lastUpdateTime = Date.now();
                
                const speedConfig = SPEED_CONFIGS[currentSpeed];
                const ANIMATION_SPEED = 50; // Mise à jour fluide toutes les 50ms
                
                // Activer le mode follow
                mapView.BlueDot.follow('position-heading');
                
                walkingInterval = setInterval(() => {
                    try {
                        // Vérifier si arrivé
                        if (currentWalkIndex >= walkingPath.length - 1 && interpolationFactor >= 1) {
                            console.log('🎉 Arrivé à destination !');
                            stopWalking(true);
                            return;
                        }
                        
                        // Calculer la progression basée sur le temps
                        const currentTime = Date.now();
                        const deltaTime = currentTime - lastUpdateTime;
                        const progressIncrement = deltaTime / speedConfig.interval;
                        
                        interpolationFactor += progressIncrement;
                        
                        // Passer au segment suivant si nécessaire
                        if (interpolationFactor >= 1 && currentWalkIndex < walkingPath.length - 1) {
                            currentWalkIndex++;
                            interpolationFactor = 0;
                        }
                        
                        // S'assurer qu'on ne dépasse pas la fin
                        if (currentWalkIndex >= walkingPath.length - 1) {
                            currentWalkIndex = walkingPath.length - 1;
                            interpolationFactor = Math.min(interpolationFactor, 1);
                        }
                        
                        // Calculer la position interpolée
                        const currentPoint = walkingPath[currentWalkIndex];
                        let nextPoint = walkingPath[Math.min(currentWalkIndex + 1, walkingPath.length - 1)];
                        
                        // Position interpolée
                        const interpolatedPosition = {
                            x: lerp(currentPoint.x, nextPoint.x, interpolationFactor),
                            y: lerp(currentPoint.y, nextPoint.y, interpolationFactor)
                        };
                        
                        // Calculer la direction actuelle et future
                        let currentHeading = 0;
                        if (currentWalkIndex < walkingPath.length - 1) {
                            currentHeading = calculateHeading(currentPoint, nextPoint);
                        } else if (currentWalkIndex > 0) {
                            currentHeading = calculateHeading(walkingPath[currentWalkIndex - 1], currentPoint);
                        }
                        
                        console.log(\`🚶‍♂️ Position: (\${interpolatedPosition.x.toFixed(2)}, \${interpolatedPosition.y.toFixed(2)}) - Direction: \${currentHeading.toFixed(1)}°\`);
                        
                        // Mettre à jour la position du Blue Dot AVEC VÉRIFICATIONS
                        if (blueDotEnabled) {
                            console.log('🔵 Tentative de mise à jour Blue Dot...');
                            console.log('🔵 Position:', interpolatedPosition.x.toFixed(2), interpolatedPosition.y.toFixed(2));
                            console.log('🔵 Heading:', currentHeading.toFixed(1), '°');
                            
                            try {
                                mapView.BlueDot.update({
                                    latitude: interpolatedPosition.y,
                                    longitude: interpolatedPosition.x,
                                    accuracy: 1,
                                    heading: currentHeading,
                                    floorOrFloorId: currentLocation.floor.id,
                                    timestamp: Date.now()
                                });
                                console.log('✅ Blue Dot mis à jour avec succès');
                            } catch (error) {
                                console.error('❌ Erreur mise à jour Blue Dot:', error);
                                
                                // MÉTHODE DE SECOURS: Déplacer le marqueur de secours
                                console.log('🔴 Utilisation du marqueur de secours pour le mouvement');
                                try {
                                    // Supprimer l'ancien marqueur
                                    mapView.Markers.removeAll();
                                    
                                    // Ajouter nouveau marqueur à la position actuelle
                                    const currentSpace = allLocations[0].mappedinObject; // Utiliser un space proche
                                    mapView.Markers.add(currentSpace, \`
                                        <div style="
                                            background: radial-gradient(circle, #FF0000, #990000);
                                            width: 40px;
                                            height: 40px;
                                            border-radius: 50%;
                                            border: 4px solid white;
                                            box-shadow: 0 0 20px rgba(255,0,0,0.8);
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-size: 16px;
                                            color: white;
                                            font-weight: bold;
                                            transform: translate(\${(interpolatedPosition.x - currentSpace.center.x) * 100}px, \${(interpolatedPosition.y - currentSpace.center.y) * 100}px);
                                        ">
                                            \${Math.round(currentHeading)}°
                                        </div>
                                    \`, {
                                        rank: 1000
                                    });
                                } catch (markerError) {
                                    console.error('❌ Erreur marqueur secours:', markerError);
                                }
                            }
                        } else {
                            console.log('⚠️ Blue Dot non activé, tentative de réactivation...');
                            enableBlueDot();
                        }
                        
                        // Mettre à jour la progression
                        const totalProgress = Math.min(
                            Math.round(((currentWalkIndex + interpolationFactor) / walkingPath.length) * 100), 
                            100
                        );
                        progressHud.textContent = totalProgress + '%';
                        
                        // Calculer la distance restante
                        let remainingDistance = 0;
                        for (let i = currentWalkIndex; i < walkingPath.length - 1; i++) {
                            remainingDistance += calculateDistance(walkingPath[i], walkingPath[i + 1]);
                        }
                        remainingDistance *= (1 - interpolationFactor);
                        
                        updateInfoPanel(remainingDistance, walkingPath.length - currentWalkIndex);
                        
                        // Notifier React Native
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'walkingProgress',
                            progress: totalProgress,
                            currentStep: currentWalkIndex,
                            totalSteps: walkingPath.length,
                            position: interpolatedPosition,
                            heading: currentHeading,
                            interpolationFactor: interpolationFactor,
                            speed: currentSpeed
                        }));
                        
                        lastUpdateTime = currentTime;
                        
                    } catch (error) {
                        console.error('❌ Erreur dans boucle de marche:', error);
                        stopWalking(false);
                    }
                    
                }, ANIMATION_SPEED);
                
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'walkingStarted',
                    totalSteps: walkingPath.length,
                    speed: currentSpeed
                }));
            }

            // Arrêter la marche
            function stopWalking(arrived = false) {
                console.log('⏹️ Arrêt marche, arrivé:', arrived);
                
                if (walkingInterval) {
                    clearInterval(walkingInterval);
                    walkingInterval = null;
                }
                
                // Désactiver le mode follow
                mapView.BlueDot.follow(false);
                
                isWalking = false;
                walkButton.classList.remove('walking');
                progressHud.style.display = 'none';
                infoPanel.style.display = 'none';
                
                if (arrived) {
                    walkButton.textContent = '🎉 Arrivé !';
                    walkButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                    speedControls.style.display = 'none';
                    
                    setTimeout(() => {
                        walkButton.style.display = 'none';
                        speedControls.style.display = 'none';
                    }, 3000);
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'walkingCompleted'
                    }));
                } else {
                    walkButton.textContent = '🚶‍♂️ Commencer la marche';
                    walkButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                }
            }

            // Gérer les contrôles de vitesse
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('speed-btn')) {
                    // Mettre à jour les boutons actifs
                    document.querySelectorAll('.speed-btn').forEach(btn => 
                        btn.classList.remove('active')
                    );
                    e.target.classList.add('active');
                    
                    // Changer la vitesse
                    const newSpeed = e.target.dataset.speed;
                    if (newSpeed && SPEED_CONFIGS[newSpeed]) {
                        currentSpeed = newSpeed;
                        console.log('⚡ Vitesse changée:', SPEED_CONFIGS[newSpeed].name);
                        
                        // Si en cours de marche, redémarrer avec la nouvelle vitesse
                        if (isWalking) {
                            const wasWalking = true;
                            stopWalking(false);
                            setTimeout(() => {
                                if (wasWalking) startBlueDotWalking();
                            }, 100);
                        }
                    }
                }
            });

            // Event listener pour le bouton principal
            walkButton.addEventListener('click', () => {
                if (isWalking) {
                    stopWalking(false);
                } else {
                    startBlueDotWalking();
                }
            });

            // Gestion des messages de React Native
            window.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'setDestination') {
                        setDestination(data.destination);
                    } else if (data.type === 'stopNavigation') {
                        stopWalking(false);
                        walkButton.style.display = 'none';
                        speedControls.style.display = 'none';
                        infoPanel.style.display = 'none';
                        
                        // Nettoyer
                        mapView.Navigation.clear();
                        
                        // Réinitialiser le Blue Dot
                        if (blueDotEnabled && currentLocation) {
                            const startCoord = currentLocation.center;
                            mapView.BlueDot.update({
                                latitude: startCoord.y,
                                longitude: startCoord.x,
                                accuracy: 0,
                                heading: 0,
                                floorOrFloorId: currentLocation.floor.id
                            });
                        }
                    } else if (data.type === 'changeSpeed' && data.speed) {
                        if (SPEED_CONFIGS[data.speed]) {
                            currentSpeed = data.speed;
                            // Mettre à jour l'interface
                            document.querySelectorAll('.speed-btn').forEach(btn => {
                                btn.classList.toggle('active', btn.dataset.speed === data.speed);
                            });
                        }
                    }
                } catch (e) {
                    console.error('❌ Erreur parsing message:', e);
                }
            });

            // Initialisation
            async function initialize() {
                try {
                    console.log('⚡ Initialisation...');
                    
                    mapData = await getMapData(options);
                    console.log('✅ Données chargées');
                    
                    mapView = await show3dMap(document.getElementById('mappedin-map'), mapData);
                    console.log('✅ Vue 3D créée');
                    
                    setTimeout(() => {
                        allLocations = getAllLocations();
                        console.log('📍 Total locations trouvées:', allLocations.length);
                        console.log('📍 Première location:', allLocations[0]?.name);
                        
                        if (allLocations.length === 0) {
                            console.error('❌ AUCUNE LOCATION TROUVÉE !');
                            // Créer une location de test
                            allLocations = [{
                                id: 'test-location',
                                name: 'Position Test',
                                type: 'test',
                                mappedinObject: {
                                    id: 'test',
                                    name: 'Position Test',
                                    center: { x: 0, y: 0 },
                                    floor: { id: mapData.getByType('floor')[0]?.id || 'floor-1' }
                                }
                            }];
                            console.log('🔧 Location de test créée');
                        }
                        
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'locationsLoaded',
                            locations: allLocations.map(loc => ({
                                id: loc.id,
                                name: loc.name,
                                type: loc.type
                            }))
                        }));
                        
                        console.log('🏷️ Affichage des labels...');
                        showSpaceLabels();
                        
                        console.log('🔵 Activation du Blue Dot...');
                        enableBlueDot();
                        
                        // FORCER le focus sur le Blue Dot
                        setTimeout(() => {
                            console.log('📷 Focus sur la première location...');
                            if (allLocations[0] && allLocations[0].mappedinObject) {
                                mapView.Camera.focusOn(allLocations[0].mappedinObject, {
                                    minZoom: 1000,
                                    maxZoom: 2000
                                });
                            }
                        }, 1000);
                        
                        console.log('🎮 Prêt avec Blue Dot navigation fluide et debugging !');
                        
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'mapLoaded',
                            blueDotEnabled: true,
                            totalLocations: allLocations.length,
                            firstLocation: allLocations[0]?.name
                        }));
                    }, 3000); // Plus de temps pour être sûr
                    
                } catch (error) {
                    console.error('❌ Erreur:', error);
                }
            }

            initialize();
        </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapLoaded':
          setIsLoading(false);
          break;
        case 'locationsLoaded':
          if (onMapMessage) {
            onMapMessage(data);
          }
          break;
        case 'locationSet':
          if (onLocationSelect) {
            onLocationSelect(data.location);
          }
          break;
        case 'navigationStarted':
          setIsNavigating(true);
          Alert.alert(
            '🎯 Navigation Prête !', 
            'Le Blue Dot 🔵 vous représente. Choisissez votre vitesse et appuyez sur "Commencer" pour voir votre déplacement fluide !',
            [{ text: 'C\'est parti !' }]
          );
          if (onMapMessage) {
            onMapMessage(data);
          }
          break;
        case 'walkingStarted':
          setIsWalking(true);
          break;
        case 'walkingProgress':
          setWalkingProgress(`${data.progress}% • ${data.speed} • ${data.currentStep}/${data.totalSteps}`);
          break;
        case 'walkingCompleted':
          setIsWalking(false);
          Vibration.vibrate([200, 100, 200, 100, 200]);
          Alert.alert(
            '🎉 Destination Atteinte !', 
            'Félicitations ! Vous avez suivi le Blue Dot jusqu\'à votre destination.',
            [{ text: 'Super !' }]
          );
          break;
        case 'blueDotPositionUpdate':
          // Gestion des mises à jour de position du Blue Dot
          console.log('Position Blue Dot mise à jour:', data.coordinate);
          if (onMapMessage) {
            onMapMessage(data);
          }
          break;
      }
    } catch (error) {
      console.error('Erreur parsing message:', error);
    }
  };

  React.useEffect(() => {
    if (selectedDestination && webViewRef.current) {
      const message = JSON.stringify({
        type: 'setDestination',
        destination: selectedDestination
      });
      webViewRef.current.postMessage(message);
    }
  }, [selectedDestination]);

  const handleStopNavigation = () => {
    if (webViewRef.current) {
      const message = JSON.stringify({ type: 'stopNavigation' });
      webViewRef.current.postMessage(message);
      setIsNavigating(false);
      setIsWalking(false);
      setWalkingProgress('');
    }
  };

  const handleSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    if (webViewRef.current) {
      const message = JSON.stringify({
        type: 'changeSpeed',
        speed: speed
      });
      webViewRef.current.postMessage(message);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>🔵 Initialisation du Blue Dot Navigation...</Text>
          <Text style={styles.loadingSubText}>Préparation des algorithmes de déplacement fluide</Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {/* HUD de navigation amélioré */}
      {isNavigating && (
        <View style={styles.navigationHud}>
          <View style={styles.hudContent}>
            <Text style={styles.hudTitle}>
              {isWalking ? '🔵 Blue Dot en mouvement' : '🎯 Navigation prête'}
            </Text>
            {walkingProgress && (
              <Text style={styles.hudProgress}>{walkingProgress}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.stopButton} 
            onPress={handleStopNavigation}
          >
            <Text style={styles.stopText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contrôles de vitesse externes (optionnel) */}
      {isNavigating && !isWalking && (
        <View style={styles.externalSpeedControls}>
          <Text style={styles.speedLabel}>Vitesse de déplacement:</Text>
          <View style={styles.speedButtons}>
            <TouchableOpacity 
              style={[styles.speedBtn, styles.slowBtn]} 
              onPress={() => handleSpeedChange('slow')}
            >
              <Text style={styles.speedBtnText}>🐌 Lent</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.speedBtn, styles.normalBtn]} 
              onPress={() => handleSpeedChange('normal')}
            >
              <Text style={styles.speedBtnText}>🚶 Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.speedBtn, styles.fastBtn]} 
              onPress={() => handleSpeedChange('fast')}
            >
              <Text style={styles.speedBtnText}>🏃 Rapide</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    textAlign: 'center',
  },
  navigationHud: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hudContent: {
    flex: 1,
  },
  hudTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  hudProgress: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.9,
  },
  stopButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  stopText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  externalSpeedControls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
    zIndex: 1000,
  },
  speedLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  speedBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  slowBtn: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  normalBtn: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
  },
  fastBtn: {
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
  },
  speedBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});