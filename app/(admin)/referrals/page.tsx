import type { Metadata } from "next";
import { Referrals } from "@/features/referrals/Referrals";

export const metadata: Metadata = { title: "Referral program" };

export default function ReferralsPage() {
  return <Referrals />;
}
