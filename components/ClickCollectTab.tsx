// components/ClickCollectTab.tsx - Onglet dédié au Click & Collect
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
  
  // États locaux
  const [showStoresList, setShowStoresList] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showClickCollectMain, setShowClickCollectMain] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  const filteredStores = state.stores.filter(store =>
    store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
    store.description?.toLowerCase().includes(storeSearchQuery.toLowerCase())
  );

  // Gérer la sélection d'un magasin
  const handleStoreSelect = (store: any) => {
    onStoreSelect(store);
    setShowStoresList(false);
    setShowClickCollectMain(true);
  };

  // Naviguer vers un magasin depuis Click & Collect
  const handleNavigateToStore = (storeId?: string) => {
    onNavigateToStore(storeId);
    setShowClickCollectMain(false);
    setShowOrdersModal(false);
  };

  // Checkout Click & Collect
  const handlePlaceOrder = (orderData: any) => {
    onPlaceOrder(orderData);
    setShowClickCollectMain(false);
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

  const renderStoreCard = (store: any) => (
    <TouchableOpacity
      key={store.id}
      style={styles.storeCard}
      onPress={() => handleStoreSelect(store)}
    >
      <View style={styles.storeCardHeader}>
        <Text style={styles.storeCardEmoji}>{getStoreEmoji(store.category)}</Text>
        <View style={styles.storeCardInfo}>
          <Text style={styles.storeCardName}>{store.name}</Text>
          <Text style={styles.storeCardCategory}>{store.category}</Text>
        </View>
        <View style={styles.storeCardRating}>
          <Text style={styles.ratingText}>⭐ {store.rating.toFixed(1)}</Text>
        </View>
      </View>
      
      <Text style={styles.storeCardDescription} numberOfLines={2}>
        {store.description}
      </Text>
      
      <View style={styles.storeCardFooter}>
        <View style={styles.storeCardDetail}>
          <Text style={styles.detailLabel}>Temps moyen:</Text>
          <Text style={styles.detailValue}>~{store.averagePreparationTime}min</Text>
        </View>
        <View style={styles.storeCardDetail}>
          <Text style={styles.detailLabel}>Produits:</Text>
          <Text style={styles.detailValue}>{store.products.length} articles</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Obtenir les statistiques des commandes
  const getOrderStats = () => {
    const activeOrders = state.activeOrders.filter(order => 
      !['collected', 'cancelled'].includes(order.status)
    );
    const readyOrders = activeOrders.filter(order => order.status === 'ready');
    return { total: activeOrders.length, ready: readyOrders.length };
  };

  const orderStats = getOrderStats();

  return (
    <View style={styles.container}>
      {/* Actions principales */}
      <View style={styles.mainActions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => setShowStoresList(true)}
        >
          <Text style={styles.primaryActionIcon}>🛍️</Text>
          <Text style={styles.primaryActionTitle}>Explorer les magasins</Text>
          <Text style={styles.primaryActionSubtitle}>
            {state.stores.length} magasins disponibles
          </Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[
              styles.secondaryAction,
              { backgroundColor: actions.getCartItemCount() > 0 ? '#FF9800' : '#666' }
            ]}
            onPress={() => actions.setCartOpen(true)}
          >
            <Text style={styles.secondaryActionIcon}>🛒</Text>
            <Text style={styles.secondaryActionText}>
              Panier{actions.getCartItemCount() > 0 ? ` (${actions.getCartItemCount()})` : ''}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.secondaryAction,
              { 
                backgroundColor: orderStats.total > 0 ? '#4CAF50' : '#666',
                position: 'relative'
              }
            ]}
            onPress={() => setShowOrdersModal(true)}
          >
            <Text style={styles.secondaryActionIcon}>📦</Text>
            <Text style={styles.secondaryActionText}>
              Commandes{orderStats.total > 0 ? ` (${orderStats.total})` : ''}
            </Text>
            {orderStats.ready > 0 && (
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>{orderStats.ready}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Magasins recommandés */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🌟 Magasins populaires</Text>
        <Text style={styles.sectionSubtitle}>
          Découvrez les magasins les mieux notés
        </Text>
        
        <View style={styles.popularStores}>
          {state.stores
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3)
            .map(renderStoreCard)
          }
        </View>

        {/* Commandes actives résumé */}
        {orderStats.total > 0 && (
          <View style={styles.activeOrdersSection}>
            <Text style={styles.sectionTitle}>📋 Vos commandes en cours</Text>
            <View style={styles.ordersSummary}>
              <View style={styles.ordersSummaryItem}>
                <Text style={styles.ordersSummaryNumber}>{orderStats.total}</Text>
                <Text style={styles.ordersSummaryLabel}>
                  Commande{orderStats.total > 1 ? 's' : ''} active{orderStats.total > 1 ? 's' : ''}
                </Text>
              </View>
              {orderStats.ready > 0 && (
                <View style={styles.ordersSummaryItem}>
                  <Text style={[styles.ordersSummaryNumber, { color: '#4CAF50' }]}>
                    {orderStats.ready}
                  </Text>
                  <Text style={styles.ordersSummaryLabel}>
                    Prête{orderStats.ready > 1 ? 's' : ''} à récupérer
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.viewOrdersButton}
              onPress={() => setShowOrdersModal(true)}
            >
              <Text style={styles.viewOrdersButtonText}>Voir mes commandes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Informations Click & Collect */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>💡 Comment ça marche ?</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choisissez un magasin</Text>
                <Text style={styles.stepDescription}>
                  Parcourez les magasins participants et leurs produits
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Passez votre commande</Text>
                <Text style={styles.stepDescription}>
                  Ajoutez vos articles au panier et finalisez votre commande
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Récupérez vos achats</Text>
                <Text style={styles.stepDescription}>
                  Rendez-vous au magasin avec votre code de retrait
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Espace pour éviter que le contenu soit caché */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal liste des magasins */}
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

      {/* Modal des commandes */}
      <ClickCollectOrders
        isVisible={showOrdersModal}
        orders={state.activeOrders}
        onClose={() => setShowOrdersModal(false)}
        onNavigateToStore={handleNavigateToStore}
        onCancelOrder={actions.cancelOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  mainActions: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  primaryAction: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  primaryActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  
  primaryActionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  
  primaryActionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  secondaryAction: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  secondaryActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  
  secondaryActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  readyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  readyBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  
  popularStores: {
    marginBottom: 16,
  },
  
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  storeCardEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  
  storeCardInfo: {
    flex: 1,
  },
  
  storeCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  
  storeCardCategory: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  
  storeCardRating: {
    alignItems: 'center',
  },
  
  ratingText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  
  storeCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  storeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  storeCardDetail: {
    alignItems: 'center',
  },
  
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  
  activeOrdersSection: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  
  ordersSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  
  ordersSummaryItem: {
    alignItems: 'center',
  },
  
  ordersSummaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  
  ordersSummaryLabel: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
  },
  
  viewOrdersButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  viewOrdersButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  infoSection: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  
  stepsList: {
    marginTop: 12,
  },
  
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffc107',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  
  stepContent: {
    flex: 1,
  },
  
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  
  stepDescription: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 18,
  },
  
  // Modal styles (réutilisés de MapsTab)
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
  
  // Store items in modal
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
  emojiText: {
    fontSize: 20,
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