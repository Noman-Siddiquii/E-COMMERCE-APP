import React from "react";
import { Card } from "@/components";
import { getCurrentUser } from "@/lib/auth/actions";
import { getAllProducts } from "@/lib/actions/product";

const Home = async () => {
  const user = await getCurrentUser();
  
  let productsData;
  try {
    productsData = await getAllProducts(); // No parameters needed now
    console.log('PRODUCTS:', productsData);
  } catch (error) {
    console.error('Error fetching products:', error);
    // Fallback to empty products if database fails
    productsData = { products: [], totalCount: 0 };
  }

  console.log('USER:', user);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section aria-labelledby="latest" className="pb-12">
        <h2 id="latest" className="mb-6 text-heading-3 text-dark-900">
          Latest shoes
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productsData.products.length > 0 ? (
            productsData.products.slice(0, 6).map((product) => (
              <Card
                key={product.id}
                title={product.name}
                subtitle={product.subtitle || "Shoes"}
                meta={`${product.minPrice ? `From $${product.minPrice}` : "Price varies"}`}
                imageSrc={product.imageUrl || "/shoes/shoe-1.jpg"}
                price={product.minPrice || undefined}
                href={`/products/${product.id}`}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
