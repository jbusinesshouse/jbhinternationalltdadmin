import type { Metadata } from "next";
import { Ads } from "@/features/ads/Ads";

export const metadata: Metadata = { title: "Product ads" };

export default function AdsPage() {
  return <Ads />;
}
