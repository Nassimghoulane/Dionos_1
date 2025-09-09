// App.tsx - Version complète avec EventTour, ToiletFinder et MyTicket
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import MapComponent from './components/MapComponent';
import ClickCollectStore from './components/ClickCollectStore';
import ClickCollectCart from './components/ClickCollectCart';
import ClickCollectCheckout from './components/ClickCollectCheckout';
import ClickCollectOrders from './components/ClickCollectOrders';
import MyTicket from './components/MyTicket';
import ToiletFinder from './components/ToiletFinder';
import EventTour from './components/EventTour';
import { ClickCollectProvider, useClickCollect } from './context/ClickCollectContext';
import ClickCollectTab from './components/ClickCollectTab';
import MapsTab from './components/MapsTab';
import AccountTab from './components/AccountTab';

const { width, height } = Dimensions.get('window');

type TabType = 'maps' | 'shopping' | 'account';

// Interface pour les données de navigation partagées
interface MapState {
  selectedDestination: string;
  currentPosition: string;
  onLocationSelect: (locationName: string) => void;
  onMapMessage: (message: any) => void;
}

// Interface pour les billets
interface TicketInfo {
  id: string;
  eventName: string;
  venue: string;
  date: string;
  time: string;
  section: string;
  row: string;
  seat: string;
  gate?: string;
  price?: string;
  barcode?: string;
  qrCode?: string;
  createdAt: string;
}

// Interface pour les toilettes
interface ToiletLocation {
  id: string;
  name: string;
  type: 'men' | 'women' | 'unisex' | 'accessible';
  level: string;
  distance?: string;
  walkingTime?: string;
  isClean?: boolean;
  hasAccessibility?: boolean;
  hasChangingTable?: boolean;
  crowdLevel?: 'Faible' | 'Modéré' | 'Élevé';
  description?: string;
  location: {
    x: number;
    y: number;
  };
}

// Interface pour les événements
interface EventInfo {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  distance: string;
  walkingTime: string;
  category: 'concert' | 'sport' | 'exhibition' | 'conference' | 'food' | 'entertainment';
  priority: 'high' | 'medium' | 'low';
  capacity?: number;
  currentAttendance?: number;
  price?: string;
  ageRestriction?: string;
  highlights: string[];
  tags: string[];
  isLive?: boolean;
  isUpcoming?: boolean;
  isSoldOut?: boolean;
}

