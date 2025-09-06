

"use server";

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brands,
  categories,
  genders,
  productImages,
  productVariants,
  products,
  sizes,
  colors,
  users,
  reviews,
  type SelectProduct,
  type SelectVariant,
  type SelectProductImage,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
  type SelectColor,
  type SelectSize,
} from "@/lib/db/schema";

import { NormalizedProductFilters } from "@/lib/utils/query";

type ProductListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  createdAt: Date;
  subtitle?: string | null;
};

export type GetAllProductsResult = {
  products: ProductListItem[];
  totalCount: number;
};

export async function getAllProducts(filters: Partial<NormalizedProductFilters> = {}): Promise<GetAllProductsResult> {
  try {
    console.log('getAllProducts called with filters:', filters);
    
    // Build the base where conditions
    const baseConditions: SQL[] = [eq(products.isPublished, true)];
    
    // Apply gender filter
    if (filters.genderSlugs && filters.genderSlugs.length > 0) {
      console.log('Applying gender filter:', filters.genderSlugs);
      baseConditions.push(
        inArray(
          products.genderId,
          db.select({ id: genders.id })
            .from(genders)
            .where(inArray(genders.slug, filters.genderSlugs))
        )
      );
    }
    
    // Apply brand filter
    if (filters.brandSlugs && filters.brandSlugs.length > 0) {
      console.log('Applying brand filter:', filters.brandSlugs);
      baseConditions.push(
        inArray(
          products.brandId,
          db.select({ id: brands.id })
            .from(brands)
            .where(inArray(brands.slug, filters.brandSlugs))
        )
      );
    }
    
    // Apply category filter
    if (filters.categorySlugs && filters.categorySlugs.length > 0) {
      console.log('Applying category filter:', filters.categorySlugs);
      baseConditions.push(
        inArray(
          products.categoryId,
          db.select({ id: categories.id })
            .from(categories)
            .where(inArray(categories.slug, filters.categorySlugs))
        )
      );
    }
    
    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchPattern = `%${filters.search.trim()}%`;
      const where = or(
        ilike(products.name, searchPattern),
        ilike(products.description, searchPattern)
      ) as unknown as SQL;
      baseConditions.push(where);
    }
    
    // Combine all conditions
    const whereClause = baseConditions.length > 1 ? and(...baseConditions) : baseConditions[0];
    
    console.log('Final where clause:', whereClause);
    
    // Start with a filtered query to get basic product information
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        createdAt: products.createdAt,
        genderId: products.genderId,
      })
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(filters.limit || 24);

    console.log('Filtered products query returned:', rows.length, 'rows');

    // Get gender information for subtitle
    const genderMap = new Map<string, string>();
    if (rows.length > 0) {
      const genderIds = rows.map(r => r.genderId).filter((x): x is string => Boolean(x));
      if (genderIds.length > 0) {
        const genderRows = await db
          .select({ id: genders.id, label: genders.label })
          .from(genders)
          .where(inArray(genders.id, genderIds));
        
        genderRows.forEach(g => genderMap.set(g.id, g.label));
      }
    }

    // Get variant information for pricing
    const productIds = rows.map(r => r.id);
    const variantRows = await db
      .select({
        productId: productVariants.productId,
        price: productVariants.price,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));

    // Group variants by product to get min/max prices
    const priceMap = new Map<string, { min: number | null; max: number | null }>();
    variantRows.forEach(v => {
      const price = parseFloat(v.price);
      if (!priceMap.has(v.productId)) {
        priceMap.set(v.productId, { min: null, max: null });
      }
      const current = priceMap.get(v.productId)!;
      if (current.min === null || price < current.min) current.min = price;
      if (current.max === null || price > current.max) current.max = price;
    });

    // Get primary images for products
    const imageRows = await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
      })
      .from(productImages)
      .where(and(
        inArray(productImages.productId, productIds),
        eq(productImages.isPrimary, true)
      ));

    const imageMap = new Map<string, string>();
    imageRows.forEach(img => imageMap.set(img.productId, img.url));

    // Build the final product list
    const productsOut: ProductListItem[] = rows.map((r) => {
      const prices = priceMap.get(r.id) || { min: null, max: null };
      const gender = r.genderId ? genderMap.get(r.genderId) : null;
      
      return {
        id: r.id,
        name: r.name,
        imageUrl: imageMap.get(r.id) || null,
        minPrice: prices.min,
        maxPrice: prices.max,
        createdAt: r.createdAt,
        subtitle: gender ? `${gender} Shoes` : null,
      };
    });

    console.log('Final products processed:', productsOut.length);
    console.log('Products with genders:', productsOut.map(p => ({ name: p.name, gender: p.subtitle })));

    return { 
      products: productsOut, 
      totalCount: productsOut.length 
    };
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  }
}

