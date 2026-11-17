import type { Metadata } from "next";
import { Delivery } from "@/features/delivery/Delivery";

export const metadata: Metadata = { title: "Delivery" };

export default function DeliveryPage() {
  return <Delivery />;
}
