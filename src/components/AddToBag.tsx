"use client";

import { useMemo } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { useVariantStore, type VariantState } from "@/store/variant";

type VariantRecord = {
  id: string;
  price: string | number | null;
  salePrice?: string | number | null;
};

type GalleryVariant = { id: string; color: string; images: string[] };

export interface AddToBagProps {
  productId: string;
  productName: string;
  variants: VariantRecord[];
  galleryVariants: GalleryVariant[];
}

function firstValidImage(images: string[]) {
  return images.find((s) => typeof s === "string" && s.trim().length > 0);
}

export default function AddToBag({ productId, productName, variants, galleryVariants }: AddToBagProps) {
  const selectedIndex = useVariantStore((state: VariantState) => state.getSelected(productId, 0));

  const { variantId, price, image } = useMemo(() => {
    const gv = galleryVariants[selectedIndex] ?? galleryVariants[0];
    const selectedId = gv?.id ?? variants[0]?.id;
    const fullVariant = variants.find((v) => v.id === selectedId) ?? variants[0];

    const rawSale = fullVariant?.salePrice;
    const rawPrice = fullVariant?.price;
    const numeric = (val: string | number | null | undefined) =>
      val === null || val === undefined ? undefined : Number(val);
    const computedPrice = numeric(rawSale) ?? numeric(rawPrice) ?? 0;

    return {
      variantId: selectedId as string,
      price: computedPrice,
      image: firstValidImage(gv?.images ?? [])
    };
  }, [galleryVariants, selectedIndex, variants]);

  if (!variantId) return null;

  return (
    <AddToCartButton
      productVariantId={variantId}
      name={productName}
      price={price}
      image={image}
      className="rounded-full px-6 py-4"
    />
  );
}

