// components/MapsTab.tsx - Interface pour carte persistante - VERSION CORRIGÉE
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';

interface MappedInLocation {
  id: string;
  name: string;
  type: string;
  description?: string;
  level?: string;
  rating?: number;
  distance?: string;
  walkingTime?: string;
  services?: string[];
  isOpen?: boolean;
  openingHours?: string;
  crowdLevel?: 'Faible' | 'Modéré' | 'Élevé';
}

interface MapState {
  selectedDestination: string;
  currentPosition: string;
  onLocationSelect: (locationName: string) => void;
  onMapMessage: (message: any) => void;
}

interface MapsTabProps {
  onNavigateToStore: (storeId?: string) => void;
  mapState: MapState;
  onDestinationChange: (destination: string) => void;
  onPositionChange: (position: string) => void;
  mapLocations?: any[];
}

export default function MapsTab({ 
  onNavigateToStore, 
  mapState, 
  onDestinationChange, 
  onPositionChange,
  mapLocations = []
}: MapsTabProps) {
  const { height: screenHeight } = Dimensions.get('window');
  
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const infoSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  
  const [showDestinations, setShowDestinations] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [selectedLocationInfo, setSelectedLocationInfo] = useState<MappedInLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableLocations, setAvailableLocations] = useState<MappedInLocation[]>([]);

  // Fonctions utilitaires memoized pour éviter les recalculs
  const getLocationTypeFromName = useCallback((name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('food') || lowerName.includes('restaurant')) return 'Restaurant';
    if (lowerName.includes('store') || lowerName.includes('shop')) return 'Shop';
    if (lowerName.includes('washroom') || lowerName.includes('toilet')) return 'Facilities';
    if (lowerName.includes('office')) return 'Services';
    if (lowerName.includes('grocery')) return 'Grocery';
    return 'Other';
  }, []);

  const generateDescription = useCallback((name: string, type: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('food') || lowerName.includes('restaurant')) {
      return 'Restaurant avec une variété de plats délicieux. Service rapide et ambiance conviviale.';
    }
    if (lowerName.includes('store')) {
      return 'Magasin proposant une sélection d\'articles de qualité. Personnel accueillant et prix compétitifs.';
    }
    if (lowerName.includes('washroom')) {
      return 'Sanitaires propres et modernes avec accès PMR. Nettoyage régulier toutes les heures.';
    }
    if (lowerName.includes('grocery')) {
      return 'Épicerie avec produits frais et articles de première nécessité. Ouvert tous les jours.';
    }
    return `${name} - Un lieu pratique et accessible pour vos besoins.`;
  }, []);

  const generateServices = useCallback((name: string): string[] => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('food') || lowerName.includes('restaurant')) {
      return ['Plats chauds', 'Boissons', 'Service rapide', 'Paiement carte'];
    }
    if (lowerName.includes('store')) {
      return ['Articles variés', 'Paiement carte', 'Conseils client', 'Échange/retour'];
    }
    if (lowerName.includes('washroom')) {
      return ['Accès PMR', 'Nettoyage régulier', 'Lave-mains automatique', 'Sèche-mains'];
    }
    if (lowerName.includes('grocery')) {
      return ['Produits frais', 'Épicerie fine', 'Paiement sans contact', 'Sacs réutilisables'];
    }
    return ['Service client', 'Accès facile'];
  }, []);

  const generateOpeningHours = useCallback((name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('washroom')) return '24h/24';
    if (lowerName.includes('office')) return '09h00 - 17h00';
    return '10h00 - 22h00';
  }, []);

  // Effect pour traiter les locations - OPTIMISÉ pour éviter useInsertionEffect
  useEffect(() => {
    if (mapLocations && mapLocations.length > 0) {
      // Utiliser setTimeout pour déférer la mise à jour et éviter useInsertionEffect
      const timeoutId = setTimeout(() => {
        const mappedLocations: MappedInLocation[] = mapLocations.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          type: getLocationTypeFromName(loc.name),
          description: generateDescription(loc.name, loc.type),
          level: 'Niveau 0',
          rating: 4.0 + Math.random() * 1.0,
          distance: `${50 + Math.floor(Math.random() * 200)}m`,
          walkingTime: `${1 + Math.floor(Math.random() * 5)} min`,
          services: generateServices(loc.name),
          isOpen: Math.random() > 0.2,
          openingHours: generateOpeningHours(loc.name),
          crowdLevel: ['Faible', 'Modéré', 'Élevé'][Math.floor(Math.random() * 3)] as 'Faible' | 'Modéré' | 'Élevé'
        }));
        
        setAvailableLocations(mappedLocations);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [mapLocations, getLocationTypeFromName, generateDescription, generateServices, generateOpeningHours]);

  // Memoized filtered locations pour éviter les recalculs
  const filteredLocations = useMemo(() => 
    availableLocations.filter(location =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (location.description && location.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [availableLocations, searchQuery]
  );

  // Handlers stables avec useCallback
  const handleDestinationSelect = useCallback((location: MappedInLocation) => {
    onDestinationChange(location.name);
    setShowDestinations(false);
    setSearchQuery('');
    hideDestinations();
  }, [onDestinationChange]);

  const handleLocationInfoPress = useCallback((location: MappedInLocation) => {
    setSelectedLocationInfo(location);
    showLocationInfoPanel();
  }, []);

  const clearDestination = useCallback(() => {
    onDestinationChange('');
  }, [onDestinationChange]);

  const clearCurrentPosition = useCallback(() => {
    onPositionChange('');
  }, [onPositionChange]);

  // Fonctions d'animation stables
  const showDestinationsPanel = useCallback(() => {
    if (availableLocations.length === 0) {
      return;
    }
    
    setShowDestinations(true);
    
    Animated.timing(slideAnim, {
      toValue: screenHeight * 0.4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [availableLocations.length, slideAnim, screenHeight]);

  const hideDestinations = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowDestinations(false);
    });
  }, [slideAnim, screenHeight]);

  const showLocationInfoPanel = useCallback(() => {
    setShowLocationInfo(true);
    Animated.timing(infoSlideAnim, {
      toValue: screenHeight * 0.25,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [infoSlideAnim, screenHeight]);

  const hideLocationInfoPanel = useCallback(() => {
    Animated.timing(infoSlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setShowLocationInfo(false);
      setSelectedLocationInfo(null);
    });
  }, [infoSlideAnim, screenHeight]);

  // Fonctions utilitaires memoized
  const getEmoji = useCallback((name: string, type: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('food') || lowerName.includes('restaurant')) return '🍔';
    if (lowerName.includes('store') || lowerName.includes('shop')) return '🛍️';
    if (lowerName.includes('washroom') || lowerName.includes('toilet')) return '🚻';
    if (lowerName.includes('office')) return 'ℹ️';
    if (lowerName.includes('grocery')) return '🛒';
    return '📍';
  }, []);

  const getCrowdLevelColor = useCallback((level?: string) => {
    switch (level) {
      case 'Faible': return '#22c55e';
      case 'Modéré': return '#f59e0b';
      case 'Élevé': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  // Composant de rendu memoized pour la performance
  const renderLocationItem = useCallback(({ item }: { item: MappedInLocation }) => {
    const emoji = getEmoji(item.name, item.type);
    
    return (
      <View style={styles.destinationCard}>
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => handleLocationInfoPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>{emoji}</Text>
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.cardDetails}>
              {item.level && (
                <Text style={styles.cardLevel}>{item.level}</Text>
              )}
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingNumber}>{item.rating.toFixed(1)}</Text>
                </View>
              )}
              {item.walkingTime && (
                <Text style={styles.cardDistance}>{item.walkingTime}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.goToButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDestinationSelect(item);
            }}
          >
            <Text style={styles.goToIcon}>✓</Text>
            <Text style={styles.goToText}>Y aller</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  }, [getEmoji, handleLocationInfoPress, handleDestinationSelect]);

  const isLoading = mapLocations.length === 0;

  return (
    <>
      {/* Contrôles de destination - en haut */}
      {(mapState.selectedDestination || mapState.currentPosition) && (
        <View style={styles.topControls}>
          {mapState.currentPosition && (
            <View style={styles.positionChip}>
              <Text style={styles.chipText}>📍 {mapState.currentPosition}</Text>
              <TouchableOpacity
                style={styles.chipCloseButton}
                onPress={clearCurrentPosition}
              >
                <Text style={styles.chipCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {mapState.selectedDestination && (
            <View style={styles.destinationChip}>
              <Text style={styles.chipText}>🎯 {mapState.selectedDestination}</Text>
              <TouchableOpacity
                style={styles.chipCloseButton}
                onPress={clearDestination}
              >
                <Text style={styles.chipCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Bouton de recherche principal */}
      <View style={styles.searchButtonContainer}>
        <TouchableOpacity
          style={[
            styles.searchButton,
            isLoading && styles.searchButtonDisabled
          ]}
          onPress={showDestinationsPanel}
          disabled={isLoading}
        >
          <View style={styles.searchIconContainer}>
            <Text style={styles.searchIcon}>
              {isLoading ? '⏳' : '🔍'}
            </Text>
          </View>
          <Text style={styles.searchButtonText}>
            {isLoading 
              ? 'Chargement des destinations...' 
              : `Où voulez-vous aller ? (${availableLocations.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Panneau des destinations */}
      {showDestinations && (
        <Animated.View style={[
          styles.destinationsPanel, 
          { 
            top: slideAnim,
            height: screenHeight * 0.6,
          }
        ]}>
          <View style={styles.panelHandle} />
          
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              Destinations ({availableLocations.length})
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={hideDestinations}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterContainer}>
            <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
              <Text style={styles.filterIconActive}>📍</Text>
              <Text style={styles.filterTextActive}>Tout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterIcon}>🍔</Text>
              <Text style={styles.filterText}>Restaurants</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterIcon}>🚻</Text>
              <Text style={styles.filterText}>Toilettes</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredLocations}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.id}
            style={styles.destinationsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.destinationsContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isLoading ? 'Chargement...' : 'Aucune destination trouvée'}
                </Text>
              </View>
            }
          />
        </Animated.View>
      )}

      {/* Panneau d'informations détaillées */}
      {showLocationInfo && selectedLocationInfo && (
        <Animated.View style={[
          styles.locationInfoPanel, 
          { 
            top: infoSlideAnim,
            height: screenHeight * 0.75
          }
        ]}>
          <View style={styles.panelHandle} />
          
          <View style={styles.infoPanelHeader}>
            <View style={styles.infoHeaderContent}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>
                  {getEmoji(selectedLocationInfo.name, selectedLocationInfo.type)}
                </Text>
              </View>
              <View style={styles.infoTitleContainer}>
                <Text style={styles.infoTitle}>{selectedLocationInfo.name}</Text>
                <View style={styles.infoSubtitle}>
                  <Text style={styles.infoLevel}>{selectedLocationInfo.level}</Text>
                  {selectedLocationInfo.isOpen && (
                    <View style={styles.openStatusContainer}>
                      <View style={styles.openDot} />
                      <Text style={styles.openText}>Ouvert</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={hideLocationInfoPanel}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{selectedLocationInfo.walkingTime}</Text>
              <Text style={styles.metricLabel}>Temps de marche</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{selectedLocationInfo.distance}</Text>
              <Text style={styles.metricLabel}>Distance</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: getCrowdLevelColor(selectedLocationInfo.crowdLevel) }]}>
                {selectedLocationInfo.crowdLevel}
              </Text>
              <Text style={styles.metricLabel}>Affluence</Text>
            </View>
          </View>

          {selectedLocationInfo.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{selectedLocationInfo.description}</Text>
            </View>
          )}

          {selectedLocationInfo.services && selectedLocationInfo.services.length > 0 && (
            <View style={styles.servicesContainer}>
              <Text style={styles.servicesTitle}>Services disponibles</Text>
              <View style={styles.servicesGrid}>
                {selectedLocationInfo.services.map((service, index) => (
                  <View key={index} style={styles.serviceTag}>
                    <Text style={styles.serviceText}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => {
                handleDestinationSelect(selectedLocationInfo);
                hideLocationInfoPanel();
              }}
            >
              <Text style={styles.navigateIcon}>🧭</Text>
              <Text style={styles.navigateText}>Y aller</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  searchButtonDisabled: {
    opacity: 0.6,
  },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  topControls: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: 'column',
    gap: 8,
  },
  
  positionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  destinationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 133, 244, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  
  chipCloseButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  chipCloseText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  searchButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  searchIcon: {
    fontSize: 16,
  },
  
  searchButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  
  destinationsPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 5000,
  },
  
  locationInfoPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 6000,
  },
  
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  
  panelTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  
  filterButtonActive: {
    backgroundColor: '#4a5568',
  },
  
  filterIcon: {
    fontSize: 14,
    color: '#666',
  },
  
  filterIconActive: {
    fontSize: 14,
    color: '#ffffff',
  },
  
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  
  filterTextActive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  
  destinationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  destinationsContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  
  destinationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  cardIcon: {
    fontSize: 24,
  },
  
  cardInfo: {
    flex: 1,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  cardLevel: {
    fontSize: 14,
    color: '#666',
  },
  
  cardDistance: {
    fontSize: 14,
    color: '#666',
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  ratingStar: {
    fontSize: 14,
    color: '#fbbf24',
  },
  
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
  },
  
  goToButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 6,
    elevation: 2,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  goToIcon: {
    fontSize: 14,
    color: '#ffffff',
  },
  
  goToText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  separator: {
    height: 8,
  },
  
  infoPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  infoHeaderContent: {
    flexDirection: 'row',
    flex: 1,
  },
  
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  infoIcon: {
    fontSize: 28,
  },
  
  infoTitleContainer: {
    flex: 1,
  },
  
  infoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  
  infoSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  infoLevel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  openStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  
  openText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  metricDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  
  descriptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  
  servicesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  servicesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  serviceTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  
  serviceText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
  },
  
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  navigateIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  
  navigateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});