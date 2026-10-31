import type { Metadata } from "next";
import { UsersList } from "@/features/users/UsersList";

export const metadata: Metadata = { title: "Users & stores" };

export default function UsersPage() {
  return <UsersList />;
}
