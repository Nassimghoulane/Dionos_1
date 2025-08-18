// components/ClickCollectStore.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Store, Product, CartItem } from '../types/ClickCollectTypes';

interface ClickCollectStoreProps {
  store: Store;
  onAddToCart: (product: Product) => void;
  onNavigateToStore: () => void;
  cartItems: CartItem[];
}

export default function ClickCollectStore({ 
  store, 
  onAddToCart, 
  onNavigateToStore,
  cartItems 
}: ClickCollectStoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(store.products.map(p => p.category))];
  
  const filteredProducts = selectedCategory === 'all' 
    ? store.products 
    : store.products.filter(p => p.category === selectedCategory);

  const getItemInCart = (productId: string) => {
    return cartItems.find(item => item.id === productId);
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      'all': '🛍️',
      'food': '🍕',
      'drinks': '🥤',
      'desserts': '🍰',
      'snacks': '🍿',
      'electronics': '📱',
      'clothing': '👕',
      'books': '📚',
      'pharmacy': '💊',
      'default': '📦'
    };
    return emojis[category] || emojis.default;
  };

  const getStoreStatusColor = () => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = store.openingHours[currentDay];
    if (!todayHours) return '#ff4444'; // Fermé
    
    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));
    
    if (currentTime >= openTime && currentTime <= closeTime) {
      return '#4CAF50'; // Ouvert
    }
    return '#ff4444'; // Fermé
  };

  const renderProduct = (product: Product) => {
    const cartItem = getItemInCart(product.id);
    const isInCart = !!cartItem;
    
    return (
      <View key={product.id} style={styles.productCard}>
        {product.image && (
          <Image source={{ uri: product.image }} style={styles.productImage} />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>{product.price.toFixed(2)} €</Text>
            <View style={styles.productMeta}>
              <Text style={styles.preparationTime}>
                ⏱️ {product.preparationTime}min
              </Text>
              {!product.available && (
                <Text style={styles.unavailable}>Indisponible</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              { backgroundColor: product.available ? '#4CAF50' : '#ccc' },
              isInCart && { backgroundColor: '#FF9800' }
            ]}
            onPress={() => product.available && onAddToCart(product)}
            disabled={!product.available}
          >
            <Text style={styles.addToCartText}>
              {isInCart 
                ? `🛒 Dans le panier (${cartItem?.quantity})` 
                : product.available 
                  ? '➕ Ajouter' 
                  : 'Indisponible'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En-tête du magasin */}
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription}>{store.description}</Text>
          
          <View style={styles.storeDetails}>
            <View style={styles.storeDetail}>
              <View style={[styles.statusDot, { backgroundColor: getStoreStatusColor() }]} />
              <Text style={styles.statusText}>
                {getStoreStatusColor() === '#4CAF50' ? 'Ouvert' : 'Fermé'}
              </Text>
            </View>
            
            <View style={styles.storeDetail}>
              <Text style={styles.detailText}>⭐ {store.rating.toFixed(1)}</Text>
            </View>
            
            <View style={styles.storeDetail}>
              <Text style={styles.detailText}>
                ⏱️ ~{store.averagePreparationTime}min
              </Text>
            </View>
          </View>
          
          {store.phone && (
            <Text style={styles.storePhone}>📞 {store.phone}</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={onNavigateToStore}
        >
          <Text style={styles.navigateButtonText}>🧭 Y aller</Text>
        </TouchableOpacity>
      </View>

      {/* Filtre par catégories */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Catégories :</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {getCategoryEmoji(category)} {category === 'all' ? 'Tout' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des produits */}
      <View style={styles.productsContainer}>
        <Text style={styles.productsTitle}>
          📦 Produits disponibles ({filteredProducts.length})
        </Text>
        
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Text style={styles.emptyProductsText}>
              Aucun produit trouvé dans cette catégorie
            </Text>
          </View>
        ) : (
          filteredProducts.map(renderProduct)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  storeHeader: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  storeDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  storeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  storePhone: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 4,
  },
  navigateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  categoriesContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  
  productsContainer: {
    padding: 20,
    paddingTop: 8,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 16,
    color: '#666',
  },
  
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  productMeta: {
    alignItems: 'flex-end',
  },
  preparationTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  unavailable: {
    fontSize: 12,
    color: '#ff4444',
    fontWeight: '600',
  },
  addToCartButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});