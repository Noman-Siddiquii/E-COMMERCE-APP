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
        // Transform server cart items to local format
        const localItems = cart.items.map((item: CartItemWithDetails) => ({
          id: item.id,
          productVariantId: item.variant.id,
          name: item.variant.product.name,
          price: parseFloat(item.variant.salePrice || item.variant.price),
          quantity: item.quantity,
          image: item.variant.product.images[0]?.url,
          color: item.variant.color.name,
          size: item.variant.size.name,
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

