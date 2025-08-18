// App.tsx - Navigation Guidée + Click & Collect
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import MapComponent from './components/MapComponent';
import ClickCollectStore from './components/ClickCollectStore';
import ClickCollectCart from './components/ClickCollectCart';
import ClickCollectCheckout from './components/ClickCollectCheckout';
import ClickCollectOrders from './components/ClickCollectOrders';
import { ClickCollectProvider, useClickCollect } from './context/ClickCollectContext';

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

function AppContent() {
  const { state, actions } = useClickCollect();
  
  // États de navigation existants
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPosition, setCurrentPosition] = useState<string>('');
  const [availableLocations, setAvailableLocations] = useState<MappedInLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  
  // États de navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalDistance, setTotalDistance] = useState<string>('');
  const [showNavigationPanel, setShowNavigationPanel] = useState(false);
  
  // États Click & Collect
  const [showClickCollectMain, setShowClickCollectMain] = useState(false);
  const [showStoresList, setShowStoresList] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const filteredLocations = availableLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (location.description && location.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStores = state.stores.filter(store =>
    store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
    store.description?.toLowerCase().includes(storeSearchQuery.toLowerCase())
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
        setShowNavigationPanel(true);
        break;
      case 'stepUpdated':
        setCurrentStepIndex(message.currentStep - 1);
        break;
      case 'navigationStopped':
        setIsNavigating(false);
        setShowNavigationPanel(false);
        setNavigationSteps([]);
        setCurrentStepIndex(0);
        break;
    }
  };

  // Gérer la sélection d'un magasin Click & Collect
  const handleStoreSelect = (store: any) => {
    actions.setSelectedStore(store);
    setShowStoresList(false);
    setShowClickCollectMain(true);
  };

  // Naviguer vers un magasin depuis Click & Collect
  const handleNavigateToStore = (storeId?: string) => {
    const store = storeId ? actions.getStoreById(storeId) : state.selectedStore;
    if (store) {
      // Trouver la location correspondante dans Mappedin
      const mappedLocation = availableLocations.find(loc => 
        loc.id === store.mappedInLocationId || 
        loc.name.toLowerCase().includes(store.name.toLowerCase())
      );
      
      if (mappedLocation) {
        setSelectedLocation(mappedLocation.name);
        setShowClickCollectMain(false);
        setShowOrdersModal(false);
      }
    }
  };

  // Checkout Click & Collect
  const handlePlaceOrder = (orderData: any) => {
    actions.placeOrder(orderData);
    setShowClickCollectMain(false);
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

  const getStoreEmoji = (category: string) => {
    const emojis = {
      restaurant: '🍽️',
      grocery: '🛒',
      pharmacy: '💊',
      electronics: '📱',
      clothing: '👕',
      other: '🏪'
    };
    return emojis[category as keyof typeof emojis] || emojis.other;
  };

  const renderLocationItem = ({ item }: { item: MappedInLocation }) => {
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

  const renderStoreItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.storeItem}
      onPress={() => handleStoreSelect(item)}
    >
      <View style={styles.storeEmoji}>
        <Text style={styles.emojiText}>{getStoreEmoji(item.category)}</Text>
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        <Text style={styles.storeDescription}>{item.description}</Text>
        <View style={styles.storeDetails}>
          <Text style={styles.storeRating}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.storeTime}>⏱️ ~{item.averagePreparationTime}min</Text>
        </View>
      </View>
      <Text style={styles.locationArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header principal */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧭 Navigation & Shopping</Text>
        
        {/* Boutons Click & Collect */}
        <View style={styles.clickCollectHeader}>
          <TouchableOpacity
            style={[styles.ccButton, styles.ccStoresButton]}
            onPress={() => setShowStoresList(true)}
          >
            <Text style={styles.ccButtonText}>🛍️ Magasins</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.ccButton, 
              styles.ccCartButton,
              { backgroundColor: actions.getCartItemCount() > 0 ? '#FF9800' : '#666' }
            ]}
            onPress={() => actions.setCartOpen(true)}
          >
            <Text style={styles.ccButtonText}>
              🛒 Panier {actions.getCartItemCount() > 0 && `(${actions.getCartItemCount()})`}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.ccButton, styles.ccOrdersButton]}
            onPress={() => setShowOrdersModal(true)}
          >
            <Text style={styles.ccButtonText}>📦 Commandes</Text>
          </TouchableOpacity>
        </View>
        
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

      {/* Panneau de Navigation Guidée */}
      {showNavigationPanel && isNavigating && (
        <View style={styles.navigationPanel}>
          <View style={styles.navigationHeader}>
            <View style={styles.navigationInfo}>
              <Text style={styles.navigationTitle}>Navigation Active</Text>
              <Text style={styles.navigationSubtitle}>
                Étape {currentStepIndex + 1} sur {navigationSteps.length} • {totalDistance}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={() => setShowNavigationPanel(false)}
            >
              <Text style={styles.minimizeButtonText}>−</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getProgressPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{getProgressPercentage()}%</Text>
          </View>

          <View style={styles.currentInstruction}>
            <Text style={styles.instructionText}>
              {getCurrentStepInstruction()}
            </Text>
          </View>
        </View>
      )}

      {/* Bouton pour rouvrir le panneau si minimisé */}
      {isNavigating && !showNavigationPanel && (
        <TouchableOpacity
          style={styles.reopenButton}
          onPress={() => setShowNavigationPanel(true)}
        >
          <Text style={styles.reopenButtonText}>
            🧭 Navigation ({currentStepIndex + 1}/{navigationSteps.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapComponent 
          onLocationSelect={handleLocationSelect}
          selectedDestination={selectedLocation}
          onMapMessage={handleMapMessage}
        />
      </View>

      {/* Instructions en bas */}
      {!isNavigating && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>💡 Fonctionnalités :</Text>
          <Text style={styles.instructionText}>
            🧭 Navigation : Choisissez une destination pour la navigation étape par étape {'\n'}
            🛍️ Click & Collect : Commandez en ligne, récupérez en magasin
          </Text>
        </View>
      )}

      {/* Modal de sélection de destination pour navigation */}
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

      {/* Modal liste des magasins Click & Collect */}
      <Modal
        visible={showStoresList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🛍️ Magasins Click & Collect</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowStoresList(false);
                setStoreSearchQuery('');
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              🛍️ {state.stores.length} magasins proposent le Click & Collect
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Rechercher un magasin..."
              value={storeSearchQuery}
              onChangeText={setStoreSearchQuery}
            />
          </View>

          <FlatList
            data={filteredStores}
            renderItem={renderStoreItem}
            keyExtractor={(item) => item.id}
            style={styles.locationsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>🔍 Aucun magasin trouvé</Text>
                <Text style={styles.emptySubtext}>
                  Essayez de modifier votre recherche
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal du magasin sélectionné */}
      <Modal
        visible={showClickCollectMain && state.selectedStore !== null}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.storeModalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowClickCollectMain(false);
                actions.setSelectedStore(null);
              }}
            >
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.storeModalTitle}>
              {state.selectedStore?.name || 'Magasin'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          
          {state.selectedStore && (
            <ClickCollectStore
              store={state.selectedStore}
              onAddToCart={actions.addToCart}
              onNavigateToStore={() => handleNavigateToStore()}
              cartItems={state.cart}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Composants Click & Collect */}
      <ClickCollectCart
        isVisible={state.isCartOpen}
        cartItems={state.cart}
        onClose={() => actions.setCartOpen(false)}
        onUpdateQuantity={actions.updateCartQuantity}
        onRemoveItem={actions.removeFromCart}
        onProceedToCheckout={() => {
          actions.setCartOpen(false);
          actions.setCheckoutOpen(true);
        }}
        onClearCart={actions.clearCart}
      />

      <ClickCollectCheckout
        isVisible={state.isCheckoutOpen}
        cartItems={state.cart}
        onClose={() => actions.setCheckoutOpen(false)}
        onPlaceOrder={handlePlaceOrder}
      />

      <ClickCollectOrders
        isVisible={showOrdersModal}
        orders={state.activeOrders}
        onClose={() => setShowOrdersModal(false)}
        onNavigateToStore={handleNavigateToStore}
        onCancelOrder={actions.cancelOrder}
      />
    </SafeAreaView>
  );
}

// Composant principal avec le Provider
export default function App() {
  return (
    <ClickCollectProvider>
      <AppContent />
    </ClickCollectProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  
  // Click & Collect Header
  clickCollectHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  ccButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ccStoresButton: {
    backgroundColor: '#2196F3',
  },
  ccCartButton: {
    backgroundColor: '#666',
  },
  ccOrdersButton: {
    backgroundColor: '#4CAF50',
  },
  ccButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  
  // Panneau de Navigation (styles existants)
  navigationPanel: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navigationInfo: {
    flex: 1,
  },
  navigationTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  navigationSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  minimizeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimizeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },
  currentInstruction: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  reopenButton: {
    backgroundColor: '#2196F3',
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reopenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  
  // Modal styles
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
  
  // Styles pour les magasins
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storeEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  storeDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  storeRating: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  storeTime: {
    fontSize: 12,
    color: '#666',
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
  
  // Modal plein écran pour le magasin
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  storeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  storeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 80, // Pour équilibrer avec le bouton retour
  },
});