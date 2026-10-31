import type { Metadata } from "next";
import { ProductsList } from "@/features/products/ProductsList";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return <ProductsList />;
}
