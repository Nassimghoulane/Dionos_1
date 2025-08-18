// components/ClickCollectOrders.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ClickCollectOrder } from '../types/ClickCollectTypes';

interface ClickCollectOrdersProps {
  isVisible: boolean;
  orders: ClickCollectOrder[];
  onClose: () => void;
  onNavigateToStore: (storeId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export default function ClickCollectOrders({
  isVisible,
  orders,
  onClose,
  onNavigateToStore,
  onCancelOrder,
}: ClickCollectOrdersProps) {
  const getStatusInfo = (status: ClickCollectOrder['status']) => {
    const statusConfig = {
      pending: { 
        emoji: '⏳', 
        label: 'En attente', 
        color: '#FF9800',
        description: 'Commande reçue, en cours de traitement'
      },
      confirmed: { 
        emoji: '✅', 
        label: 'Confirmée', 
        color: '#2196F3',
        description: 'Commande confirmée, préparation démarrée'
      },
      preparing: { 
        emoji: '👨‍🍳', 
        label: 'En préparation', 
        color: '#9C27B0',
        description: 'Vos articles sont en cours de préparation'
      },
      ready: { 
        emoji: '📦', 
        label: 'Prête !', 
        color: '#4CAF50',
        description: 'Votre commande est prête pour le retrait'
      },
      collected: { 
        emoji: '✅', 
        label: 'Récupérée', 
        color: '#4CAF50',
        description: 'Commande récupérée avec succès'
      },
      cancelled: { 
        emoji: '❌', 
        label: 'Annulée', 
        color: '#f44336',
        description: 'Commande annulée'
      }
    };
    return statusConfig[status];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTimeUntilReady = (estimatedTime: Date) => {
    const now = new Date();
    const estimated = new Date(estimatedTime);
    const diffMs = estimated.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'Maintenant';
    if (diffMins < 60) return `${diffMins}min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  };

  const handleCancelOrder = (order: ClickCollectOrder) => {
    Alert.alert(
      'Annuler la commande',
      `Êtes-vous sûr de vouloir annuler votre commande chez ${order.storeName} ?`,
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, annuler', 
          style: 'destructive', 
          onPress: () => onCancelOrder(order.id) 
        },
      ]
    );
  };

  const canCancelOrder = (order: ClickCollectOrder) => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    // Priorité aux commandes actives
    const priorityOrder = ['ready', 'preparing', 'confirmed', 'pending', 'collected', 'cancelled'];
    const aPriority = priorityOrder.indexOf(a.status);
    const bPriority = priorityOrder.indexOf(b.status);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Puis par date (plus récent en premier)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeOrders = sortedOrders.filter(order => 
    !['collected', 'cancelled'].includes(order.status)
  );
  
  const pastOrders = sortedOrders.filter(order => 
    ['collected', 'cancelled'].includes(order.status)
  );

  const renderOrder = (order: ClickCollectOrder) => {
    const statusInfo = getStatusInfo(order.status);
    const isActive = !['collected', 'cancelled'].includes(order.status);
    
    return (
      <View key={order.id} style={[styles.orderCard, !isActive && styles.pastOrderCard]}>
        {/* Header de la commande */}
        <View style={styles.orderHeader}>
          <View style={styles.orderTitleContainer}>
            <Text style={styles.orderTitle}>
              {statusInfo.emoji} {order.storeName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusText}>{statusInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            {formatDate(order.createdAt)}
          </Text>
        </View>

        {/* Informations de la commande */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderDescription}>
            {statusInfo.description}
          </Text>
          
          <View style={styles.orderDetails}>
            <View style={styles.orderDetail}>
              <Text style={styles.detailLabel}>Articles :</Text>
              <Text style={styles.detailValue}>
                {order.items.reduce((total, item) => total + item.quantity, 0)} article(s)
              </Text>
            </View>
            
            <View style={styles.orderDetail}>
              <Text style={styles.detailLabel}>Total :</Text>
              <Text style={styles.detailValue}>{order.totalAmount.toFixed(2)} €</Text>
            </View>
            
            {order.status === 'ready' && (
              <View style={styles.orderDetail}>
                <Text style={styles.detailLabel}>Code retrait :</Text>
                <Text style={[styles.detailValue, styles.pickupCode]}>
                  {order.pickupCode}
                </Text>
              </View>
            )}
            
            {isActive && (
              <View style={styles.orderDetail}>
                <Text style={styles.detailLabel}>
                  {order.status === 'ready' ? 'Prêt depuis :' : 'Prêt vers :'}
                </Text>
                <Text style={styles.detailValue}>
                  {order.status === 'ready' 
                    ? formatTime(order.estimatedReadyTime)
                    : getTimeUntilReady(order.estimatedReadyTime)
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Détail des articles */}
        <View style={styles.itemsList}>
          <Text style={styles.itemsTitle}>Articles commandés :</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemText}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                {(item.price * item.quantity).toFixed(2)} €
              </Text>
            </View>
          ))}
        </View>

        {/* Instructions spéciales */}
        {order.specialInstructions && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>💬 Instructions spéciales :</Text>
            <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.orderActions}>
          {isActive && (
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => onNavigateToStore(order.storeId)}
            >
              <Text style={styles.navigateButtonText}>🧭 Y aller</Text>
            </TouchableOpacity>
          )}
          
          {canCancelOrder(order) && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelOrder(order)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📦 Mes Commandes</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {orders.length === 0 ? (
          /* Aucune commande */
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyOrdersIcon}>📦</Text>
            <Text style={styles.emptyOrdersTitle}>Aucune commande</Text>
            <Text style={styles.emptyOrdersText}>
              Vos commandes Click & Collect apparaîtront ici une fois que vous en aurez passé une.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
            {/* Commandes actives */}
            {activeOrders.length > 0 && (
              <View style={styles.ordersSection}>
                <Text style={styles.sectionTitle}>
                  🔥 Commandes en cours ({activeOrders.length})
                </Text>
                {activeOrders.map(renderOrder)}
              </View>
            )}

            {/* Commandes passées */}
            {pastOrders.length > 0 && (
              <View style={styles.ordersSection}>
                <Text style={styles.sectionTitle}>
                  📚 Historique ({pastOrders.length})
                </Text>
                {pastOrders.map(renderOrder)}
              </View>
            )}

            {/* Espace pour éviter que le contenu soit caché */}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 24,
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
  
  emptyOrders: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyOrdersIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyOrdersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyOrdersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ordersSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  pastOrderCard: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#ccc',
  },
  
  orderHeader: {
    marginBottom: 12,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  
  orderInfo: {
    marginBottom: 12,
  },
  orderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  orderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  orderDetail: {
    flexDirection: 'row',
    marginRight: 16,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  pickupCode: {
    backgroundColor: '#4CAF50',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  itemsList: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  instructions: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  navigateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});