export type FullProduct = {
  product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
  };
  variants: Array<
    SelectVariant & {
      color?: SelectColor | null;
      size?: SelectSize | null;
    }
  >;
  images: SelectProductImage[];
};

export async function getProduct(productId: string): Promise<FullProduct | null> {
  try {
    console.log('Fetching product with ID:', productId);
    
    const rows = await db
      .select({
        productId: products.id,
        productName: products.name,
        productDescription: products.description,
        productBrandId: products.brandId,
        productCategoryId: products.categoryId,
        productGenderId: products.genderId,
        isPublished: products.isPublished,
        defaultVariantId: products.defaultVariantId,
        productCreatedAt: products.createdAt,
        productUpdatedAt: products.updatedAt,

        brandId: brands.id,
        brandName: brands.name,
        brandSlug: brands.slug,
        brandLogoUrl: brands.logoUrl,

        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,

        genderId: genders.id,
        genderLabel: genders.label,
        genderSlug: genders.slug,

        variantId: productVariants.id,
        variantSku: productVariants.sku,
        variantPrice: sql<number | null>`${productVariants.price}::numeric`,
        variantSalePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
        variantColorId: productVariants.colorId,
        variantSizeId: productVariants.sizeId,
        variantInStock: productVariants.inStock,

        colorId: colors.id,
        colorName: colors.name,
        colorSlug: colors.slug,
        colorHex: colors.hexCode,

        sizeId: sizes.id,
        sizeName: sizes.name,
        sizeSlug: sizes.slug,
        sizeSortOrder: sizes.sortOrder,

        imageId: productImages.id,
        imageUrl: productImages.url,
        imageIsPrimary: productImages.isPrimary,
        imageSortOrder: productImages.sortOrder,
        imageVariantId: productImages.variantId,
      })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(productVariants, eq(productVariants.productId, products.id))
      .leftJoin(colors, eq(colors.id, productVariants.colorId))
      .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .where(eq(products.id, productId));

    console.log('Query executed successfully, rows returned:', rows.length);

    if (!rows.length) {
      console.log('No product found with ID:', productId);
      return null;
    }

    const head = rows[0];

    const product: SelectProduct & {
      brand?: SelectBrand | null;
      category?: SelectCategory | null;
      gender?: SelectGender | null;
    } = {
      id: head.productId,
      name: head.productName,
      description: head.productDescription,
      brandId: head.productBrandId ?? null,
      categoryId: head.productCategoryId ?? null,
      genderId: head.productGenderId ?? null,
      isPublished: head.isPublished,
      defaultVariantId: head.defaultVariantId ?? null,
      createdAt: head.productCreatedAt,
      updatedAt: head.productUpdatedAt,
      brand: head.brandId
        ? {
            id: head.brandId,
            name: head.brandName!,
            slug: head.brandSlug!,
            logoUrl: head.brandLogoUrl ?? null,
          }
        : null,
      category: head.categoryId
        ? {
            id: head.categoryId,
            name: head.categoryName!,
            slug: head.categorySlug!,
            parentId: null,
          }
        : null,
      gender: head.genderId
        ? {
            id: head.genderId,
            label: head.genderLabel!,
            slug: head.genderSlug!,
          }
        : null,
    };

    const variantsMap = new Map<string, FullProduct["variants"][number]>();
    const imagesMap = new Map<string, SelectProductImage>();

    for (const r of rows) {
      if (r.variantId && !variantsMap.has(r.variantId)) {
        variantsMap.set(r.variantId, {
          id: r.variantId,
          productId: head.productId,
          sku: r.variantSku!,
          price: r.variantPrice !== null ? String(r.variantPrice) : "0",
          salePrice: r.variantSalePrice !== null ? String(r.variantSalePrice) : null,
          colorId: r.variantColorId!,
          sizeId: r.variantSizeId!,
          inStock: r.variantInStock!,
          weight: null,
          dimensions: null,
          createdAt: head.productCreatedAt,
          color: r.colorId
            ? {
                id: r.colorId,
                name: r.colorName!,
                slug: r.colorSlug!,
                hexCode: r.colorHex!,
              }
            : null,
          size: r.sizeId
            ? {
                id: r.sizeId,
                name: r.sizeName!,
                slug: r.sizeSlug!,
                sortOrder: r.sizeSortOrder!,
              }
            : null,
        });
      }
      if (r.imageId && !imagesMap.has(r.imageId)) {
        imagesMap.set(r.imageId, {
          id: r.imageId,
          productId: head.productId,
          variantId: r.imageVariantId ?? null,
          url: r.imageUrl!,
          sortOrder: r.imageSortOrder ?? 0,
          isPrimary: r.imageIsPrimary ?? false,
        });
      }
    }

    return {
      product,
      variants: Array.from(variantsMap.values()),
      images: Array.from(imagesMap.values()),
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}
export type Review = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
};

export type RecommendedProduct = {
  id: string;
  title: string;
  price: number | null;
  imageUrl: string;
};

export async function getProductReviews(productId: string): Promise<Review[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    author: r.authorName?.trim() || r.authorEmail || "Anonymous",
    rating: r.rating,
    title: undefined,
    content: r.comment || "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getRecommendedProducts(productId: string): Promise<RecommendedProduct[]> {
  const base = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      brandId: products.brandId,
      genderId: products.genderId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!base.length) return [];
  const b = base[0];

  const v = db
    .select({
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("price"),
    })
    .from(productVariants)
    .as("v");

  const pi = db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      rn: sql<number>`row_number() over (partition by ${productImages.productId} order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc)`.as(
        "rn",
      ),
    })
    .from(productImages)
    .as("pi");

  const priority = sql<number>`
    (case when ${products.categoryId} is not null and ${products.categoryId} = ${b.categoryId} then 1 else 0 end) * 3 +
    (case when ${products.brandId} is not null and ${products.brandId} = ${b.brandId} then 1 else 0 end) * 2 +
    (case when ${products.genderId} is not null and ${products.genderId} = ${b.genderId} then 1 else 0 end) * 1
  `;

  const rows = await db
    .select({
      id: products.id,
      title: products.name,
      minPrice: sql<number | null>`min(${v.price})`,
      imageUrl: sql<string | null>`max(case when ${pi.rn} = 1 then ${pi.url} else null end)`,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(v, eq(v.productId, products.id))
    .leftJoin(pi, eq(pi.productId, products.id))
    .where(and(eq(products.isPublished, true), sql`${products.id} <> ${productId}`))
    .groupBy(products.id, products.name, products.createdAt)
    .orderBy(
      desc(priority),
      desc(products.createdAt),
      asc(products.id)
    )
    .limit(8);

  const out: RecommendedProduct[] = [];
  for (const r of rows) {
    const img = r.imageUrl?.trim();
    if (!img) continue;
    out.push({
      id: r.id,
      title: r.title,
      price: r.minPrice === null ? null : Number(r.minPrice),
      imageUrl: img,
    });
    if (out.length >= 6) break;
  }
  return out;
}
