// components/ClickCollectCheckout.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { CartItem, ClickCollectOrder } from '../types/ClickCollectTypes';

interface ClickCollectCheckoutProps {
  isVisible: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onPlaceOrder: (order: Omit<ClickCollectOrder, 'id' | 'createdAt' | 'pickupCode'>) => void;
}

export default function ClickCollectCheckout({
  isVisible,
  cartItems,
  onClose,
  onPlaceOrder,
}: ClickCollectCheckoutProps) {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getEstimatedReadyTime = () => {
    const maxPreparationTime = Math.max(...cartItems.map(item => item.preparationTime));
    const readyTime = new Date();
    readyTime.setMinutes(readyTime.getMinutes() + maxPreparationTime);
    return readyTime;
  };

  const getStoreFromCart = () => {
    // Supposer que tous les articles viennent du même magasin
    return cartItems.length > 0 ? {
      id: cartItems[0].storeId,
      name: cartItems[0].storeName
    } : null;
  };

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nom');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone');
      return false;
    }
    const phoneRegex = /^[0-9+\-\s()]{8,}$/;
    if (!phoneRegex.test(customerInfo.phone)) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone valide');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    const store = getStoreFromCart();
    if (!store) {
      Alert.alert('Erreur', 'Aucun magasin sélectionné');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        storeId: store.id,
        storeName: store.name,
        items: cartItems,
        totalAmount: getTotalAmount(),
        status: 'pending' as const,
        estimatedReadyTime: getEstimatedReadyTime(),
        customerInfo: {
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.trim(),
          email: customerInfo.email.trim() || undefined,
        },
        specialInstructions: specialInstructions.trim() || undefined,
      };

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation API
      onPlaceOrder(orderData);
      
      Alert.alert(
        '🎉 Commande confirmée !',
        `Votre commande sera prête dans ~${Math.max(...cartItems.map(item => item.preparationTime))} minutes. Vous recevrez un SMS avec votre code de retrait.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de passer la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
          <Text style={styles.headerTitle}>📦 Finaliser ma commande</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Résumé de commande */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Résumé de votre commande</Text>
            
            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Magasin :</Text>
                <Text style={styles.summaryValue}>{getStoreFromCart()?.name}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Articles :</Text>
                <Text style={styles.summaryValue}>
                  {cartItems.reduce((total, item) => total + item.quantity, 0)} article(s)
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total :</Text>
                <Text style={[styles.summaryValue, styles.totalPrice]}>
                  {getTotalAmount().toFixed(2)} €
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Prêt vers :</Text>
                <Text style={styles.summaryValue}>
                  {formatTime(getEstimatedReadyTime())}
                </Text>
              </View>
            </View>
          </View>

          {/* Détail des articles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛍️ Détail des articles</Text>
            {cartItems.map((item, index) => (
              <View key={item.id} style={styles.itemDetail}>
                <Text style={styles.itemDetailName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemDetailPrice}>
                  {(item.price * item.quantity).toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>

          {/* Informations client */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Vos informations</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet *</Text>
              <TextInput
                style={styles.input}
                value={customerInfo.name}
                onChangeText={(text) => setCustomerInfo({...customerInfo, name: text})}
                placeholder="Votre nom et prénom"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone *</Text>
              <TextInput
                style={styles.input}
                value={customerInfo.phone}
                onChangeText={(text) => setCustomerInfo({...customerInfo, phone: text})}
                placeholder="06 12 34 56 78"
                keyboardType="phone-pad"
              />
              <Text style={styles.inputHelp}>
                Nécessaire pour vous prévenir quand votre commande est prête
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={customerInfo.email}
                onChangeText={(text) => setCustomerInfo({...customerInfo, email: text})}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Instructions spéciales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Instructions spéciales</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Demandes particulières, allergies, préférences..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Conditions */}
          <View style={styles.section}>
            <View style={styles.conditionsContainer}>
              <Text style={styles.conditionsText}>
                En passant cette commande, vous acceptez de récupérer vos articles dans les 2 heures suivant la notification de disponibilité. 
                Passé ce délai, la commande pourra être annulée.
              </Text>
            </View>
          </View>

          {/* Espace pour éviter que le bouton cache le contenu */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer avec bouton de commande */}
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total à payer :</Text>
            <Text style={styles.totalAmount}>{getTotalAmount().toFixed(2)} €</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.orderButton,
              { backgroundColor: isSubmitting ? '#ccc' : '#4CAF50' }
            ]}
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
          >
            <Text style={styles.orderButtonText}>
              {isSubmitting ? '⏳ Commande en cours...' : '✅ Confirmer ma commande'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.paymentInfo}>
            💳 Paiement à effectuer lors du retrait en magasin
          </Text>
        </View>
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
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  
  orderSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemDetailName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemDetailPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    height: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  inputHelp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  conditionsContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  conditionsText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});