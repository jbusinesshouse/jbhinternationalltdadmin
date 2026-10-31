import type { Metadata } from "next";
import { Support } from "@/features/support/Support";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return <Support />;
}
