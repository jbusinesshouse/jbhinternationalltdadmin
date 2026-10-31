import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/primitives";
import { ProductDetail } from "@/features/products/ProductDetail";

export const metadata: Metadata = { title: "Product" };

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<Spinner />}>
      {params.then(({ id }) => (
        <ProductDetail id={id} />
      ))}
    </Suspense>
  );
}
