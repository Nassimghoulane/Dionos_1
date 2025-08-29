// components/MapComponent.tsx - Blue Dot Navigation
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

  // HTML avec Blue Dot Navigation sans contrôles de vitesse
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Navigation Blue Dot</title>
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
        </style>
    </head>
    <body>
        <div id="mappedin-map"></div>
        
        <div id="progress-hud" class="progress-hud">0%</div>
        <button id="walk-button" class="walk-button">Commencer</button>

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
            let interpolationFactor = 0;
            let lastUpdateTime = 0;
            
            const progressHud = document.getElementById('progress-hud');
            const walkButton = document.getElementById('walk-button');
            
            // Configuration de vitesse fixe
            const WALKING_SPEED = 600; // millisecondes par étape

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
                
                console.log('Lieux trouvés:', locations.length);
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

            // Activer le Blue Dot
            function enableBlueDot() {
                if (allLocations.length === 0) return;
                
                const startLocation = allLocations[0];
                currentLocation = startLocation.mappedinObject;
                
                console.log('Activation du Blue Dot à:', startLocation.name);
                
                try {
                    mapView.BlueDot.enable({
                        color: '#FF0000',
                        size: 50,
                        debug: true,
                        accuracyRing: {
                            color: '#FF0000',
                            opacity: 0.6,
                        },
                        heading: {
                            color: '#00FF00',
                            opacity: 1.0,
                            size: 25,
                        },
                        inactiveColor: '#FFFF00',
                        timeout: 300000,
                        watch: false                
                    });
                    
                    blueDotEnabled = true;
                    
                    setTimeout(() => {
                        const startCoord = startLocation.mappedinObject.center;
                        
                        mapView.BlueDot.update({
                            latitude: startCoord.y,
                            longitude: startCoord.x,
                            accuracy: 1,
                            heading: 45,
                            floorOrFloorId: startLocation.mappedinObject.floor.id,
                            timestamp: Date.now()
                        });
                        
                    }, 500);
                    
                    setTimeout(() => {
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
                            rank: 1000
                        });
                    }, 2000);
                    
                } catch (error) {
                    console.error('Erreur Blue Dot enable:', error);
                    
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
                
                mapView.on('blue-dot-position-update', (event) => {
                    console.log('Blue Dot position UPDATE:', event);
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'blueDotPositionUpdate',
                        coordinate: event.coordinate,
                        floor: event.floor,
                        accuracy: event.accuracy,
                        heading: event.heading
                    }));
                });

                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'locationSet',
                    location: startLocation.name
                }));
            }

            // Définir la destination
            function setDestination(destinationNameInput) {
                console.log('Recherche destination:', destinationNameInput);
                
                const destination = allLocations.find(location => 
                    location.name.toLowerCase().includes(destinationNameInput.toLowerCase())
                );
                
                if (!destination || !currentLocation) {
                    console.log('Destination ou position manquante');
                    return;
                }
                
                destinationLocation = destination.mappedinObject;
                console.log('Destination définie:', destination.name);
                
                mapView.Markers.add(destination.mappedinObject, \`
                    <div class="destination-marker">🎯 \${destination.name}</div>
                \`, {
                    rank: 500
                });
                
                setTimeout(() => {
                    startNavigation();
                }, 1000);
            }

            // Démarrer la navigation
            function startNavigation() {
                if (!currentLocation || !destinationLocation) {
                    console.log('Position ou destination manquante');
                    return;
                }
                
                console.log('Calcul du chemin de', currentLocation.name, 'vers', destinationLocation.name);
                
                try {
                    const directions = mapData.getDirections(currentLocation, destinationLocation);
                    if (!directions || !directions.coordinates || directions.coordinates.length === 0) {
                        console.log('Impossible de calculer le chemin');
                        return;
                    }
                    
                    console.log('Chemin calculé avec', directions.coordinates.length, 'points');
                    
                    mapView.Navigation.draw(directions, {
                        pathOptions: {
                            displayArrowsOnPath: true,
                            animateArrowsOnPath: true,
                            accentColor: '#FF9800',
                            thickness: 8,
                            nearRadius: 3.0,
                            farRadius: 3.0
                        }
                    });
                    
                    walkingPath = directions.coordinates;
                    currentWalkIndex = 0;
                    interpolationFactor = 0;
                    
                    let totalDistance = 0;
                    for (let i = 0; i < walkingPath.length - 1; i++) {
                        totalDistance += calculateDistance(walkingPath[i], walkingPath[i + 1]);
                    }
                    
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
                    
                    walkButton.style.display = 'block';
                    walkButton.textContent = 'Commencer la marche';
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'navigationStarted',
                        from: currentLocation.name,
                        to: destinationLocation.name,
                        distance: Math.round(totalDistance * 10),
                        pathLength: walkingPath.length
                    }));
                    
                } catch (error) {
                    console.error('Erreur navigation:', error);
                }
            }

            // Démarrer la marche
            function startBlueDotWalking() {
                if (walkingPath.length === 0 || isWalking) return;
                
                console.log('Début de la marche Blue Dot - Chemin de', walkingPath.length, 'points');
                isWalking = true;
                walkButton.textContent = 'Arrêter';
                walkButton.classList.add('walking');
                progressHud.style.display = 'block';
                
                currentWalkIndex = 0;
                interpolationFactor = 0;
                lastUpdateTime = Date.now();
                
                const ANIMATION_SPEED = 50;
                
                mapView.BlueDot.follow('position-heading');
                
                walkingInterval = setInterval(() => {
                    try {
                        if (currentWalkIndex >= walkingPath.length - 1 && interpolationFactor >= 1) {
                            console.log('Arrivé à destination !');
                            stopWalking(true);
                            return;
                        }
                        
                        const currentTime = Date.now();
                        const deltaTime = currentTime - lastUpdateTime;
                        const progressIncrement = deltaTime / WALKING_SPEED;
                        
                        interpolationFactor += progressIncrement;
                        
                        if (interpolationFactor >= 1 && currentWalkIndex < walkingPath.length - 1) {
                            currentWalkIndex++;
                            interpolationFactor = 0;
                        }
                        
                        if (currentWalkIndex >= walkingPath.length - 1) {
                            currentWalkIndex = walkingPath.length - 1;
                            interpolationFactor = Math.min(interpolationFactor, 1);
                        }
                        
                        const currentPoint = walkingPath[currentWalkIndex];
                        let nextPoint = walkingPath[Math.min(currentWalkIndex + 1, walkingPath.length - 1)];
                        
                        const interpolatedPosition = {
                            x: lerp(currentPoint.x, nextPoint.x, interpolationFactor),
                            y: lerp(currentPoint.y, nextPoint.y, interpolationFactor)
                        };
                        
                        let currentHeading = 0;
                        if (currentWalkIndex < walkingPath.length - 1) {
                            currentHeading = calculateHeading(currentPoint, nextPoint);
                        } else if (currentWalkIndex > 0) {
                            currentHeading = calculateHeading(walkingPath[currentWalkIndex - 1], currentPoint);
                        }
                        
                        if (blueDotEnabled) {
                            try {
                                mapView.BlueDot.update({
                                    latitude: interpolatedPosition.y,
                                    longitude: interpolatedPosition.x,
                                    accuracy: 1,
                                    heading: currentHeading,
                                    floorOrFloorId: currentLocation.floor.id,
                                    timestamp: Date.now()
                                });
                            } catch (error) {
                                console.error('Erreur mise à jour Blue Dot:', error);
                            }
                        }
                        
                        const totalProgress = Math.min(
                            Math.round(((currentWalkIndex + interpolationFactor) / walkingPath.length) * 100), 
                            100
                        );
                        progressHud.textContent = totalProgress + '%';
                        
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'walkingProgress',
                            progress: totalProgress,
                            currentStep: currentWalkIndex,
                            totalSteps: walkingPath.length,
                            position: interpolatedPosition,
                            heading: currentHeading,
                            interpolationFactor: interpolationFactor
                        }));
                        
                        lastUpdateTime = currentTime;
                        
                    } catch (error) {
                        console.error('Erreur dans boucle de marche:', error);
                        stopWalking(false);
                    }
                    
                }, ANIMATION_SPEED);
                
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'walkingStarted',
                    totalSteps: walkingPath.length
                }));
            }

            // Arrêter la marche
            function stopWalking(arrived = false) {
                console.log('Arrêt marche, arrivé:', arrived);
                
                if (walkingInterval) {
                    clearInterval(walkingInterval);
                    walkingInterval = null;
                }
                
                mapView.BlueDot.follow(false);
                
                isWalking = false;
                walkButton.classList.remove('walking');
                progressHud.style.display = 'none';
                
                if (arrived) {
                    walkButton.textContent = 'Arrivé !';
                    walkButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                    
                    setTimeout(() => {
                        walkButton.style.display = 'none';
                    }, 3000);
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'walkingCompleted'
                    }));
                } else {
                    walkButton.textContent = 'Commencer la marche';
                    walkButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                }
            }

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
                        
                        mapView.Navigation.clear();
                        
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
                    }
                } catch (e) {
                    console.error('Erreur parsing message:', e);
                }
            });

            // Initialisation
            async function initialize() {
                try {
                    console.log('Initialisation...');
                    
                    mapData = await getMapData(options);
                    console.log('Données chargées');
                    
                    mapView = await show3dMap(document.getElementById('mappedin-map'), mapData);
                    console.log('Vue 3D créée');
                    
                    setTimeout(() => {
                        allLocations = getAllLocations();
                        console.log('Total locations trouvées:', allLocations.length);
                        
                        if (allLocations.length === 0) {
                            console.error('AUCUNE LOCATION TROUVÉE !');
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
                        }
                        
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'locationsLoaded',
                            locations: allLocations.map(loc => ({
                                id: loc.id,
                                name: loc.name,
                                type: loc.type
                            }))
                        }));
                        
                        showSpaceLabels();
                        enableBlueDot();
                        
                        setTimeout(() => {
                            if (allLocations[0] && allLocations[0].mappedinObject) {
                                mapView.Camera.focusOn(allLocations[0].mappedinObject, {
                                    minZoom: 1000,
                                    maxZoom: 2000
                                });
                            }
                        }, 1000);
                        
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'mapLoaded',
                            blueDotEnabled: true,
                            totalLocations: allLocations.length,
                            firstLocation: allLocations[0]?.name
                        }));
                    }, 3000);
                    
                } catch (error) {
                    console.error('Erreur:', error);
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
          if (onMapMessage) {
            onMapMessage(data);
          }
          break;
        case 'walkingStarted':
          setIsWalking(true);
          break;
        case 'walkingProgress':
          setWalkingProgress(`${data.progress}% • ${data.currentStep}/${data.totalSteps}`);
          break;
        case 'walkingCompleted':
          setIsWalking(false);
          Vibration.vibrate([200, 100, 200, 100, 200]);
          Alert.alert(
            'Destination Atteinte !', 
            'Félicitations ! Vous avez suivi le Blue Dot jusqu\'à votre destination.',
            [{ text: 'Super !' }]
          );
          break;
        case 'blueDotPositionUpdate':
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

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Initialisation du Blue Dot Navigation...</Text>
          <Text style={styles.loadingSubText}>Préparation des algorithmes de déplacement</Text>
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

      {/* HUD de navigation */}
      {isNavigating && (
        <View style={styles.navigationHud}>
          <TouchableOpacity 
            style={styles.stopButton} 
            onPress={handleStopNavigation}
          >
            <Text style={styles.stopText}>✕</Text>
          </TouchableOpacity>
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
});