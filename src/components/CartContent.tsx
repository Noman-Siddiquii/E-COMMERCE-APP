"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { CartItemWithDetails } from '@/lib/actions/cart';
import { formatPrice } from '@/lib/utils/format';
import { useCartSync } from '@/hooks/useCartSync';

type ServerCartLight = { items: { id: string; quantity: number; variantId: string }[] };

interface CartContentProps {
  initialCart: ServerCartLight | { items: CartItemWithDetails[] } | null;
}

export default function CartContent({ initialCart }: CartContentProps) {
  const [cart] = useState(initialCart);
  const { updateQuantity, removeItem, isLoading } = useCartStore();
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
  const { syncCart, isLoading: isSyncing } = useCartSync();

  useEffect(() => {
    if (initialCart?.items) {
      const quantities: Record<string, number> = {};
      (initialCart.items as Array<CartItemWithDetails | ServerCartLight['items'][number]>).forEach((item) => {
        quantities[item.id] = item.quantity;
      });
      setLocalQuantities(quantities);
    }
  }, [initialCart]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setLocalQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
    
    try {
      await updateQuantity(itemId, newQuantity);
      // Sync cart data after successful update
      await syncCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // Revert local state on error
      setLocalQuantities(prev => ({
        ...prev,
        [itemId]: (cart?.items as Array<CartItemWithDetails | ServerCartLight['items'][number]>)?.find((i) => i.id === itemId)?.quantity || 1,
      }));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      // Sync cart data after successful removal
      await syncCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  type CartItemUnion = CartItemWithDetails | ServerCartLight['items'][number];
  const isDetailedItem = (item: CartItemUnion): item is CartItemWithDetails =>
    (item as CartItemWithDetails)?.variant !== undefined;

  const calculateSubtotal = () => {
    return cart?.items?.reduce((total: number, item: CartItemUnion) => {
      if (isDetailedItem(item)) {
        const price = parseFloat(item.variant.salePrice || item.variant.price);
        return total + price * item.quantity;
      }
      return total; // unknown price for light item; will be updated after sync
    }, 0) || 0;
  };

  const subtotal = calculateSubtotal();
  const shipping = 2.00; // Fixed shipping cost
  const total = subtotal + shipping;

  if (isSyncing) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">Syncing cart...</p>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-500 mb-6">Looks like you {"haven't"} added any items to your cart yet.</p>
        <Link
          href="/products"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cart</h2>
        
        {cart.items.map((item: CartItemUnion) => (
          <div key={item.id} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <Image
                  src={isDetailedItem(item) ? (item.variant.images?.[0]?.url || '/placeholder-shoe.jpg') : '/placeholder-shoe.jpg'}
                  alt={isDetailedItem(item) ? item.variant.product.name : 'Product image'}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {isDetailedItem(item) ? item.variant.product.name : 'Loading product...'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {isDetailedItem(item) ? item.variant.product.description : ''}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      {isDetailedItem(item) && (
                        <>
                          <span>Size {item.variant.size.name}</span>
                          <span>Color {item.variant.color.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    {isDetailedItem(item) && (
                      <>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPrice(parseFloat(item.variant.salePrice || item.variant.price))}
                        </p>
                        {item.variant.salePrice && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(parseFloat(item.variant.price))}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Quantity</span>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleQuantityChange(item.id, localQuantities[item.id] - 1)}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium">
                        {localQuantities[item.id] || item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, localQuantities[item.id] + 1)}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800 p-2 disabled:opacity-50"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg p-6 border border-gray-200 h-fit sticky top-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Delivery & Handling</span>
              <span className="font-medium">{formatPrice(shipping)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <button
            disabled={isLoading || cart.items.length === 0}
            className="w-full bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : 'Proceed to Checkout'}
          </button>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Free shipping on orders over $150
          </p>
        </div>
      </div>
    </div>
  );
}
