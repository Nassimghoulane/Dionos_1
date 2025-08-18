// context/ClickCollectContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  Store, 
  Product, 
  CartItem, 
  ClickCollectOrder, 
  ClickCollectState 
} from '../types/ClickCollectTypes';

// Actions
type ClickCollectAction =
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SELECTED_STORE'; payload: Store | null }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_CHECKOUT_OPEN'; payload: boolean }
  | { type: 'ADD_ORDER'; payload: ClickCollectOrder }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: ClickCollectOrder['status'] } }
  | { type: 'CANCEL_ORDER'; payload: string };

// État initial
const initialState: ClickCollectState = {
  stores: [],
  cart: [],
  currentOrder: null,
  activeOrders: [],
  selectedStore: null,
  isCartOpen: false,
  isCheckoutOpen: false,
};

// Reducer
function clickCollectReducer(state: ClickCollectState, action: ClickCollectAction): ClickCollectState {
  switch (action.type) {
    case 'SET_STORES':
      return { ...state, stores: action.payload };

    case 'ADD_TO_CART': {
      const product = action.payload;
      const existingItem = state.cart.find(item => item.id === product.id);
      
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        return {
          ...state,
          cart: [...state.cart, { ...product, quantity: 1 }],
        };
      }
    }

    case 'UPDATE_CART_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.id !== productId),
        };
      }
      
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        ),
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SET_SELECTED_STORE':
      return { ...state, selectedStore: action.payload };

    case 'SET_CART_OPEN':
      return { ...state, isCartOpen: action.payload };

    case 'SET_CHECKOUT_OPEN':
      return { ...state, isCheckoutOpen: action.payload };

    case 'ADD_ORDER': {
      const newOrder = action.payload;
      return {
        ...state,
        activeOrders: [...state.activeOrders, newOrder],
        currentOrder: newOrder,
        cart: [], // Vider le panier après commande
        isCheckoutOpen: false,
        isCartOpen: false,
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      const { orderId, status } = action.payload;
      return {
        ...state,
        activeOrders: state.activeOrders.map(order =>
          order.id === orderId ? { ...order, status } : order
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, status }
          : state.currentOrder,
      };
    }

    case 'CANCEL_ORDER': {
      const orderId = action.payload;
      return {
        ...state,
        activeOrders: state.activeOrders.map(order =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, status: 'cancelled' }
          : state.currentOrder,
      };
    }

    default:
      return state;
  }
}

// Context
interface ClickCollectContextType {
  state: ClickCollectState;
  actions: {
    setStores: (stores: Store[]) => void;
    addToCart: (product: Product) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    setSelectedStore: (store: Store | null) => void;
    setCartOpen: (open: boolean) => void;
    setCheckoutOpen: (open: boolean) => void;
    placeOrder: (orderData: Omit<ClickCollectOrder, 'id' | 'createdAt' | 'pickupCode'>) => void;
    updateOrderStatus: (orderId: string, status: ClickCollectOrder['status']) => void;
    cancelOrder: (orderId: string) => void;
    getStoreById: (storeId: string) => Store | undefined;
    getCartTotal: () => number;
    getCartItemCount: () => number;
  };
}

const ClickCollectContext = createContext<ClickCollectContextType | undefined>(undefined);

// Provider
interface ClickCollectProviderProps {
  children: React.ReactNode;
}

