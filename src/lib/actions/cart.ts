"use server";

import { db } from "@/lib/db";
import { carts, cartItems } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export interface CartItemData {
  productVariantId: string;
  quantity: number;
}

export interface CartItemWithDetails {
  id: string;
  quantity: number;
  variant: {
    id: string;
    price: string;
    salePrice: string | null;
    color: {
      id: string;
      name: string;
    };
    size: {
      id: string;
      name: string;
    };
    product: {
      id: string;
      name: string;
      description: string;
    };
    images: {
      id: string;
      url: string;
      alt: string;
    }[];
  };
}

export async function getOrCreateCart() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (session?.user?.id) {
      // User is authenticated, get or create their cart
      let userCart = await db.select().from(carts).where(eq(carts.userId, session.user.id));
      
      if (userCart.length > 0) {
        // Get cart items with variant details
        const cartItemsWithDetails = await db
          .select({
            id: cartItems.id,
            quantity: cartItems.quantity,
            variantId: cartItems.productVariantId,
          })
          .from(cartItems)
          .where(eq(cartItems.cartId, userCart[0].id));
        
        return {
          ...userCart[0],
          items: cartItemsWithDetails,
        };
      } else {
        // Create new cart for user
        const [newCart] = await db.insert(carts).values({
          userId: session.user.id,
        }).returning();
        
        return {
          ...newCart,
          items: [],
        };
      }
    } else {
      // Guest user - create temporary cart (you might want to use cookies for this)
      // For now, we'll return null for guests
      return null;
    }
  } catch (error) {
    console.error('Error in getOrCreateCart:', error);
    return null;
  }
}

export async function addToCart(productVariantId: string, quantity: number = 1) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      throw new Error("User must be authenticated to add items to cart");
    }

    let userCart = await db.select().from(carts).where(eq(carts.userId, session.user.id));

    if (userCart.length === 0) {
      const [newCart] = await db.insert(carts).values({
        userId: session.user.id,
      }).returning();
      userCart = [newCart];
    }

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.cartId, userCart[0].id),
        eq(cartItems.productVariantId, productVariantId)
      ));

    if (existingItem.length > 0) {
      // Update quantity
      await db.update(cartItems)
        .set({ quantity: existingItem[0].quantity + quantity })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId: userCart[0].id,
        productVariantId,
        quantity,
      });
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error('Error in addToCart:', error);
    throw error;
  }
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      throw new Error("User must be authenticated to update cart");
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await removeFromCart(cartItemId);
      return { success: true };
    }

    await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, cartItemId));

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    throw error;
  }
}

export async function removeFromCart(cartItemId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      throw new Error("User must be authenticated to remove items from cart");
    }

    await db.delete(cartItems)
      .where(eq(cartItems.id, cartItemId));

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    throw error;
  }
}

export async function clearCart() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      throw new Error("User must be authenticated to clear cart");
    }

    const userCart = await db.select().from(carts).where(eq(carts.userId, session.user.id));

    if (userCart.length > 0) {
      await db.delete(cartItems)
        .where(eq(cartItems.cartId, userCart[0].id));
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error('Error in clearCart:', error);
    throw error;
  }
}

export async function getCartItemCount() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return 0;
    }

    const userCart = await db.select().from(carts).where(eq(carts.userId, session.user.id));

    if (userCart.length === 0) return 0;

    const cartItemsList = await db
      .select({ quantity: cartItems.quantity })
      .from(cartItems)
      .where(eq(cartItems.cartId, userCart[0].id));

    return cartItemsList.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error in getCartItemCount:', error);
    return 0;
  }
}

export async function migrateGuestCart(guestCartItems: CartItemData[]) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id || guestCartItems.length === 0) {
      return { success: false };
    }

    let userCart = await db.select().from(carts).where(eq(carts.userId, session.user.id));

    if (userCart.length === 0) {
      const [newCart] = await db.insert(carts).values({
        userId: session.user.id,
      }).returning();
      userCart = [newCart];
    }

    // Add each guest cart item to user cart
    for (const item of guestCartItems) {
      const existingItem = await db
        .select()
        .from(cartItems)
        .where(and(
          eq(cartItems.cartId, userCart[0].id),
          eq(cartItems.productVariantId, item.productVariantId)
        ));

      if (existingItem.length > 0) {
        // Update quantity
        await db.update(cartItems)
          .set({ quantity: existingItem[0].quantity + item.quantity })
          .where(eq(cartItems.id, existingItem[0].id));
      } else {
        // Add new item
        await db.insert(cartItems).values({
          cartId: userCart[0].id,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        });
      }
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error('Error in migrateGuestCart:', error);
    return { success: false };
  }
}
