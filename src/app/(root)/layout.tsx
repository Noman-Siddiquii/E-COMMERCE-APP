import { Navbar, Footer } from "@/components";
import CartProvider from "@/components/CartProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      {children}
      <Footer />
    </CartProvider>
  );
}
