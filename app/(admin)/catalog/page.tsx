import type { Metadata } from "next";
import { Catalog } from "@/features/catalog/Catalog";

export const metadata: Metadata = { title: "Catalog" };

export default function CatalogPage() {
  return <Catalog />;
}
