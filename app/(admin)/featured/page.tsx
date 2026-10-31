import type { Metadata } from "next";
import { Featured } from "@/features/featured/Featured";

export const metadata: Metadata = { title: "Featured stores" };

export default function FeaturedPage() {
  return <Featured />;
}
