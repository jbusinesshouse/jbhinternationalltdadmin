import type { Metadata } from "next";
import { Reports } from "@/features/reports/Reports";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <Reports />;
}