export function ClickCollectProvider({ children }: ClickCollectProviderProps) {
  const [state, dispatch] = useReducer(clickCollectReducer, initialState);

  // Charger les données au démarrage
  useEffect(() => {
    loadMockData();
  }, []);

  // Données fictives pour la démo
  const loadMockData = () => {
    const mockStores: Store[] = [
      {
        id: 'store-1',
        name: 'Food Corner',
        mappedInLocationId: 'location-food-court', // ID correspondant dans Mappedin
        category: 'restaurant',
        rating: 4.5,
        openingHours: {
          monday: { open: '08:00', close: '22:00' },
          tuesday: { open: '08:00', close: '22:00' },
          wednesday: { open: '08:00', close: '22:00' },
          thursday: { open: '08:00', close: '22:00' },
          friday: { open: '08:00', close: '23:00' },
          saturday: { open: '09:00', close: '23:00' },
          sunday: { open: '10:00', close: '21:00' },
        },
        phone: '01 23 45 67 89',
        description: 'Restaurant rapide avec des plats frais et savoureux',
        acceptsClickCollect: true,
        averagePreparationTime: 15,
        products: [
          {
            id: 'prod-1',
            name: 'Burger Classic',
            price: 8.90,
            description: 'Burger avec steak, salade, tomate, cornichons',
            category: 'food',
            storeId: 'store-1',
            storeName: 'Food Corner',
            available: true,
            preparationTime: 10,
          },
          {
            id: 'prod-2',
            name: 'Pizza Margherita',
            price: 12.50,
            description: 'Pizza traditionnelle à la tomate et mozzarella',
            category: 'food',
            storeId: 'store-1',
            storeName: 'Food Corner',
            available: true,
            preparationTime: 15,
          },
          {
            id: 'prod-3',
            name: 'Salade César',
            price: 9.80,
            description: 'Salade fraîche avec poulet grillé et parmesan',
            category: 'food',
            storeId: 'store-1',
            storeName: 'Food Corner',
            available: true,
            preparationTime: 5,
          },
          {
            id: 'prod-4',
            name: 'Coca-Cola',
            price: 2.50,
            description: 'Boisson gazeuse rafraîchissante',
            category: 'drinks',
            storeId: 'store-1',
            storeName: 'Food Corner',
            available: true,
            preparationTime: 1,
          },
        ],
      },
      {
        id: 'store-2',
        name: 'PharmaCare',
        mappedInLocationId: 'location-pharmacy',
        category: 'pharmacy',
        rating: 4.2,
        openingHours: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '09:00', close: '18:00' },
          sunday: null,
        },
        phone: '01 23 45 67 90',
        description: 'Pharmacie moderne avec un large choix de produits de santé',
        acceptsClickCollect: true,
        averagePreparationTime: 5,
        products: [
          {
            id: 'prod-5',
            name: 'Paracétamol 1g',
            price: 3.20,
            description: 'Antalgique et antipyrétique - Boîte de 8 comprimés',
            category: 'pharmacy',
            storeId: 'store-2',
            storeName: 'PharmaCare',
            available: true,
            preparationTime: 2,
          },
          {
            id: 'prod-6',
            name: 'Vitamines C',
            price: 6.50,
            description: 'Complément alimentaire vitamine C - 30 comprimés',
            category: 'pharmacy',
            storeId: 'store-2',
            storeName: 'PharmaCare',
            available: true,
            preparationTime: 2,
          },
        ],
      },
      {
        id: 'store-3',
        name: 'TechZone',
        mappedInLocationId: 'location-electronics',
        category: 'electronics',
        rating: 4.7,
        openingHours: {
          monday: { open: '10:00', close: '20:00' },
          tuesday: { open: '10:00', close: '20:00' },
          wednesday: { open: '10:00', close: '20:00' },
          thursday: { open: '10:00', close: '20:00' },
          friday: { open: '10:00', close: '21:00' },
          saturday: { open: '10:00', close: '21:00' },
          sunday: { open: '11:00', close: '19:00' },
        },
        phone: '01 23 45 67 91',
        description: 'Magasin d\'électronique avec les dernières technologies',
        acceptsClickCollect: true,
        averagePreparationTime: 10,
        products: [
          {
            id: 'prod-7',
            name: 'Écouteurs Bluetooth',
            price: 29.99,
            description: 'Écouteurs sans fil avec réduction de bruit',
            category: 'electronics',
            storeId: 'store-3',
            storeName: 'TechZone',
            available: true,
            preparationTime: 5,
          },
          {
            id: 'prod-8',
            name: 'Chargeur USB-C',
            price: 15.99,
            description: 'Chargeur rapide 20W compatible tous appareils',
            category: 'electronics',
            storeId: 'store-3',
            storeName: 'TechZone',
            available: false,
            preparationTime: 3,
          },
        ],
      },
    ];

    dispatch({ type: 'SET_STORES', payload: mockStores });
  };

  // Actions
  const actions = {
    setStores: (stores: Store[]) => {
      dispatch({ type: 'SET_STORES', payload: stores });
    },

    addToCart: (product: Product) => {
      dispatch({ type: 'ADD_TO_CART', payload: product });
    },

    updateCartQuantity: (productId: string, quantity: number) => {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
    },

    removeFromCart: (productId: string) => {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    },

    clearCart: () => {
      dispatch({ type: 'CLEAR_CART' });
    },

    setSelectedStore: (store: Store | null) => {
      dispatch({ type: 'SET_SELECTED_STORE', payload: store });
    },

    setCartOpen: (open: boolean) => {
      dispatch({ type: 'SET_CART_OPEN', payload: open });
    },

    setCheckoutOpen: (open: boolean) => {
      dispatch({ type: 'SET_CHECKOUT_OPEN', payload: open });
    },

    placeOrder: (orderData: Omit<ClickCollectOrder, 'id' | 'createdAt' | 'pickupCode'>) => {
      const newOrder: ClickCollectOrder = {
        ...orderData,
        id: `order-${Date.now()}`,
        createdAt: new Date(),
        pickupCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
      };
      
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
      
      // Simuler la progression de la commande
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_ORDER_STATUS', 
          payload: { orderId: newOrder.id, status: 'confirmed' } 
        });
      }, 2000);
      
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_ORDER_STATUS', 
          payload: { orderId: newOrder.id, status: 'preparing' } 
        });
      }, 5000);
      
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_ORDER_STATUS', 
          payload: { orderId: newOrder.id, status: 'ready' } 
        });
      }, orderData.estimatedReadyTime.getTime() - Date.now());
    },

    updateOrderStatus: (orderId: string, status: ClickCollectOrder['status']) => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
    },

    cancelOrder: (orderId: string) => {
      dispatch({ type: 'CANCEL_ORDER', payload: orderId });
    },

    getStoreById: (storeId: string) => {
      return state.stores.find(store => store.id === storeId);
    },

    getCartTotal: () => {
      return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    getCartItemCount: () => {
      return state.cart.reduce((total, item) => total + item.quantity, 0);
    },
  };

  return (
    <ClickCollectContext.Provider value={{ state, actions }}>
      {children}
    </ClickCollectContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useClickCollect() {
  const context = useContext(ClickCollectContext);
  if (context === undefined) {
    throw new Error('useClickCollect must be used within a ClickCollectProvider');
  }
  return context;
}