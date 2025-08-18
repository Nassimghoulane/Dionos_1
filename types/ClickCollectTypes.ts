// types/ClickCollectTypes.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  category: string;
  storeId: string;
  storeName: string;
  available: boolean;
  preparationTime: number; // en minutes
  quantity?: number; // pour le panier
}

export interface Store {
  id: string;
  name: string;
  mappedInLocationId: string; // ID de la location Mappedin
  category: 'restaurant' | 'grocery' | 'pharmacy' | 'electronics' | 'clothing' | 'other';
  rating: number;
  openingHours: {
    [key: string]: { open: string; close: string } | null;
  };
  phone?: string;
  description?: string;
  products: Product[];
  acceptsClickCollect: boolean;
  averagePreparationTime: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOptions?: { [key: string]: string };
}

export interface ClickCollectOrder {
  id: string;
  storeId: string;
  storeName: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'collected' | 'cancelled';
  createdAt: Date;
  estimatedReadyTime: Date;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  pickupCode: string;
  specialInstructions?: string;
}

export interface ClickCollectState {
  stores: Store[];
  cart: CartItem[];
  currentOrder: ClickCollectOrder | null;
  activeOrders: ClickCollectOrder[];
  selectedStore: Store | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
}