// App.tsx - Navigation avec onglets
import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

type TabType = 'maps' | 'clickcollect';

function AppContent() {
  const { state, actions } = useClickCollect();
  const [activeTab, setActiveTab] = useState<TabType>('maps');

  // Gérer la sélection d'un magasin Click & Collect
  const handleStoreSelect = (store: any) => {
    actions.setSelectedStore(store);
  };

  // Naviguer vers un magasin depuis Click & Collect vers l'onglet Maps
  const handleNavigateToStore = (storeId?: string) => {
    const store = storeId ? actions.getStoreById(storeId) : state.selectedStore;
    if (store) {
      // Passer à l'onglet Maps avec la destination
      setActiveTab('maps');
      // Vous pourrez ensuite passer les données du magasin à MapsTab
    }
  };

  // Checkout Click & Collect
  const handlePlaceOrder = (orderData: any) => {
    actions.placeOrder(orderData);
  };

  const renderTabButton = (tabType: TabType, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabType && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tabType)}
    >
      <Text style={[
        styles.tabIcon,
        activeTab === tabType && styles.activeTabIcon
      ]}>
        {icon}
      </Text>
      <Text style={[
        styles.tabLabel,
        activeTab === tabType && styles.activeTabLabel
      ]}>
        {label}
      </Text>
      {tabType === 'clickcollect' && actions.getCartItemCount() > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{actions.getCartItemCount()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      


      {/* Contenu des onglets */}
      <View style={styles.tabContent}>
        {activeTab === 'maps' ? (
          <MapsTab onNavigateToStore={handleNavigateToStore} />
        ) : (
          <ClickCollectTab
            onStoreSelect={handleStoreSelect}
            onNavigateToStore={handleNavigateToStore}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
      </View>

      {/* Barre d'onglets en bas */}
      <View style={styles.tabBar}>
        {renderTabButton('maps', 'Navigation', '🗺️')}
        {renderTabButton('clickcollect', 'Shopping', '🛍️')}
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
    flexDirection: 'row',
            justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  quickActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  tabContent: {
    flex: 1,
  },
  
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  activeTabButton: {
    backgroundColor: '#f0f8ff',
  },
  
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  
  activeTabIcon: {
    opacity: 1,
  },
  
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  
  activeTabLabel: {
    color: '#2196F3',
    fontWeight: '600',
  },
  
  badge: {
    position: 'absolute',
    top: 8,
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