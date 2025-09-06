"use client";

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  productVariantId: string;
  name: string;
  price: number;
  image?: string;
  color?: string;
  size?: string;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productVariantId,
  name,
  price,
  image,
  color,
  size,
  disabled = false,
  className = "",
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCartStore();

  const handleAddToCart = async () => {
    if (disabled || isAdding) return;

    setIsAdding(true);
    try {
      await addItem({
        productVariantId,
        name,
        price,
        image,
        color,
        size,
      });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={`flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}

