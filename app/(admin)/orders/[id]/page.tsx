import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/primitives";
import { OrderDetail } from "@/features/orders/OrderDetail";

export const metadata: Metadata = { title: "Order" };

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <Suspense fallback={<Spinner />}>
      {params.then(({ id }) => (
        <OrderDetail id={id} />
      ))}
    </Suspense>
  );
}
