import type { ReactNode } from "react";
import { Empty } from "@/components/materials/Cards";
import { loginHref } from "@/lib/api/auth";

export default function AccountGate({
  path,
  signedIn,
  children,
}: {
  path: string;
  signedIn: boolean;
  children: ReactNode;
}) {
  const publicPage =
    path === "/dashboard" ||
    path.startsWith("/dashboard/items/") ||
    path.startsWith("/dashboard/people/");
  return signedIn || publicPage ? (
    children
  ) : (
    <Empty
      title="Sign in to continue."
      text="Use your account to list materials, request a batch and keep your handover records."
      href={loginHref(path)}
      label="Sign in"
    />
  );
}
