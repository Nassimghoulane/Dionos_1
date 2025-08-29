// components/MapsTab.tsx - Onglet dédié à la navigation
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import MapComponent from './MapComponent';

interface MappedInLocation {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface NavigationStep {
  instruction: string;
  distance: number;
  direction: string;
  completed: boolean;
}

interface MapsTabProps {
  onNavigateToStore: (storeId?: string) => void;
}

export default function MapsTab({ onNavigateToStore }: MapsTabProps) {
  // États de navigation
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPosition, setCurrentPosition] = useState<string>('');
  const [availableLocations, setAvailableLocations] = useState<MappedInLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  
  // États de navigation guidée
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalDistance, setTotalDistance] = useState<string>('');
  const [showNavigationPanel, setShowNavigationPanel] = useState(false);

  const filteredLocations = availableLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (location.description && location.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLocationSelect = (locationName: string) => {
    setCurrentPosition(locationName);
  };

  const handleDestinationSelect = (location: MappedInLocation) => {
    setSelectedLocation(location.name);
    setShowLocationPicker(false);
    setSearchQuery('');
  };

  const clearDestination = () => {
    setSelectedLocation('');
    setIsNavigating(false);
    setShowNavigationPanel(false);
  };

  const clearCurrentPosition = () => {
    setCurrentPosition('');
  };

  // Recevoir les messages depuis la carte
  const handleMapMessage = (message: any) => {
    switch (message.type) {
      case 'locationsLoaded':
        setAvailableLocations(message.locations);
        setIsLoadingLocations(false);
        break;
      case 'navigationStarted':
        setIsNavigating(true);
        setTotalDistance(`≈ ${message.distance}m`);
        break;
      case 'stepUpdated':
        setCurrentStepIndex(message.currentStep - 1);
        break;
      case 'navigationStopped':
        setIsNavigating(false);
        setNavigationSteps([]);
        setCurrentStepIndex(0);
        break;
    }
  };

  const getProgressPercentage = () => {
    if (navigationSteps.length === 0) return 0;
    return Math.round((currentStepIndex / (navigationSteps.length - 1)) * 100);
  };

  const getCurrentStepInstruction = () => {
    if (navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
      return navigationSteps[currentStepIndex].instruction;
    }
    return 'Navigation en cours...';
  };

  const getEmoji = (name: string, type: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('restaurant')) return '🍽️';
    if (lowerName.includes('food') || lowerName.includes('stall')) return '🍕';
    if (lowerName.includes('store') || lowerName.includes('shop')) return '🛍️';
    if (lowerName.includes('grocery')) return '🛒';
    if (lowerName.includes('toilet') || lowerName.includes('washroom')) return '🚻';
    if (lowerName.includes('elevator')) return '🛗';
    if (lowerName.includes('exit') || lowerName.includes('entrance')) return '🚪';
    if (lowerName.includes('info')) return 'ℹ️';
    if (lowerName.includes('atm')) return '🏧';
    if (lowerName.includes('security')) return '🛡️';
    if (lowerName.includes('parking')) return '🅿️';
    return '📍';
  };

  const renderLocationItem = ({ item }: { item: MappedInLocation }) => {
    const emoji = getEmoji(item.name, item.type);
    
    return (
      <TouchableOpacity
        style={styles.locationItem}
        onPress={() => handleDestinationSelect(item)}
      >
        <View style={styles.locationEmoji}>
          <Text style={styles.emojiText}>{emoji}</Text>
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.name}</Text>
          <Text style={styles.locationDescription}>Type: {item.type}</Text>
        </View>
        <Text style={styles.locationArrow}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Contrôles de navigation */}
      <View style={styles.navigationControls}>
        {/* Position actuelle */}
        {currentPosition && (
          <View style={styles.positionContainer}>
            <View style={styles.positionInfo}>
              <Text style={styles.positionText}>📍 Position: {currentPosition}</Text>
            </View>
            <TouchableOpacity
              style={styles.clearPositionButton}
              onPress={clearCurrentPosition}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Sélection de destination */}
        <View style={styles.destinationContainer}>
          <TouchableOpacity
            style={[
              styles.destinationButton,
              { backgroundColor: selectedLocation ? '#4CAF50' : '#007AFF' }
            ]}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.destinationButtonText}>
              {selectedLocation ? `🎯 ${selectedLocation}` : '🎯 Choisir une destination'}
            </Text>
          </TouchableOpacity>
          {selectedLocation && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearDestination}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>



      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapComponent 
          onLocationSelect={handleLocationSelect}
          selectedDestination={selectedLocation}
          onMapMessage={handleMapMessage}
        />
      </View>



      {/* Modal de sélection de destination */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎯 Destinations Disponibles</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowLocationPicker(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              📍 {availableLocations.length} lieux trouvés sur cette carte
            </Text>
            {isLoadingLocations && (
              <Text style={styles.loadingText}>Chargement des lieux...</Text>
            )}
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Rechercher un lieu..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredLocations}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.id}
            style={styles.locationsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isLoadingLocations ? '⏳ Chargement...' : '🔍 Aucun lieu trouvé'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {isLoadingLocations 
                    ? 'Récupération des lieux depuis Mappedin...'
                    : 'Essayez de modifier votre recherche'
                  }
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  navigationControls: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionInfo: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  positionText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  clearPositionButton: {
    backgroundColor: '#ff4444',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  destinationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#ff4444',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  mapContainer: {
    flex: 1,
  },
  
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  // Modal styles (identiques à l'original)
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 12,
    color: '#1976d2',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiText: {
    fontSize: 20,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationDescription: {
    fontSize: 13,
    color: '#666',
  },
  locationArrow: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 16,
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});