// App.tsx - Navigation avec carte persistante optimisée CORRIGÉE
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import MapComponent from './components/MapComponent';
import ClickCollectStore from './components/ClickCollectStore';
import ClickCollectCart from './components/ClickCollectCart';
import ClickCollectCheckout from './components/ClickCollectCheckout';
import ClickCollectOrders from './components/ClickCollectOrders';
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

function AppContent() {
  const { state, actions } = useClickCollect();
  const [activeTab, setActiveTab] = useState<TabType>('maps');
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  
  // États partagés pour la carte
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [currentPosition, setCurrentPosition] = useState<string>('');
  const mapRef = useRef<any>(null);

  // ✅ AJOUT : État pour stocker les locations de la carte
  const [mapLocations, setMapLocations] = useState<any[]>([]);

  // Gérer la sélection d'un magasin Click & Collect
  const handleStoreSelect = (store: any) => {
    actions.setSelectedStore(store);
  };

  // Naviguer vers un magasin depuis Click & Collect vers l'onglet Maps
  const handleNavigateToStore = (storeId?: string) => {
    const store = storeId ? actions.getStoreById(storeId) : state.selectedStore;
    if (store) {
      // Définir la destination sur la carte
      setSelectedDestination(store.name);
      setActiveTab('maps');
    }
  };

  // Checkout Click & Collect
  const handlePlaceOrder = (orderData: any) => {
    actions.placeOrder(orderData);
  };

  // Navigation vers les commandes depuis l'onglet compte
  const handleNavigateToOrders = () => {
    setShowOrdersModal(true);
  };

  // Navigation vers les favoris (à implémenter)
  const handleNavigateToFavorites = () => {
    console.log('Navigation vers favoris - à implémenter');
  };

  // Fonctions partagées pour la carte
  const handleLocationSelect = (locationName: string) => {
    setCurrentPosition(locationName);
  };

  // ✅ MODIFICATION : Capturer les données de locations
  const handleMapMessage = (message: any) => {
    console.log('Map message dans App:', message.type);
    
    // Capturer les données de locations quand elles arrivent
    if (message.type === 'locationsLoaded' && message.locations) {
      console.log('📍 Stockage des locations dans App:', message.locations.length);
      setMapLocations(message.locations);
    }
  };

  // Props partagés pour la carte
  const mapProps: MapState = {
    selectedDestination,
    currentPosition,
    onLocationSelect: handleLocationSelect,
    onMapMessage: handleMapMessage,
  };

  const getOrderStats = () => {
    const activeOrders = state.activeOrders.filter(order => 
      !['collected', 'cancelled'].includes(order.status)
    );
    return { total: activeOrders.length };
  };

  const orderStats = getOrderStats();

  const renderTabButton = (tabType: TabType, label: string, icon: string) => {
    const cartItemCount = actions.getCartItemCount();
    const showCartBadge = tabType === 'shopping' && cartItemCount > 0;
    const showOrderBadge = tabType === 'account' && orderStats.total > 0;

    return (
      <TouchableOpacity
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
  };

  const renderQuickAction = (label: string, icon: string, onPress?: () => void) => (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={onPress}
    >
      <View style={styles.quickActionIconContainer}>
        <Text style={styles.quickActionIcon}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

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
            mapLocations={mapLocations} // ✅ AJOUT : Passer les données de locations
          />
          
          {/* Actions rapides en bas de la carte */}
          <View style={styles.quickActionsContainer}>
            {renderQuickAction('Tour', '🎯')}
            {renderQuickAction('Ma place', '📍')}
            {renderQuickAction('Toilet', '🚻')}
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