function AppContent() {
  const { state, actions } = useClickCollect();
  const [activeTab, setActiveTab] = useState<TabType>('maps');
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showMyTicketModal, setShowMyTicketModal] = useState(false);
  const [showToiletModal, setShowToiletModal] = useState(false);
  const [showEventTourModal, setShowEventTourModal] = useState(false);
  const [savedTickets, setSavedTickets] = useState<TicketInfo[]>([]);
  
  // États partagés pour la carte
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [currentPosition, setCurrentPosition] = useState<string>('');
  const mapRef = useRef<any>(null);

  // État pour stocker les locations de la carte - STABLE
  const [mapLocations, setMapLocations] = useState<any[]>([]);

  // Fonctions de gestion des billets
  const handleTicketSaved = useCallback((ticket: TicketInfo) => {
    setSavedTickets(prev => [...prev, ticket]);
    console.log('Billet sauvegardé:', ticket.eventName);
  }, []);

  const handleDeleteTicket = useCallback((ticketId: string) => {
    setSavedTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    console.log('Billet supprimé:', ticketId);
  }, []);

  const handleMyPlacePress = useCallback(() => {
    setShowMyTicketModal(true);
  }, []);

  // Fonctions de gestion des toilettes
  const handleToiletPress = useCallback(() => {
    setShowToiletModal(true);
  }, []);

  const handleNavigateToToilet = useCallback((toilet: ToiletLocation) => {
    setSelectedDestination(toilet.name);
    setActiveTab('maps');
    console.log('Navigation vers toilette:', toilet.name);
  }, []);

  // Fonctions de gestion du tour des événements
  const handleEventTourPress = useCallback(() => {
    setShowEventTourModal(true);
  }, []);

  const handleNavigateToEvent = useCallback((event: EventInfo) => {
    setSelectedDestination(event.location);
    setActiveTab('maps');
    console.log('Navigation vers événement:', event.title);
  }, []);

  // Gérer la sélection d'un magasin Click & Collect - STABLE
  const handleStoreSelect = useCallback((store: any) => {
    actions.setSelectedStore(store);
  }, [actions]);

  // Naviguer vers un magasin depuis Click & Collect vers l'onglet Maps - STABLE
  const handleNavigateToStore = useCallback((storeId?: string) => {
    const store = storeId ? actions.getStoreById(storeId) : state.selectedStore;
    if (store) {
      setSelectedDestination(store.name);
      setActiveTab('maps');
    }
  }, [actions, state.selectedStore]);

  // Checkout Click & Collect - STABLE
  const handlePlaceOrder = useCallback((orderData: any) => {
    actions.placeOrder(orderData);
  }, [actions]);

  // Navigation vers les commandes depuis l'onglet compte - STABLE
  const handleNavigateToOrders = useCallback(() => {
    setShowOrdersModal(true);
  }, []);

  // Navigation vers les favoris (à implémenter) - STABLE
  const handleNavigateToFavorites = useCallback(() => {
    console.log('Navigation vers favoris - à implémenter');
  }, []);

  // Fonctions partagées pour la carte - STABLE
  const handleLocationSelect = useCallback((locationName: string) => {
    setCurrentPosition(locationName);
  }, []);

  // Capturer les données de locations - STABLE et OPTIMISÉ
  const handleMapMessage = useCallback((message: any) => {
    console.log('Map message dans App:', message.type);
    
    if (message.type === 'locationsLoaded' && message.locations) {
      console.log('📍 Stockage des locations dans App:', message.locations.length);
      // Utiliser une fonction callback pour éviter les re-rendus inutiles
      setMapLocations(prevLocations => {
        // Éviter de mettre à jour si les données sont identiques
        if (prevLocations.length === message.locations.length) {
          return prevLocations;
        }
        return message.locations;
      });
    }
  }, []);

  // Props partagés pour la carte - MEMOIZED pour éviter les re-rendus
  const mapProps: MapState = useMemo(() => ({
    selectedDestination,
    currentPosition,
    onLocationSelect: handleLocationSelect,
    onMapMessage: handleMapMessage,
  }), [selectedDestination, currentPosition, handleLocationSelect, handleMapMessage]);

  // Calcul des stats de commandes - MEMOIZED
  const orderStats = useMemo(() => {
    const activeOrders = state.activeOrders.filter(order => 
      !['collected', 'cancelled'].includes(order.status)
    );
    return { total: activeOrders.length };
  }, [state.activeOrders]);

  // Fonction de rendu des boutons d'onglet - STABLE
  const renderTabButton = useCallback((tabType: TabType, label: string, icon: string) => {
    const cartItemCount = actions.getCartItemCount();
    const showCartBadge = tabType === 'shopping' && cartItemCount > 0;
    const showOrderBadge = tabType === 'account' && orderStats.total > 0;

    return (
      <TouchableOpacity
        key={tabType}
        style={[
          styles.tabButton,
          activeTab === tabType && styles.activeTabButton
        ]}
        onPress={() => setActiveTab(tabType)}
      >
        <View style={[
          styles.tabIconContainer,
          activeTab === tabType && styles.activeTabIconContainer
        ]}>
          <Text style={[
            styles.tabIcon,
            activeTab === tabType && styles.activeTabIcon
          ]}>
            {icon}
          </Text>
        </View>
        <Text style={[
          styles.tabLabel,
          activeTab === tabType && styles.activeTabLabel
        ]}>
          {label}
        </Text>
        {showCartBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartItemCount}</Text>
          </View>
        )}
        {showOrderBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{orderStats.total}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [activeTab, actions, orderStats.total]);

  // Fonction de rendu des actions rapides - STABLE
  const renderQuickAction = useCallback((label: string, icon: string, onPress?: () => void) => (
    <TouchableOpacity
      key={label}
      style={styles.quickActionButton}
      onPress={onPress}
    >
      <View style={styles.quickActionIconContainer}>
        <Text style={styles.quickActionIcon}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* CARTE PERSISTANTE - TOUJOURS MONTÉE, JAMAIS DÉTRUITE */}
      <View style={styles.mapContainer}>
        <MapComponent 
          ref={mapRef}
          onLocationSelect={handleLocationSelect}
          selectedDestination={selectedDestination}
          onMapMessage={handleMapMessage}
        />
      </View>

      {/* OVERLAY DES ONGLETS - Masque ou révèle la carte */}
      <View style={[
        styles.tabOverlay, 
        { 
          backgroundColor: activeTab === 'maps' ? 'transparent' : '#f8f9fa',
          pointerEvents: activeTab === 'maps' ? 'none' : 'auto'
        }
      ]}>
        {activeTab === 'shopping' && (
          <ClickCollectTab
            onStoreSelect={handleStoreSelect}
            onNavigateToStore={handleNavigateToStore}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
        
        {activeTab === 'account' && (
          <AccountTab
            onNavigateToOrders={handleNavigateToOrders}
            onNavigateToFavorites={handleNavigateToFavorites}
          />
        )}
      </View>

      {/* INTERFACE MAPS - Par-dessus la carte quand actif */}
      {activeTab === 'maps' && (
        <>
          <MapsTab 
            onNavigateToStore={handleNavigateToStore}
            mapState={mapProps}
            onDestinationChange={setSelectedDestination}
            onPositionChange={setCurrentPosition}
            mapLocations={mapLocations}
          />
          
          {/* Actions rapides en bas de la carte */}
          <View style={styles.quickActionsContainer}>
            {renderQuickAction('Tour', '🎯', handleEventTourPress)}
            {renderQuickAction('Ma place', '📍', handleMyPlacePress)}
            {renderQuickAction('Toilet', '🚻', handleToiletPress)}
          </View>
        </>
      )}

      {/* Barre de navigation principale */}
      <View style={styles.mainTabBar}>
        {renderTabButton('maps', 'Navigation', '🧭')}
        {renderTabButton('shopping', 'Shopping', '🛍️')}
        {renderTabButton('account', 'Compte', '👤')}
      </View>

      {/* Composants Click & Collect globaux */}
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

      {/* Modal des commandes (accessible depuis l'onglet Compte) */}
      <ClickCollectOrders
        isVisible={showOrdersModal}
        orders={state.activeOrders}
        onClose={() => setShowOrdersModal(false)}
        onNavigateToStore={handleNavigateToStore}
        onCancelOrder={actions.cancelOrder}
      />

      {/* Composant Ma Place */}
      <MyTicket
        isVisible={showMyTicketModal}
        onClose={() => setShowMyTicketModal(false)}
        onTicketSaved={handleTicketSaved}
        savedTickets={savedTickets}
      />

      {/* Composant ToiletFinder */}
      <ToiletFinder
        isVisible={showToiletModal}
        onClose={() => setShowToiletModal(false)}
        onNavigateToToilet={handleNavigateToToilet}
        mapLocations={mapLocations}
      />

      {/* Composant EventTour */}
      <EventTour
        isVisible={showEventTourModal}
        onClose={() => setShowEventTourModal(false)}
        onNavigateToEvent={handleNavigateToEvent}
        mapLocations={mapLocations}
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
    backgroundColor: '#f8f9fa',
  },
  
  // CARTE PERSISTANTE - Position absolue, toujours visible
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // Sous les overlays
  },
  
  // OVERLAY DES ONGLETS - Masque la carte quand nécessaire
  tabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2, // Au-dessus de la carte
  },
  
  // Actions rapides en bas (Tour, Ma place, Toilet)
  quickActionsContainer: {
    position: 'absolute',
    bottom: 100, // Au-dessus de la barre de navigation
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 16,
    zIndex: 3,
  },
  
  quickActionButton: {
    alignItems: 'center',
    padding: 8,
  },
  
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 6,
  },
  
  quickActionIcon: {
    fontSize: 18,
  },
  
  quickActionLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  
  // Barre de navigation principale
  mainTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 4, // Au-dessus de tout
  },
  
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  
  activeTabButton: {
    // Pas de changement de background ici
  },
  
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  activeTabIconContainer: {
    backgroundColor: '#4285F4',
  },
  
  tabIcon: {
    fontSize: 20,
    color: '#666',
  },
  
  activeTabIcon: {
    color: '#ffffff',
  },
  
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  
  activeTabLabel: {
    color: '#4285F4',
    fontWeight: '600',
  },
  
  badge: {
    position: 'absolute',
    top: -2,
    right: '25%',
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});