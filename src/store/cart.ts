import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addToCart, updateCartItemQuantity, removeFromCart, clearCart, migrateGuestCart } from '@/lib/actions/cart';

export interface CartItem {
  id: string;
  productVariantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, 'quantity' | 'id'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
  migrateGuestCart: () => Promise<void>;
  setItems: (items: CartItem[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isLoading: false,
      
      setItems: (items) => {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        set({ items, total });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      addItem: async (item) => {
        try {
          set({ isLoading: true });
          
          // Try to add to server cart first
          await addToCart(item.productVariantId, 1);
          
          // Update local state
          const items = get().items;
          const existingItem = items.find((i) => i.productVariantId === item.productVariantId);
          
          if (existingItem) {
            const updatedItems = items.map((i) =>
              i.productVariantId === item.productVariantId 
                ? { ...i, quantity: i.quantity + 1 } 
                : i
            );
            const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            set({ items: updatedItems, total });
          } else {
            const newItem = { ...item, quantity: 1, id: crypto.randomUUID() };
            const updatedItems = [...items, newItem];
            const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            set({ items: updatedItems, total });
          }
        } catch (error) {
          console.error('Failed to add item to cart:', error);
          // Fallback to local state only
          const items = get().items;
          const existingItem = items.find((i) => i.productVariantId === item.productVariantId);
          
          if (existingItem) {
            const updatedItems = items.map((i) =>
              i.productVariantId === item.productVariantId 
                ? { ...i, quantity: i.quantity + 1 } 
                : i
            );
            const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            set({ items: updatedItems, total });
          } else {
            const newItem = { ...item, quantity: 1, id: crypto.randomUUID() };
            const updatedItems = [...items, newItem];
            const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            set({ items: updatedItems, total });
          }
        } finally {
          set({ isLoading: false });
        }
      },
      
      removeItem: async (id) => {
        try {
          set({ isLoading: true });
          
          // Try to remove from server cart first
          await removeFromCart(id);
          
          // Update local state
          const items = get().items.filter((item) => item.id !== id);
          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          set({ items, total });
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
          // Fallback to local state only
          const items = get().items.filter((item) => item.id !== id);
          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          set({ items, total });
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        try {
          set({ isLoading: true });
          
          // Try to update server cart first
          await updateCartItemQuantity(id, quantity);
          
          // Update local state
          const items = get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          );
          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          set({ items, total });
        } catch (error) {
          console.error('Failed to update cart item quantity:', error);
          // Fallback to local state only
          const items = get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          );
          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          set({ items, total });
        } finally {
          set({ isLoading: false });
        }
      },
      
      clearCart: async () => {
        try {
          set({ isLoading: true });
          
          // Try to clear server cart first
          await clearCart();
          
          // Update local state
          set({ items: [], total: 0 });
        } catch (error) {
          console.error('Failed to clear cart:', error);
          // Fallback to local state only
          set({ items: [], total: 0 });
        } finally {
          set({ isLoading: false });
        }
      },
      
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      
      migrateGuestCart: async () => {
        try {
          set({ isLoading: true });
          
          const guestItems = get().items.map(item => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          }));
          
          if (guestItems.length > 0) {
            await migrateGuestCart(guestItems);
            // Clear local guest cart after successful migration
            set({ items: [], total: 0 });
          }
        } catch (error) {
          console.error('Failed to migrate guest cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);