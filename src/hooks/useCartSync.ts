import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart';
import { getOrCreateCart } from '@/lib/actions/cart';
import { CartItemWithDetails } from '@/lib/actions/cart';

export function useCartSync() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setItems, setLoading } = useCartStore();

  const syncCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cart = await getOrCreateCart();
      
      if (cart?.items) {
        // cart.items from server are lightweight. We can't build full local items without extra fetches,
        // so we only update quantities here; details will populate on subsequent navigations.
        const localItems = cart.items.map((item: { id: string; quantity: number; variantId: string }) => ({
          id: item.id,
          productVariantId: item.variantId,
          name: 'Product',
          price: 0,
          quantity: item.quantity,
          image: undefined,
          color: undefined as unknown as string,
          size: undefined as unknown as string,
        }));

        setItems(localItems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync cart');
      console.error('Cart sync error:', err);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    syncCart();
  }, []);

  return {
    syncCart,
    isLoading,
    error,
  };
}

