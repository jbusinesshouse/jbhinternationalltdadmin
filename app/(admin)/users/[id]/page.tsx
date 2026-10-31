import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/primitives";
import { UserDetail } from "@/features/users/UserDetail";

export const metadata: Metadata = { title: "User" };

export default function UserPage({ params }: PageProps<"/users/[id]">) {
  return (
    <Suspense fallback={<Spinner />}>
      {params.then(({ id }) => (
        <UserDetail id={id} />
      ))}
    </Suspense>
  );
}
