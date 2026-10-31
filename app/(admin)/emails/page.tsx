import type { Metadata } from "next";
import { BroadcastEmail } from "@/features/emails/BroadcastEmail";

export const metadata: Metadata = { title: "Email broadcast" };

export default function EmailsPage() {
  return <BroadcastEmail />;
}
