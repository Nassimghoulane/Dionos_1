// components/ClickCollectTab.tsx - Style Shopping modernisé (CORRIGÉ)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import ClickCollectStore from './ClickCollectStore';
import ClickCollectOrders from './ClickCollectOrders';
import ClickCollectCart from './ClickCollectCart';
import ClickCollectCheckout from './ClickCollectCheckout';
import { useClickCollect } from '../context/ClickCollectContext';

interface ClickCollectTabProps {
  onStoreSelect: (store: any) => void;
  onNavigateToStore: (storeId?: string) => void;
  onPlaceOrder: (orderData: any) => void;
}

export default function ClickCollectTab({
  onStoreSelect,
  onNavigateToStore,
  onPlaceOrder,
}: ClickCollectTabProps) {
  const { state, actions } = useClickCollect();
  
  const [selectedFilter, setSelectedFilter] = useState<string>('Tout');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  const filters = ['Tout', 'Boissons', 'Nourriture', 'Pharmacie', 'Électronique'];
  
  const getFilteredStores = () => {
    if (selectedFilter === 'Tout') return state.stores;
    
    const categoryMap: { [key: string]: string } = {
      'Boissons': 'drinks',
      'Nourriture': 'restaurant', 
      'Pharmacie': 'pharmacy',
      'Électronique': 'electronics'
    };
    
    return state.stores.filter(store => 
      store.category === categoryMap[selectedFilter]
    );
  };

  const handleStorePress = (store: any) => {
    actions.setSelectedStore(store);
    setSelectedStore(store);
    setShowStoreModal(true);
  };

  const handleCloseStoreModal = () => {
    setShowStoreModal(false);
    setSelectedStore(null);
    actions.setSelectedStore(null);
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      'restaurant': '🍔',
      'drinks': '🥤',
      'pharmacy': '💊',
      'electronics': '📱',
      'grocery': '🛒',
      'clothing': '👕',
      'other': '🏪'
    };
    return emojis[category] || emojis.other;
  };

  const getStoreStatus = (store: any) => {
    // Logique simplifiée - en réalité il faudrait vérifier les horaires
    return Math.random() > 0.3 ? 'Ouvert' : 'Fermé';
  };

  const renderStoreCard = ({ item: store }: { item: any }) => {
    const isOpen = getStoreStatus(store) === 'Ouvert';
    
    return (
      <TouchableOpacity
        style={styles.storeCard}
        onPress={() => handleStorePress(store)}
        activeOpacity={0.8}
      >
        <View style={styles.storeCardHeader}>
          <View style={styles.storeIconContainer}>
            <Text style={styles.storeIcon}>
              {getCategoryEmoji(store.category)}
            </Text>
          </View>
          
          <View style={styles.storeCardContent}>
            <View style={styles.storeCardTop}>
              <Text style={styles.storeName}>{store.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isOpen ? '#22c55e' : '#ef4444' }
              ]}>
                <Text style={styles.statusText}>{isOpen ? 'Ouvert' : 'Fermé'}</Text>
              </View>
            </View>
            
            <Text style={styles.storeCategory}>{store.category}</Text>
            
            <View style={styles.storeFooter}>
              <View style={styles.storeInfo}>
                <Text style={styles.storeRating}>⭐ {store.rating.toFixed(1)}</Text>
                <Text style={styles.storeTime}>
                  Temps d'attente: ~{store.averagePreparationTime} min
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.commanderButton}
                onPress={() => handleStorePress(store)}
              >
                <Text style={styles.commanderText}>Commander</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filter: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterText,
        selectedFilter === filter && styles.filterTextActive
      ]}>
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const getOrderStats = () => {
    const activeOrders = state.activeOrders.filter(order => 
      !['collected', 'cancelled'].includes(order.status)
    );
    const readyOrders = activeOrders.filter(order => order.status === 'ready');
    return { total: activeOrders.length, ready: readyOrders.length };
  };

  const orderStats = getOrderStats();
  const cartItemCount = actions.getCartItemCount();

  return (
    <View style={styles.container}>
      {/* Header avec titre */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping</Text>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map(renderFilterButton)}
        </ScrollView>
      </View>

      {/* Liste des magasins */}
      <FlatList
        data={getFilteredStores()}
        renderItem={renderStoreCard}
        keyExtractor={(item) => item.id}
        style={styles.storesList}
        contentContainerStyle={styles.storesContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun magasin disponible</Text>
            <Text style={styles.emptySubtext}>
              Essayez un autre filtre ou revenez plus tard
            </Text>
          </View>
        }
      />

      {/* Barre de navigation en bas */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🧭</Text>
          <Text style={styles.navLabel}>Navigation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>🛍️</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Shopping</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => actions.setCartOpen(true)}
        >
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>🛒</Text>
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.navLabel}>Panier</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => actions.setCheckoutOpen(true)}
        >
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>📦</Text>
            {orderStats.total > 0 && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{orderStats.total}</Text>
              </View>
            )}
          </View>
          <Text style={styles.navLabel}>Commandes</Text>
        </TouchableOpacity>
      </View>

      {/* Modal du magasin sélectionné */}
      <Modal
        visible={showStoreModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.storeModalContainer}>
          <View style={styles.storeModalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCloseStoreModal}
            >
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
            
            <Text style={styles.storeModalTitle}>
              {selectedStore?.name || 'Magasin'}
            </Text>
            
            <View style={styles.headerSpacer} />
          </View>
          
          {selectedStore && (
            <ClickCollectStore
              store={selectedStore}
              onAddToCart={actions.addToCart}
              onNavigateToStore={() => {
                onNavigateToStore(selectedStore.id);
                handleCloseStoreModal();
              }}
              cartItems={state.cart}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal du panier */}
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

      {/* Modal de checkout */}
      <ClickCollectCheckout
        isVisible={state.isCheckoutOpen}
        cartItems={state.cart}
        onClose={() => actions.setCheckoutOpen(false)}
        onPlaceOrder={(orderData) => {
          actions.placeOrder(orderData);
          actions.setCheckoutOpen(false);
          onPlaceOrder(orderData);
        }}
      />

      {/* Modal des commandes */}
      <ClickCollectOrders
        isVisible={false} // Géré par le contexte ou un état séparé
        orders={state.activeOrders}
        onClose={() => {}}
        onNavigateToStore={onNavigateToStore}
        onCancelOrder={actions.cancelOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  filterButtonActive: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5f6368',
  },
  
  filterTextActive: {
    color: '#ffffff',
  },
  
  storesList: {
    flex: 1,
  },
  
  storesContent: {
    padding: 20,
    paddingBottom: 100, // Espace pour la navigation
  },
  
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  storeCardHeader: {
    padding: 20,
  },
  
  storeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  
  storeIcon: {
    fontSize: 28,
  },
  
  storeCardContent: {
    flex: 1,
  },
  
  storeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  storeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  storeCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  storeInfo: {
    flex: 1,
  },
  
  storeRating: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
    marginBottom: 4,
  },
  
  storeTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  commanderButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  
  commanderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  navItemActive: {
    // Style pour l'élément actif
  },
  
  navIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  
  navIconActive: {
    // Style pour l'icône active - pourrait changer la couleur
  },
  
  navLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  navLabelActive: {
    color: '#4285f4',
    fontWeight: '600',
  },
  
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cartBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  orderBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  orderBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Modal styles
  storeModalContainer: {
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
    backgroundColor: '#4285f4',
    borderRadius: 8,
  },
  
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  storeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  
  headerSpacer: {
    width: 80, // Pour équilibrer avec le bouton retour
  },
});