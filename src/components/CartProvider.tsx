"use client";

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';

interface CartProviderProps {
  children: React.ReactNode;
}

export default function CartProvider({ children }: CartProviderProps) {
  const { migrateGuestCart } = useCartStore();

  useEffect(() => {
    // Cart migration will be handled when the user logs in
    // This component now just provides the cart context
    // The actual migration logic will be in the auth flow
    // We can add a listener for auth state changes here later
  }, []);

  return <>{children}</>;
}
